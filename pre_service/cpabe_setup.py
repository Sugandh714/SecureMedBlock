import json, os, sys
sys.path.insert(0, '/usr/local/lib/python3.10/dist-packages')

from charm.toolbox.pairinggroup import PairingGroup
from charm.schemes.abenc.abenc_waters09 import CPabe09

KEYS_DIR = os.path.join(os.path.dirname(__file__), 'keys')
os.makedirs(KEYS_DIR, exist_ok=True)

group = PairingGroup('SS512')
cpabe = CPabe09(group)

(pk, mk) = cpabe.setup()

with open(os.path.join(KEYS_DIR, 'cpabe_pk.json'), 'w') as f:
    json.dump(group.serialize(pk).decode(), f)

with open(os.path.join(KEYS_DIR, 'cpabe_mk.json'), 'w') as f:
    json.dump(group.serialize(mk).decode(), f)

print("CP-ABE master keys generated:")
print(f"  Public key  -> keys/cpabe_pk.json  (distribute freely)")
print(f"  Master key  -> keys/cpabe_mk.json  (KEEP SECRET — admin only)")