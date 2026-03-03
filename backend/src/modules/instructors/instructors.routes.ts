import { Router } from "express";
import * as controller from "./instructors.controller.ts";
import authMiddleware from "../../middleware/authMiddleware.ts";

const router = Router();

router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.post("/", authMiddleware, controller.create);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.remove);

export default router;
