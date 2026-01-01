import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createReferral,
  listReferrals,
  updateReferralStatus,
} from "../controllers/referrals.controller.js";

const router: Router = Router();

router.post("/", asyncHandler(createReferral));
router.get("/", asyncHandler(listReferrals));
router.patch("/:id/status", asyncHandler(updateReferralStatus));

export default router;
