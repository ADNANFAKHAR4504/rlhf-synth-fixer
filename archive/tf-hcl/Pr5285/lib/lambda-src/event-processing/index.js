const { DynamoDBClient, UpdateItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event) => {
  console.log('Event processing started', JSON.stringify(event));

  const results = {
    processed: 0,
    failed: 0
  };

  // Process SQS messages
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { eventId, eventType, payload, timestamp } = message;

      console.log(`Processing event: ${eventId}, type: ${eventType}`);

      // Simulate transaction analysis
      const analysisResult = analyzeTransaction(eventType, payload);

      // Update event in DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: marshall({
          pk: `EVENT#${eventId}`,
          sk: `METADATA#${timestamp}`
        }),
        UpdateExpression: 'SET #status = :status, #processedAt = :processedAt, #analysis = :analysis, #gsi2pk = :gsi2pk',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#processedAt': 'processedAt',
          '#analysis': 'analysis',
          '#gsi2pk': 'gsi2pk'
        },
        ExpressionAttributeValues: marshall({
          ':status': 'processed',
          ':processedAt': new Date().toISOString(),
          ':analysis': analysisResult,
          ':gsi2pk': 'STATUS#processed'
        })
      }));

      // Create audit trail
      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: marshall({
          auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          eventId,
          action: 'processed',
          details: {
            eventType,
            riskScore: analysisResult.riskScore,
            fraudFlag: analysisResult.fraudFlag
          }
        })
      }));

      // Emit processed event to EventBridge
      await eventBridgeClient.send(new PutEventsCommand({
        Entries: [
          {
            Source: 'fintech-event-processor.processing',
            DetailType: 'EventProcessed',
            Detail: JSON.stringify({
              eventId,
              eventType,
              status: 'processed',
              analysis: analysisResult,
              metadata: {
                requiresStorage: true
              }
            }),
            EventBusName: process.env.EVENTBRIDGE_BUS
          }
        ]
      }));

      console.log(`Event processed successfully: ${eventId}`);
      results.processed++;
    } catch (error) {
      console.error('Error processing event:', error);
      results.failed++;
      
      // Emit failure event
      try {
        await eventBridgeClient.send(new PutEventsCommand({
          Entries: [
            {
              Source: 'fintech-event-processor.processing',
              DetailType: 'EventProcessingFailed',
              Detail: JSON.stringify({
                error: error.message,
                status: 'failed'
              }),
              EventBusName: process.env.EVENTBRIDGE_BUS
            }
          ]
        }));
      } catch (emitError) {
        console.error('Failed to emit failure event:', emitError);
      }
    }
  }

  console.log('Processing complete:', results);
  return results;
};

function analyzeTransaction(eventType, payload) {
  // Simple transaction analysis logic
  let riskScore = 0;
  let fraudFlag = false;

  if (eventType === 'transaction' && payload.amount) {
    // High-value transaction risk
    if (payload.amount > 10000) {
      riskScore += 30;
    }
    
    // Multiple small transactions (structuring)
    if (payload.amount < 100 && payload.frequency === 'high') {
      riskScore += 40;
    }
  }

  if (eventType === 'payment') {
    // Check payment status
    if (payload.status === 'failed') {
      riskScore += 20;
    }
  }

  // Fraud detection
  if (riskScore > 50) {
    fraudFlag = true;
  }

  return {
    riskScore,
    fraudFlag,
    processedAt: new Date().toISOString(),
    recommendations: fraudFlag ? ['Manual review required', 'Enhanced monitoring'] : ['Standard processing']
  };
}

