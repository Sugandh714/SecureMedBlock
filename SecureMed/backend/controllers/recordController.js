

import Record from "../models/Record.js";
import upload from "../middleware/upload.js";
/*import pinataSDK from "@pinata/sdk";
import { v4 as uuidv4 } from "uuid";
import { PassThrough } from "stream";*/

import axios from "axios";
import FormData from "form-data";

const DUMMY_USER_ID = "67f8a1b2c3d4e5f6a7b8c9d0";

// POST /api/records/upload
export const uploadRecord = [
  upload.single("file"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { title, type } = req.body;
      if (!title || !type) {
        return res.status(400).json({ success: false, message: "Title and type are required" });
      }

      console.log("📤 Uploading to IPFS:", req.file.originalname);

      // ✅ Create form-data
      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      // ✅ Send to Pinata
      const resPinata = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );

      const cid = resPinata.data.IpfsHash;

      // ✅ Save to DB
      const newRecord = new Record({
        title,
        type,
        fileName: req.file.originalname,
        ipfsCid: cid,
        userId: DUMMY_USER_ID
      });

      await newRecord.save();

      console.log("✅ Success! IPFS CID:", cid);

      res.status(201).json({
        success: true,
        message: "File uploaded to IPFS successfully",
        data: {
          title,
          fileName: req.file.originalname,
          ipfsCid: cid,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`
        }
      });

    } catch (error) {
      console.error("Upload Error:", error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: error.response?.data?.error || error.message
      });
    }
  }
];
console.log("KEY:", process.env.PINATA_API_KEY);
console.log("SECRET:", process.env.PINATA_SECRET_API_KEY);
// GET /api/records
export const getRecords = async (req, res) => {
  try {
    const records = await Record.find({ userId: DUMMY_USER_ID }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};