import { Router } from "express";
import * as controller from "./payments.controller.ts";
import authMiddleware from "../../middleware/authMiddleware.ts";

const router = Router();

router.get("/", authMiddleware, controller.getAll);
router.get(
  "/enrollment/:enrollmentId",
  authMiddleware,
  controller.getByEnrollment,
);
router.post("/", authMiddleware, controller.create);
router.patch("/:id/cancel", authMiddleware, controller.cancel);

export default router;
