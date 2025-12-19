# Overview

Please find solution files below.

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2', // Enforced region as per requirements
  },
});

```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ===========================================
    // DynamoDB Table with Streams
    // ===========================================
    const dataTable = new dynamodb.Table(
      this,
      `TapDataTable-${environmentSuffix}`,
      {
        tableName: `tap-data-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'createdAt',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environments
        pointInTimeRecovery: true,
      }
    );

    // ===========================================
    // IAM Roles and Policies
    // ===========================================

    // IAM Role for API Lambda Function
    const apiLambdaRole = new iam.Role(
      this,
      `ApiLambdaRole-${environmentSuffix}`,
      {
        roleName: `tap-api-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
        inlinePolicies: {
          DynamoDBAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                resources: [dataTable.tableArn],
              }),
            ],
          }),
        },
      }
    );

    // IAM Role for Stream Processing Lambda Function
    const streamLambdaRole = new iam.Role(
      this,
      `StreamLambdaRole-${environmentSuffix}`,
      {
        roleName: `tap-stream-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
        inlinePolicies: {
          DynamoDBStreamAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:DescribeStream',
                  'dynamodb:GetRecords',
                  'dynamodb:GetShardIterator',
                  'dynamodb:ListStreams',
                ],
                resources: [dataTable.tableStreamArn!],
              }),
            ],
          }),
        },
      }
    );

    // ===========================================
    // CloudWatch Log Groups
    // ===========================================

    const apiLambdaLogGroup = new logs.LogGroup(
      this,
      `ApiLambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-api-lambda-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const streamLambdaLogGroup = new logs.LogGroup(
      this,
      `StreamLambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-stream-processor-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ===========================================
    // Lambda Functions
    // ===========================================

    // Main API Lambda Function
    const apiLambdaFunction = new lambda.Function(
      this,
      `ApiLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-api-lambda-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
        role: apiLambdaRole,
        logGroup: apiLambdaLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          TABLE_NAME: dataTable.tableName,
          ENVIRONMENT: environmentSuffix,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          const { httpMethod, pathParameters, body } = event;
          const tableName = process.env.TABLE_NAME;
          
          try {
            switch (httpMethod) {
              case 'GET':
                if (pathParameters && pathParameters.id) {
                  return await getItem(tableName, pathParameters.id, pathParameters.createdAt);
                } else {
                  return await getAllItems(tableName);
                }
              case 'POST':
                return await createItem(tableName, JSON.parse(body));
              case 'PUT':
                return await updateItem(tableName, pathParameters.id, JSON.parse(body));
              case 'DELETE':
                return await deleteItem(tableName, pathParameters.id, pathParameters.createdAt);
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'https://yourdomain.com',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                  },
                  body: JSON.stringify({ error: 'Method not allowed' }),
                };
            }
          } catch (error) {
            console.error('Error:', error);
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

        async function getItem(tableName, id, createdAt) {
          const command = new GetCommand({
            TableName: tableName,
            Key: { id, createdAt: parseInt(createdAt) },
          });
          
          const result = await docClient.send(command);
          return {
            statusCode: result.Item ? 200 : 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.Item || { error: 'Item not found' }),
          };
        }

        async function getAllItems(tableName) {
          const command = new ScanCommand({
            TableName: tableName,
          });
          
          const result = await docClient.send(command);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.Items || []),
          };
        }

        async function createItem(tableName, item) {
          const newItem = {
            ...item,
            id: item.id || require('crypto').randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          const command = new PutCommand({
            TableName: tableName,
            Item: newItem,
          });
          
          await docClient.send(command);
          return {
            statusCode: 201,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(newItem),
          };
        }

        async function updateItem(tableName, id, updates) {
          const command = new UpdateCommand({
            TableName: tableName,
            Key: { id, createdAt: updates.createdAt },
            UpdateExpression: 'SET updatedAt = :updatedAt, #data = :data',
            ExpressionAttributeNames: {
              '#data': 'data',
            },
            ExpressionAttributeValues: {
              ':updatedAt': Date.now(),
              ':data': updates.data,
            },
            ReturnValues: 'ALL_NEW',
          });
          
          const result = await docClient.send(command);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.Attributes),
          };
        }

        async function deleteItem(tableName, id, createdAt) {
          const command = new DeleteCommand({
            TableName: tableName,
            Key: { id, createdAt: parseInt(createdAt) },
          });
          
          await docClient.send(command);
          return {
            statusCode: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: '',
          };
        }
      `),
      }
    );

    // Stream Processing Lambda Function
    const streamProcessorFunction = new lambda.Function(
      this,
      `StreamProcessorFunction-${environmentSuffix}`,
      {
        functionName: `tap-stream-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
        role: streamLambdaRole,
        logGroup: streamLambdaLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            console.log('Processing record:', record.eventName);
            console.log('DynamoDB Record:', JSON.stringify(record.dynamodb, null, 2));
            
            // Add your stream processing logic here
            switch (record.eventName) {
              case 'INSERT':
                console.log('New item created:', record.dynamodb.NewImage);
                break;
              case 'MODIFY':
                console.log('Item updated:', record.dynamodb.NewImage);
                break;
              case 'REMOVE':
                console.log('Item deleted:', record.dynamodb.OldImage);
                break;
            }
          }
          
          return { statusCode: 200, body: 'Stream processed successfully' };
        };
      `),
      }
    );

    // Add DynamoDB Stream as event source for stream processor
    streamProcessorFunction.addEventSource(
      new lambdaEventSources.DynamoEventSource(dataTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
      })
    );

    // ===========================================
    // API Gateway
    // ===========================================

    const api = new apigateway.RestApi(
      this,
      `TapRestApi-${environmentSuffix}`,
      {
        restApiName: `tap-rest-api-${environmentSuffix}`,
        description: `TAP REST API for ${environmentSuffix} environment`,
        deployOptions: {
          stageName: environmentSuffix,
          tracingEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: ['https://localhost:3000', 'https://yourdomain.com'], // Specific allowed origins
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowHeaders: [
            'Content-Type',
            'Authorization',
            'X-Amz-Date',
            'X-Api-Key',
            'X-Amz-Security-Token',
          ],
          allowCredentials: false,
        },
        cloudWatchRole: true,
      }
    );

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      apiLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // API Gateway Resources and Methods
    const itemsResource = api.root.addResource('items');

    // GET /items - Get all items
    itemsResource.addMethod('GET', lambdaIntegration);

    // POST /items - Create new item
    itemsResource.addMethod('POST', lambdaIntegration);

    // Individual item resource
    const itemResource = itemsResource
      .addResource('{id}')
      .addResource('{createdAt}');

    // GET /items/{id}/{createdAt} - Get specific item
    itemResource.addMethod('GET', lambdaIntegration);

    // PUT /items/{id}/{createdAt} - Update specific item
    itemResource.addMethod('PUT', lambdaIntegration);

    // DELETE /items/{id}/{createdAt} - Delete specific item
    itemResource.addMethod('DELETE', lambdaIntegration);

    // ===========================================
    // CloudWatch Alarms
    // ===========================================

    // API Lambda Error Alarm
    new cloudwatch.Alarm(this, `ApiLambdaErrorAlarm-${environmentSuffix}`, {
      alarmName: `tap-api-lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for API Lambda function errors',
      metric: apiLambdaFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Stream Processor Lambda Error Alarm
    new cloudwatch.Alarm(this, `StreamLambdaErrorAlarm-${environmentSuffix}`, {
      alarmName: `tap-stream-processor-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for Stream Processor Lambda function errors',
      metric: streamProcessorFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // API Gateway 4XX Error Alarm
    new cloudwatch.Alarm(this, `ApiGateway4xxAlarm-${environmentSuffix}`, {
      alarmName: `tap-api-gateway-4xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for API Gateway 4XX errors',
      metric: api.metricClientError({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // API Gateway 5XX Error Alarm
    new cloudwatch.Alarm(this, `ApiGateway5xxAlarm-${environmentSuffix}`, {
      alarmName: `tap-api-gateway-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for API Gateway 5XX errors',
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ===========================================
    // Stack Outputs
    // ===========================================

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `tap-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dataTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `tap-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiLambdaFunctionName', {
      value: apiLambdaFunction.functionName,
      description: 'API Lambda Function Name',
      exportName: `tap-api-lambda-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StreamProcessorFunctionName', {
      value: streamProcessorFunction.functionName,
      description: 'Stream Processor Lambda Function Name',
      exportName: `tap-stream-processor-name-${environmentSuffix}`,
    });
  }
}

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { ApiGatewayV2Client, GetApiCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });

describe('TAP Infrastructure Integration Tests', () => {
  const apiGatewayUrl = outputs.ApiGatewayUrl;
  const dynamoTableName = outputs.DynamoDBTableName;
  const apiLambdaFunctionName = outputs.ApiLambdaFunctionName;
  const streamProcessorFunctionName = outputs.StreamProcessorFunctionName;

  describe('DynamoDB Table Tests', () => {
    test('DynamoDB table exists and has correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: dynamoTableName,
      });

      const response = await dynamodbClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(dynamoTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      
      // Check key schema
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema?.[0]).toEqual({
        AttributeName: 'id',
        KeyType: 'HASH',
      });
      expect(keySchema?.[1]).toEqual({
        AttributeName: 'createdAt',
        KeyType: 'RANGE',
      });

      // Point-in-time recovery is enabled via CloudFormation but not returned in DescribeTable
    });

    test('can read from empty DynamoDB table', async () => {
      const command = new ScanCommand({
        TableName: dynamoTableName,
        Limit: 10,
      });

      const response = await dynamodbClient.send(command);
      expect(response.Items).toBeDefined();
      expect(Array.isArray(response.Items)).toBe(true);
    });
  });

  describe('Lambda Function Tests', () => {
    test('API Lambda function exists and has correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: apiLambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(apiLambdaFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(128);
      expect(response.Configuration?.Timeout).toBe(10);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      
      // Check environment variables
      const env = response.Configuration?.Environment?.Variables;
      expect(env?.TABLE_NAME).toBe(dynamoTableName);
      expect(env?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('Stream Processor Lambda function exists and has correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: streamProcessorFunctionName,
      });

      const response = await lambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(streamProcessorFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(128);
      expect(response.Configuration?.Timeout).toBe(10);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('API Lambda function can be invoked directly', async () => {
      const testEvent = {
        httpMethod: 'GET',
        pathParameters: null,
        body: null,
      };

      const command = new InvokeCommand({
        FunctionName: apiLambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      const response = await lambdaClient.send(command);
      
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
      
      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual([]);
      }
    });
  });

  describe('API Gateway Integration Tests', () => {
    test('API Gateway endpoint is accessible', async () => {
      const response = await fetch(`${apiGatewayUrl}items`);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('CRUD operations through API Gateway', async () => {
      const testItem = {
        data: 'Test integration item',
        category: 'integration-test',
      };

      // CREATE - POST /items
      const createResponse = await fetch(`${apiGatewayUrl}items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testItem),
      });

      expect(createResponse.status).toBe(201);
      const createdItem = await createResponse.json();
      expect(createdItem.id).toBeDefined();
      expect(createdItem.createdAt).toBeDefined();
      expect(createdItem.data).toBe(testItem.data);

      // READ - GET /items/{id}/{createdAt}
      const readResponse = await fetch(
        `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`
      );
      
      expect(readResponse.status).toBe(200);
      const readItem = await readResponse.json();
      expect(readItem.id).toBe(createdItem.id);
      expect(readItem.data).toBe(testItem.data);

      // UPDATE - PUT /items/{id}/{createdAt}
      const updatedData = { data: 'Updated test data', createdAt: createdItem.createdAt };
      const updateResponse = await fetch(
        `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        }
      );

      expect(updateResponse.status).toBe(200);
      const updatedItem = await updateResponse.json();
      expect(updatedItem.data).toBe(updatedData.data);

      // DELETE - DELETE /items/{id}/{createdAt}
      const deleteResponse = await fetch(
        `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`,
        {
          method: 'DELETE',
        }
      );

      expect(deleteResponse.status).toBe(204);

      // Verify item is deleted
      const verifyResponse = await fetch(
        `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`
      );
      expect(verifyResponse.status).toBe(404);
    });

    test('CORS headers are present', async () => {
      const response = await fetch(`${apiGatewayUrl}items`, {
        method: 'OPTIONS',
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://yourdomain.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    test('CloudWatch alarms exist and are configured', async () => {
      const alarmNames = [
        `tap-api-lambda-errors-${environmentSuffix}`,
        `tap-stream-processor-errors-${environmentSuffix}`,
        `tap-api-gateway-4xx-errors-${environmentSuffix}`,
        `tap-api-gateway-5xx-errors-${environmentSuffix}`,
      ];

      for (const alarmName of alarmNames) {
        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        });

        const response = await cloudwatchClient.send(command);
        expect(response.MetricAlarms).toHaveLength(1);
        
        const alarm = response.MetricAlarms?.[0];
        expect(alarm?.AlarmName).toBe(alarmName);
        expect(alarm?.StateValue).toBeDefined();
      }
    });
  });

  describe('Error Handling Tests', () => {
    test('handles invalid HTTP methods', async () => {
      const response = await fetch(`${apiGatewayUrl}items`, {
        method: 'PATCH',
      });

      // API Gateway returns 403 for unsupported methods
      expect(response.status).toBe(403);
      const errorData = await response.json();
      expect(errorData.message).toBeDefined(); // API Gateway error structure
    });

    test('handles invalid JSON in request body', async () => {
      const response = await fetch(`${apiGatewayUrl}items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Internal server error');
    });

    test('handles non-existent item retrieval', async () => {
      const response = await fetch(
        `${apiGatewayUrl}items/non-existent-id/1234567890`
      );

      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.error).toBe('Item not found');
    });
  });

  describe('Performance Tests', () => {
    test('API response time is acceptable', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${apiGatewayUrl}items`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('can handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        fetch(`${apiGatewayUrl}items`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-data-table-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'createdAt',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('has exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Lambda Functions', () => {
    test('creates API Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-lambda-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        },
      });
    });

    test('creates Stream Processor Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-stream-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: {
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });

    test('creates exactly two Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('creates Lambda event source mapping for DynamoDB stream', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
        MaximumRetryAttempts: 3,
        StartingPosition: 'LATEST',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates API Lambda IAM role with correct basic properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-api-lambda-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('creates Stream Lambda IAM role with correct basic properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-stream-lambda-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('creates inline policies for IAM roles', () => {
      // Check that API Lambda role has inline DynamoDB policy
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-api-lambda-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          {
            PolicyName: 'DynamoDBAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                  ]),
                }),
              ]),
            }),
          },
        ]),
      });
    });

    test('creates exactly three IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 3); // 2 Lambda roles + 1 API Gateway CloudWatch role
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-rest-api-${environmentSuffix}`,
        Description: `TAP REST API for ${environmentSuffix} environment`,
      });
    });

    test('creates API Gateway deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        TracingEnabled: true,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('creates correct API Gateway resources and methods', () => {
      // Check for items resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items',
      });

      // Check for GET method on items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });

      // Check for POST method on items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });

      // Check for PUT method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
      });

      // Check for DELETE method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
      });
    });

    test('creates exactly one REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });
  });

  describe('CloudWatch Components', () => {
    test('creates CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-api-lambda-${environmentSuffix}`,
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-stream-processor-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates CloudWatch alarms for monitoring', () => {
      // API Lambda Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Lambda function errors',
        Threshold: 1,
        EvaluationPeriods: 1,
      });

      // Stream Processor Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-stream-processor-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for Stream Processor Lambda function errors',
        Threshold: 1,
        EvaluationPeriods: 1,
      });

      // API Gateway 4XX Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-gateway-4xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Gateway 4XX errors',
        Threshold: 10,
        EvaluationPeriods: 2,
      });

      // API Gateway 5XX Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-gateway-5xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Gateway 5XX errors',
        Threshold: 5,
        EvaluationPeriods: 1,
      });
    });

    test('creates exactly two log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });

    test('creates exactly four CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });
  });

  describe('Stack Outputs', () => {
    test('creates stack outputs with correct properties', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs).toHaveProperty('ApiGatewayUrl');
      expect(outputs).toHaveProperty('DynamoDBTableName');
      expect(outputs).toHaveProperty('ApiLambdaFunctionName');
      expect(outputs).toHaveProperty('StreamProcessorFunctionName');

      expect(outputs.ApiGatewayUrl.Description).toBe('API Gateway URL');
      expect(outputs.DynamoDBTableName.Description).toBe('DynamoDB Table Name');
      expect(outputs.ApiLambdaFunctionName.Description).toBe('API Lambda Function Name');
      expect(outputs.StreamProcessorFunctionName.Description).toBe('Stream Processor Lambda Function Name');
    });
  });

  describe('X-Ray Tracing', () => {
    test('enables X-Ray tracing for Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('enables X-Ray tracing for API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });
  });

  describe('CORS Configuration', () => {
    test('configures CORS for API Gateway methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '204',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Origin': "'https://localhost:3000,https://yourdomain.com'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'GET,POST,PUT,DELETE,OPTIONS'",
              },
            },
          ],
        },
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
