// backend/services/preService.js
import axios from "axios";

const PRE_URL = process.env.PRE_SERVICE_URL || "http://localhost:5001";

// ── Generate a new PRE keypair ────────────────────────────────────────────────
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
  return res.data; // { ct_kem, ct_file, nonce, tag }
}

// ── Decrypt bundle with owner's PRE private key ───────────────────────────────
// Used by patient to preview/download their own files.
// Uses /pre/decrypt-owner — different from doctor decrypt (/pre/decrypt).
// Owner flow: decaps(sk_owner, ct_kem) → ss → AES-GCM.dec(ss, ct_file)
// Doctor flow: decaps(sk_doctor, ct_kem2) → ss_transit → unwrap ss → AES-GCM.dec
export async function preDecrypt(skBase64, bundle) {
  const res = await axios.post(`${PRE_URL}/pre/decrypt-owner`, {
    sk_owner: skBase64,        // ← owner's private key
    ct_kem:   bundle.ct_kem,   // ← original KEM ciphertext (not ct_kem2)
    ct_file:  bundle.ct_file,
    nonce:    bundle.nonce,
    tag:      bundle.tag,
  }, { maxBodyLength: Infinity });
  return res.data; // { plaintext } — base64 encoded original file
}

// ── Owner generates re-encryption key fragment for doctor ─────────────────────
export async function preRekey(skOwnerBase64, pkDoctorBase64, ctKemBase64) {
  const res = await axios.post(`${PRE_URL}/pre/rekey`, {
    sk_owner:  skOwnerBase64,
    pk_doctor: pkDoctorBase64,
    ct_kem:    ctKemBase64
  }, {
    headers: { "Content-Type": "application/json" },
    maxBodyLength: Infinity
  });
  return res.data;
}

// ── Proxy re-encrypt ──────────────────────────────────────────────────────────
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
export async function cpAbeDecrypt(encryptedCid, attributes) {
  const res = await axios.post(`${PRE_URL}/cpabe/decrypt`, {
    encrypted_cid: encryptedCid,
    attributes
  });
  return res.data.cid;
}

// ── Issue attribute key to a user (admin action) ──────────────────────────────
export async function issueAttributeKey(userId, attributes) {
  const res = await axios.post(`${PRE_URL}/cpabe/issue-key`, { userId, attributes });
  return res.data; // { sk_abe, attributes, userId }
}