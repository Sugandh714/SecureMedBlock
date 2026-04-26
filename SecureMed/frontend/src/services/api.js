
// src/services/api.js
const API_BASE = "http://localhost:5000/api";

// const apiCall = async (endpoint, options = {}) => {
//   const response = await fetch(`${API_BASE}${endpoint}`, {
//     headers: { "Content-Type": "application/json" },
//     ...options,
//   });
//   const data = await response.json();
//   if (!response.ok) throw new Error(data.message || "API Error");
//   return data;
// };
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "API Error");
  return data;
};

// Records
export const uploadRecord = (data) => apiCall("/records", { method: "POST", body: JSON.stringify(data) });
export const getRecords = () => apiCall("/records");
export const deleteRecord = (id) => apiCall(`/records/${id}`, { method: "DELETE" });

// Requests
export const getRequests = () => apiCall("/requests");
export const createRequest = (data) => apiCall("/requests", { method: "POST", body: JSON.stringify(data) });
export const updateRequestStatus = (id, status) =>
  apiCall(`/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });

// Logs
export const getLogs = () => apiCall("/logs");

//profile
// Profile
export const getProfile = () => apiCall("/profile");