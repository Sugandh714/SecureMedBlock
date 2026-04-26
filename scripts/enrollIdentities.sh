#!/bin/bash
set -e

FABRIC_DIR="$(pwd)/fabric"

echo "==> Enrolling Fabric admin..."
cd "$FABRIC_DIR"
node enrollAdmin.js

echo "==> Admin enrolled. You can now register users with:"
echo "    node registerUser.js <userId> <role> <department>"
echo ""
echo "==> Example:"
echo "    node registerUser.js patient001 patient general"
echo "    node registerUser.js doctor001 doctor cardiology"