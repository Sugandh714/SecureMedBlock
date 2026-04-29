// src/services/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// Central auth helpers — import these instead of touching localStorage directly.
// ─────────────────────────────────────────────────────────────────────────────

/** Return the stored JWT token, or null */
export const getToken = () => localStorage.getItem("token");

/** Return the stored user object, or null */
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
};

/**
 * Return the PRE private key for the currently logged-in user.
 * Keys are stored as  skPre_<email>  so they survive multi-account use.
 */
export const getSkPre = () => {
  const user = getUser();
  if (!user?.email) return null;
  return localStorage.getItem(`skPre_${user.email.toLowerCase()}`);
};

/**
 * Clear all auth state and redirect to /login.
 * Does NOT delete skPre keys — the patient may log back in
 * and still needs their private key.
 */
export const logout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (navigate) navigate("/login");
  else window.location.href = "/login";
};