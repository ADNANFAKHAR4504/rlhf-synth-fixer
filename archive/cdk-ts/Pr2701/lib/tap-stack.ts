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
