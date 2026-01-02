import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { suggestOrganizations } from "../controllers/mcp.controller.js";

const router: Router = Router();

router.get("/suggest", asyncHandler(suggestOrganizations));

export default router;
