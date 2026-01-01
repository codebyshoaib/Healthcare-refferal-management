import { Request, Response } from "express";
import pool from "../config/database.js";
import {
  createReferralSchema,
  updateReferralSchema,
} from "../validators/referrals.schema.js";

export async function createReferral(req: Request, res: Response) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error:
        "Request body is empty or not parsed. Make sure Content-Type is application/json",
    });
  }

  const parsed = createReferralSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const {
    sender_org_id,
    receiver_org_id,
    patient_name,
    insurance_number,
    notes,
  } = parsed.data;

  if (sender_org_id === receiver_org_id) {
    return res.status(400).json({ error: "Cannot refer to self" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const senderCheck = await client.query(
      `SELECT role FROM organizations WHERE id = $1`,
      [sender_org_id]
    );
    if (!senderCheck.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sender organization not found" });
    }
    if (!["sender", "both"].includes(senderCheck.rows[0].role)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Sender organization cannot send referrals" });
    }

    const receiverCheck = await client.query(
      `SELECT role FROM organizations WHERE id = $1`,
      [receiver_org_id]
    );
    if (!receiverCheck.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Receiver organization not found" });
    }
    if (!["receiver", "both"].includes(receiverCheck.rows[0].role)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Receiver organization cannot receive referrals" });
    }

    const referralResult = await client.query(
      `INSERT INTO referrals (sender_org_id, receiver_org_id, patient_name, insurance_number, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [sender_org_id, receiver_org_id, patient_name, insurance_number, notes]
    );

    const referral = referralResult.rows[0];
    await client.query("COMMIT");
    return res.status(201).json(referral);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error creating referral:", err);
    return res.status(500).json({ error: "Failed to create referral" });
  } finally {
    client.release();
  }
}

export async function listReferrals(req: Request, res: Response) {
  const sender_org_id = req.query.sender_org_id as string | undefined;
  const receiver_org_id = req.query.receiver_org_id as string | undefined;

  const where: string[] = [];
  const values: any[] = [];

  if (sender_org_id) {
    values.push(sender_org_id);
    where.push(`r.sender_org_id = $${values.length}`);
  }
  if (receiver_org_id) {
    values.push(receiver_org_id);
    where.push(`r.receiver_org_id = $${values.length}`);
  }

  const sql = `
    SELECT 
      r.*,
      sender.name as sender_name,
      receiver.name as receiver_name
    FROM referrals r
    JOIN organizations sender ON r.sender_org_id = sender.id
    JOIN organizations receiver ON r.receiver_org_id = receiver.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY r.created_at DESC
  `;

  try {
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error listing referrals:", err);
    res.status(500).json({ error: "Failed to list referrals" });
  }
}

export async function updateReferralStatus(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateReferralSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const { status } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const referralCheck = await client.query(
      `SELECT * FROM referrals WHERE id = $1`,
      [id]
    );

    if (!referralCheck.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Referral not found" });
    }

    if (referralCheck.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Only pending referrals can be updated",
      });
    }

    const updateResult = await client.query(
      `UPDATE referrals SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    await client.query("COMMIT");
    res.json(updateResult.rows[0]);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error updating referral status:", err);
    res.status(500).json({ error: "Failed to update referral status" });
  } finally {
    client.release();
  }
}
