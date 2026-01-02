import { Request, Response } from "express";
import { callSuggestReferralOrganization } from "../services/mcpClient.js";

export async function suggestOrganizations(req: Request, res: Response) {
  const { patient_zip_code, organization_type, sender_org_id } = req.query;

  if (
    !patient_zip_code ||
    typeof patient_zip_code !== "string" ||
    patient_zip_code.length < 3
  ) {
    return res
      .status(400)
      .json({ error: "Valid patient_zip_code is required" });
  }

  try {
    const result = await callSuggestReferralOrganization({
      patient_zip_code,
      organization_type: organization_type as string | undefined,
      sender_org_id: sender_org_id as string | undefined,
    });

    return res.json(result);
  } catch (error) {
    console.error("Error calling MCP server:", error);
    return res.status(500).json({
      error: "Failed to get suggestions",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
