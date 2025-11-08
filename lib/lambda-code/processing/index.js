const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Processing SQS messages:', JSON.stringify(event, null, 2));
  
  const results = [];
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const transactionId = uuidv4();
      
      console.log('Processing message:', message.correlationId);
      
      // Store raw payload in S3
      const s3Key = `webhooks/${message.provider}/${transactionId}.json`;
      
      await s3.putObject({
        Bucket: process.env.BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify(message),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256'
      }).promise();
      
      // Store transaction record in DynamoDB
      await dynamodb.put({
        TableName: process.env.TABLE_NAME,
        Item: {
          transactionId,
          correlationId: message.correlationId,
          provider: message.provider,
          status: 'processed',
          s3Key,
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      }).promise();
      
      console.log('Successfully processed:', transactionId);
      results.push({ success: true, transactionId });
      
    } catch (error) {
      console.error('Error processing record:', error);
      results.push({ success: false, error: error.message });
    }
  }
  
  return {
    batchItemFailures: results
      .filter(r => !r.success)
      .map((_, index) => ({ itemIdentifier: event.Records[index].messageId }))
  };
};