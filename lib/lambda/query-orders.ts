/* eslint-disable import/no-extraneous-dependencies */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
/* eslint-enable import/no-extraneous-dependencies */

// Initialize AWS SDK clients with X-Ray tracing
const dynamodbClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Initialize Powertools
const logger = new Logger({ serviceName: 'query-orders' });
const metrics = new Metrics({
  namespace: 'FoodDelivery',
  serviceName: 'query-orders',
});

const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Processing query request', {
      method: event.httpMethod,
      path: event.path,
      pathParameters: event.pathParameters,
    });

    const orderId = event.pathParameters?.orderId;
    const customerId = event.pathParameters?.customerId;

    if (orderId) {
      // Get specific order
      const timestamp = event.queryStringParameters?.timestamp;

      if (!timestamp) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Timestamp is required for order lookup',
          }),
        };
      }

      const result = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME!,
          Key: {
            orderId: orderId,
            timestamp: Number(timestamp),
          },
        })
      );

      metrics.addMetric('OrderQueried', MetricUnit.Count, 1);

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Order not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify(result.Item),
      };
    } else if (customerId) {
      // Query orders by customer
      const result = await docClient.send(
        new QueryCommand({
          TableName: process.env.TABLE_NAME!,
          IndexName: 'customerIdIndex',
          KeyConditionExpression: 'customerId = :customerId',
          ExpressionAttributeValues: {
            ':customerId': customerId,
          },
          ScanIndexForward: false,
          Limit: 50,
        })
      );

      metrics.addMetric('CustomerOrdersQueried', MetricUnit.Count, 1);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          orders: result.Items || [],
          count: result.Items?.length || 0,
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request parameters' }),
    };
  } catch (error) {
    logger.error('Error querying orders', error as Error);
    metrics.addMetric('QueryError', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext.requestId,
      }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
};

export const handler = lambdaHandler;
