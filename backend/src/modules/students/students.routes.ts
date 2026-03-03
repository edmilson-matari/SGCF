import authMiddleware from "../../middleware/authMiddleware.ts";
import * as controller from "./students.controller.ts";

import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAllStudents);
router.get("/:id", authMiddleware, controller.getById);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.remove);

export default router;
