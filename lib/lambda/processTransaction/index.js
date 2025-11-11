"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const dynamodb = new client_dynamodb_1.DynamoDBClient({});
const sqs = new client_sqs_1.SQSClient({});
const TABLE_NAME = process.env.TABLE_NAME;
const QUEUE_URL = process.env.QUEUE_URL;
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        // Validation
        if (!body.transactionId || !body.amount || !body.currency) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Missing required fields: transactionId, amount, currency',
                }),
            };
        }
        const transaction = {
            transactionId: body.transactionId,
            timestamp: body.timestamp || Date.now(),
            amount: body.amount,
            currency: body.currency,
            customerId: body.customerId || 'unknown',
            status: 'processed',
        };
        // Store in DynamoDB
        await dynamodb.send(new client_dynamodb_1.PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
                transactionId: { S: transaction.transactionId },
                timestamp: { N: transaction.timestamp.toString() },
                amount: { N: transaction.amount.toString() },
                currency: { S: transaction.currency },
                customerId: { S: transaction.customerId },
                status: { S: transaction.status },
            },
        }));
        // Send to audit queue
        await sqs.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify(transaction),
        }));
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Transaction processed successfully',
                transactionId: transaction.transactionId,
            }),
        };
    }
    catch (error) {
        console.error('Error processing transaction:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Failed to process transaction',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
exports.handler = handler;
