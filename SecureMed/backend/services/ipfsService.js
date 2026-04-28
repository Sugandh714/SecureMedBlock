// backend/services/ipfsService.js
import axios from "axios";
import FormData from "form-data";

const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function getPinataHeaders(formData) {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) throw new Error("PINATA_JWT not set in environment");
  return { ...formData.getHeaders(), Authorization: `Bearer ${jwt}` };
}

async function pinBuffer(buffer, filename, contentType) {
  const formData = new FormData();
  formData.append("file", buffer, { filename, contentType });
  const res = await axios.post(PINATA_PIN_URL, formData, {
    maxBodyLength: Infinity,
    headers: getPinataHeaders(formData)
  });
  return res.data.IpfsHash;
}

// Bundle format: { ct_kem, ct_file, nonce, tag }
export async function uploadEncryptedBundle(encResult, originalName) {
  const bundle = Buffer.from(JSON.stringify(encResult));
  return await pinBuffer(bundle, `${originalName}.enc`, "application/octet-stream");
}

export async function fetchEncryptedBundle(cid) {
  const res = await axios.get(`${PINATA_GATEWAY}/${cid}`, {
    responseType: 'text'   // force text so we can parse ourselves
  });
  // Parse whether it came back as string or object
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data; // { ct_kem, ct_file, nonce, tag }
}

// Re-encrypted bundle: { ct_kem2, key_capsule, kc_nonce, kc_tag, ct_file, nonce, tag, pk_owner }
export async function uploadReencryptedBundle(bundle, label) {
  const buf = Buffer.from(JSON.stringify(bundle));
  return await pinBuffer(buf, `${label}.reenc`, "application/octet-stream");
}

export const gatewayUrl = (cid) => `${PINATA_GATEWAY}/${cid}`;