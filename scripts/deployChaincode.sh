#!/bin/bash
set -e

FABRIC_SAMPLES=${FABRIC_SAMPLES_PATH:-"$HOME/fabric-samples"}
NETWORK_DIR="$FABRIC_SAMPLES/test-network"
CC_SRC="$(pwd)/chaincode/certificate/javascript"
CC_NAME="healthrecords"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CHANNEL="mychannel"

echo "==> Installing dependencies for chaincode..."
cd "$CC_SRC" && npm install && cd -

echo "==> Deploying chaincode: $CC_NAME..."
cd "$NETWORK_DIR"
./network.sh deployCC \
  -ccn "$CC_NAME" \
  -ccp "$CC_SRC" \
  -ccl javascript \
  -ccv "$CC_VERSION" \
  -ccs "$CC_SEQUENCE" \
  -c "$CHANNEL"

echo "==> Chaincode $CC_NAME deployed to channel $CHANNEL."
echo "==> Run scripts/enrollIdentities.sh next."