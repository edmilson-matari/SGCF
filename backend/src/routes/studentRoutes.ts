import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  // Logic to fetch students from the database
  res.json({ message: "List of students" });
});

export default router;
