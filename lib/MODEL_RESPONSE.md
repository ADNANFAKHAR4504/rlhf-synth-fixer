# Serverless Payment Webhook Processing System - Pulumi TypeScript Implementation

I'll create a complete serverless payment webhook processing system using Pulumi with TypeScript. This implementation includes DynamoDB for storage, Lambda functions for processing and report generation, API Gateway for the webhook endpoint, S3 for report storage, and CloudWatch for logging.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi stack for the serverless payment webhook processing system.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './apigateway-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the payment webhook system.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'production',
      Project: 'payment-processor',
    }));

    // Create CloudWatch Log Groups
    const cloudWatchStack = new CloudWatchStack(
      'cloudwatch',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create DynamoDB table for transaction storage
    const dynamoDBStack = new DynamoDBStack(
      'dynamodb',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create S3 bucket for report storage
    const s3Stack = new S3Stack(
      's3',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create Lambda functions
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        tableName: dynamoDBStack.tableName,
        bucketName: s3Stack.bucketName,
        webhookLogGroupName: cloudWatchStack.webhookLogGroupName,
        reportLogGroupName: cloudWatchStack.reportLogGroupName,
        tags,
      },
      { parent: this }
    );

    // Create API Gateway
    const apiGatewayStack = new ApiGatewayStack(
      'apigateway',
      {
        environmentSuffix,
        webhookLambdaArn: lambdaStack.webhookLambdaArn,
        webhookLambdaName: lambdaStack.webhookLambdaName,
        tags,
      },
      { parent: this }
    );

    this.apiEndpoint = apiGatewayStack.apiEndpoint;
    this.tableName = dynamoDBStack.tableName;
    this.bucketName = s3Stack.bucketName;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableName: this.tableName,
      bucketName: this.bucketName,
    });
  }
}
```

## File: lib/dynamodb-stack.ts

```typescript
/**
 * dynamodb-stack.ts
 *
 * DynamoDB table for storing transaction records.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: DynamoDBStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    // Create DynamoDB table with on-demand billing
    this.table = new aws.dynamodb.Table(
      `transactions-table-${args.environmentSuffix}`,
      {
        name: `transactions-table-${args.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.tableName = this.table.name;

    this.registerOutputs({
      tableName: this.tableName,
    });
  }
}
```

## File: lib/s3-stack.ts

```typescript
/**
 * s3-stack.ts
 *
 * S3 bucket for storing daily transaction reports.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3StackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    // Create S3 bucket for reports
    this.bucket = new aws.s3.Bucket(
      `reports-bucket-${args.environmentSuffix}`,
      {
        bucket: `payment-reports-${args.environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.bucketName = this.bucket.bucket;

    this.registerOutputs({
      bucketName: this.bucketName,
    });
  }
}
```

## File: lib/cloudwatch-stack.ts

```typescript
/**
 * cloudwatch-stack.ts
 *
 * CloudWatch Log Groups for Lambda functions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly webhookLogGroup: aws.cloudwatch.LogGroup;
  public readonly reportLogGroup: aws.cloudwatch.LogGroup;
  public readonly webhookLogGroupName: pulumi.Output<string>;
  public readonly reportLogGroupName: pulumi.Output<string>;

  constructor(name: string, args: CloudWatchStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // Log group for webhook Lambda
    this.webhookLogGroup = new aws.cloudwatch.LogGroup(
      `webhook-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/webhook-processor-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Log group for report Lambda
    this.reportLogGroup = new aws.cloudwatch.LogGroup(
      `report-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/report-generator-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    this.webhookLogGroupName = this.webhookLogGroup.name;
    this.reportLogGroupName = this.reportLogGroup.name;

    this.registerOutputs({
      webhookLogGroupName: this.webhookLogGroupName,
      reportLogGroupName: this.reportLogGroupName,
    });
  }
}
```

## File: lib/lambda-stack.ts

```typescript
/**
 * lambda-stack.ts
 *
 * Lambda functions for webhook processing and report generation.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tableName: pulumi.Input<string>;
  bucketName: pulumi.Input<string>;
  webhookLogGroupName: pulumi.Input<string>;
  reportLogGroupName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly webhookLambda: aws.lambda.Function;
  public readonly reportLambda: aws.lambda.Function;
  public readonly webhookLambdaArn: pulumi.Output<string>;
  public readonly webhookLambdaName: pulumi.Output<string>;

  constructor(name: string, args: LambdaStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:lambda:LambdaStack', name, args, opts);

    // IAM role for webhook Lambda
    const webhookRole = new aws.iam.Role(
      `webhook-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Policy for webhook Lambda to access DynamoDB
    const webhookPolicy = new aws.iam.RolePolicy(
      `webhook-policy-${args.environmentSuffix}`,
      {
        role: webhookRole.id,
        policy: pulumi.all([args.tableName]).apply(([tableName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:PutItem'],
                Resource: `arn:aws:dynamodb:ap-southeast-2:*:table/${tableName}`,
              },
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Webhook Lambda function
    this.webhookLambda = new aws.lambda.Function(
      `webhook-processor-${args.environmentSuffix}`,
      {
        name: `webhook-processor-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: webhookRole.arn,
        memorySize: 512,
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: args.tableName,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });

exports.handler = async (event) => {
  console.log('Received webhook:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency, provider } = body;

    // Validate required fields
    if (!amount || !currency || !provider) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'amount, currency, and provider are required',
        }),
      };
    }

    const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    const timestamp = Date.now();

    // Store in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: amount.toString() },
        currency: { S: currency },
        provider: { S: provider },
        receivedAt: { S: new Date().toISOString() },
      },
    }));

    console.log('Transaction stored:', transactionId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        transactionId: transactionId,
        message: 'Webhook processed successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'webhook-processor',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
              },
            })
          ),
        }),
        tags: args.tags,
      },
      { parent: this, dependsOn: [webhookPolicy] }
    );

    // IAM role for report Lambda
    const reportRole = new aws.iam.Role(
      `report-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Policy for report Lambda to access DynamoDB and S3
    const reportPolicy = new aws.iam.RolePolicy(
      `report-policy-${args.environmentSuffix}`,
      {
        role: reportRole.id,
        policy: pulumi.all([args.tableName, args.bucketName]).apply(([tableName, bucketName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:Scan'],
                Resource: `arn:aws:dynamodb:ap-southeast-2:*:table/${tableName}`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject'],
                Resource: `arn:aws:s3:::${bucketName}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Report Lambda function
    this.reportLambda = new aws.lambda.Function(
      `report-generator-${args.environmentSuffix}`,
      {
        name: `report-generator-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: reportRole.arn,
        memorySize: 512,
        timeout: 300,
        environment: {
          variables: {
            TABLE_NAME: args.tableName,
            BUCKET_NAME: args.bucketName,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });
const s3 = new S3Client({ region: 'ap-southeast-2' });

exports.handler = async (event) => {
  console.log('Generating daily report');

  try {
    // Scan DynamoDB for all transactions
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
    }));

    console.log(\`Found \${scanResult.Items.length} transactions\`);

    // Generate CSV
    let csv = 'Transaction ID,Timestamp,Amount,Currency,Provider,Received At\\n';

    for (const item of scanResult.Items) {
      const row = [
        item.transactionId?.S || '',
        item.timestamp?.N || '',
        item.amount?.N || '',
        item.currency?.S || '',
        item.provider?.S || '',
        item.receivedAt?.S || '',
      ].join(',');
      csv += row + '\\n';
    }

    // Upload to S3
    const date = new Date().toISOString().split('T')[0];
    const key = \`reports/transactions-\${date}.csv\`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: csv,
      ContentType: 'text/csv',
    }));

    console.log(\`Report uploaded to s3://\${process.env.BUCKET_NAME}/\${key}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        reportKey: key,
        transactionCount: scanResult.Items.length,
      }),
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'report-generator',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/client-s3': '^3.0.0',
              },
            })
          ),
        }),
        tags: args.tags,
      },
      { parent: this, dependsOn: [reportPolicy] }
    );

    // CloudWatch Events rule for daily report generation at 2 AM UTC
    const reportScheduleRule = new aws.cloudwatch.EventRule(
      `report-schedule-${args.environmentSuffix}`,
      {
        name: `report-schedule-${args.environmentSuffix}`,
        description: 'Trigger report generation daily at 2 AM UTC',
        scheduleExpression: 'cron(0 2 * * ? *)',
        tags: args.tags,
      },
      { parent: this }
    );

    // Target for the CloudWatch Events rule
    const reportScheduleTarget = new aws.cloudwatch.EventTarget(
      `report-schedule-target-${args.environmentSuffix}`,
      {
        rule: reportScheduleRule.name,
        arn: this.reportLambda.arn,
      },
      { parent: this }
    );

    // Permission for CloudWatch Events to invoke the Lambda
    const reportLambdaPermission = new aws.lambda.Permission(
      `report-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.reportLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: reportScheduleRule.arn,
      },
      { parent: this }
    );

    this.webhookLambdaArn = this.webhookLambda.arn;
    this.webhookLambdaName = this.webhookLambda.name;

    this.registerOutputs({
      webhookLambdaArn: this.webhookLambdaArn,
      webhookLambdaName: this.webhookLambdaName,
    });
  }
}
```

## File: lib/apigateway-stack.ts

```typescript
/**
 * apigateway-stack.ts
 *
 * API Gateway REST API for webhook endpoint.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  webhookLambdaArn: pulumi.Input<string>;
  webhookLambdaName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly apiEndpoint: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    // Create REST API
    this.api = new aws.apigateway.RestApi(
      `payment-api-${args.environmentSuffix}`,
      {
        name: `payment-api-${args.environmentSuffix}`,
        description: 'Payment webhook processing API',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create request validator
    const requestValidator = new aws.apigateway.RequestValidator(
      `webhook-validator-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        name: `webhook-validator-${args.environmentSuffix}`,
        validateRequestBody: true,
      },
      { parent: this }
    );

    // Create request model for validation
    const requestModel = new aws.apigateway.Model(
      `webhook-model-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        name: `WebhookModel${args.environmentSuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
        contentType: 'application/json',
        schema: JSON.stringify({
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'WebhookPayload',
          type: 'object',
          required: ['amount', 'currency', 'provider'],
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' },
            provider: { type: 'string' },
          },
        }),
      },
      { parent: this }
    );

    // Create /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this }
    );

    // Create POST method
    const webhookMethod = new aws.apigateway.Method(
      `webhook-method-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': requestModel.name,
        },
      },
      { parent: this }
    );

    // Create Lambda integration
    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/${args.webhookLambdaArn}/invocations`,
      },
      { parent: this }
    );

    // Permission for API Gateway to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `api-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: args.webhookLambdaName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-logs-${args.environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Deploy API
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        triggers: {
          redeployment: pulumi.interpolate`${webhookResource.id}-${webhookMethod.id}-${webhookIntegration.id}`,
        },
      },
      { parent: this, dependsOn: [webhookIntegration] }
    );

    // Create stage with throttling
    const stage = new aws.apigateway.Stage(
      `api-stage-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        deployment: deployment.id,
        stageName: 'prod',
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Method settings for rate limiting
    const methodSettings = new aws.apigateway.MethodSettings(
      `method-settings-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 1000,
          throttlingRateLimit: 1000,
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      },
      { parent: this }
    );

    this.apiEndpoint = pulumi.interpolate`${this.api.executionArn}/${stage.stageName}/webhook`;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * bin/tap.ts
 *
 * Main entry point for the Pulumi program.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get the Pulumi configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

// Create the main stack
const stack = new TapStack('payment-webhook-stack', {
  environmentSuffix: environmentSuffix,
});

// Export the outputs
export const apiEndpoint = stack.apiEndpoint;
export const tableName = stack.tableName;
export const bucketName = stack.bucketName;
```

## Summary

This implementation provides a complete serverless payment webhook processing system with:

1. **DynamoDB Table**: Stores transaction records with transactionId (partition key) and timestamp (sort key), using on-demand billing mode
2. **Webhook Lambda**: Processes incoming webhook payloads, validates required fields, and stores in DynamoDB
3. **API Gateway**: REST API with /webhook POST endpoint, request validation, rate limiting (1000 req/min), and CloudWatch logging
4. **S3 Bucket**: Stores daily CSV reports with server-side encryption, versioning, and lifecycle policy to Glacier after 90 days
5. **Report Lambda**: Scheduled function that runs daily at 2 AM UTC, scans DynamoDB, generates CSV reports, and uploads to S3
6. **CloudWatch**: Log groups for both Lambda functions with 7-day retention
7. **IAM**: Proper roles and policies following least privilege principle
8. **Resource Naming**: All resources include environmentSuffix for environment isolation
9. **Tags**: All resources tagged with Environment: production and Project: payment-processor

The implementation uses Node.js 18.x runtime for both Lambda functions with 512 MB memory, includes proper error handling, and all resources are destroyable without retention policies.
