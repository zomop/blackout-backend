import { Router } from "express";
import { start, action } from "../controllers/dungeon.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/start", requireAuth, start);
router.post("/action", requireAuth, action);

export default router;