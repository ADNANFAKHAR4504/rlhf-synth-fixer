const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Event storage started', JSON.stringify(event));

  try {
    // Parse EventBridge event
    const detail = event.detail;
    const { eventId, eventType, status, analysis } = detail;

    // Generate storage ID
    const storageId = `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Retrieve original event data
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: marshall({
        pk: `EVENT#${eventId}`,
        sk: `METADATA#${detail.timestamp || new Date().toISOString()}`
      })
    };

    let originalEvent = {};
    try {
      const getResponse = await dynamoClient.send(new GetItemCommand(getParams));
      if (getResponse.Item) {
        originalEvent = unmarshall(getResponse.Item);
      }
    } catch (err) {
      console.warn('Could not retrieve original event:', err.message);
    }

    // Store processed event
    const storageRecord = {
      pk: `STORAGE#${storageId}`,
      sk: `EVENT#${eventId}`,
      storageId,
      eventId,
      eventType,
      status,
      analysis,
      originalPayload: originalEvent.payload || {},
      storedAt: new Date().toISOString(),
      metadata: {
        riskScore: analysis?.riskScore || 0,
        fraudFlag: analysis?.fraudFlag || false,
        environment: process.env.ENVIRONMENT || 'unknown'
      }
    };

    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: marshall(storageRecord)
    }));

    console.log(`Event stored successfully: ${storageId}`);

    // Create audit trail entry
    const auditRecord = {
      auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventId,
      action: 'stored',
      details: {
        storageId,
        eventType,
        status,
        riskScore: analysis?.riskScore || 0
      }
    };

    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: marshall(auditRecord)
    }));

    console.log('Audit trail created');

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        storageId,
        eventId
      })
    };
  } catch (error) {
    console.error('Error storing event:', error);

    // Store error in audit trail
    try {
      const errorAudit = {
        auditId: `audit-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventId: event.detail?.eventId || 'unknown',
        action: 'storage_failed',
        details: {
          error: error.message,
          stack: error.stack
        }
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: marshall(errorAudit)
      }));
    } catch (auditError) {
      console.error('Failed to create error audit:', auditError);
    }

    throw error;
  }
};

