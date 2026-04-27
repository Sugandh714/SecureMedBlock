import os, json, base64, hashlib, hmac
from flask import Flask, request, jsonify

# ── Umbral PRE (v0.3.0 API) ───────────────────────────────────────────────────
from umbral.pre import (
    SecretKey, PublicKey,
    encrypt, generate_kfrags, reencrypt,
    decrypt_reencrypted,
    Capsule, CapsuleFrag, KeyFrag, VerifiedKeyFrag
)
from umbral.signing import Signer

# ── AES for policy-based CID encryption ──────────────────────────────────────
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes

app = Flask(__name__)

KEYS_DIR = os.path.join(os.path.dirname(__file__), 'keys')
os.makedirs(KEYS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def b64e(b: bytes) -> str:
    return base64.b64encode(b).decode()

def b64d(s: str) -> bytes:
    return base64.b64decode(s)

def load_master_secret() -> bytes:
    path = os.path.join(KEYS_DIR, 'master_secret.bin')
    if not os.path.exists(path):
        raise RuntimeError("Master secret not found. Run cpabe_setup.py first.")
    with open(path, 'rb') as f:
        return f.read()

def derive_policy_key(attributes: list, master_secret: bytes) -> bytes:
    """
    Derive a deterministic AES-256 key from a sorted attribute set + master secret.
    Same attributes always produce the same key.
    This simulates CP-ABE: only users whose attributes satisfy the policy
    can derive the correct key and decrypt the CID.
    """
    attr_string = "|".join(sorted(attributes))
    return hmac.new(master_secret, attr_string.encode(), hashlib.sha256).digest()

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'pre_service'})

# ─────────────────────────────────────────────────────────────────────────────
# PRE — KEYGEN
# Generate a new Umbral keypair for a user.
# SK is returned to client and NEVER stored server-side.
# PK is stored in User.pkPre in MongoDB.
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/pre/keygen', methods=['POST'])
def pre_keygen():
    try:
        sk = SecretKey.random()
        pk = sk.public_key()
        return jsonify({
            'sk': b64e(sk.to_secret_bytes()),   # → client stores securely, never sent back
            'pk': b64e(bytes(pk))                # → stored in MongoDB User.pkPre
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# PRE — ENCRYPT
# Patient encrypts file plaintext with their PRE public key.
# Returns capsule + ciphertext (both base64) to store on IPFS.
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/pre/encrypt', methods=['POST'])
def pre_encrypt():
    try:
        data      = request.json
        pk        = PublicKey.from_bytes(b64d(data['pk']))
        plaintext = b64d(data['plaintext'])

        capsule, ciphertext = encrypt(pk, plaintext)

        return jsonify({
            'capsule':    b64e(bytes(capsule)),
            'ciphertext': b64e(ciphertext)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# PRE — REKEY
# Patient generates re-encryption key fragment using their SK.
# sk_owner is sent over TLS and NEVER stored server-side.
# Returns kfrag which allows proxy to re-encrypt WITHOUT seeing plaintext.
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/pre/rekey', methods=['POST'])
def pre_rekey():
    try:
        data      = request.json
        sk_owner  = SecretKey.from_bytes(b64d(data['sk_owner']))
        pk_doctor = PublicKey.from_bytes(b64d(data['pk_doctor']))
        signer    = Signer(sk_owner)

        kfrags = generate_kfrags(
            delegating_sk=sk_owner,
            receiving_pk=pk_doctor,
            signer=signer,
            threshold=1,
            shares=1
        )

        # kfrags[0] is VerifiedKeyFrag — serialize with bytes()
        return jsonify({
            'kfrags': [b64e(bytes(kf)) for kf in kfrags]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# PRE — REENCRYPT (PROXY OPERATION)
# Backend acts as proxy. Transforms capsule using kfrag.
# NO plaintext is ever produced at this step — this is the core PRE guarantee.
# Input:  capsule (from IPFS bundle) + kfrag (from patient approval)
# Output: cfrag   (transformed capsule fragment for doctor)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/pre/reencrypt', methods=['POST'])
def pre_reencrypt():
    try:
        data = request.json

        capsule = Capsule.from_bytes(b64d(data['capsule']))

        # kfrag coming from patient was serialized as VerifiedKeyFrag
        # We must load as KeyFrag then re-verify, OR load directly as VerifiedKeyFrag
        kfrag = VerifiedKeyFrag.from_verified_bytes(b64d(data['kfrag']))

        cfrag = reencrypt(capsule=capsule, kfrag=kfrag)

        # cfrag is VerifiedCapsuleFrag — serialize with bytes()
        return jsonify({'cfrag': b64e(bytes(cfrag))})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# CP-ABE SIMULATION — ENCRYPT CID
# Encrypts IPFS CID under an access policy using AES-256-CBC.
# The AES key is derived from the policy attributes + master secret.
# Only a user whose attributes match the policy can derive the same key.
# Policy format: "department::cardiology|role::doctor"
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/cpabe/encrypt', methods=['POST'])
def cpabe_encrypt():
    try:
        data   = request.json
        cid    = data['cid'].encode()
        policy = data['policy']   # e.g. "department::cardiology|role::doctor"

        master     = load_master_secret()
        attributes = [a.strip() for a in policy.split('|')]
        aes_key    = derive_policy_key(attributes, master)

        iv         = get_random_bytes(16)
        cipher     = AES.new(aes_key, AES.MODE_CBC, iv)
        ciphertext = cipher.encrypt(pad(cid, AES.block_size))

        bundle = {
            'iv':         b64e(iv),
            'ciphertext': b64e(ciphertext),
            'policy':     policy
        }

        return jsonify({
            'encrypted_cid': b64e(json.dumps(bundle).encode())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# CP-ABE SIMULATION — DECRYPT CID
# Doctor sends their attributes issued by admin.
# Backend checks attributes satisfy policy, derives same AES key, decrypts.
# If any required attribute is missing → 403 before any crypto attempt.
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/cpabe/decrypt', methods=['POST'])
def cpabe_decrypt():
    try:
        data       = request.json
        enc_b64    = data['encrypted_cid']
        attributes = data['attributes']   # list e.g. ["department::cardiology","role::doctor"]

        master = load_master_secret()
        bundle = json.loads(b64d(enc_b64).decode())

        # Check every policy attribute is present in user's attribute set
        policy_attrs = [a.strip() for a in bundle['policy'].split('|')]
        missing = [a for a in policy_attrs if a not in attributes]
        if missing:
            return jsonify({
                'error': f'Access denied — missing attributes: {missing}'
            }), 403

        # Derive key using policy attributes (same derivation as encrypt)
        aes_key    = derive_policy_key(policy_attrs, master)
        iv         = b64d(bundle['iv'])
        ciphertext = b64d(bundle['ciphertext'])

        cipher    = AES.new(aes_key, AES.MODE_CBC, iv)
        plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)

        return jsonify({'cid': plaintext.decode()})
    except Exception as e:
        return jsonify({'error': 'Decryption failed — attribute mismatch'}), 403

# ─────────────────────────────────────────────────────────────────────────────
# CP-ABE — ISSUE ATTRIBUTE KEY
# Admin calls this to issue attributes to a user (doctor or patient).
# The returned sk_abe is stored in User.skAbe in MongoDB.
# Format: base64 of JSON list of attribute strings.
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/cpabe/issue-key', methods=['POST'])
def issue_key():
    try:
        data       = request.json
        attributes = data['attributes']   # e.g. ["department::cardiology","role::doctor"]
        user_id    = data.get('userId', 'unknown')

        sk_abe = b64e(json.dumps(attributes).encode())

        print(f"[KeyAuthority] Issued attributes to {user_id}: {attributes}")

        return jsonify({
            'sk_abe':     sk_abe,
            'attributes': attributes,
            'userId':     user_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# UTILITY — Decode sk_abe back to attributes list
# Used internally and for testing
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/cpabe/decode-key', methods=['POST'])
def decode_key():
    try:
        data   = request.json
        sk_abe = data['sk_abe']
        attributes = json.loads(b64d(sk_abe).decode())
        return jsonify({'attributes': attributes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("=" * 50)
    print("  SecureMed PRE + CP-ABE Microservice")
    print("  Umbral v0.3.0 | AES-256-CBC policy encryption")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=False)