# pre_service/cpabe_setup.py
# Run once by admin — generates master secret for policy key derivation
import os, secrets

KEYS_DIR = os.path.join(os.path.dirname(__file__), 'keys')
os.makedirs(KEYS_DIR, exist_ok=True)

secret_path = os.path.join(KEYS_DIR, 'master_secret.bin')

if os.path.exists(secret_path):
    print("Master secret already exists. Delete keys/master_secret.bin to regenerate.")
else:
    master_secret = secrets.token_bytes(32)   # 256-bit random secret
    with open(secret_path, 'wb') as f:
        f.write(master_secret)
    print("✅ Master secret generated at keys/master_secret.bin")
    print("   KEEP THIS SECRET — never commit to git")
    print("   Add keys/master_secret.bin to .gitignore")