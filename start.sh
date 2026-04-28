#!/bin/bash
set -e
echo "==> Starting Fabric network..."
cd /mnt/d/fabric-samples/test-network
./network.sh up createChannel -ca -c mychannel -s couchdb

echo "==> Deploying chaincode..."
./network.sh deployCC \
  -ccn healthcareLogs \
  -ccp /mnt/d/SecureMedBlock/chaincode/certificate/javascript \
  -ccl javascript \
  -c mychannel

echo "==> Enrolling admin..."
cd /mnt/d/SecureMedBlock/SecureMed
node enrollAdmin.js

echo "==> Network ready."
echo "    Now start pre_service, backend, and frontend in separate terminals."
