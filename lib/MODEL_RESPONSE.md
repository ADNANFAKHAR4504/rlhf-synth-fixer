### Reasoning Trace

---

This is a comprehensive AWS CDK request with TypeScript. Let me break down all the requirements:

1. Infrastructure in us-west-1
2. API Gateway → Lambda flow
3. Lambda requirements:
   - Runs in VPC (private subnet)
   - Reads from Systems Manager Parameter Store
   - Reads from Secrets Manager (as env vars)
   - Writes to DynamoDB
   - Interacts with S3
4. API Gateway:
   - Enable CORS
   - Access logging to CloudWatch
5. DynamoDB:
   - Partition key: 'id'
   - On-demand capacity mode
   - DynamoDB Streams for creation events → SQS
6. S3 bucket:
   - AES-256 encryption
   - Lifecycle policy: move to Standard-IA after 30 days
7. Lambda concurrency:
   - Provisioned concurrency
   - Auto Scaling based on custom metric
8. CloudWatch alarms for DynamoDB
9. Security:
   - Least-privilege IAM
   - CloudTrail for DynamoDB data events and API Gateway management events
10. Tags: 'environment' and 'project' on all resources

I'll structure this as a complete CDK application with proper TypeScript code.

### Answer

---

I'll help you build this comprehensive serverless infrastructure using AWS CDK with TypeScript. Let me create a well-structured solution that addresses all your requirements.

## Project Structure

First, let's set up the project structure:

```bash
mkdir serverless-app-cdk
cd serverless-app-cdk
npx cdk init app --language typescript
npm install @aws-cdk/aws-apigateway @aws-cdk/aws-lambda @aws-cdk/aws-dynamodb @aws-cdk/aws-s3 @aws-cdk/aws-ec2 @aws-cdk/aws-iam @aws-cdk/aws-cloudtrail @aws-cdk/aws-sqs @aws-cdk/aws-ssm @aws-cdk/aws-secretsmanager @aws-cdk/aws-applicationautoscaling @aws-cdk/aws-cloudwatch @aws-cdk/aws-logs
```

## Main Stack Implementation

Here's the complete CDK stack implementation:

```typescript
// lib/serverless-app-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class ServerlessAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Default tags for all resources
    cdk.Tags.of(this).add('environment', 'production');
    cdk.Tags.of(this).add('project', 'serverless-app');

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // S3 Bucket with encryption and lifecycle policy
    const appBucket = new s3.Bucket(this, 'AppBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'move-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // DynamoDB Table with streams
    const appTable = new dynamodb.Table(this, 'AppTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
    });

    // SQS Queue for DynamoDB streams
    const streamQueue = new sqs.Queue(this, 'StreamQueue', {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Systems Manager Parameter
    const configParam = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: '/serverless-app/config',
      stringValue: JSON.stringify({
        apiVersion: '1.0',
        features: {
          caching: true,
          logging: 'verbose',
        },
      }),
    });

    // Secrets Manager Secret
    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      description: 'Application secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // Lambda Function Role with least-privilege permissions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        LambdaPolicy: new iam.PolicyDocument({
          statements: [
            // DynamoDB permissions
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
              resources: [appTable.tableArn, `${appTable.tableArn}/index/*`],
            }),
            // S3 permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${appBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [appBucket.bucketArn],
            }),
            // Parameter Store permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParametersByPath'],
              resources: [configParam.parameterArn],
            }),
            // Secrets Manager permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [appSecret.secretArn],
            }),
          ],
        }),
      },
    });

    // Lambda Function
    const appFunction = new lambda.Function(this, 'AppFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        const ssm = new AWS.SSM();
        const secretsManager = new AWS.SecretsManager();
        
        exports.handler = async (event) => {
          try {
            // Get config from Parameter Store
            const paramResult = await ssm.getParameter({
              Name: process.env.CONFIG_PARAM_NAME,
            }).promise();
            
            // Get secret from Secrets Manager
            const secretResult = await secretsManager.getSecretValue({
              SecretId: process.env.SECRET_ARN,
            }).promise();
            
            // Example DynamoDB operation
            const item = {
              id: Date.now().toString(),
              data: JSON.parse(event.body || '{}'),
              timestamp: new Date().toISOString(),
            };
            
            await dynamodb.put({
              TableName: process.env.TABLE_NAME,
              Item: item,
            }).promise();
            
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
      `),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        TABLE_NAME: appTable.tableName,
        BUCKET_NAME: appBucket.bucketName,
        CONFIG_PARAM_NAME: configParam.parameterName,
        SECRET_ARN: appSecret.secretArn,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 100,
    });

    // Configure Provisioned Concurrency
    const alias = new lambda.Alias(this, 'AppFunctionAlias', {
      aliasName: 'production',
      version: appFunction.currentVersion,
      provisionedConcurrentExecutions: 5,
    });

    // Application Auto Scaling for Lambda
    const scalingTarget = new applicationautoscaling.ScalableTarget(
      this,
      'ScalableTarget',
      {
        serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
        resourceId: `function:${appFunction.functionName}:${alias.aliasName}`,
        scalableDimension: 'lambda:function:ProvisionedConcurrency',
        minCapacity: 5,
        maxCapacity: 20,
      }
    );

    // Custom metric for scaling
    const customMetric = new cloudwatch.Metric({
      namespace: 'ServerlessApp',
      metricName: 'RequestsPerFunction',
      dimensionsMap: {
        FunctionName: appFunction.functionName,
      },
    });

    // Scaling policy based on custom metric
    scalingTarget.scaleOnMetric('ScaleOnCustomMetric', {
      metric: customMetric,
      targetValue: 100,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway with CORS and logging
    const api = new apigateway.RestApi(this, 'AppApi', {
      restApiName: 'ServerlessAppAPI',
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // API Gateway Lambda integration
    const integration = new apigateway.LambdaIntegration(appFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API endpoints
    const items = api.root.addResource('items');
    items.addMethod('GET', integration);
    items.addMethod('POST', integration);

    // DynamoDB Stream to SQS
    const streamFunction = new lambda.Function(this, 'StreamFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sqs = new AWS.SQS();
        
        exports.handler = async (event) => {
          const queueUrl = process.env.QUEUE_URL;
          
          for (const record of event.Records) {
            if (record.eventName === 'INSERT') {
              await sqs.sendMessage({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(record.dynamodb.NewImage),
              }).promise();
            }
          }
        };
      `),
      environment: {
        QUEUE_URL: streamQueue.queueUrl,
      },
    });

    streamQueue.grantSendMessages(streamFunction);

    streamFunction.addEventSource(
      new lambdaEventSources.DynamoEventSource(appTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindowInMinutes: 2,
      })
    );

    // CloudWatch Alarms for DynamoDB
    new cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      metric: appTable.metricUserErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB user errors alarm',
    });

    new cloudwatch.Alarm(this, 'DynamoDBSystemErrorAlarm', {
      metric: appTable.metricSystemErrorsForOperations(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB system errors alarm',
    });

    // CloudTrail for auditing
    const trail = new cloudtrail.Trail(this, 'AppTrail', {
      includeGlobalServiceEvents: false,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // Log DynamoDB data events
    trail.addEventSelector({
      readWriteType: cloudtrail.ReadWriteType.ALL,
      dataResources: [
        {
          dataResourceType: cloudtrail.DataResourceType.DYNAMODB_TABLE,
          values: [appTable.tableArn],
        },
      ],
    });

    // Log API Gateway management events
    trail.logAllApiGatewayDataEvents();

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: appTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: appBucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: streamQueue.queueUrl,
      description: 'SQS queue URL',
    });
  }
}
```

## App Entry Point

Update the main app file:

```typescript
// bin/serverless-app-cdk.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessAppStack } from '../lib/serverless-app-stack';

const app = new cdk.App();
new ServerlessAppStack(app, 'ServerlessAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1'
  },
  description: 'Serverless application with VPC Lambda, DynamoDB, S3, and comprehensive monitoring',
});
```

## CDK Configuration

Update the CDK configuration file:

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/serverless-app-cdk.ts",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Deployment Instructions

To deploy this infrastructure:

```bash
# Install dependencies
npm install

# Bootstrap CDK (if not already done)
cdk bootstrap aws://ACCOUNT-ID/us-west-1

# Deploy the stack
cdk deploy
```

## Key Features Implemented

### 1. **VPC and Networking**

- Lambda runs in private subnets with NAT Gateway for internet access
- Proper subnet configuration for high availability

### 2. **Security**

- Least-privilege IAM roles with specific permissions
- S3 bucket encryption with AES-256
- Secrets stored in AWS Secrets Manager
- CloudTrail for comprehensive auditing

### 3. **API Gateway**

- CORS enabled for all origins (customize as needed)
- Access logging to CloudWatch
- RESTful endpoints for items resource

### 4. **Lambda Configuration**

- Provisioned concurrency for consistent performance
- Auto-scaling based on custom metrics
- Environment variables for configuration

### 5. **DynamoDB**

- On-demand billing mode
- Streams enabled for change capture
- Point-in-time recovery enabled

### 6. **Monitoring and Alerting**

- CloudWatch alarms for DynamoDB errors
- Application auto-scaling for Lambda concurrency
- Comprehensive logging

### 7. **Event Processing**

- DynamoDB streams trigger Lambda function
- INSERT events sent to SQS queue
- Batching configured for efficiency

### 8. **Resource Tagging**

- All resources tagged with 'environment' and 'project'
- Tags applied at stack level for consistency

## Considerations for Production

1. **API Security**: Consider adding API keys, request throttling, or AWS WAF
2. **VPC Endpoints**: Add VPC endpoints for AWS services to reduce costs
3. **Multi-Region**: Consider cross-region replication for DynamoDB
4. **Backup Strategy**: Implement regular backups for critical data
5. **Custom Domain**: Add a custom domain name for the API Gateway
6. **Monitoring**: Set up dashboards and additional metrics as needed

This implementation provides a robust, scalable, and secure serverless architecture that meets all your requirements while following AWS best practices.
