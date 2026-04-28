// backend/middleware/upload.js
// No longer uses multer — files come as base64 JSON
export default {
  single: () => (req, res, next) => next()  // passthrough shim for compatibility
};