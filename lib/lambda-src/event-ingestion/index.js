const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { marshall } = require('@aws-sdk/util-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event) => {
  console.log('Event ingestion started', JSON.stringify(event));

  try {
    // Parse event body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { eventType, payload, timestamp } = body;

    // Generate event ID
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare event data
    const eventData = {
      pk: `EVENT#${eventId}`,
      sk: `METADATA#${timestamp}`,
      gsi1pk: `TYPE#${eventType}`,
      gsi1sk: timestamp,
      gsi2pk: `STATUS#pending`,
      gsi2sk: timestamp,
      eventId,
      eventType,
      payload,
      timestamp,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };

    // Store in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: marshall(eventData)
    }));
    console.log('Event stored in DynamoDB:', eventId);

    // Send to SQS for processing
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        eventId,
        eventType,
        payload,
        timestamp
      }),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType
        }
      }
    }));
    console.log('Event sent to SQS:', eventId);

    // Emit to EventBridge
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'fintech-event-processor.ingestion',
          DetailType: 'EventIngested',
          Detail: JSON.stringify({
            eventId,
            eventType,
            payload,
            timestamp
          }),
          EventBusName: process.env.EVENTBRIDGE_BUS
        }
      ]
    }));
    console.log('Event emitted to EventBridge:', eventId);

    return {
      statusCode: 202,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': event.requestContext?.requestId || 'unknown'
      },
      body: JSON.stringify({
        status: 'accepted',
        eventId,
        message: 'Event accepted for processing'
      })
    };
  } catch (error) {
    console.error('Error processing event:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Internal server error'
      })
    };
  }
};

