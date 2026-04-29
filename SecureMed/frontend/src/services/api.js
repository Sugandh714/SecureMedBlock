// src/services/api.js
const API_BASE = "http://localhost:5000/api";

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    });
  } catch {
    throw new Error("Network error — is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned non-JSON response (status ${response.status})`);
  }

  if (!response.ok) throw new Error(data.message || "API Error");
  return data;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert a File object → base64 string (strips the data-URL prefix) */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

// ── Auth ───────────────────────────────────────────────────────────────────

/**
 * Login a user.
 * @param {{ loginIdentifier: string, password: string, role: string }} payload
 */
export const loginUser = (payload) =>
  apiCall("/auth/login", { method: "POST", body: JSON.stringify(payload) });

/**
 * Register a new user (patient or doctor).
 * @param {{ name: string, email: string, password: string, role: string, phone?: string, medicalId?: string, specialization?: string, department?: string, hospital?: string }} payload
 */
export const registerUser = (payload) =>
  apiCall("/auth/register", { method: "POST", body: JSON.stringify(payload) });

// ── Records ────────────────────────────────────────────────────────────────

/**
 * Upload a medical record.
 * @param {{ title: string, type: string, department: string, fileName: string, fileBase64: string, mimeType: string }} data
 */
export const uploadRecord = (data) =>
  apiCall("/records/upload", { method: "POST", body: JSON.stringify(data) });

export const getRecords   = ()    => apiCall("/records");
export const deleteRecord = (id)  => apiCall(`/records/${id}`, { method: "DELETE" });

// ── Requests ───────────────────────────────────────────────────────────────

export const getRequests    = ()   => apiCall("/requests");
export const createRequest  = (data) => apiCall("/requests", { method: "POST", body: JSON.stringify(data) });

/** Dedicated approve endpoint (POST /requests/:id/approve) */
export const approveRequest = (id) => apiCall(`/requests/${id}/approve`, { method: "POST" });

/** Dedicated reject endpoint (POST /requests/:id/reject) */
export const rejectRequest  = (id) => apiCall(`/requests/${id}/reject`,  { method: "POST" });

// ── Doctor ─────────────────────────────────────────────────────────────────

export const discoverRecords  = (data) => apiCall("/records/discover",  { method: "POST", body: JSON.stringify(data) });
export const getMyRequests    = ()     => apiCall("/requests/mine");
export const fetchRecord      = (id)   => apiCall(`/requests/${id}/fetch`);

// ── Logs ───────────────────────────────────────────────────────────────────

export const getLogs = () => apiCall("/logs");

// ── Profile ────────────────────────────────────────────────────────────────

export const getProfile = () => apiCall("/profile");

// ── Admin ──────────────────────────────────────────────────────────────────

export const getPendingApplications = ()   => apiCall("/auth/applications/pending");
export const approveApplication     = (id) => apiCall(`/auth/applications/${id}/approve`, { method: "POST" });
export const rejectApplication      = (id, reason) =>
  apiCall(`/auth/applications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "Not approved by admin", rejectedBy: "Admin" }),
  });