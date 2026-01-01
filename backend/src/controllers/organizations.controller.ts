import { Request, Response } from "express";
import pool from "../config/database.js";
import {
  createOrganizationSchema,
  upsertCoverageSchema,
} from "../validators/organizations.schema.js";

export async function createOrganization(req: Request, res: Response) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error:
        "Request body is empty or not parsed. Make sure Content-Type is application/json",
    });
  }

  const parsed = createOrganizationSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const { name, type, role, contact_info, coverage_areas } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orgResult = await client.query(
      `INSERT INTO organizations (name, type, role, contact_info)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name, type, role, contact_info]
    );

    const org = orgResult.rows[0];

    if (coverage_areas?.length) {
      for (const ca of coverage_areas) {
        await client.query(
          `INSERT INTO coverage_areas (organization_id, state, county, city, zip_code)
           VALUES ($1,$2,$3,$4,$5)`,
          [org.id, ca.state, ca.county ?? null, ca.city ?? null, ca.zip_code]
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json(org);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating organization:", err);
    return res.status(500).json({ error: "Failed to create organization" });
  } finally {
    client.release();
  }
}

export async function listOrganizations(req: Request, res: Response) {
  const type = req.query.type as string | undefined;
  const role = req.query.role as string | undefined;

  const where: string[] = [];
  const values: any[] = [];

  if (type) {
    values.push(type);
    where.push(`type = $${values.length}`);
  }
  if (role) {
    values.push(role);
    where.push(`role = $${values.length}`);
  }

  const sql = `
    SELECT * FROM organizations
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
  `;

  const result = await pool.query(sql, values);
  res.json(result.rows);
}

export async function getOrganization(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const org = await pool.query(`SELECT * FROM organizations WHERE id=$1`, [id]);
  if (!org.rows[0])
    return res.status(404).json({ error: "Organization not found" });

  const coverage = await pool.query(
    `SELECT * FROM coverage_areas WHERE organization_id=$1 ORDER BY id DESC`,
    [id]
  );

  res.json({ ...org.rows[0], coverage_areas: coverage.rows });
}

export async function upsertCoverage(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const parsed = upsertCoverageSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query(
      `SELECT id FROM organizations WHERE id=$1`,
      [id]
    );
    if (!exists.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Organization not found" });
    }

    await client.query(`DELETE FROM coverage_areas WHERE organization_id=$1`, [
      id,
    ]);

    for (const ca of parsed.data.coverage_areas) {
      await client.query(
        `INSERT INTO coverage_areas (organization_id, state, county, city, zip_code)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, ca.state, ca.county ?? null, ca.city ?? null, ca.zip_code]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error upserting coverage:", err);
    return res.status(500).json({ error: "Failed to upsert coverage" });
  } finally {
    client.release();
  }
}
