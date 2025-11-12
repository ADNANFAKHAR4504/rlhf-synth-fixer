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

## ./lib/lambda/api-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME || 'events-table';
const BUCKET_NAME = process.env.BUCKET_NAME || 'lambda-code-bucket';

interface Event {
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
  method: string;
  path: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, pathParameters, body } = event;

    // Log to S3 for audit purposes
    await logToS3(event);

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getEvent(pathParameters.id);
        }
        return await listEvents();

      case 'POST':
        return await createEvent(body);

      case 'DELETE':
        if (pathParameters?.id) {
          return await deleteEvent(pathParameters.id);
        }
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Event ID is required for deletion' }),
        };

      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function logToS3(event: APIGatewayProxyEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const key = `logs/${timestamp.split('T')[0]}/${timestamp}-${uuidv4()}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(event),
        ContentType: 'application/json',
      })
    );
    console.log(`Logged event to S3: ${key}`);
  } catch (error) {
    console.error('Failed to log to S3:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

async function createEvent(
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body || body.trim() === '' || body === 'null') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  let eventData;
  try {
    eventData = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  if (!eventData || Object.keys(eventData).length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body cannot be empty' }),
    };
  }

  const eventId = uuidv4();
  const timestamp = new Date().toISOString();

  const item: Event = {
    id: eventId,
    timestamp,
    data: eventData,
    method: 'POST',
    path: '/api/events',
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Event created successfully',
      event: item,
    }),
  };
}

async function getEvent(id: string): Promise<APIGatewayProxyResult> {
  // Query for items with this id (partition key)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Event not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Items[0]),
  };
}

async function listEvents(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: result.Items || [],
      count: result.Count || 0,
    }),
  };
}

async function deleteEvent(id: string): Promise<APIGatewayProxyResult> {
  // First, query to get the item with its timestamp
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
      Limit: 1,
    })
  );

  if (!queryResult.Items || queryResult.Items.length === 0) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Event not found' }),
    };
  }

  const item = queryResult.Items[0];

  // Now delete using both id and timestamp
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id: item.id,
        timestamp: item.timestamp,
      },
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Event deleted successfully' }),
  };
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
  customDomainName?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const isProd = environmentSuffix === 'prod';
    const resourcePrefix = isProd ? 'prod-' : `${environmentSuffix}-`;

    // Create S3 bucket for Lambda code
    const lambdaCodeBucket = new s3.Bucket(this, 'LambdaCodeBucket', {
      bucketName: `${resourcePrefix}lambda-code-bucket-${this.account}`,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'EventsTable', {
      tableName: `${resourcePrefix}events-table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProd,
    });

    // Create SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'LambdaAlarmTopic', {
      topicName: `${resourcePrefix}lambda-alarms`,
      displayName: `${resourcePrefix}Lambda Function Alarms`,
    });

    // Add email subscription if provided
    if (props?.notificationEmail) {
      alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create Lambda execution role with necessary permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${resourcePrefix}lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions to the role
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          lambdaCodeBucket.bucketArn,
          `${lambdaCodeBucket.bucketArn}/*`,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [table.tableArn],
      })
    );

    // Create Lambda function
    const apiHandler = new nodejslambda.NodejsFunction(this, 'ApiHandler', {
      functionName: `${resourcePrefix}api-handler`,
      entry: path.join(__dirname, 'lambda/api-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: lambdaCodeBucket.bucketName,
        NODE_ENV: isProd ? 'production' : 'development',
      },
      role: lambdaExecutionRole,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      logRetention: logs.RetentionDays.TWO_WEEKS,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_143_0, // Enable Lambda Insights
    });

    // Create CloudWatch Alarms for Lambda
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `${resourcePrefix}lambda-errors`,
      metric: apiHandler.metricErrors({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorsAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    const lambdaThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottlesAlarm',
      {
        alarmName: `${resourcePrefix}lambda-throttles`,
        metric: apiHandler.metricThrottles({
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        actionsEnabled: true,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    lambdaThrottlesAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Create CloudWatch Logs role for API Gateway (required for access logging)
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchRole',
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    // Set the CloudWatch role for API Gateway account settings
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    // Create Log Group for API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: `/aws/apigateway/${resourcePrefix}api`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `${resourcePrefix}serverless-api`,
      description: 'Serverless API with Lambda integration',
      deployOptions: {
        stageName: isProd ? 'prod' : environmentSuffix,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: !isProd, // Enable in non-prod only for security
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Add custom domain if provided
    if (props?.customDomainName && props?.hostedZoneName) {
      // Create a certificate
      const certificate = new certmanager.Certificate(this, 'ApiCertificate', {
        domainName: props.customDomainName,
        validation: certmanager.CertificateValidation.fromDns(
          props.hostedZoneId
            ? route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
                hostedZoneId: props.hostedZoneId,
                zoneName: props.hostedZoneName,
              })
            : route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: props.hostedZoneName,
              })
        ),
      });

      // Create custom domain
      const domainName = new apigateway.DomainName(this, 'ApiDomainName', {
        domainName: props.customDomainName,
        certificate: certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      // Map the custom domain to the API
      new apigateway.BasePathMapping(this, 'ApiPathMapping', {
        domainName: domainName,
        restApi: api,
        stage: api.deploymentStage,
      });

      // Create Route53 record
      const zone = props.hostedZoneId
        ? route53.HostedZone.fromHostedZoneAttributes(
            this,
            'Route53HostedZone',
            {
              hostedZoneId: props.hostedZoneId,
              zoneName: props.hostedZoneName,
            }
          )
        : route53.HostedZone.fromLookup(this, 'Route53HostedZone', {
            domainName: props.hostedZoneName,
          });

      new route53.ARecord(this, 'ApiDnsRecord', {
        recordName: props.customDomainName.split('.')[0], // Extracts subdomain
        zone: zone,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(domainName)
        ),
      });
    }

    // Create the API resources and methods
    const apiResource = api.root.addResource('api');
    const eventsResource = apiResource.addResource('events');

    // GET /api/events
    eventsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // POST /api/events
    eventsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // GET /api/events/{id}
    const eventResource = eventsResource.addResource('{id}');
    eventResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // DELETE /api/events/{id}
    eventResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/${api.deploymentStage.stageName}/`,
      description: 'API Gateway URL',
    });

    if (props?.customDomainName) {
      new cdk.CfnOutput(this, 'ApiCustomDomain', {
        value: `https://${props.customDomainName}/`,
        description: 'API Gateway Custom Domain URL',
      });
    }

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunction', {
      value: apiHandler.functionName,
      description: 'Lambda Function Name',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { APIGatewayClient, GetRestApiCommand, GetStageCommand } from '@aws-sdk/client-api-gateway';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read region from AWS_REGION file
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

// Extract stack outputs
const tableName = outputs.DynamoDBTableName;
const lambdaFunctionName = outputs.LambdaFunction;
const apiUrl = outputs.ApiUrl;

// Derive resource names based on environment suffix
const expectedBucketName = `${environmentSuffix}-lambda-code-bucket`;
const expectedAlarmTopicName = `${environmentSuffix}-lambda-alarms`;
const expectedErrorAlarmName = `${environmentSuffix}-lambda-errors`;
const expectedThrottleAlarmName = `${environmentSuffix}-lambda-throttles`;

describe('Serverless API Infrastructure Integration Tests', () => {
  describe('DynamoDB Table', () => {
    test('should exist and have correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have correct partition and sort keys', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const partitionKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const sortKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('id');
      expect(sortKey?.AttributeName).toBe('timestamp');
    });

    test('should use PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have correct attribute definitions', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const attributeDefinitions = response.Table?.AttributeDefinitions;
      expect(attributeDefinitions).toBeDefined();
      expect(attributeDefinitions?.length).toBe(2);

      const idAttribute = attributeDefinitions?.find((a) => a.AttributeName === 'id');
      const timestampAttribute = attributeDefinitions?.find(
        (a) => a.AttributeName === 'timestamp'
      );

      expect(idAttribute?.AttributeType).toBe('S');
      expect(timestampAttribute?.AttributeType).toBe('S');
    });
  });

  describe('Lambda Function', () => {
    test('should exist and be in active state', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(lambdaFunctionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have correct runtime and configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('should have correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TABLE_NAME).toBe(tableName);
      expect(envVars?.NODE_ENV).toBe('development');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have Lambda Insights layer attached', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      const layers = response.Configuration?.Layers || [];
      const hasInsightsLayer = layers.some((layer) =>
        layer.Arn?.includes('LambdaInsightsExtension')
      );

      expect(hasInsightsLayer).toBe(true);
    });
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      // Get account ID to construct bucket name
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);
      const lambdaArn = response.Configuration?.FunctionArn;
      const accountId = lambdaArn?.split(':')[4];

      const bucketName = `${expectedBucketName}-${accountId}`;

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have Lambda errors alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedErrorAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms?.length).toBe(1);
      const alarm = response.MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe(expectedErrorAlarmName);
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should have Lambda throttles alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedThrottleAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms?.length).toBe(1);
      const alarm = response.MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe(expectedThrottleAlarmName);
      expect(alarm?.MetricName).toBe('Throttles');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Threshold).toBe(1);
    });

    test('should have alarm actions configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedErrorAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.ActionsEnabled).toBe(true);
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    test('should be accessible and return valid response', async () => {
      // Test the root path
      const response = await axios.get(apiUrl, { validateStatus: () => true });

      // API Gateway should respond (even if it's a 404 or other status)
      expect(response.status).toBeDefined();
    });

    test('should have CORS headers configured', async () => {
      const response = await axios.options(`${apiUrl}api/events`, {
        validateStatus: () => true,
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('End-to-End API Tests', () => {
    let createdEventId: string;

    test('should create a new event via POST /api/events', async () => {
      const eventData = {
        name: 'Integration Test Event',
        description: 'This is a test event created during integration testing',
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(`${apiUrl}api/events`, eventData, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.event).toBeDefined();
      expect(response.data.event.id).toBeDefined();

      createdEventId = response.data.event.id;
    });

    test('should list events via GET /api/events', async () => {
      const response = await axios.get(`${apiUrl}api/events`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.events).toBeInstanceOf(Array);
      expect(response.data.count).toBeGreaterThan(0);
    });

    test('should retrieve a specific event via GET /api/events/{id}', async () => {
      if (!createdEventId) {
        throw new Error('No event ID available for testing');
      }

      const response = await axios.get(`${apiUrl}api/events/${createdEventId}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(createdEventId);
    });

    test('should delete an event via DELETE /api/events/{id}', async () => {
      if (!createdEventId) {
        throw new Error('No event ID available for testing');
      }

      const response = await axios.delete(`${apiUrl}api/events/${createdEventId}`);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('successfully');
    });

    test('should return 404 for non-existent event', async () => {
      const response = await axios.get(`${apiUrl}api/events/non-existent-id`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
    });

    test('should return 400 for POST with empty body', async () => {
      const response = await axios.post(`${apiUrl}api/events`, null, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });
  });

  describe('Data Persistence and Consistency', () => {
    test('should persist data correctly in DynamoDB', async () => {
      // Create an event
      const eventData = {
        name: 'Persistence Test',
        value: Math.random().toString(),
      };

      const createResponse = await axios.post(`${apiUrl}api/events`, eventData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const eventId = createResponse.data.event.id;

      // Wait a moment for consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retrieve the event by ID
      const getResponse = await axios.get(`${apiUrl}api/events/${eventId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data).toMatchObject(eventData);

      // Cleanup
      await axios.delete(`${apiUrl}api/events/${eventId}`);
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        axios.get(`${apiUrl}api/events`)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    test('should respond within acceptable time', async () => {
      const start = Date.now();
      await axios.get(`${apiUrl}api/events`);
      const duration = Date.now() - start;

      // API should respond within 5 seconds
      expect(duration).toBeLessThan(5000);
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
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create Lambda code bucket with correct configuration', () => {
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
      });
    });

    test('should have auto-delete objects enabled for dev environment', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create events table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
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
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create alarm topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `${environmentSuffix}-Lambda Function Alarms`,
        TopicName: `${environmentSuffix}-lambda-alarms`,
      });
    });
  });

  describe('IAM Role - Lambda Execution', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        },
      });
    });

    test('should have correct managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicies: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp(
                  'service-role/AWSLambdaBasicExecutionRole'
                ),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should have S3 permissions policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have DynamoDB permissions policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Role - API Gateway CloudWatch', () => {
    test('should create API Gateway CloudWatch role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create API handler Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'development',
          },
        },
      });
    });

    test('should have Lambda Insights enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Layers: Match.arrayWith([
          Match.stringLikeRegexp('LambdaInsightsExtension'),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Lambda errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
      });
    });

    test('should create Lambda throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
      });
    });

    test('should have alarm actions configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ActionsEnabled: true,
        AlarmActions: Match.arrayWith([Match.objectLike({ Ref: Match.anyValue() })]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `${environmentSuffix}-serverless-api`,
        Description: 'Serverless API with Lambda integration',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should create API Gateway stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
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

    test('should create /api/events resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'events',
      });
    });

    test('should create /api/events/{id} resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });
    });

    test('should create GET method for /api/events', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
      });
    });

    test('should create POST method for /api/events', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });
    });

    test('should create DELETE method for /api/events/{id}', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'NONE',
      });
    });

    test('should have CORS enabled with OPTIONS methods', () => {
      const optionsMethods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(optionsMethods).length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create API Gateway access log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/${environmentSuffix}-api`,
        RetentionInDays: 14,
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('should grant API Gateway permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should have multiple Lambda permissions for different API methods', () => {
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThan(4);
    });
  });

  describe('Stack Outputs', () => {
    test('should have API URL output', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
      });
    });

    test('should have DynamoDB table name output', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
      });
    });

    test('should have Lambda function name output', () => {
      template.hasOutput('LambdaFunction', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
    });

    test('should have API Gateway account configured', () => {
      template.resourceCountIs('AWS::ApiGateway::Account', 1);
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Tagging', () => {
    test('should have environment tags on resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('Production vs Non-Production Configuration', () => {
    test('should configure dev environment with destroy policy', () => {
      const devStack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'dev',
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should use environment-specific resource prefix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-api-handler`,
      });
    });
  });

  describe('Optional Features - Notification Email', () => {
    test('should add email subscription when notification email is provided', () => {
      const stackWithEmail = new TapStack(app, 'StackWithEmail', {
        environmentSuffix: 'dev',
        notificationEmail: 'test@example.com',
      });
      const emailTemplate = Template.fromStack(stackWithEmail);

      emailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should not add email subscription when notification email is not provided', () => {
      const emailTemplate = Template.fromStack(stack);
      const subscriptions = emailTemplate.findResources('AWS::SNS::Subscription');
      expect(Object.keys(subscriptions).length).toBe(0);
    });
  });

  describe('Optional Features - Custom Domain', () => {
    test('should create custom domain resources when domain name and hosted zone are provided', () => {
      const stackWithDomain = new TapStack(app, 'StackWithDomain', {
        environmentSuffix: 'dev',
        customDomainName: 'api.example.com',
        hostedZoneName: 'example.com',
        hostedZoneId: 'Z1234567890ABC',
      });
      const domainTemplate = Template.fromStack(stackWithDomain);

      domainTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'api.example.com',
      });

      domainTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'api.example.com',
        SecurityPolicy: 'TLS_1_2',
      });

      domainTemplate.hasResourceProperties('AWS::ApiGateway::BasePathMapping', {});

      domainTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'api.example.com.',
        Type: 'A',
      });
    });

    test('should create custom domain output when custom domain is provided', () => {
      const stackWithDomain = new TapStack(app, 'StackWithDomain2', {
        environmentSuffix: 'dev',
        customDomainName: 'api.example.com',
        hostedZoneName: 'example.com',
      });
      const domainTemplate = Template.fromStack(stackWithDomain);

      domainTemplate.hasOutput('ApiCustomDomain', {
        Description: 'API Gateway Custom Domain URL',
      });
    });

    test('should not create custom domain resources when domain name is not provided', () => {
      const domainTemplate = Template.fromStack(stack);
      const certificates = domainTemplate.findResources('AWS::CertificateManager::Certificate');
      const domainNames = domainTemplate.findResources('AWS::ApiGateway::DomainName');

      expect(Object.keys(certificates).length).toBe(0);
      expect(Object.keys(domainNames).length).toBe(0);
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
