import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createOrganization,
  listOrganizations,
  getOrganization,
  upsertCoverage,
} from "../controllers/organizations.controller";

const router: Router = Router();

router.post("/", asyncHandler(createOrganization));
router.get("/", asyncHandler(listOrganizations));
router.get("/:id", asyncHandler(getOrganization));
router.put("/:id/coverage", asyncHandler(upsertCoverage));

export default router;
