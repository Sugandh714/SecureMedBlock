'use strict';

const { Contract } = require('fabric-contract-api');

class HealthcareLogs extends Contract {

    // ─────────────────────────────────────────
    // UPLOAD
    // Stores metadata only.
    // encryptedCID = CP-ABE ciphertext of IPFS CID.
    // No plain CID, no file data, no crypto logic.
    // ─────────────────────────────────────────

    async UploadRecord(ctx, recordID, uploaderID, department, accessPolicy, encryptedCID) {

        // Prevent duplicate records
        const existing = await ctx.stub.getState(recordID);
        if (existing && existing.length > 0) {
            throw new Error(`Record "${recordID}" already exists on the ledger.`);
        }

        // Validate required fields
        if (!recordID || !uploaderID || !department || !accessPolicy || !encryptedCID) {
            throw new Error('All fields are required: recordID, uploaderID, department, accessPolicy, encryptedCID');
        }

        const record = {
            recordID,
            uploaderID,
            department,
            timestamp:    Math.floor(Date.now() / 1000),  // Unix seconds
            accessPolicy, // e.g. "dept::cardiology AND role::doctor"
            encryptedCID  // CP-ABE encrypted IPFS CID — never a plain CID
        };

        await ctx.stub.putState(recordID, Buffer.from(JSON.stringify(record)));

        // Emit event so backend can listen for uploads
        ctx.stub.setEvent(
            'RecordUploaded',
            Buffer.from(JSON.stringify({ recordID, uploaderID, department }))
        );

        return JSON.stringify(record);
    }

    // ─────────────────────────────────────────
    // GET SINGLE RECORD
    // ─────────────────────────────────────────

    async GetRecord(ctx, recordID) {
        const data = await ctx.stub.getState(recordID);
        if (!data || data.length === 0) {
            throw new Error(`Record "${recordID}" does not exist.`);
        }
        return data.toString();
    }

    // ─────────────────────────────────────────
    // QUERY BY DEPARTMENT
    // Returns all records where:
    //   department matches AND timestamp <= requestTimestamp
    // Requester then attempts CP-ABE decrypt of each encryptedCID.
    // Only records matching their attributes will succeed.
    // ─────────────────────────────────────────

    async QueryByDepartment(ctx, department, requestTimestamp) {
        const ts = parseInt(requestTimestamp);
        if (isNaN(ts)) {
            throw new Error('requestTimestamp must be a valid Unix timestamp integer.');
        }

        const queryString = JSON.stringify({
            selector: {
                department: department,
                timestamp:  { $lte: ts }
            },
    sort: [{ department: 'desc' }, { timestamp: 'desc' }]
        });

        const iterator = await ctx.stub.getQueryResult(queryString);
        const results  = [];

        while (true) {
            const res = await iterator.next();
            if (res.done) break;
            if (res.value && res.value.value) {
                try {
                    const record = JSON.parse(res.value.value.toString('utf8'));
                    results.push(record);
                } catch (_) {
                    // Skip malformed records
                }
            }
        }

        await iterator.close();
        return JSON.stringify(results);
    }

    // ─────────────────────────────────────────
    // QUERY BY UPLOADER
    // Patient uses this to see all their own records
    // ─────────────────────────────────────────

    async QueryByUploader(ctx, uploaderID) {
        const queryString = JSON.stringify({
            selector: {
                uploaderID: uploaderID
            }
        });

        const iterator = await ctx.stub.getQueryResult(queryString);
        const results  = [];

        while (true) {
            const res = await iterator.next();
            if (res.done) break;
            if (res.value && res.value.value) {
                try {
                    results.push(JSON.parse(res.value.value.toString('utf8')));
                } catch (_) {}
            }
        }

        await iterator.close();
        return JSON.stringify(results);
    }

    // ─────────────────────────────────────────
    // RECORD EXISTS
    // Lightweight check before upload
    // ─────────────────────────────────────────

    async RecordExists(ctx, recordID) {
        const data = await ctx.stub.getState(recordID);
        return JSON.stringify(!!(data && data.length > 0));
    }

    // ─────────────────────────────────────────
    // DELETE RECORD
    // Only the original uploader can delete
    // ─────────────────────────────────────────

    async DeleteRecord(ctx, recordID, requestingUserID) {
        const data = await ctx.stub.getState(recordID);
        if (!data || data.length === 0) {
            throw new Error(`Record "${recordID}" does not exist.`);
        }

        const record = JSON.parse(data.toString());
        if (record.uploaderID !== requestingUserID) {
            throw new Error(`Access denied. Only the uploader can delete record "${recordID}".`);
        }

        await ctx.stub.deleteState(recordID);
        ctx.stub.setEvent(
            'RecordDeleted',
            Buffer.from(JSON.stringify({ recordID, deletedBy: requestingUserID }))
        );

        return JSON.stringify({ success: true, recordID });
    }
}

module.exports = HealthcareLogs;