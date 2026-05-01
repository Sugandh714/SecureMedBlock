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

// ── Helpers ───────────────────────────────────────────────────────────────────

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginUser    = (payload) => apiCall("/auth/login",    { method: "POST", body: JSON.stringify(payload) });

/**
 * Register a new user.
 * payload MUST include pkPre (Kyber768 public key, base64).
 * The secret key is generated browser-side and NEVER included here.
 */
export const registerUser = (payload) => apiCall("/auth/register", { method: "POST", body: JSON.stringify(payload) });

// ── Records ───────────────────────────────────────────────────────────────────

export const uploadRecord = (data) => apiCall("/records/upload", { method: "POST", body: JSON.stringify(data) });
export const getRecords   = ()     => apiCall("/records");
export const deleteRecord = (id)   => apiCall(`/records/${id}`, { method: "DELETE" });

// ── Requests ──────────────────────────────────────────────────────────────────

export const getRequests   = ()     => apiCall("/requests");
export const createRequest = (data) => apiCall("/requests", { method: "POST", body: JSON.stringify(data) });

/**
 * Approve a request.
 *
 * body contains ONLY the re-encrypted bundle produced by clientSideRekey():
 *   { ct_kem2, key_capsule, kc_nonce, kc_tag }
 *
 * The patient's secret key (skOwner) is NEVER in this payload.
 * Re-encryption ran entirely in the browser before this call was made.
 */
export const approveRequest = (id, rekeyBundle) =>
  apiCall(`/requests/${id}/approve`, { method: "POST", body: JSON.stringify(rekeyBundle) });

export const rejectRequest = (id) =>
  apiCall(`/requests/${id}/reject`, { method: "POST" });

// ── Doctor ────────────────────────────────────────────────────────────────────

export const discoverRecords = (data) => apiCall("/records/discover", { method: "POST", body: JSON.stringify(data) });
export const getMyRequests   = ()     => apiCall("/requests/mine");
export const fetchRecord     = (id)   => apiCall(`/requests/${id}/fetch`);

// ── Logs ──────────────────────────────────────────────────────────────────────

export const getLogs = () => apiCall("/logs");

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = () => apiCall("/profile");

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getPendingApplications = ()   => apiCall("/auth/applications/pending");
export const approveApplication     = (id) => apiCall(`/auth/applications/${id}/approve`, { method: "POST" });
export const rejectApplication      = (id, reason) =>
  apiCall(`/auth/applications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "Not approved by admin", rejectedBy: "Admin" }),
  });