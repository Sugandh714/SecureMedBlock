
/*import express from "express";
import { uploadRecord, getRecords, deleteRecord } from "../controllers/recordController.js";

const router = express.Router();

router.post("/", uploadRecord);
router.get("/", getRecords);
router.delete("/:id", deleteRecord);

export default router;*/
import express from "express";
import { uploadRecord, getRecords } from "../controllers/recordController.js";

const router = express.Router();

router.post("/upload", uploadRecord);   // ← Important: /upload
router.get("/", getRecords);

export default router;