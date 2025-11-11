"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME;
const handler = async (event) => {
    for (const record of event.Records) {
        try {
            const transaction = JSON.parse(record.body);
            const auditLog = {
                ...transaction,
                auditedAt: Date.now(),
                messageId: record.messageId,
            };
            const key = `audit/${transaction.transactionId}-${Date.now()}.json`;
            await s3.send(new client_s3_1.PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify(auditLog, null, 2),
                ContentType: 'application/json',
            }));
            console.log(`Audit log created: ${key}`);
        }
        catch (error) {
            console.error('Error creating audit log:', error);
            throw error;
        }
    }
};
exports.handler = handler;
