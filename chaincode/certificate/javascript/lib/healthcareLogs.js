'use strict';

const { Contract } = require('fabric-contract-api');

class HealthcareLogs extends Contract {

    // 🔹 Create a new event log
    async LogEvent(ctx, eventData) {
        try {
            const event = JSON.parse(eventData);

            // Basic validation
            if (!event.sessionID || !event.timestamp || !event.actor || !event.action) {
                throw new Error('Invalid event structure');
            }

            const logID = ctx.stub.getTxID();

            const logEntry = {
                logID,
                sessionID: event.sessionID,
                timestamp: event.timestamp,

                actor: {
                    userID: event.actor.userID,
                    role: event.actor.role
                },

                target: event.target || {},

                action: {
                    type: event.action.type
                },

                metadata: event.metadata || {}
            };

            await ctx.stub.putState(logID, Buffer.from(JSON.stringify(logEntry)));

            return JSON.stringify({
                message: 'Event logged successfully',
                logID
            });

        } catch (error) {
            throw new Error(`LogEvent failed: ${error.message}`);
        }
    }

    // 🔹 Get log by ID
    async GetLogByID(ctx, logID) {
        const data = await ctx.stub.getState(logID);

        if (!data || data.length === 0) {
            throw new Error('Log not found');
        }

        return data.toString();
    }

    // 🔹 Get all logs (Admin use)
    async GetAllLogs(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        let result = await iterator.next();

        while (!result.done) {
            const value = result.value.value.toString('utf8');

            try {
                results.push(JSON.parse(value));
            } catch (err) {
                results.push(value);
            }

            result = await iterator.next();
        }

        return JSON.stringify(results);
    }

    // 🔹 Query logs by patientID
    async GetLogsByPatient(ctx, patientID) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        let result = await iterator.next();

        while (!result.done) {
            const value = JSON.parse(result.value.value.toString('utf8'));

            if (value.target && value.target.patientID === patientID) {
                results.push(value);
            }

            result = await iterator.next();
        }

        return JSON.stringify(results);
    }

    // 🔹 Query logs by doctorID
    async GetLogsByDoctor(ctx, doctorID) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        let result = await iterator.next();

        while (!result.done) {
            const value = JSON.parse(result.value.value.toString('utf8'));

            if (
                (value.actor && value.actor.userID === doctorID) ||
                (value.target && value.target.doctorID === doctorID)
            ) {
                results.push(value);
            }

            result = await iterator.next();
        }

        return JSON.stringify(results);
    }

    // 🔹 Query logs by document ID
    async GetLogsByDocID(ctx, docID) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        let result = await iterator.next();

        while (!result.done) {
            const value = JSON.parse(result.value.value.toString('utf8'));

            if (value.target && value.target.docID === docID) {
                results.push(value);
            }

            result = await iterator.next();
        }

        return JSON.stringify(results);
    }

    // 🔹 Query logs by action type
    async GetLogsByAction(ctx, actionType) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        let result = await iterator.next();

        while (!result.done) {
            const value = JSON.parse(result.value.value.toString('utf8'));

            if (value.action && value.action.type === actionType) {
                results.push(value);
            }

            result = await iterator.next();
        }

        return JSON.stringify(results);
    }
        // 🔹 Store Record Hash (IPFS integrity layer)
    async StoreRecordHash(ctx, recordId, hash) {
        try {
            if (!recordId || !hash) {
                throw new Error("Missing recordId or hash");
            }

            const existing = await ctx.stub.getState(recordId);

            let recordEntry = {
                recordId,
                hash,
                timestamp: new Date().toISOString()
            };

            // If record already exists, preserve history
            if (existing && existing.length > 0) {
                const prev = JSON.parse(existing.toString());
                recordEntry.previousHash = prev.hash;
                recordEntry.version = (prev.version || 1) + 1;
            } else {
                recordEntry.version = 1;
            }

            await ctx.stub.putState(
                recordId,
                Buffer.from(JSON.stringify(recordEntry))
            );

            return JSON.stringify({
                message: "Record hash stored successfully",
                recordId
            });

        } catch (error) {
            throw new Error(`StoreRecordHash failed: ${error.message}`);
        }
    }
        // 🔹 Verify Record Hash
    async VerifyRecordHash(ctx, recordId, hashToCheck) {
        const data = await ctx.stub.getState(recordId);

        if (!data || data.length === 0) {
            throw new Error("Record not found");
        }

        const record = JSON.parse(data.toString());

        const isValid = record.hash === hashToCheck;

        return JSON.stringify({
            recordId,
            isValid,
            storedHash: record.hash
        });
    }
}

module.exports = HealthcareLogs;