'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs   = require('fs');

// ─────────────────────────────────────────────
// PATHS
// WSL translation of D:\fabric-samples\...
// Windows D:\ → WSL /mnt/d/
// ─────────────────────────────────────────────

const CONNECTION_PROFILE_PATH = '/mnt/d/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json';

// Wallet lives inside SecureMed/ folder
const WALLET_PATH = path.resolve(__dirname, '..', 'SecureMed', 'wallet');

// Channel and chaincode names
const CHANNEL_NAME   = 'mychannel';
const CHAINCODE_NAME = 'healthcareLogs';

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

function loadConnectionProfile() {
    if (!fs.existsSync(CONNECTION_PROFILE_PATH)) {
        throw new Error(
            `Connection profile not found at: ${CONNECTION_PROFILE_PATH}\n` +
            `Make sure your Fabric test network is running in WSL and the path is correct.`
        );
    }
    const raw = fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8');
    return JSON.parse(raw);
}

async function buildGateway(userId) {
    const ccp    = loadConnectionProfile();
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    const identity = await wallet.get(userId);
    if (!identity) {
        throw new Error(
            `Identity "${userId}" not found in wallet at ${WALLET_PATH}.\n` +
            `Run enrollAdmin.js first, then enrollUser.js for this user.`
        );
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true }
    });

    return gateway;
}

async function getContract(userId) {
    const gateway = await buildGateway(userId);
    const network  = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    return { gateway, contract };
}

// ─────────────────────────────────────────────
// PUBLIC API — INVOKE (write to ledger)
// ─────────────────────────────────────────────

/**
 * Submit a transaction that writes to the ledger.
 * @param {string} userId     - Fabric identity in wallet
 * @param {string} fnName     - Chaincode function name
 * @param  {...string} args   - Arguments (all must be strings)
 * @returns {string|null}     - Response from chaincode or null
 */
async function invoke(userId, fnName, ...args) {
    let gateway;
    try {
        const { gateway: gw, contract } = await getContract(userId);
        gateway = gw;

        console.log(`[Fabric] INVOKE  ${fnName}`, args);
        const result = await contract.submitTransaction(fnName, ...args);
        console.log(`[Fabric] SUCCESS ${fnName}`);
        return result && result.length ? result.toString() : null;

    } catch (err) {
        console.error(`[Fabric] INVOKE ERROR in ${fnName}:`, err.message);
        throw err;
    } finally {
        if (gateway) gateway.disconnect();
    }
}

// ─────────────────────────────────────────────
// PUBLIC API — QUERY (read from ledger, no write)
// ─────────────────────────────────────────────

/**
 * Evaluate a transaction (read-only, no ledger write).
 * @param {string} userId     - Fabric identity in wallet
 * @param {string} fnName     - Chaincode function name
 * @param  {...string} args   - Arguments (all must be strings)
 * @returns {object|Array}    - Parsed JSON response from chaincode
 */
async function query(userId, fnName, ...args) {
    let gateway;
    try {
        const { gateway: gw, contract } = await getContract(userId);
        gateway = gw;

        console.log(`[Fabric] QUERY   ${fnName}`, args);
        const result = await contract.evaluateTransaction(fnName, ...args);
        console.log(`[Fabric] SUCCESS ${fnName}`);
        return JSON.parse(result.toString());

    } catch (err) {
        console.error(`[Fabric] QUERY ERROR in ${fnName}:`, err.message);
        throw err;
    } finally {
        if (gateway) gateway.disconnect();
    }
}

// ─────────────────────────────────────────────
// NAMED CHAINCODE OPERATIONS
// Convenience wrappers so backend never
// hardcodes function names
// ─────────────────────────────────────────────

/**
 * Upload a health record's metadata to the ledger.
 * No plain CID ever stored — encryptedCID is CP-ABE ciphertext.
 */
async function uploadRecord({ userId, recordID, uploaderID, department, accessPolicy, encryptedCID }) {
    return await invoke(
        userId,
        'UploadRecord',
        recordID,
        uploaderID,
        department,
        accessPolicy,
        encryptedCID
    );
}

/**
 * Query all records for a department with timestamp <= requestTimestamp.
 * Returns array of record metadata objects.
 */
async function queryByDepartment({ userId, department, requestTimestamp }) {
    return await query(
        userId,
        'QueryByDepartment',
        department,
        String(requestTimestamp)
    );
}

/**
 * Get a single record by its ID.
 */
async function getRecord({ userId, recordID }) {
    return await query(userId, 'GetRecord', recordID);
}

/**
 * Check whether a record exists on the ledger.
 */
async function recordExists({ userId, recordID }) {
    return await query(userId, 'RecordExists', recordID);
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
    invoke,          // raw invoke — for any custom chaincode call
    query,           // raw query  — for any custom chaincode call
    uploadRecord,
    queryByDepartment,
    getRecord,
    recordExists
};