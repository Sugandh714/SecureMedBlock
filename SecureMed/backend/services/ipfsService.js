// backend/services/ipfsService.js
import axios from "axios";
import FormData from "form-data";

const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

// Read JWT inside function — ensures dotenv has already loaded
function getPinataHeaders(formData) {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) throw new Error("PINATA_JWT not set in environment");
  return {
    ...formData.getHeaders(),
    Authorization: `Bearer ${jwt}`
  };
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

export async function uploadEncryptedBundle(capsule, ciphertext, originalName) {
  const bundle = Buffer.from(JSON.stringify({ capsule, ciphertext }));
  return await pinBuffer(bundle, `${originalName}.enc`, "application/octet-stream");
}

export async function fetchEncryptedBundle(cid) {
  const res = await axios.get(`${PINATA_GATEWAY}/${cid}`);
  return res.data;
}

export async function uploadReencryptedBundle(cfrag, capsule, ciphertext, pkOwner, label) {
  const bundle = Buffer.from(JSON.stringify({ cfrag, capsule, ciphertext, pkOwner }));
  return await pinBuffer(bundle, `${label}.reenc`, "application/octet-stream");
}

export const gatewayUrl = (cid) => `${PINATA_GATEWAY}/${cid}`;