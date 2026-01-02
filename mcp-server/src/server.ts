import "dotenv/config";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import pool from "./db.js";
function assertEnv() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasIndividualVars =
    process.env.DB_HOST &&
    process.env.DB_NAME &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD;

  if (!hasDatabaseUrl && !hasIndividualVars) {
    throw new Error(
      "Missing database configuration. Add either DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD to mcp-server/.env"
    );
  }
}

export async function createMcpServer() {
  console.error("Initializing MCP server...");
  assertEnv();

  console.error("Testing database connection...");
  await pool.query("SELECT 1");
  console.error("Database connection successful!");

  const server = new McpServer({
    name: "healthcare-referral-mcp",
    version: "1.0.0",
  });

  console.error("MCP server created, registering tools...");

  server.tool(
    "suggest_referral_organization",
    "Suggest the best organization to send a referral to based on coverage area, historical acceptance rate, and specialty matching. Returns ranked suggestions with match scores.",
    {
      patient_zip_code: z.string().min(3),
      organization_type: z.string().optional(),
      sender_org_id: z.string().uuid().optional(),
    },
    async ({ patient_zip_code, organization_type, sender_org_id }) => {
      try {
        const zipInfo = await pool.query(
          `SELECT DISTINCT city, county, state FROM coverage_areas WHERE zip_code = $1 LIMIT 1`,
          [patient_zip_code]
        );

        const zipCity = zipInfo.rows[0]?.city || null;
        const zipCounty = zipInfo.rows[0]?.county || null;
        const zipState = zipInfo.rows[0]?.state || null;

        const queryParams: any[] = [patient_zip_code];
        let paramIndex = 2;

        let whereConditions = ["(c.zip_code = $1"];
        if (zipCity) {
          whereConditions.push(`OR c.city = $${paramIndex}`);
          queryParams.push(zipCity);
          paramIndex++;
        }
        if (zipCounty) {
          whereConditions.push(`OR c.county = $${paramIndex}`);
          queryParams.push(zipCounty);
          paramIndex++;
        }
        if (zipState) {
          whereConditions.push(`OR c.state = $${paramIndex}`);
          queryParams.push(zipState);
          paramIndex++;
        }
        whereConditions.push(")");

        let coverageQuery = `
          SELECT DISTINCT
            o.id,
            o.name,
            o.type,
            o.role,
            o.contact_info,
            c.zip_code,
            c.city,
            c.county,
            c.state
          FROM organizations o
          JOIN coverage_areas c ON c.organization_id = o.id
          WHERE ${whereConditions.join(" ")}
            AND (o.role = 'receiver' OR o.role = 'both')
        `;

        if (sender_org_id) {
          coverageQuery += ` AND o.id != $${paramIndex}`;
          queryParams.push(sender_org_id);
          paramIndex++;
        }

        if (organization_type) {
          coverageQuery += ` AND o.type = $${paramIndex}`;
          queryParams.push(organization_type);
          paramIndex++;
        }

        coverageQuery += ` ORDER BY o.name ASC`;

        const coverageResult = await pool.query(coverageQuery, queryParams);

        coverageResult.rows.forEach((row) => {
          if (row.zip_code === patient_zip_code) {
            row.coverage_score = 40;
          } else if (zipCity && row.city === zipCity) {
            row.coverage_score = 30;
          } else if (zipCounty && row.county === zipCounty) {
            row.coverage_score = 20;
          } else if (zipState && row.state === zipState) {
            row.coverage_score = 10;
          } else {
            row.coverage_score = 0;
          }
        });

        if (coverageResult.rows.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    zip_code: patient_zip_code,
                    suggestions: [],
                    message: "No organizations found covering this area",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const orgIds = coverageResult.rows.map((row) => row.id);
        const acceptanceQuery = await pool.query(
          `
          SELECT 
            receiver_org_id,
            COUNT(*) as total_referrals,
            COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' AND status = 'accepted' THEN 1 END) as recent_accepted
          FROM referrals
          WHERE receiver_org_id = ANY($1)
          GROUP BY receiver_org_id
          `,
          [orgIds]
        );

        const acceptanceMap = new Map();
        acceptanceQuery.rows.forEach((row) => {
          const total = parseInt(row.total_referrals) || 0;
          const accepted = parseInt(row.accepted_count) || 0;
          const completed = parseInt(row.completed_count) || 0;
          const recentAccepted = parseInt(row.recent_accepted) || 0;

          const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;
          const successRate =
            total > 0 ? ((accepted + completed) / total) * 100 : 0;

          acceptanceMap.set(row.receiver_org_id, {
            acceptance_rate: acceptanceRate,
            success_rate: successRate,
            total_referrals: total,
            recent_accepted: recentAccepted,
          });
        });

        const suggestions = coverageResult.rows.map((org) => {
          const acceptance = acceptanceMap.get(org.id) || {
            acceptance_rate: 0,
            success_rate: 0,
            total_referrals: 0,
            recent_accepted: 0,
          };

          let matchScore = org.coverage_score || 0;
          matchScore += (acceptance.acceptance_rate / 100) * 30;
          if (organization_type && org.type === organization_type) {
            matchScore += 20;
          }
          if (acceptance.recent_accepted > 0) {
            matchScore += Math.min(acceptance.recent_accepted * 2, 10);
          }

          return {
            organization: {
              id: org.id,
              name: org.name,
              type: org.type,
              contact_info: org.contact_info,
            },
            match_score: Math.round(matchScore * 10) / 10,
            coverage_level: org.zip_code
              ? "zip_code"
              : org.city
              ? "city"
              : org.county
              ? "county"
              : "state",
            acceptance_stats: {
              acceptance_rate: Math.round(acceptance.acceptance_rate * 10) / 10,
              success_rate: Math.round(acceptance.success_rate * 10) / 10,
              total_referrals: acceptance.total_referrals,
              recent_accepted: acceptance.recent_accepted,
            },
            reasons: [
              `Covers ${patient_zip_code} at ${
                org.zip_code === patient_zip_code
                  ? "zip code"
                  : org.city
                  ? "city"
                  : org.county
                  ? "county"
                  : "state"
              } level`,
              acceptance.total_referrals > 0
                ? `${acceptance.acceptance_rate.toFixed(1)}% acceptance rate (${
                    acceptance.total_referrals
                  } total referrals)`
                : "No referral history",
              organization_type && org.type === organization_type
                ? `Matches requested type: ${organization_type}`
                : null,
              acceptance.recent_accepted > 0
                ? `${acceptance.recent_accepted} recent accepted referrals`
                : null,
            ].filter(Boolean),
          };
        });

        suggestions.sort((a, b) => b.match_score - a.match_score);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  zip_code: patient_zip_code,
                  organization_type: organization_type || null,
                  suggestions: suggestions.slice(0, 10),
                  total_found: suggestions.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Error suggesting organizations: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  console.error(
    "Tool 'suggest_referral_organization' registered successfully!"
  );
  return server;
}

async function main() {
  try {
    const server = await createMcpServer();
    const transport = new StdioServerTransport();
    console.error("Connecting to stdio transport...");
    await server.connect(transport);
    console.error("MCP server is now running and listening on stdio");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
