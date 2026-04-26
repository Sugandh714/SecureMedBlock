#!/bin/bash
set -e

FABRIC_SAMPLES=${FABRIC_SAMPLES_PATH:-"$HOME/fabric-samples"}
NETWORK_DIR="$FABRIC_SAMPLES/test-network"

echo "==> Tearing down any existing network..."
cd "$NETWORK_DIR"
./network.sh down

echo "==> Starting Fabric test network with CA..."
./network.sh up createChannel -ca -c mychannel

echo "==> Network is up. Channel: mychannel"
echo "    Org1 peer:  localhost:7051"
echo "    Org1 CA:    localhost:7054"
echo "==> Run scripts/deployChaincode.sh next."