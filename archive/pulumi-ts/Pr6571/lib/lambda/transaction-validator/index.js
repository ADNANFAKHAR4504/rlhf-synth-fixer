const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDb = new DynamoDBClient({ region: process.env.REGION });
const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const body = JSON.parse(event.body);
        const { transactionId, amount, currency, merchantId, customerId } = body;

        const timestamp = Date.now();

        const params = {
            TableName: tableName,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                merchantId: { S: merchantId },
                customerId: { S: customerId || 'unknown' },
                status: { S: 'pending' },
                createdAt: { S: new Date().toISOString() },
            },
        };

        await dynamoDb.send(new PutItemCommand(params));

        console.log('Transaction saved successfully:', transactionId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Transaction processed successfully',
                transactionId: transactionId,
                timestamp: timestamp,
            }),
        };
    } catch (error) {
        console.error('Error processing transaction:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Error processing transaction',
                error: error.message,
            }),
        };
    }
};