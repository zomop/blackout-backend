import { Request, Response } from "express";
import { z } from "zod";
import { startDungeon, performAction, DungeonError } from "../services/dungeon.service";

export async function start(req: Request, res: Response) {
  try {
    // req.user comes from requireAuth middleware — we trust the userId in it.
    const result = await startDungeon(req.user!.userId);
    return res.status(200).json({ status: "ok", ...result });
  } catch (error) {
    if (error instanceof DungeonError) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong." });
  }
}

const actionSchema = z.object({
  action: z.enum(["attack", "flee"]),
});

export async function action(req: Request, res: Response) {
  const parseResult = actionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid input. Action must be 'attack' or 'flee'.",
    });
  }

  try {
    const result = await performAction(req.user!.userId, parseResult.data.action);
   return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof DungeonError) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong." });
  }
}