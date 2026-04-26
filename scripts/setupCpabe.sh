#!/bin/bash
set -e

PRE_DIR="$(pwd)/pre_service"

echo "==> Generating CP-ABE master keys..."
cd "$PRE_DIR"
python3 cpabe_setup.py

echo ""
echo "==> Keys generated in pre_service/keys/"
echo "    cpabe_pk.json  — distribute to all services"
echo "    cpabe_mk.json  — KEEP SECRET, admin only"
echo ""
echo "==> To issue an attribute key to a user:"
echo "    python3 keygen.py <userId> dept::cardiology role::doctor"