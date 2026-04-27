// backend/routes/recordRoutes.js
import express from "express";
import { uploadRecord, getRecords, discoverRecords } from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload",   protect, uploadRecord);    // patient uploads encrypted file
router.get("/",          protect, getRecords);       // patient's own records
router.post("/discover", protect, discoverRecords);  // doctor discovers accessible records

export default router;