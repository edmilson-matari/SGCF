import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  // Logic to fetch courses from the database
  res.json({ message: "List of courses" });
});

export default router;
