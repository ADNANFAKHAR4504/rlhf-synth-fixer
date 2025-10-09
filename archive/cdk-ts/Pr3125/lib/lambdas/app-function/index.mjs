import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});
const ssm = new SSMClient({});
const secretsManager = new SecretsManagerClient({});

export const handler = async (event) => {
  try {
    // Get config from Parameter Store
    const paramResult = await ssm.send(new GetParameterCommand({
      Name: process.env.CONFIG_PARAM_NAME,
    }));

    // Get secret from Secrets Manager
    const secretResult = await secretsManager.send(new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN,
    }));

    // Example DynamoDB operation
    const item = {
      id: Date.now().toString(),
      data: JSON.parse(event.body || '{}'),
      timestamp: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        message: 'Success',
        itemId: item.id,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
