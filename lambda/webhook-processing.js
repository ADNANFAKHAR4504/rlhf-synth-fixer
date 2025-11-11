const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    const results = [];
    
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            const transactionId = randomUUID();
            const { correlationId, provider, payload, timestamp } = message;
            
            const s3Key = `webhooks/${provider}/${transactionId}.json`;
            const s3Object = { correlationId, provider, payload, timestamp, transactionId };
            
            await s3.send(new PutObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: s3Key,
                Body: JSON.stringify(s3Object, null, 2),
                ContentType: 'application/json'
            }));
            
            await dynamodb.send(new PutItemCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    transactionId: { S: transactionId },
                    timestamp: { S: timestamp },
                    correlationId: { S: correlationId },
                    provider: { S: provider },
                    status: { S: 'processed' },
                    s3Key: { S: s3Key },
                    processedAt: { S: new Date().toISOString() }
                }
            }));
            
            results.push({ messageId: record.messageId, status: 'success', transactionId, correlationId });
        } catch (error) {
            results.push({ messageId: record.messageId, status: 'error', error: error.message });
        }
    }
    
    return results;
};
