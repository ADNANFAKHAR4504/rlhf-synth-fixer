const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const stepfunctions = new AWS.StepFunctions();

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

      // Check authorization
      const authResult = await checkAuthorization(userId, resourcePath);

      if (!authResult.authorized) {
        // Trigger Step Functions workflow for unauthorized access
        await stepfunctions
          .startExecution({
            stateMachineArn: process.env.STEP_FUNCTION_ARN,
            input: JSON.stringify({
              userId,
              objectKey: resourcePath,
              timestamp: eventTime,
              logData: logData,
              authorizationFailureReason: authResult.reason,
            }),
          })
          .promise();

        console.error(
          `UNAUTHORIZED ACCESS DETECTED: User ${userId} accessing ${resourcePath}`
        );
      }

      // Return the record for Firehose processing
      processedRecords.push({
        recordId: record.recordId,
        result: 'Ok',
        data: record.data, // Pass through the original data
      });
    } catch (error) {
      console.error('Error processing record:', error);
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
    const params = {
      TableName: process.env.AUTHORIZATION_TABLE,
      Key: {
        userId: userId,
        resourcePath: resourcePath,
      },
    };

    const result = await dynamodb.get(params).promise();

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
    const wildcardParams = {
      TableName: process.env.AUTHORIZATION_TABLE,
      KeyConditionExpression:
        'userId = :userId AND begins_with(resourcePath, :pathPrefix)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':pathPrefix': resourcePath.split('/').slice(0, -1).join('/') + '/*',
      },
    };

    const wildcardResult = await dynamodb.query(wildcardParams).promise();

    if (wildcardResult.Items && wildcardResult.Items.length > 0) {
      return { authorized: true };
    }

    return { authorized: false, reason: 'No matching authorization found' };
  } catch (error) {
    console.error('Authorization check error:', error);
    return { authorized: false, reason: 'Authorization check failed' };
  }
}
