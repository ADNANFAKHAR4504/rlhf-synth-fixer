import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('API Handler received:', JSON.stringify(event));

  const path = event.path;
  const method = event.httpMethod;

  try {
    // GET /status/{jobId}
    if (method === 'GET' && path.startsWith('/status/')) {
      const jobId = event.pathParameters?.jobId;

      if (!jobId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing jobId parameter' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      // Query DynamoDB for job status
      const queryCommand = new QueryCommand({
        TableName: process.env.METADATA_TABLE!,
        KeyConditionExpression: 'jobId = :jobId',
        ExpressionAttributeValues: {
          ':jobId': { S: jobId },
        },
      });

      const result = await dynamoClient.send(queryCommand);

      if (!result.Items || result.Items.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Job not found' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const item = result.Items[0];
      const response = {
        jobId: item.jobId.S,
        fileName: item.fileName.S,
        status: item.status.S,
        timestamp: parseInt(item.timestamp.N || '0'),
        rowCount: item.rowCount?.N ? parseInt(item.rowCount.N) : undefined,
        error: item.error?.S,
        s3Bucket: item.s3Bucket?.S,
        s3Key: item.s3Key?.S,
        outputKey: item.outputKey?.S,
        enrichedKey: item.enrichedKey?.S,
        completedAt: item.completedAt?.N
          ? parseInt(item.completedAt.N)
          : undefined,
      };

      return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // POST /trigger
    if (method === 'POST' && path === '/trigger') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { bucket, key } = body;

      if (!bucket || !key) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing bucket or key in request body',
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const input = {
        bucket,
        key,
        jobId,
      };

      const command = new StartSyncExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN!,
        input: JSON.stringify(input),
      });

      const result = await sfnClient.send(command);

      // Handle sync execution result
      if (result.status === 'SUCCEEDED') {
        return {
          statusCode: 200,
          body: JSON.stringify({
            jobId,
            executionArn: result.executionArn,
            status: result.status,
            output: result.output ? JSON.parse(result.output) : undefined,
            message: 'ETL workflow completed successfully',
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      } else if (result.status === 'FAILED') {
        return {
          statusCode: 500,
          body: JSON.stringify({
            jobId,
            executionArn: result.executionArn,
            status: result.status,
            error: result.error,
            cause: result.cause,
            message: 'ETL workflow execution failed',
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      } else {
        // TIMED_OUT or other statuses
        return {
          statusCode: 200,
          body: JSON.stringify({
            jobId,
            executionArn: result.executionArn,
            status: result.status,
            message: 'ETL workflow triggered',
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('API Handler error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
