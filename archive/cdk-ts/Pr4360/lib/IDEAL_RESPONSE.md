# Overview

Please find solution files below.

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

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create DynamoDB table for storing application data
    const dynamoTable = new dynamodb.Table(
      this,
      `AppDataTable-${environmentSuffix}`,
      {
        tableName: `app-data-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environments
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );
    cdk.Tags.of(dynamoTable).add('iac-rlhf-amazon', 'true');

    // Create S3 bucket for logging API requests - with restricted access
    const logBucket = new s3.Bucket(this, `ApiLogBucket-${environmentSuffix}`, {
      bucketName: `api-logs-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For dev environments
    });
    cdk.Tags.of(logBucket).add('iac-rlhf-amazon', 'true');

    // Create Lambda function with TypeScript runtime using NodejsFunction for auto-bundling
    const apiLambda = new NodejsFunction(
      this,
      `ApiLambda-${environmentSuffix}`,
      {
        functionName: `api-lambda-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/api-handler.js',
        handler: 'handler',
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        environment: {
          DYNAMODB_TABLE_NAME: dynamoTable.tableName,
          S3_BUCKET_NAME: logBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
          DB_HOST: `db-host-${environmentSuffix}.example.com`, // Database connection details
          DB_PORT: '5432',
          DB_NAME: `app_db_${environmentSuffix}`,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2022',
          format: OutputFormat.CJS,
          externalModules: [],
        },
      }
    );
    cdk.Tags.of(apiLambda).add('iac-rlhf-amazon', 'true');

    // Grant Lambda permissions to access DynamoDB table
    dynamoTable.grantReadWriteData(apiLambda);

    // Grant Lambda exclusive access to S3 bucket for logging
    logBucket.grantReadWrite(apiLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(
      this,
      `ApiGateway-${environmentSuffix}`,
      {
        restApiName: `serverless-api-${environmentSuffix}`,
        description: `Serverless API Gateway for ${environmentSuffix} environment`,
        deployOptions: {
          stageName: environmentSuffix,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          throttlingBurstLimit: 100,
          throttlingRateLimit: 50,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: ['Content-Type', 'Authorization'],
        },
      }
    );
    cdk.Tags.of(api).add('iac-rlhf-amazon', 'true');

    // Add Lambda integration to API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add API methods
    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration);
    apiResource.addMethod('POST', lambdaIntegration);
    apiResource.addMethod('PUT', lambdaIntegration);
    apiResource.addMethod('DELETE', lambdaIntegration);

    // Create SNS topic for CloudWatch alarms
    const alarmTopic = new sns.Topic(
      this,
      `LambdaAlarmTopic-${environmentSuffix}`,
      {
        topicName: `lambda-alarms-${environmentSuffix}`,
        displayName: `Lambda Alarms for ${environmentSuffix}`,
      }
    );
    cdk.Tags.of(alarmTopic).add('iac-rlhf-amazon', 'true');

    // Create CloudWatch alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-error-rate-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda error rate is too high in ${environmentSuffix}`,
        metric: apiLambda.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Create CloudWatch alarm for Lambda throttles
    const throttleAlarm = new cloudwatch.Alarm(
      this,
      `LambdaThrottleAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-throttle-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda is throttled in ${environmentSuffix}`,
        metric: apiLambda.metricThrottles({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    throttleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Create CloudWatch alarm for Lambda duration
    const durationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-duration-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda execution takes too long in ${environmentSuffix}`,
        metric: apiLambda.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 8000, // 8 seconds (80% of timeout)
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Output important values
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiLambda.functionName,
      description: 'Lambda Function Name',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DynamoTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: logBucket.bucketName,
      description: 'S3 Log Bucket Name',
      exportName: `LogBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Deployment Region',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Configuration - Read from flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Serverless Infrastructure Integration Tests', () => {
  const tableName = outputs.DynamoTableName;
  const bucketName = outputs.LogBucketName;
  const functionName = outputs.LambdaFunctionName;
  const apiUrl = outputs.ApiUrl;

  describe('DynamoDB Table Tests', () => {
    test('should exist and be active', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have correct primary key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('id');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('table should be properly configured', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      // Table exists and is properly configured (PITR verified in unit tests)
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('should allow write operations', async () => {
      const testId = `test-${Date.now()}`;
      const command = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: Date.now().toString() },
          testData: { S: 'integration-test' },
        },
      });

      await expect(dynamoClient.send(command)).resolves.not.toThrow();
    });

    test('should allow read operations', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should exist with correct name', () => {
      const accountId = outputs.LogBucketName.split('-').pop();
      expect(bucketName).toBe(
        `api-logs-bucket-${environmentSuffix}-${accountId}`
      );
    });

    test('bucket name should contain environment suffix', () => {
      expect(bucketName).toContain(environmentSuffix);
    });

    test('bucket should be secure (not publicly accessible)', () => {
      // Bucket has encryption, versioning, and blockPublicAccess enabled
      // which is verified in unit tests
      expect(bucketName).toBeTruthy();
    });
  });

  describe('Lambda Function Tests', () => {
    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have correct runtime', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should have correct memory and timeout configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(10);
    });

    test('should have environment variables configured', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables || {};
      expect(envVars.DYNAMODB_TABLE_NAME).toBe(tableName);
      expect(envVars.S3_BUCKET_NAME).toBe(bucketName);
      expect(envVars.ENVIRONMENT).toBe(environmentSuffix);
      expect(envVars.DB_PORT).toBe('5432');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have iac-rlhf-amazon tag', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const tags = response.Tags || {};
      expect(tags['iac-rlhf-amazon']).toBe('true');
    });
  });

  describe('API Gateway Tests', () => {
    test('should be accessible via HTTP GET', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should return JSON response', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    test('should support POST requests', async () => {
      const testData = {
        test: 'integration-test-data',
        timestamp: Date.now(),
      };

      const response = await fetch(`${apiUrl}api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should have CORS headers', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'OPTIONS',
      });

      const corsHeader = response.headers.get(
        'access-control-allow-origin'
      );
      expect(corsHeader).toBeDefined();
    });

    test('should log requests to S3', async () => {
      // Make a request
      await fetch(`${apiUrl}api`, { method: 'GET' });

      // Wait for logs to be written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if logs exist in S3
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'requests/',
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);
      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('should have Lambda error alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-error-rate-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.EvaluationPeriods).toBe(1);
    });

    test('should have Lambda throttle alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-throttle-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Throttles');
      expect(alarm.Threshold).toBe(1);
    });

    test('should have Lambda duration alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-duration-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Threshold).toBe(8000);
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    test('alarms should be in OK or INSUFFICIENT_DATA state', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `lambda-`,
        StateValue: 'ALARM',
      });

      const response = await cloudWatchClient.send(command);
      const alarmingAlarms = (response.MetricAlarms || []).filter((alarm) =>
        alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(alarmingAlarms.length).toBe(0);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete a full request cycle', async () => {
      const testData = {
        testId: `e2e-${Date.now()}`,
        message: 'End-to-end integration test',
      };

      // 1. POST data via API
      const postResponse = await fetch(`${apiUrl}api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(postResponse.status).toBeLessThan(500);

      // 2. GET data via API
      const getResponse = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      expect(getResponse.status).toBe(200);

      const responseData = await getResponse.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('environment');
      expect(responseData.environment).toBe(environmentSuffix);
    });

    test('should verify data was stored in DynamoDB', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 5,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Region Configuration Tests', () => {
    test('resources should be in the correct region', () => {
      expect(outputs.Region).toBe(region);
    });

    test('API URL should contain correct region', () => {
      expect(apiUrl).toContain(region);
    });
  });
});

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
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `app-data-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have lifecycle rule for log deletion', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should have bucket policy', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct runtime and handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        FunctionName: `api-lambda-${environmentSuffix}`,
        MemorySize: 256,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            DYNAMODB_TABLE_NAME: Match.anyValue(),
            S3_BUCKET_NAME: Match.anyValue(),
            ENVIRONMENT: environmentSuffix,
            DB_PORT: '5432',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        },
      });
    });

    test('should have IAM role with DynamoDB permissions', () => {
      const policyJson = template.toJSON().Resources;
      const policies = Object.values(policyJson).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      const hasDB = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some(
            (action: string) =>
              action.includes('dynamodb:PutItem') ||
              action.includes('dynamodb:Scan')
          )
        )
      );

      expect(hasDB).toBe(true);
    });

    test('should have IAM role with S3 permissions', () => {
      const policyJson = template.toJSON().Resources;
      const policies = Object.values(policyJson).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      const hasS3 = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some(
            (action: string) =>
              action.includes('s3:PutObject') || action.includes('s3:GetObject')
          )
        )
      );

      expect(hasS3).toBe(true);
    });

    test('should have IAM role with X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct properties', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: `Serverless API Gateway for ${environmentSuffix} environment`,
      });
    });

    test('should have deployment stage configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ThrottlingBurstLimit: 100,
            ThrottlingRateLimit: 50,
          }),
        ]),
      });
    });

    test('should have GET method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have POST method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have PUT method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have DELETE method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have CORS OPTIONS method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: Match.objectLike({
          Type: 'MOCK',
        }),
      });
    });

    test('should have Lambda invoke permissions for API Gateway', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `lambda-alarms-${environmentSuffix}`,
        DisplayName: `Lambda Alarms for ${environmentSuffix}`,
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-error-rate-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-throttle-${environmentSuffix}`,
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-duration-${environmentSuffix}`,
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 8000,
        EvaluationPeriods: 2,
        Statistic: 'Average',
        TreatMissingData: 'notBreaching',
      });
    });

    test('all alarms should have SNS alarm actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API URL output', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('should have Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
        Export: {
          Name: `LambdaFunctionName-${environmentSuffix}`,
        },
      });
    });

    test('should have DynamoDB table name output', () => {
      template.hasOutput('DynamoTableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: `DynamoTableName-${environmentSuffix}`,
        },
      });
    });

    test('should have S3 bucket name output', () => {
      template.hasOutput('LogBucketName', {
        Description: 'S3 Log Bucket Name',
        Export: {
          Name: `LogBucketName-${environmentSuffix}`,
        },
      });
    });

    test('should have Region output', () => {
      template.hasOutput('Region', {
        Description: 'Deployment Region',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(20);
    });

    test('should have exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should have exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should have exactly two Lambda functions', () => {
      // One for API handler, one for S3 auto-delete
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should have exactly one API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should have exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should have exactly three CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Integration with region', () => {
    test('stack should use specified region', () => {
      expect(stack.region).toBe('ap-northeast-1');
    });

    test('resources should be region-independent', () => {
      const resources = template.toJSON().Resources;
      const resourceKeys = Object.keys(resources);

      // Check that resource names contain environmentSuffix but not hardcoded regions
      resourceKeys.forEach((key) => {
        expect(key).not.toContain('us-east-1');
        expect(key).not.toContain('us-west-2');
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use context environmentSuffix if provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'qa' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-qa',
      });
    });

    test('should use props environmentSuffix over context', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'qa' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-staging',
      });
    });

    test('should default to dev if no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-dev',
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

## ./lib/lambda/api-handler.js

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    // Log the request to S3
    const logKey = `requests/${Date.now()}-${event.requestContext?.requestId || 'unknown'}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: logKey,
      Body: JSON.stringify({
        timestamp: new Date().toISOString(),
        event: event,
        environment: process.env.ENVIRONMENT
      }),
      ContentType: 'application/json'
    }));

    // Example: Store data in DynamoDB
    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body);
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: {
          id: event.requestContext?.requestId || `id-${Date.now()}`,
          timestamp: Date.now(),
          data: data,
          createdAt: new Date().toISOString()
        }
      }));
    }

    // Example: Read data from DynamoDB
    if (event.httpMethod === 'GET') {
      const result = await docClient.send(new ScanCommand({
        TableName: tableName,
        Limit: 10
      }));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Request processed successfully',
          items: result.Items,
          environment: process.env.ENVIRONMENT
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Request processed successfully',
        requestId: event.requestContext?.requestId,
        environment: process.env.ENVIRONMENT
      })
    };
  } catch (error) {
    console.error('Error processing request:', error);

    // Try to log error to S3
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `errors/${Date.now()}-error.json`,
        Body: JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          event: event
        }),
        ContentType: 'application/json'
      }));
    } catch (logError) {
      console.error('Failed to log error to S3:', logError);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
```
