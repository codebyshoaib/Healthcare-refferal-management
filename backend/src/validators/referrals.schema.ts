import { z } from "zod";

export const ReferralStatus = z.enum([
  "pending",
  "accepted",
  "rejected",
  "completed",
]);

export const createReferralSchema = z.object({
  sender_org_id: z.string().uuid(),
  receiver_org_id: z.string().uuid(),
  patient_name: z.string().min(2),
  insurance_number: z.string().min(2),
  notes: z.string().optional(),
});

export const updateReferralSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});
