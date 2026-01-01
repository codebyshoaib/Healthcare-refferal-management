import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createReferral,
  listReferrals,
  updateReferralStatus,
} from "../controllers/referrals.controller";

const router: Router = Router();

router.post("/", asyncHandler(createReferral));
router.get("/", asyncHandler(listReferrals));
router.patch("/:id/status", asyncHandler(updateReferralStatus));

export default router;
