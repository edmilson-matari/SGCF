import * as controller from "./auth.controller.ts";
import { Router } from "express";

const router = Router();
router.get("/", (req, res) => {
  res.json({ name: "Inside api/auth" });
});
router.post("/register", controller.register);
router.post("/login", controller.login);

export default router;
