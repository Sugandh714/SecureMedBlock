
import Request from "../models/Request.js";

const DUMMY_USER_ID = "67f8a1b2c3d4e5f6a7b8c9d0";

// GET /api/requests
export const getRequests = async (req, res) => {
  try {
    const requests = await Request.find({ patientId: DUMMY_USER_ID }).sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/requests
export const createRequest = async (req, res) => {
  try {
    const { requesterName, recordId } = req.body;
    const newRequest = new Request({
      requesterName,
      recordId,
      patientId: DUMMY_USER_ID
    });
    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/requests/:id
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};