
import express from "express";

const router = express.Router();

// Dummy GET route
router.get("/", (req, res) => {
  res.json({ message: "All requests fetched" });
});

// Dummy POST route
router.post("/", (req, res) => {
  res.json({ message: "Request created" });
});

export default router;