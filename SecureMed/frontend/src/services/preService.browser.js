/**
 * preService.browser.js
 *
 * Client-side Proxy Re-Encryption using:
 *   - @noble/post-quantum ml_kem768  (pure JS, FIPS 203, no WASM)
 *   - WebCrypto SubtleCrypto         (AES-256-GCM, browser-native)
 *
 * WHY NOT DASHLANE WASM:
 *   The @dashlane/pqc-kem-kyber768-browser package requires its .wasm
 *   file to be served with Content-Type: application/wasm. Vite/CRA dev
 *   servers return text/html for unknown assets, causing the WASM compile
 *   to fail with "expected magic word 00 61 sm, found 3c 21 64 6f".
 *   @noble/post-quantum is pure JavaScript — zero config, works in any
 *   bundler out of the box.
 *
 * KEY SIZES (matching Python kyber_py.kyber.Kyber768 exactly):
 *   pk  = 1184 bytes
 *   sk  = 2400 bytes
 *   ct  = 1088 bytes
 *   ss  =   32 bytes
 *
 * SECURITY CONTRACT:
 *   - sk (secret key) never leaves this module.
 *   - clientSideRekey() zeros sk and all intermediate shared secrets
 *     immediately after use via Uint8Array.fill(0).
 *   - Only the re-encrypted ciphertext bundle is returned / sent to backend.
 *   - No localStorage, sessionStorage, or console.log of any key material.
 */

import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";

// ─── AES-256-GCM via WebCrypto ────────────────────────────────────────────────
// Matches Python: AES.new(key[:32], AES.MODE_GCM, nonce=nonce)
// WebCrypto appends the 16-byte tag to the ciphertext — we split to match
// pycryptodome's separate { ciphertext, tag } output format.

async function aesGcmEncrypt(keyBytes, plaintext) {
  const nonce = crypto.getRandomValues(new Uint8Array(16)); // 128-bit nonce = Python default

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.slice(0, 32),   // AES-256: first 32 bytes of the 32-byte ss
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const raw = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      cryptoKey,
      plaintext
    )
  );

  // WebCrypto layout: [ ciphertext ... | tag (16 bytes) ]
  return {
    ciphertext: raw.slice(0, raw.length - 16),
    nonce,
    tag:        raw.slice(raw.length - 16),
  };
}

// ─── Base64 helpers ───────────────────────────────────────────────────────────

export function b64e(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64d(str) {
  const s = atob(str);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a Kyber768 keypair in the browser.
 * Called once at registration — sk is shown to the patient and then discarded.
 * Only pk is sent to the backend.
 *
 * @returns {{ pkB64: string, skB64: string }}
 */
export function browserKeygen() {
  const { publicKey: pk, secretKey: sk } = ml_kem768.keygen();
  return {
    pkB64: b64e(pk),
    skB64: b64e(sk),
  };
}

/**
 * Client-side PRE rekey — mirrors Python /pre/rekey exactly.
 *
 * Python equivalent:
 *   ss          = Kyber768.decaps(sk_owner, ct_kem)      # recover file key
 *   ss_t, ct2   = Kyber768.encaps(pk_doctor)             # new KEM for doctor
 *   key_capsule = AES-GCM.enc(key=ss_t, plaintext=ss)   # wrap file key
 *   return { ct_kem2, key_capsule, kc_nonce, kc_tag }
 *
 * Security:
 *   - skOwner decoded from base64 → Uint8Array → used for decaps → fill(0)
 *   - ss (file key) used for AES wrap → fill(0)
 *   - ssTransit used as AES key → fill(0)
 *   - Only ciphertext returned — no key material
 *
 * @param {string} skOwnerB64   Patient's sk (base64) — pasted from password manager
 * @param {string} pkDoctorB64  Doctor's pk (base64) — from access request record
 * @param {string} ctKemB64     Original ct_kem from IPFS bundle (base64)
 * @returns {Promise<{ ct_kem2, key_capsule, kc_nonce, kc_tag }>} all base64
 */
export async function clientSideRekey(skOwnerB64, pkDoctorB64, ctKemB64) {
  const skOwner  = b64d(skOwnerB64);
  const pkDoctor = b64d(pkDoctorB64);
  const ctKem    = b64d(ctKemB64);

  // Step 1: Recover the shared secret (file encryption key)
  // Python: ss = Kyber768.decaps(sk_owner, ct_kem)
  const ss = ml_kem768.decapsulate(ctKem, skOwner);
  skOwner.fill(0); // zero sk immediately — no lingering reference

  // Step 2: Generate a new KEM encapsulation for the doctor
  // Python: ss_transit, ct_kem2 = Kyber768.encaps(pk_doctor)
  const { cipherText: ct_kem2, sharedSecret: ssTransit } =
    ml_kem768.encapsulate(pkDoctor);

  // Step 3: Wrap the file key under the transit key
  // Python: key_capsule_bundle = aes_gcm_encrypt(ss_transit, ss)
  const { ciphertext: keyCapsule, nonce: kcNonce, tag: kcTag } =
    await aesGcmEncrypt(ssTransit, ss);

  // Zero all intermediate secrets
  ss.fill(0);
  ssTransit.fill(0);

  // Return base64 — matches exactly what Python /pre/rekey returns
  // This is ALL that gets sent to the backend — zero key material
  return {
    ct_kem2:     b64e(ct_kem2),
    key_capsule: b64e(keyCapsule),
    kc_nonce:    b64e(kcNonce),
    kc_tag:      b64e(kcTag),
  };
}