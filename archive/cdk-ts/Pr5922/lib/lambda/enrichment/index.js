const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Enrichment received event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);
      console.log('Enriching transaction:', transaction);

      // Fetch customer data from DynamoDB (simulated)
      const customerData = await getCustomerData(transaction.customerId);

      // Enrich transaction
      const enrichedTransaction = {
        ...transaction,
        customerName: customerData.name,
        customerTier: customerData.tier,
        customerRiskScore: customerData.riskScore,
        enrichedAt: new Date().toISOString(),
      };

      // Update DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.TRANSACTION_TABLE,
        Key: {
          transactionId: { S: transaction.transactionId },
        },
        UpdateExpression: 'SET #status = :status, enrichedData = :data, enrichedAt = :enrichedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'enriched' },
          ':data': { S: JSON.stringify(customerData) },
          ':enrichedAt': { S: new Date().toISOString() },
        },
      }));

      // Send to enrichment queue
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.ENRICHMENT_QUEUE_URL,
        MessageBody: JSON.stringify(enrichedTransaction),
      }));

      console.log('Transaction enriched:', enrichedTransaction.transactionId);
    } catch (error) {
      console.error('Error enriching transaction:', error);
      throw error;
    }
  }

  return { statusCode: 200 };
};

async function getCustomerData(customerId) {
  // Simulated customer data lookup
  // In production, this would query the actual customer database
  return {
    customerId,
    name: `Customer ${customerId}`,
    tier: 'gold',
    riskScore: 0.2,
  };
}
