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
    console.log("[MCP Controller] Request received:", {
      patient_zip_code,
      organization_type,
      sender_org_id,
    });

    const result = await callSuggestReferralOrganization({
      patient_zip_code,
      organization_type: organization_type as string | undefined,
      sender_org_id: sender_org_id as string | undefined,
    });

    console.log("[MCP Controller] Successfully got suggestions");
    return res.json(result);
  } catch (error) {
    console.error("[MCP Controller] Error calling MCP server:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("directory not found")) {
      return res.status(500).json({
        error: "MCP server not available",
        message:
          "The MCP server is not properly configured. Please check deployment logs.",
      });
    }

    if (errorMessage.includes("timeout")) {
      return res.status(504).json({
        error: "Request timeout",
        message: "The MCP server took too long to respond. Please try again.",
      });
    }

    return res.status(500).json({
      error: "Failed to get suggestions",
      message: errorMessage,
    });
  }
}
