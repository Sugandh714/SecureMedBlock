// backend/routes/recordRoutes.js
import express from "express";
import {
  uploadRecord,
  getRecords,
  decryptRecord,
  discoverRecords,
} from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload",       protect, uploadRecord);
router.get("/",              protect, getRecords);
router.post("/discover",     protect, discoverRecords);
router.post("/:id/decrypt",  protect, decryptRecord);   // ← patient self-decrypt

export default router;