const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

// Initialize AWS SDK v3 clients
const ddbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(ddbClient);
const stepfunctions = new SFNClient({});

exports.handler = async event => {
  const records = event.records || [];
  const processedRecords = [];

  for (const record of records) {
    try {
      // Decode the data
      const payload = Buffer.from(record.data, 'base64').toString('utf-8');
      const logData = JSON.parse(payload);

      // Extract user and resource information
      const userId = logData.userIdentity?.principalId || 'unknown';
      const resourcePath =
        logData.requestParameters?.key ||
        logData.resources?.[0]?.accountId ||
        'unknown';
      const eventTime = logData.eventTime;

      // Structured logging with context
      console.log(JSON.stringify({
        level: 'INFO',
        message: 'Processing access event',
        userId,
        resourcePath,
        eventTime,
        requestId: event.requestId || 'N/A'
      }));

      // Check authorization
      const authResult = await checkAuthorization(userId, resourcePath);

      if (!authResult.authorized) {
        // Trigger Step Functions workflow for unauthorized access
        const command = new StartExecutionCommand({
          stateMachineArn: process.env.STEP_FUNCTION_ARN,
          input: JSON.stringify({
            userId,
            objectKey: resourcePath,
            timestamp: eventTime,
            logData: logData,
            authorizationFailureReason: authResult.reason,
          }),
        });

        await stepfunctions.send(command);

        console.error(JSON.stringify({
          level: 'ERROR',
          message: 'UNAUTHORIZED ACCESS DETECTED',
          userId,
          resourcePath,
          reason: authResult.reason,
          eventTime
        }));
      }

      // Return the record for Firehose processing
      processedRecords.push({
        recordId: record.recordId,
        result: 'Ok',
        data: record.data, // Pass through the original data
      });
    } catch (error) {
      console.error(JSON.stringify({
        level: 'ERROR',
        message: 'Error processing record',
        error: error.message,
        stack: error.stack,
        recordId: record.recordId
      }));
      processedRecords.push({
        recordId: record.recordId,
        result: 'ProcessingFailed',
        data: record.data,
      });
    }
  }

  return { records: processedRecords };
};

async function checkAuthorization(userId, resourcePath) {
  try {
    const getCommand = new GetCommand({
      TableName: process.env.AUTHORIZATION_TABLE,
      Key: {
        userId: userId,
        resourcePath: resourcePath,
      },
    });

    const result = await dynamodb.send(getCommand);

    if (result.Item) {
      // Check if the permission is still valid (not expired)
      if (
        result.Item.expirationTime &&
        new Date(result.Item.expirationTime) < new Date()
      ) {
        return { authorized: false, reason: 'Permission expired' };
      }
      return { authorized: true };
    }

    // Check wildcard permissions
    const queryCommand = new QueryCommand({
      TableName: process.env.AUTHORIZATION_TABLE,
      KeyConditionExpression:
        'userId = :userId AND begins_with(resourcePath, :pathPrefix)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':pathPrefix': resourcePath.split('/').slice(0, -1).join('/') + '/*',
      },
    });

    const wildcardResult = await dynamodb.send(queryCommand);

    if (wildcardResult.Items && wildcardResult.Items.length > 0) {
      return { authorized: true };
    }

    return { authorized: false, reason: 'No matching authorization found' };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message: 'Authorization check error',
      error: error.message,
      userId,
      resourcePath
    }));
    return { authorized: false, reason: 'Authorization check failed' };
  }
}
