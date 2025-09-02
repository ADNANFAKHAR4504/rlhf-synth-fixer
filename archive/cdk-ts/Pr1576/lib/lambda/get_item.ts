import {
  AttributeValue,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

// Custom type definitions for Lambda events
interface APIGatewayProxyEvent {
  body?: string;
  headers?: { [name: string]: string };
  httpMethod: string;
  path: string;
  queryStringParameters?: { [name: string]: string };
  pathParameters?: { [name: string]: string };
  stageVariables?: { [name: string]: string };
  requestContext: Record<string, unknown>;
  resource: string;
  multiValueHeaders?: { [name: string]: string[] };
  multiValueQueryStringParameters?: { [name: string]: string[] };
  isBase64Encoded: boolean;
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers?: { [header: string]: boolean | number | string };
  multiValueHeaders?: { [header: string]: (boolean | number | string)[] };
  body: string;
  isBase64Encoded?: boolean;
}

// Helper function to convert DynamoDB format to JavaScript object
function unmarshall(
  dynamoObj: Record<string, AttributeValue>
): Record<string, unknown> {
  const unmarshalled: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dynamoObj)) {
    if (value && typeof value === 'object' && 'S' in value) {
      unmarshalled[key] = value.S;
    } else if (value && typeof value === 'object' && 'N' in value) {
      unmarshalled[key] = Number(value.N);
    } else if (value && typeof value === 'object' && 'BOOL' in value) {
      unmarshalled[key] = value.BOOL;
    } else if (value && typeof value === 'object' && 'NULL' in value) {
      unmarshalled[key] = null;
    } else if (value && typeof value === 'object' && 'L' in value) {
      unmarshalled[key] = (value as { L: AttributeValue[] }).L.map(
        (item: AttributeValue) => {
          if (typeof item === 'object' && item !== null) {
            return unmarshall(
              item as unknown as Record<string, AttributeValue>
            );
          }
          return item;
        }
      );
    } else if (value && typeof value === 'object' && 'M' in value) {
      unmarshalled[key] = unmarshall(
        (value as { M: Record<string, AttributeValue> }).M as unknown as Record<
          string,
          AttributeValue
        >
      );
    } else {
      unmarshalled[key] = value;
    }
  }
  return unmarshalled;
}

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get Items function invoked', JSON.stringify(event, null, 2));

  try {
    // Verify access to secrets (demonstrates secrets manager integration)
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ARN,
      });
      await secretsClient.send(secretCommand);
      console.log('Successfully accessed application secrets');
    } catch (error) {
      console.error('Failed to access secrets:', error);
    }

    // Scan DynamoDB table for all items
    const scanCommand = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    });

    const result = await dynamoClient.send(scanCommand);

    // Convert DynamoDB items to regular JavaScript objects
    const items =
      result.Items?.map((item: Record<string, AttributeValue>) =>
        unmarshall(item)
      ) || [];

    console.log(`Retrieved ${items.length} items from DynamoDB`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items: items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error retrieving items:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
