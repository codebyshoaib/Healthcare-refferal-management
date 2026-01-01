import { z } from "zod";

export const OrgType = z.enum([
  "clinic",
  "pharmacy",
  "home_health",
  "nursing_home",
  "transportation",
  "dme",
]);

export const OrgRole = z.enum(["sender", "receiver", "both"]);

export const coverageAreaSchema = z.object({
  state: z.string().min(2),
  county: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().min(3),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2),
  type: OrgType,
  role: OrgRole,
  contact_info: z.object({
    email: z.string().email(),
    phone: z.string().min(5),
  }),
  coverage_areas: z.array(coverageAreaSchema).optional(),
});

export const upsertCoverageSchema = z.object({
  coverage_areas: z.array(coverageAreaSchema).min(1),
});
