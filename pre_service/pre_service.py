import os, json, base64, sys
sys.path.insert(0, '/usr/local/lib/python3.10/dist-packages')

from flask import Flask, request, jsonify
from umbral import SecretKey, PublicKey, encrypt, Capsule, CapsuleFrag
from umbral import generate_kfrags, reencrypt as umbral_reencrypt
from umbral import decrypt_reencrypted, decrypt_original
from charm.toolbox.pairinggroup import PairingGroup
from charm.schemes.abenc.abenc_waters09 import CPabe09

app = Flask(__name__)

KEYS_DIR = os.path.join(os.path.dirname(__file__), 'keys')
group = PairingGroup('SS512')
cpabe = CPabe09(group)

def load_cpabe_pk():
    with open(os.path.join(KEYS_DIR, 'cpabe_pk.json')) as f:
        return group.deserialize(json.load(f).encode())

PK_ABE = load_cpabe_pk()

def b64d(s): return base64.b64decode(s)
def b64e(b): return base64.b64encode(b).decode()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/pre/encrypt', methods=['POST'])
def pre_encrypt():
    data = request.json
    pk = PublicKey.from_bytes(b64d(data['pk']))
    plaintext = b64d(data['plaintext'])
    capsule, ciphertext = encrypt(pk, plaintext)
    return jsonify({
        'capsule': b64e(bytes(capsule)),
        'ciphertext': b64e(ciphertext)
    })


@app.route('/pre/rekey', methods=['POST'])
def pre_rekey():
    """Owner calls this (SK must be supplied). Generates kfrags."""
    data = request.json
    sk_owner = SecretKey.from_bytes(b64d(data['sk_owner']))
    pk_doctor = PublicKey.from_bytes(b64d(data['pk_doctor']))
    threshold = int(data.get('threshold', 1))
    shares = int(data.get('shares', 1))

    kfrags = generate_kfrags(
        delegating_sk=sk_owner,
        receiving_pk=pk_doctor,
        signer=sk_owner,
        threshold=threshold,
        shares=shares
    )
    return jsonify({
        'kfrags': [b64e(bytes(kf)) for kf in kfrags]
    })


@app.route('/pre/reencrypt', methods=['POST'])
def pre_reencrypt():
    """Proxy endpoint. No plaintext is ever produced here."""
    data = request.json
    capsule = Capsule.from_bytes(b64d(data['capsule']))

    from umbral import VerifiedKeyFrag
    kfrag = VerifiedKeyFrag.from_verified_bytes(b64d(data['kfrag']))
    cfrag = umbral_reencrypt(capsule=capsule, kfrag=kfrag)
    return jsonify({'cfrag': b64e(bytes(cfrag))})


@app.route('/pre/decrypt', methods=['POST'])
def pre_decrypt():
    """
    Doctor-side decrypt. Ideally runs client-side.
    This endpoint exists for server-assisted flows only.
    """
    data = request.json
    sk = SecretKey.from_bytes(b64d(data['sk']))
    pk_owner = PublicKey.from_bytes(b64d(data['pk_owner']))
    capsule = Capsule.from_bytes(b64d(data['capsule']))
    cfrag = CapsuleFrag.from_bytes(b64d(data['cfrag']))
    ciphertext = b64d(data['ciphertext'])

    verified = cfrag.verify(capsule, delegating_pk=pk_owner,
                            receiving_pk=sk.public_key())
    plaintext = decrypt_reencrypted(
        receiving_sk=sk,
        delegating_pk=pk_owner,
        capsule=capsule,
        verified_cfrags=[verified],
        ciphertext=ciphertext
    )
    return jsonify({'plaintext': b64e(plaintext)})


@app.route('/cpabe/encrypt', methods=['POST'])
def cpabe_encrypt():
    data = request.json
    cid_bytes = data['cid'].encode()
    policy = data['policy']
    ct = cpabe.encrypt(PK_ABE, cid_bytes, policy)
    return jsonify({'encrypted_cid': b64e(group.serialize(ct))})


@app.route('/cpabe/decrypt', methods=['POST'])
def cpabe_decrypt():
    data = request.json
    sk_abe = group.deserialize(b64d(data['sk_abe']))
    ct = group.deserialize(b64d(data['encrypted_cid']))
    try:
        cid = cpabe.decrypt(PK_ABE, sk_abe, ct)
        return jsonify({'cid': cid.decode()})
    except Exception:
        return jsonify({'error': 'Attribute mismatch — decryption failed'}), 403


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)