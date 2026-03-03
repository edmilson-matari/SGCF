import { Router } from "express";
import * as controller from "./enrollments.controller.ts";
import authMiddleware from "../../middleware/authMiddleware.ts";

const router = Router();

router.get("/", authMiddleware, controller.getAll);
router.get("/student/:studentId", authMiddleware, controller.getByStudent);
router.get("/:id", authMiddleware, controller.getById);
router.post("/", authMiddleware, controller.create);
router.patch("/:id/status", authMiddleware, controller.updateStatus);

export default router;
