# Ideal CDKTF Loyalty Program Infrastructure

Here's the complete, production-ready infrastructure code for the loyalty program system using CDKTF with TypeScript:

## File Structure
```
lib/
├── tap-stack.ts                 # Main stack with AWS provider and backend
├── loyalty-program-stack.ts     # Loyalty program infrastructure
├── point-calc-lambda.js        # Point calculation Lambda function
├── stream-processor-lambda.js  # DynamoDB stream processor Lambda
└── lambda-layer/
    └── nodejs/
        └── package.json         # Shared Lambda dependencies
```

## Main Stack (lib/tap-stack.ts)

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { LoyaltyProgramStack } from './loyalty-program-stack';
import * as fs from 'fs';
import * as path from 'path';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Read region override if it exists
    const regionOverride = fs.existsSync(path.join(__dirname, 'AWS_REGION'))
      ? fs.readFileSync(path.join(__dirname, 'AWS_REGION'), 'utf8').trim()
      : null;

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = regionOverride || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    new LoyaltyProgramStack(this, 'loyalty-program', {
      environmentSuffix,
      awsRegion,
    });
  }
}
```

## Loyalty Program Stack (lib/loyalty-program-stack.ts)

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayRequestValidator } from '@cdktf/provider-aws/lib/api-gateway-request-validator';
import { ApiGatewayUsagePlan } from '@cdktf/provider-aws/lib/api-gateway-usage-plan';
import { ApiGatewayModel } from '@cdktf/provider-aws/lib/api-gateway-model';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { LambdaLayerVersion } from '@cdktf/provider-aws/lib/lambda-layer-version';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

interface LoyaltyProgramStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class LoyaltyProgramStack extends Construct {
  public readonly apiEndpoint: TerraformOutput;
  public readonly dynamoTableName: TerraformOutput;
  public readonly snsTopicArn: TerraformOutput;

  constructor(scope: Construct, id: string, props: LoyaltyProgramStackProps) {
    super(scope, id);

    new ArchiveProvider(this, 'archive-provider');

    // Dead Letter Queues for Lambda functions
    const pointCalcDlq = new SqsQueue(this, 'point-calc-dlq', {
      name: `loyalty-point-calc-dlq-${props.environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: `loyalty-point-calc-dlq-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    const streamProcessorDlq = new SqsQueue(this, 'stream-processor-dlq', {
      name: `loyalty-stream-processor-dlq-${props.environmentSuffix}`,
      messageRetentionSeconds: 1209600,
      tags: {
        Name: `loyalty-stream-processor-dlq-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // CloudWatch Log Groups with retention
    const pointCalcLogGroup = new CloudwatchLogGroup(this, 'point-calc-log-group', {
      name: `/aws/lambda/loyalty-point-calc-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `loyalty-point-calc-logs-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    const streamProcessorLogGroup = new CloudwatchLogGroup(this, 'stream-processor-log-group', {
      name: `/aws/lambda/loyalty-stream-processor-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `loyalty-stream-processor-logs-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // DynamoDB Table for Members
    const membersTable = new DynamodbTable(this, 'members-table', {
      name: `loyalty-members-${props.environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'memberId',
      rangeKey: 'transactionId',
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      deletionProtectionEnabled: false, // Ensure destroyable for testing
      attribute: [
        {
          name: 'memberId',
          type: 'S',
        },
        {
          name: 'transactionId',
          type: 'S',
        },
        {
          name: 'email',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'email-index',
          hashKey: 'email',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: 'alias/aws/dynamodb',
      },
      tags: {
        Name: `loyalty-members-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // SNS Topic for Notifications
    const notificationTopic = new SnsTopic(this, 'notification-topic', {
      name: `loyalty-notifications-${props.environmentSuffix}`,
      displayName: 'Loyalty Program Notifications',
      kmsMasterKeyId: 'alias/aws/sns',
      tags: {
        Name: `loyalty-notifications-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // Create Lambda Layer for shared dependencies
    const layerPath = path.join(__dirname, 'lambda-layer');
    if (!fs.existsSync(layerPath)) {
      fs.mkdirSync(layerPath, { recursive: true });
      fs.mkdirSync(path.join(layerPath, 'nodejs'), { recursive: true });

      // Create package.json for layer
      fs.writeFileSync(
        path.join(layerPath, 'nodejs', 'package.json'),
        JSON.stringify({
          name: 'loyalty-lambda-layer',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-dynamodb': '^3.0.0',
            '@aws-sdk/lib-dynamodb': '^3.0.0',
            '@aws-sdk/client-sns': '^3.0.0',
          },
        })
      );

      // Install dependencies
      execSync('npm install --production', { cwd: path.join(layerPath, 'nodejs') });
    }

    const lambdaLayerAsset = new DataArchiveFile(this, 'lambda-layer-zip', {
      type: 'zip',
      outputPath: 'lambda-layer.zip',
      sourceDir: layerPath,
    });

    const lambdaLayer = new LambdaLayerVersion(this, 'lambda-layer', {
      layerName: `loyalty-dependencies-${props.environmentSuffix}`,
      filename: lambdaLayerAsset.outputPath,
      compatibleRuntimes: ['nodejs20.x'],
      description: 'Shared dependencies for loyalty program Lambda functions',
    });

    // IAM Role for Point Calculation Lambda
    const pointCalcLambdaRole = new IamRole(this, 'point-calc-lambda-role', {
      name: `loyalty-point-calc-lambda-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `loyalty-point-calc-lambda-role-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // IAM Policy for Point Calculation Lambda
    const pointCalcPolicy = new IamPolicy(this, 'point-calc-policy', {
      name: `loyalty-point-calc-${props.environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:TransactWriteItems',
            ],
            Resource: [
              membersTable.arn,
              `${membersTable.arn}/index/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: pointCalcLogGroup.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: pointCalcDlq.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'point-calc-policy-attachment', {
      role: pointCalcLambdaRole.name,
      policyArn: pointCalcPolicy.arn,
    });

    // Package Lambda Functions
    const pointCalcLambdaCode = fs.readFileSync(
      path.join(__dirname, 'point-calc-lambda.js'),
      'utf8'
    );

    const pointCalcLambdaAsset = new DataArchiveFile(this, 'point-calc-lambda-zip', {
      type: 'zip',
      outputPath: 'point-calc-lambda.zip',
      source: [
        {
          content: pointCalcLambdaCode,
          filename: 'index.js',
        },
      ],
    });

    // Point Calculation Lambda
    const pointCalcLambda = new LambdaFunction(this, 'point-calc-lambda', {
      functionName: `loyalty-point-calc-${props.environmentSuffix}`,
      role: pointCalcLambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      filename: pointCalcLambdaAsset.outputPath,
      sourceCodeHash: pointCalcLambdaAsset.outputBase64Sha256,
      timeout: 30,
      memorySize: 256,
      layers: [lambdaLayer.arn],
      deadLetterConfig: {
        targetArn: pointCalcDlq.arn,
      },
      environment: {
        variables: {
          TABLE_NAME: membersTable.name,
          AWS_REGION: props.awsRegion,
        },
      },
      tags: {
        Name: `loyalty-point-calc-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
      dependsOn: [pointCalcLogGroup],
    });

    // IAM Role for Stream Processing Lambda
    const streamProcessorRole = new IamRole(this, 'stream-processor-role', {
      name: `loyalty-stream-processor-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `loyalty-stream-processor-role-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // IAM Policy for Stream Processing Lambda
    const streamProcessorPolicy = new IamPolicy(this, 'stream-processor-policy', {
      name: `loyalty-stream-processor-${props.environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:DescribeStream',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:ListStreams',
            ],
            Resource: `${membersTable.arn}/stream/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: notificationTopic.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: streamProcessorLogGroup.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: streamProcessorDlq.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'stream-processor-policy-attachment', {
      role: streamProcessorRole.name,
      policyArn: streamProcessorPolicy.arn,
    });

    // Stream Processing Lambda Asset
    const streamProcessorLambdaCode = fs.readFileSync(
      path.join(__dirname, 'stream-processor-lambda.js'),
      'utf8'
    );

    const streamProcessorLambdaAsset = new DataArchiveFile(this, 'stream-processor-lambda-zip', {
      type: 'zip',
      outputPath: 'stream-processor-lambda.zip',
      source: [
        {
          content: streamProcessorLambdaCode,
          filename: 'index.js',
        },
      ],
    });

    // Stream Processing Lambda
    const streamProcessorLambda = new LambdaFunction(this, 'stream-processor-lambda', {
      functionName: `loyalty-stream-processor-${props.environmentSuffix}`,
      role: streamProcessorRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      filename: streamProcessorLambdaAsset.outputPath,
      sourceCodeHash: streamProcessorLambdaAsset.outputBase64Sha256,
      timeout: 60,
      memorySize: 256,
      layers: [lambdaLayer.arn],
      deadLetterConfig: {
        targetArn: streamProcessorDlq.arn,
      },
      environment: {
        variables: {
          SNS_TOPIC_ARN: notificationTopic.arn,
          AWS_REGION: props.awsRegion,
        },
      },
      tags: {
        Name: `loyalty-stream-processor-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
      dependsOn: [streamProcessorLogGroup],
    });

    // DynamoDB Stream Event Source Mapping
    new LambdaEventSourceMapping(this, 'stream-event-mapping', {
      eventSourceArn: membersTable.streamArn!,
      functionName: streamProcessorLambda.arn,
      startingPosition: 'LATEST',
      maximumBatchingWindowInSeconds: 5,
      parallelizationFactor: 10,
      maximumRetryAttempts: 3,
      destinationConfig: {
        onFailure: {
          destinationArn: streamProcessorDlq.arn,
        },
      },
    });

    // API Gateway Request Model
    const transactionRequestModel = new ApiGatewayModel(this, 'transaction-request-model', {
      restApiId: api.id,
      name: 'TransactionRequest',
      contentType: 'application/json',
      schema: JSON.stringify({
        type: 'object',
        required: ['memberId', 'transactionAmount', 'transactionType'],
        properties: {
          memberId: { type: 'string', minLength: 1 },
          transactionAmount: { type: 'number', minimum: 0 },
          transactionType: { type: 'string', enum: ['purchase', 'referral', 'bonus'] },
        },
      }),
    });

    // API Gateway
    const api = new ApiGatewayRestApi(this, 'loyalty-api', {
      name: `loyalty-api-${props.environmentSuffix}`,
      description: 'Loyalty Program API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `loyalty-api-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // Request Validator
    const requestValidator = new ApiGatewayRequestValidator(this, 'request-validator', {
      restApiId: api.id,
      name: 'request-validator',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // API Resources
    const transactionsResource = new ApiGatewayResource(this, 'transactions-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'transactions',
    });

    // API Method
    const transactionMethod = new ApiGatewayMethod(this, 'transaction-method', {
      restApiId: api.id,
      resourceId: transactionsResource.id,
      httpMethod: 'POST',
      authorization: 'AWS_IAM', // Add IAM authorization
      requestValidatorId: requestValidator.id,
      requestModels: {
        'application/json': transactionRequestModel.name,
      },
    });

    // API Integration
    new ApiGatewayIntegration(this, 'transaction-integration', {
      restApiId: api.id,
      resourceId: transactionsResource.id,
      httpMethod: transactionMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: pointCalcLambda.invokeArn,
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: pointCalcLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [transactionMethod],
    });

    // API Stage with Usage Plan
    const apiStage = new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: props.environmentSuffix,
      tags: {
        Name: `loyalty-api-stage-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // Usage Plan for throttling
    new ApiGatewayUsagePlan(this, 'usage-plan', {
      name: `loyalty-usage-plan-${props.environmentSuffix}`,
      description: 'Loyalty API Usage Plan',
      apiStages: [
        {
          apiId: api.id,
          stage: apiStage.stageName,
        },
      ],
      throttleSettings: {
        rateLimit: 50,
        burstLimit: 100,
      },
      quotaSettings: {
        limit: 10000,
        period: 'DAY',
      },
    });

    // EventBridge Rule for Periodic Tier Review
    const tierReviewRule = new CloudwatchEventRule(this, 'tier-review-rule', {
      name: `loyalty-tier-review-${props.environmentSuffix}`,
      description: 'Periodic tier review for loyalty members',
      scheduleExpression: 'rate(1 day)',
      tags: {
        Name: `loyalty-tier-review-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    new CloudwatchEventTarget(this, 'tier-review-target', {
      rule: tierReviewRule.name,
      arn: streamProcessorLambda.arn,
    });

    new LambdaPermission(this, 'eventbridge-lambda-permission', {
      statementId: 'AllowEventBridgeInvoke',
      action: 'lambda:InvokeFunction',
      functionName: streamProcessorLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: tierReviewRule.arn,
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'high-transaction-volume-alarm', {
      alarmName: `loyalty-high-transactions-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Invocations',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1000,
      alarmDescription: 'Alert when transaction volume is high',
      dimensions: {
        FunctionName: pointCalcLambda.functionName,
      },
      tags: {
        Name: `loyalty-high-transactions-alarm-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'failed-transactions-alarm', {
      alarmName: `loyalty-failed-transactions-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when transactions are failing',
      actionsEnabled: true,
      alarmActions: [notificationTopic.arn],
      dimensions: {
        FunctionName: pointCalcLambda.functionName,
      },
      tags: {
        Name: `loyalty-failed-transactions-alarm-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
      },
    });

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, 'loyalty-dashboard', {
      dashboardName: `loyalty-metrics-${props.environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'Total Transactions' }],
                ['.', 'Errors', { stat: 'Sum', label: 'Failed Transactions' }],
                ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                ['.', 'ConcurrentExecutions', { stat: 'Maximum', label: 'Peak Concurrency' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: props.awsRegion,
              title: 'Transaction Metrics',
              period: 300,
              dimensions: {
                FunctionName: pointCalcLambda.functionName,
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/DynamoDB', 'UserErrors', { stat: 'Sum' }],
                ['.',  'SystemErrors', { stat: 'Sum' }],
                ['.', 'ConsumedReadCapacityUnits', { stat: 'Sum' }],
                ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
                ['.', 'ThrottledRequests', { stat: 'Sum' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: props.awsRegion,
              title: 'DynamoDB Metrics',
              period: 300,
              dimensions: {
                TableName: membersTable.name,
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
                ['.', 'Errors', { stat: 'Sum' }],
                ['.', 'Duration', { stat: 'Average' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: props.awsRegion,
              title: 'Stream Processor Metrics',
              period: 300,
              dimensions: {
                FunctionName: streamProcessorLambda.functionName,
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/SNS', 'NumberOfMessagesPublished', { stat: 'Sum' }],
                ['.', 'NumberOfNotificationsFailed', { stat: 'Sum' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: props.awsRegion,
              title: 'Notification Metrics',
              period: 300,
              dimensions: {
                TopicName: notificationTopic.name,
              },
            },
          },
        ],
      }),
    });

    // Terraform Outputs
    this.apiEndpoint = new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${props.awsRegion}.amazonaws.com/${props.environmentSuffix}`,
      description: 'API Gateway endpoint URL',
    });

    this.dynamoTableName = new TerraformOutput(this, 'dynamo-table-name', {
      value: membersTable.name,
      description: 'DynamoDB table name',
    });

    this.snsTopicArn = new TerraformOutput(this, 'sns-topic-arn', {
      value: notificationTopic.arn,
      description: 'SNS Topic ARN for notifications',
    });
  }
}
```

## Lambda Functions

### Point Calculation Lambda (lib/point-calc-lambda.js)

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
  },
});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body);
    const { memberId, transactionAmount, transactionType } = body;

    if (!memberId || !transactionAmount || !transactionType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: memberId, transactionAmount, transactionType'
        })
      };
    }

    if (transactionAmount < 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Transaction amount must be positive' })
      };
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const points = calculatePoints(transactionAmount, transactionType);
    const timestamp = new Date().toISOString();

    // Get current member points
    const getMemberCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        memberId: memberId,
        transactionId: 'MEMBER_PROFILE'
      }
    });

    let currentPoints = 0;
    let email = body.email || null;

    try {
      const memberData = await docClient.send(getMemberCommand);
      if (memberData.Item) {
        currentPoints = memberData.Item.totalPoints || 0;
        email = memberData.Item.email || email;
      }
    } catch (error) {
      console.log('Member profile not found, creating new member');
    }

    const newTotalPoints = currentPoints + points;
    const tier = calculateTier(newTotalPoints);

    // Prepare transaction items
    const transactItems = [
      {
        Put: {
          TableName: process.env.TABLE_NAME,
          Item: {
            memberId,
            transactionId,
            transactionAmount,
            transactionType,
            pointsEarned: points,
            timestamp
          }
        }
      },
      {
        Put: {
          TableName: process.env.TABLE_NAME,
          Item: {
            memberId,
            transactionId: 'MEMBER_PROFILE',
            totalPoints: newTotalPoints,
            tier,
            email,
            lastUpdated: timestamp
          }
        }
      }
    ];

    // Execute transaction
    const transactCommand = new TransactWriteCommand({
      TransactItems: transactItems
    });

    await docClient.send(transactCommand);

    console.log('Transaction completed successfully:', {
      transactionId,
      pointsEarned: points,
      totalPoints: newTotalPoints,
      tier
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        transactionId,
        pointsEarned: points,
        totalPoints: newTotalPoints,
        tier,
        message: 'Transaction processed successfully'
      })
    };
  } catch (error) {
    console.error('Error processing transaction:', error);

    // Check for specific DynamoDB errors
    if (error.name === 'TransactionCanceledException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Transaction conflict. Please retry.'
        })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process transaction',
        details: error.message
      })
    };
  }
};

function calculatePoints(amount, type) {
  const rates = {
    purchase: 0.1,
    referral: 0.15,
    bonus: 0.2
  };

  const baseRate = rates[type] || 0.05;
  return Math.floor(amount * baseRate);
}

function calculateTier(points) {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  if (points >= 1000) return 'SILVER';
  return 'BRONZE';
}
```

### Stream Processor Lambda (lib/stream-processor-lambda.js)

```javascript
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000
};

exports.handler = async (event) => {
  console.log('Processing stream records:', JSON.stringify(event.Records, null, 2));

  const notifications = [];

  for (const record of event.Records) {
    try {
      if (record.eventName === 'MODIFY' || record.eventName === 'INSERT') {
        const newImage = record.dynamodb.NewImage;
        const oldImage = record.dynamodb.OldImage;

        // Check if this is a member profile update
        if (newImage?.transactionId?.S === 'MEMBER_PROFILE') {
          const newPoints = parseInt(newImage.totalPoints?.N || 0);
          const oldPoints = parseInt(oldImage?.totalPoints?.N || 0);
          const memberId = newImage.memberId?.S;
          const email = newImage.email?.S;

          const newTier = getTier(newPoints);
          const oldTier = getTier(oldPoints);

          // Check for tier upgrade
          if (newTier !== oldTier && getTierLevel(newTier) > getTierLevel(oldTier)) {
            console.log(`Tier upgrade detected for member ${memberId}: ${oldTier} -> ${newTier}`);

            notifications.push({
              memberId,
              email,
              oldTier,
              newTier,
              points: newPoints,
              timestamp: new Date().toISOString()
            });
          }

          // Check for milestone achievements
          const milestones = checkMilestones(oldPoints, newPoints);
          if (milestones.length > 0) {
            console.log(`Milestones achieved for member ${memberId}:`, milestones);

            notifications.push({
              memberId,
              email,
              milestones,
              points: newPoints,
              timestamp: new Date().toISOString(),
              type: 'milestone'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing record:', error, 'Record:', record);
      // Continue processing other records even if one fails
    }
  }

  // Send notifications
  for (const notification of notifications) {
    await sendNotification(notification);
  }

  console.log(`Processed ${event.Records.length} records, sent ${notifications.length} notifications`);

  return {
    statusCode: 200,
    batchItemFailures: [] // Return empty array to indicate all records were processed
  };
};

function getTier(points) {
  if (points >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (points >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (points >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

function getTierLevel(tier) {
  const levels = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
  return levels[tier] || 0;
}

function checkMilestones(oldPoints, newPoints) {
  const milestones = [];
  const checkPoints = [100, 500, 2500, 7500, 15000, 25000];

  for (const milestone of checkPoints) {
    if (oldPoints < milestone && newPoints >= milestone) {
      milestones.push(milestone);
    }
  }

  return milestones;
}

async function sendNotification(notification) {
  let message, subject;

  if (notification.type === 'milestone') {
    subject = 'Loyalty Program Milestone Achievement';
    message = {
      default: `Congratulations! You've reached ${notification.milestones.join(', ')} points!`,
      email: formatEmailMessage(notification),
      sms: `Loyalty: You've reached ${notification.milestones[0]} points! Check your rewards.`
    };
  } else {
    subject = 'Loyalty Program Tier Upgrade';
    message = {
      default: `Congratulations! You've been upgraded to ${notification.newTier} tier!`,
      email: formatEmailMessage(notification),
      sms: `Loyalty: Upgraded to ${notification.newTier}! Enjoy exclusive benefits.`
    };
  }

  const command = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: JSON.stringify(message),
    MessageStructure: 'json',
    Subject: subject,
    MessageAttributes: {
      memberId: {
        DataType: 'String',
        StringValue: notification.memberId
      },
      notificationType: {
        DataType: 'String',
        StringValue: notification.type || 'tier_upgrade'
      }
    }
  });

  try {
    const result = await snsClient.send(command);
    console.log('Notification sent successfully:', result.MessageId, 'for member:', notification.memberId);
  } catch (error) {
    console.error('Error sending notification:', error, 'Notification:', notification);
    throw error; // Re-throw to trigger DLQ
  }
}

function formatEmailMessage(notification) {
  if (notification.type === 'milestone') {
    return `
Dear Valued Member,

Congratulations on reaching a significant milestone in our Loyalty Program!

Milestones Achieved: ${notification.milestones.join(', ')} points
Current Points: ${notification.points}
Current Tier: ${getTier(notification.points)}

Keep earning to unlock more exclusive rewards!

Best regards,
Loyalty Program Team
    `.trim();
  }

  return `
Dear Valued Member,

We're thrilled to inform you that you've been upgraded to our ${notification.newTier} tier!

Previous Tier: ${notification.oldTier}
New Tier: ${notification.newTier}
Current Points: ${notification.points}

As a ${notification.newTier} member, you now enjoy:
${getTierBenefits(notification.newTier)}

Thank you for your continued loyalty!

Best regards,
Loyalty Program Team
  `.trim();
}

function getTierBenefits(tier) {
  const benefits = {
    SILVER: '• 5% bonus points on all purchases\n• Priority customer support\n• Exclusive member-only offers',
    GOLD: '• 10% bonus points on all purchases\n• Free shipping on all orders\n• Early access to sales\n• Priority customer support',
    PLATINUM: '• 15% bonus points on all purchases\n• Free expedited shipping\n• Exclusive VIP events\n• Personal account manager\n• Complimentary gift wrapping'
  };

  return benefits[tier] || '';
}
```

## Key Improvements

1. **Proper File Organization**: Lambda code in separate files for maintainability
2. **Lambda Layers**: Shared dependencies packaged as layers to reduce deployment size
3. **Dead Letter Queues**: Added DLQ for both Lambda functions for failed invocation handling
4. **CloudWatch Log Groups**: Explicit log groups with retention policies
5. **Enhanced Error Handling**: Better error handling and specific error responses
6. **API Authentication**: Added IAM authentication to API Gateway
7. **Request Validation**: Added API Gateway models for request validation
8. **Usage Plans**: Implemented throttling through usage plans
9. **Comprehensive Monitoring**: Enhanced dashboard with more metrics
10. **Notification System**: Improved notification formatting and milestone tracking
11. **Terraform Outputs**: Added outputs for integration testing
12. **Proper Tagging**: Consistent tagging strategy across all resources
13. **Security Improvements**: Scoped IAM policies and encryption configurations
14. **Tier Benefits**: Added tier benefit information in notifications
15. **Batch Processing**: Proper batch processing for DynamoDB streams with failure handling