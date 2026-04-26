import json, os, sys, base64, argparse
sys.path.insert(0, '/usr/local/lib/python3.10/dist-packages')

from charm.toolbox.pairinggroup import PairingGroup
from charm.schemes.abenc.abenc_waters09 import CPabe09

KEYS_DIR = os.path.join(os.path.dirname(__file__), 'keys')

group = PairingGroup('SS512')
cpabe = CPabe09(group)

def load_pk():
    with open(os.path.join(KEYS_DIR, 'cpabe_pk.json')) as f:
        return group.deserialize(json.load(f).encode())

def load_mk():
    with open(os.path.join(KEYS_DIR, 'cpabe_mk.json')) as f:
        return group.deserialize(json.load(f).encode())

def issue_key(user_id: str, attributes: list[str]) -> str:
    """
    Issue a CP-ABE attribute key for a user.
    attributes example: ["dept::cardiology", "role::doctor"]
    Returns base64-encoded serialised key to hand to the user.
    """
    pk = load_pk()
    mk = load_mk()
    sk = cpabe.keygen(pk, mk, attributes)
    serialised = group.serialize(sk)
    b64 = base64.b64encode(serialised).decode()
    print(f"Attribute key issued for {user_id}: {attributes}")
    return b64

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Issue CP-ABE attribute key')
    parser.add_argument('user_id', help='User identifier')
    parser.add_argument('attributes', nargs='+', help='Attributes e.g. dept::cardiology role::doctor')
    args = parser.parse_args()

    key_b64 = issue_key(args.user_id, args.attributes)
    out_path = os.path.join(KEYS_DIR, f'sk_abe_{args.user_id}.b64')
    with open(out_path, 'w') as f:
        f.write(key_b64)
    print(f"Key written to {out_path}")
    print(f"Give this file securely to {args.user_id} — never send over email.")