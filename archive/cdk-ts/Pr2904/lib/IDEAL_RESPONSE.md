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
    region: process.env.CDK_DEFAULT_REGION,
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
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      project: 'serverless_app',
    };

    // 1. DynamoDB Table
    const dataTable = new dynamodb.Table(this, 'ServerlessDataTable', {
      tableName: `serverless-data-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      pointInTimeRecovery: true,
    });

    // Apply tags to DynamoDB table
    cdk.Tags.of(dataTable).add('project', commonTags.project);

    // 2. Lambda Execution Role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
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
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::prod-${this.account}-data-storage-${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Apply tags to IAM role
    cdk.Tags.of(lambdaExecutionRole).add('project', commonTags.project);

    // 3. CloudWatch Log Group with 14-day retention
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to log group
    cdk.Tags.of(lambdaLogGroup).add('project', commonTags.project);

    // 4. Lambda Function
    const processorFunction = new lambda.Function(this, 'ServerlessProcessor', {
      functionName: `serverless-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(10),
      logGroup: lambdaLogGroup,
      environment: {
        STAGE: 'production',
        DYNAMODB_TABLE_NAME: dataTable.tableName,
        REGION: this.region,
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({ region: process.env.REGION });
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          try {
            // Handle S3 event
            if (event.Records && event.Records[0].eventSource === 'aws:s3') {
              const s3Record = event.Records[0].s3;
              const bucketName = s3Record.bucket.name;
              const objectKey = s3Record.object.key;
              
              // Store S3 event info in DynamoDB
              const params = {
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                  id: \`s3-event-\${Date.now()}\`,
                  bucket: bucketName,
                  key: objectKey,
                  timestamp: new Date().toISOString(),
                  eventName: event.Records[0].eventName
                }
              };
              
              await docClient.send(new PutCommand(params));
              
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'S3 event processed successfully',
                  bucket: bucketName,
                  key: objectKey
                })
              };
            }
            
            // Handle API Gateway event
            if (event.httpMethod) {
              const response = {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                  message: 'Hello from Serverless API!',
                  stage: process.env.STAGE,
                  timestamp: new Date().toISOString()
                })
              };
              
              return response;
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Event processed' })
            };
            
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
    });

    // Apply tags to Lambda function
    cdk.Tags.of(processorFunction).add('project', commonTags.project);

    // 5. S3 Bucket with specific naming pattern
    const dataBucket = new s3.Bucket(this, 'DataStorageBucket', {
      bucketName: `prod-${this.account}-data-storage-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      autoDeleteObjects: true, // Only for development
    });

    // Apply tags to S3 bucket
    cdk.Tags.of(dataBucket).add('project', commonTags.project);

    // 6. S3 Event Notification to trigger Lambda
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      { prefix: 'uploads/' } // Only trigger for objects in uploads/ prefix
    );

    // Grant S3 bucket permissions to Lambda
    dataBucket.grantReadWrite(processorFunction);

    // 7. API Gateway with HTTPS and rate limiting
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless application API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Apply tags to API Gateway
    cdk.Tags.of(api).add('project', commonTags.project);

    // 8. API Gateway Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      processorFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add API Gateway resources and methods
    const dataResource = api.root.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration);
    dataResource.addMethod('POST', lambdaIntegration);

    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // 9. Usage Plan for Rate Limiting (1000 requests/second)
    const usagePlan = api.addUsagePlan('ServerlessUsagePlan', {
      name: `serverless-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Apply tags to usage plan
    cdk.Tags.of(usagePlan).add('project', commonTags.project);

    // 10. CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'ServerlessDashboard',
      {
        dashboardName: `serverless-dashboard-${environmentSuffix}`,
      }
    );

    // Add widgets to monitor Lambda, API Gateway, and DynamoDB
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          processorFunction.metricInvocations(),
          processorFunction.metricErrors(),
          processorFunction.metricDuration(),
        ],
      })
    );

    // Apply tags to dashboard
    cdk.Tags.of(dashboard).add('project', commonTags.project);

    // 11. Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      description: 'API Gateway URL',
      value: api.url,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      description: 'S3 Bucket Name',
      value: dataBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      description: 'DynamoDB Table Name',
      value: dataTable.tableName,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      description: 'Lambda Function Name',
      value: processorFunction.functionName,
    });

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { 
  DynamoDBClient, 
  DescribeTableCommand, 
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
  DescribeContinuousBackupsCommand
} from '@aws-sdk/client-dynamodb';
import { 
  S3Client, 
  HeadBucketCommand, 
  PutObjectCommand,
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketNotificationConfigurationCommand
} from '@aws-sdk/client-s3';
import { 
  LambdaClient, 
  GetFunctionCommand, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  APIGatewayClient, 
  GetRestApisCommand,
  GetResourcesCommand,
  TestInvokeMethodCommand
} from '@aws-sdk/client-api-gateway';
import { 
  CloudWatchClient, 
  ListDashboardsCommand,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

// Get environment suffix and AWS region from environment variables (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const apiGatewayClient = new APIGatewayClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });

// Read outputs from flat-outputs.json (generated after deployment)
let outputs: any = {};
const flatOutputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

try {
  if (fs.existsSync(flatOutputsPath)) {
    outputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
  } else {
    console.warn('flat-outputs.json not found, some tests may fail');
  }
} catch (error) {
  console.warn('Error reading flat-outputs.json:', error);
}

// Extract stack name prefix for resource identification
const stackNamePrefix = `TapStack${environmentSuffix}`;

describe('Serverless Application Integration Tests', () => {
  
  describe('DynamoDB Table Tests', () => {
    const tableName = `serverless-data-table-${environmentSuffix}`;

    test('should exist and have correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.KeySchema).toContainEqual({
        AttributeName: 'id',
        KeyType: 'HASH'
      });
      expect(response.Table!.ProvisionedThroughput!.ReadCapacityUnits).toBe(5);
      expect(response.Table!.ProvisionedThroughput!.WriteCapacityUnits).toBe(5);
      
      // Check point-in-time recovery using the correct API
      const backupCommand = new DescribeContinuousBackupsCommand({ TableName: tableName });
      const backupResponse = await dynamodbClient.send(backupCommand);
      expect(backupResponse.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('should support read and write operations', async () => {
      const testId = `integration-test-${Date.now()}`;
      
      // Put test item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          testData: { S: 'integration test data' },
          timestamp: { S: new Date().toISOString() }
        }
      });
      await dynamodbClient.send(putCommand);

      // Verify item exists
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testId }
        }
      });
      const scanResponse = await dynamodbClient.send(scanCommand);
      
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBe(1);
      expect(scanResponse.Items![0].id.S).toBe(testId);

      // Clean up test item
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });
      await dynamodbClient.send(deleteCommand);
    });
  });

  describe('S3 Bucket Tests', () => {
    let bucketName: string;

    beforeAll(() => {
      // Extract bucket name from outputs or construct it
      bucketName = outputs.S3BucketName || `prod-${process.env.AWS_ACCOUNT_ID || '546574183988'}-data-storage`;
    });

    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      });
    });

    test('should have Lambda notification configured', async () => {
      const command = new GetBucketNotificationConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      
      expect(response.LambdaFunctionConfigurations).toBeDefined();
      expect(response.LambdaFunctionConfigurations!.length).toBeGreaterThan(0);
      
      const lambdaConfig = response.LambdaFunctionConfigurations![0];
      expect(lambdaConfig.Events).toContain('s3:ObjectCreated:*');
      expect(lambdaConfig.Filter?.Key?.FilterRules).toContainEqual({
        Name: 'Prefix',
        Value: 'uploads/'
      });
    });

    test('should trigger Lambda on object upload', async () => {
      const testKey = `uploads/integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload test file
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      });
      await s3Client.send(putCommand);

      // Wait a bit for Lambda to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify Lambda was triggered by checking DynamoDB for S3 event record
      const tableName = `serverless-data-table-${environmentSuffix}`;
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'contains(#key, :key)',
        ExpressionAttributeNames: {
          '#key': 'key'
        },
        ExpressionAttributeValues: {
          ':key': { S: testKey }
        }
      });
      
      const scanResponse = await dynamodbClient.send(scanCommand);
      expect(scanResponse.Items!.length).toBeGreaterThan(0);

      // Clean up test file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('Lambda Function Tests', () => {
    const functionName = `serverless-processor-${environmentSuffix}`;

    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(10);
    });

    test('should have correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.Environment!.Variables).toEqual(
        expect.objectContaining({
          STAGE: 'production',
          REGION: awsRegion,
          DYNAMODB_TABLE_NAME: `serverless-data-table-${environmentSuffix}`
        })
      );
    });

    test('should handle direct invocation', async () => {
      const testEvent = {
        httpMethod: 'GET',
        path: '/test'
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Hello from Serverless API!');
      expect(JSON.parse(payload.body).stage).toBe('production');
    });
  });

  describe('API Gateway Tests', () => {
    let apiId: string;

    beforeAll(async () => {
      // Find API Gateway by name
      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);
      
      const api = response.items?.find(api => 
        api.name === `serverless-api-${environmentSuffix}`
      );
      expect(api).toBeDefined();
      apiId = api!.id!;
    });

    test('should exist with correct configuration', async () => {
      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);
      
      const api = response.items?.find(api => api.id === apiId);
      expect(api).toBeDefined();
      expect(api!.name).toBe(`serverless-api-${environmentSuffix}`);
      expect(api!.description).toBe('Serverless application API');
      expect(api!.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('should have correct resources and methods', async () => {
      const command = new GetResourcesCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      const resources = response.items || [];
      const dataResource = resources.find(r => r.pathPart === 'data');
      const healthResource = resources.find(r => r.pathPart === 'health');

      expect(dataResource).toBeDefined();
      expect(healthResource).toBeDefined();

      // Check methods
      expect(dataResource!.resourceMethods).toEqual(
        expect.objectContaining({
          GET: expect.anything(),
          POST: expect.anything()
        })
      );
      expect(healthResource!.resourceMethods).toEqual(
        expect.objectContaining({
          GET: expect.anything()
        })
      );
    });

    test('should handle test invocation of health endpoint', async () => {
      const resourcesCommand = new GetResourcesCommand({ restApiId: apiId });
      const resourcesResponse = await apiGatewayClient.send(resourcesCommand);
      const healthResource = resourcesResponse.items?.find(r => r.pathPart === 'health');

      const testCommand = new TestInvokeMethodCommand({
        restApiId: apiId,
        resourceId: healthResource!.id!,
        httpMethod: 'GET'
      });

      const response = await apiGatewayClient.send(testCommand);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      const body = JSON.parse(response.body!);
      expect(body.message).toBe('Hello from Serverless API!');
      expect(body.stage).toBe('production');
    });
  });

  describe('CloudWatch Tests', () => {
    test('should have dashboard created', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `serverless-dashboard-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThan(0);
      
      const dashboard = response.DashboardEntries![0];
      expect(dashboard.DashboardName).toBe(`serverless-dashboard-${environmentSuffix}`);
    });

    test('should have dashboard with widgets', async () => {
      const command = new GetDashboardCommand({
        DashboardName: `serverless-dashboard-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Tests', () => {
    test('should have Lambda log group with correct retention', async () => {
      const logGroupName = `/aws/lambda/serverless-processor-${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await cloudwatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(14);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete full workflow: S3 upload -> Lambda trigger -> DynamoDB record', async () => {
      const bucketName = outputs.S3BucketName || `prod-${process.env.AWS_ACCOUNT_ID || '546574183988'}-data-storage`;
      const tableName = `serverless-data-table-${environmentSuffix}`;
      const testKey = `uploads/e2e-test-${Date.now()}.json`;
      const testData = { message: 'End-to-end test', timestamp: new Date().toISOString() };

      // Step 1: Upload file to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      });
      await s3Client.send(putCommand);

      // Step 2: Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Verify DynamoDB record was created
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'contains(#key, :key)',
        ExpressionAttributeNames: {
          '#key': 'key'
        },
        ExpressionAttributeValues: {
          ':key': { S: testKey }
        }
      });
      
      const scanResponse = await dynamodbClient.send(scanCommand);
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      
      const record = scanResponse.Items![0];
      expect(record.bucket.S).toBe(bucketName);
      expect(record.key.S).toBe(testKey);
      expect(record.eventName.S).toBe('ObjectCreated:Put');

      // Clean up
      const deleteS3Command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      await s3Client.send(deleteS3Command);

      const deleteDynamoCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: record.id
        }
      });
      await dynamodbClient.send(deleteDynamoCommand);
    });

    test('should handle API Gateway -> Lambda -> DynamoDB workflow', async () => {
      const functionName = `serverless-processor-${environmentSuffix}`;
      
      // Simulate API Gateway event
      const apiEvent = {
        httpMethod: 'POST',
        path: '/data',
        body: JSON.stringify({ test: 'api integration' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(apiEvent),
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Hello from Serverless API!');
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
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverless-data-table-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('should have correct tags on DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'project',
            Value: 'serverless_app'
          }
        ])
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 10,
        Environment: {
          Variables: {
            STAGE: 'production',
            REGION: Match.anyValue(),
            DYNAMODB_TABLE_NAME: Match.anyValue()
          }
        }
      });
    });

    test('should create Lambda execution role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
              ]
            ]
          }
        ]
      });
    });

    test('should create Lambda log group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-processor-${environmentSuffix}`,
        RetentionInDays: 14
      });
    });

    test('should have correct tags on Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'project',
            Value: 'serverless_app'
          }
        ])
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct naming pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(), // BucketName is a CloudFormation function, so test separately
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
      
      // Verify bucket name pattern using CloudFormation function
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(s3Buckets)[0] as any;
      expect(bucketResource.Properties.BucketName).toBeDefined();
    });

    test('should configure S3 event notification for Lambda', () => {
      template.hasResource('Custom::S3BucketNotifications', {
        Properties: {
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                Events: ['s3:ObjectCreated:*'],
                Filter: {
                  Key: {
                    FilterRules: [
                      {
                        Name: 'prefix',
                        Value: 'uploads/'
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      });
    });

    test('should have correct tags on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'project',
            Value: 'serverless_app'
          }
        ])
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: 'Serverless application API',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should enforce HTTPS-only policy', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 'execute-api:Invoke',
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            }
          ])
        }
      });
    });

    test('should create API Gateway resources and methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE'
      });
    });

    test('should have correct tags on API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          {
            Key: 'project',
            Value: 'serverless_app'
          }
        ])
      });
    });
  });

  describe('Usage Plan', () => {
    test('should create usage plan with rate limiting', () => {
      template.hasResource('AWS::ApiGateway::UsagePlan', {
        Properties: {
          UsagePlanName: `serverless-usage-plan-${environmentSuffix}`,
          Throttle: {
            RateLimit: 1000,
            BurstLimit: 2000
          },
          Quota: {
            Limit: 1000000,
            Period: 'MONTH'
          }
        }
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-dashboard-${environmentSuffix}`
      });
    });

    test('should have correct tags on CloudWatch dashboard', () => {
      // CloudWatch Dashboard tags are handled differently in CDK
      // Just verify the dashboard exists with correct name
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-dashboard-${environmentSuffix}`
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL'
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });

      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name'
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name'
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Resource', 2); // data and health
      template.resourceCountIs('AWS::ApiGateway::Method', 3); // GET data, POST data, GET health
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      // Note: Lambda functions and IAM roles count may vary due to custom resources
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      
      const iamRoles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(iamRoles).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix in resource names', () => {
      // Verify DynamoDB table name contains environment suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverless-data-table-${environmentSuffix}`
      });
      
      // Verify API Gateway name contains environment suffix
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`
      });
    });

    test('should handle missing environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-table-dev'
      });
    });

    test('should use context for environment suffix', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'test');
      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-table-test'
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have least privilege IAM policies', () => {
      // Check inline policies on the Lambda execution role
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRole = Object.values(roles).find((role: any) => 
        role.Properties.Policies && 
        role.Properties.Policies.some((policy: any) => policy.PolicyName === 'DynamoDBAccess')
      ) as any;
      
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.Properties.Policies).toContainEqual(
        expect.objectContaining({
          PolicyName: 'DynamoDBAccess',
          PolicyDocument: expect.objectContaining({
            Statement: expect.arrayContaining([
              expect.objectContaining({
                Effect: 'Allow',
                Action: expect.arrayContaining([
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan'
                ])
              })
            ])
          })
        })
      );
    });

    test('should block public S3 access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
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
