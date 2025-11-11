"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const dynamodb = new client_dynamodb_1.DynamoDBClient({});
const s3 = new client_s3_1.S3Client({});
const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const handler = async () => {
    try {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const result = await dynamodb.send(new client_dynamodb_1.ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: '#ts > :yesterday',
            ExpressionAttributeNames: {
                '#ts': 'timestamp',
            },
            ExpressionAttributeValues: {
                ':yesterday': { N: oneDayAgo.toString() },
            },
        }));
        const transactions = result.Items || [];
        const summary = {
            date: new Date().toISOString().split('T')[0],
            totalTransactions: transactions.length,
            totalAmount: transactions.reduce((sum, item) => {
                return sum + parseFloat(item.amount?.N || '0');
            }, 0),
            generatedAt: Date.now(),
        };
        const key = `summaries/daily-${summary.date}.json`;
        await s3.send(new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(summary, null, 2),
            ContentType: 'application/json',
        }));
        console.log(`Daily summary created: ${key}`);
    }
    catch (error) {
        console.error('Error generating daily summary:', error);
        throw error;
    }
};
exports.handler = handler;
