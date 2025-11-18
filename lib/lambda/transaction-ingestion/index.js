const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const AWSXRay = require('aws-xray-sdk-core');

// Create DynamoDB client with X-Ray tracing
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

exports.handler = async (event) => {
    console.log('Received API Gateway event:', JSON.stringify(event, null, 2));

    const transactionsTable = process.env.TRANSACTIONS_TABLE;

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { transaction_id, amount, merchant } = body;

        if (!transaction_id || !amount) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: transaction_id and amount are required'
                })
            };
        }

        const timestamp = Date.now();

        // Write transaction to DynamoDB
        const putCommand = new PutCommand({
            TableName: transactionsTable,
            Item: {
                transaction_id: transaction_id,
                timestamp: timestamp,
                amount: parseFloat(amount),
                merchant: merchant || 'unknown',
                created_at: new Date().toISOString()
            }
        });

        await docClient.send(putCommand);

        console.log(`Stored transaction ${transaction_id} in DynamoDB`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Transaction received successfully',
                transaction_id: transaction_id,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Error processing transaction:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
