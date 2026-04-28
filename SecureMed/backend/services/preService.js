// backend/services/preService.js
import axios from "axios";

const PRE_URL = process.env.PRE_SERVICE_URL || "http://localhost:5001";

// ── Generate a new PRE keypair ────────────────────────────────────────────────
// Called once per user at registration. SK returned to client, PK stored in DB.
export async function preKeygen() {
  const res = await axios.post(`${PRE_URL}/pre/keygen`);
  return res.data; // { sk, pk }
}

// ── Encrypt file buffer with owner's PRE public key ───────────────────────────
export async function preEncrypt(pkBase64, fileBuffer) {
  const res = await axios.post(`${PRE_URL}/pre/encrypt`, {
    pk:        pkBase64,
    plaintext: fileBuffer.toString("base64")
  });
  return res.data; // { capsule, ciphertext }
}

// ── Owner generates re-encryption key fragment for doctor ─────────────────────
export async function preRekey(skOwnerBase64, pkDoctorBase64, ctKemBase64) {
  console.log("preRekey - ct_kem length:", ctKemBase64?.length);
  console.log("preRekey - ct_kem defined:", ctKemBase64 !== undefined);
  
  const res = await axios.post(`${PRE_URL}/pre/rekey`, {
    sk_owner:  skOwnerBase64,
    pk_doctor: pkDoctorBase64,
    ct_kem:    ctKemBase64
  }, {
    headers: { 'Content-Type': 'application/json' },
    maxBodyLength: Infinity
  });
  return res.data;
}
export async function preReencrypt(rekeyBundle, originalBundle, pkOwner) {
  const res = await axios.post(`${PRE_URL}/pre/reencrypt`, {
    ct_kem2:     rekeyBundle.ct_kem2,
    key_capsule: rekeyBundle.key_capsule,
    kc_nonce:    rekeyBundle.kc_nonce,
    kc_tag:      rekeyBundle.kc_tag,
    ct_file:     originalBundle.ct_file,
    nonce:       originalBundle.nonce,
    tag:         originalBundle.tag,
    pk_owner:    pkOwner
  });
  return res.data;
}

// ── CP-ABE: encrypt IPFS CID under access policy ─────────────────────────────
export async function cpAbeEncrypt(cid, policy) {
  const res = await axios.post(`${PRE_URL}/cpabe/encrypt`, { cid, policy });
  return res.data.encrypted_cid;
}

// ── CP-ABE: decrypt CID using doctor's attribute list ─────────────────────────
// attributes = ["department::cardiology", "role::doctor"]
export async function cpAbeDecrypt(encryptedCid, attributes) {
  const res = await axios.post(`${PRE_URL}/cpabe/decrypt`, {
    encrypted_cid: encryptedCid,
    attributes
  });
  return res.data.cid;
}

// ── Issue attribute key to a user (admin action) ──────────────────────────────
export async function issueAttributeKey(userId, attributes) {
  const res = await axios.post(`${PRE_URL}/cpabe/issue-key`, {
    userId,
    attributes
  });
  return res.data; // { sk_abe, attributes, userId }
}