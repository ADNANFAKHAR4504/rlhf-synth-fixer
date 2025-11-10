const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    try {
        const transactionId = event.pathParameters?.transactionId;
        
        if (!transactionId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Transaction ID is required' })
            };
        }
        
        const result = await dynamodb.send(new QueryCommand({
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'transactionId = :tid',
            ExpressionAttributeValues: { ':tid': { S: transactionId } }
        }));
        
        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Transaction not found' })
            };
        }
        
        const item = result.Items[0];
        const transaction = {
            transactionId: item.transactionId.S,
            correlationId: item.correlationId.S,
            provider: item.provider.S,
            status: item.status.S,
            s3Key: item.s3Key.S,
            processedAt: item.processedAt.S,
            timestamp: item.timestamp?.S
        };
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(transaction)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
