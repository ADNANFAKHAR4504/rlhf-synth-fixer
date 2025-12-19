# Referral Management System Infrastructure - CDKTF TypeScript

## Main Stack File

```typescript
// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SchedulerSchedule } from '@cdktf/provider-aws/lib/scheduler-schedule';
import { SchedulerScheduleGroup } from '@cdktf/provider-aws/lib/scheduler-schedule-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import * as fs from 'fs';
import * as path from 'path';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider
    new ArchiveProvider(this, 'archive');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      Application: 'ReferralManagement',
      ManagedBy: 'CDKTF',
    };

    // DynamoDB Table for referral tracking
    const referralTable = new DynamodbTable(this, 'referral-table', {
      name: `referral-tracking-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'user_id',
      rangeKey: 'referral_timestamp',
      pointInTimeRecovery: {
        enabled: true,
      },
      attribute: [
        {
          name: 'user_id',
          type: 'S',
        },
        {
          name: 'referral_timestamp',
          type: 'N',
        },
        {
          name: 'referrer_id',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'referrer-index',
          hashKey: 'referrer_id',
          projectionType: 'ALL',
        },
      ],
      tags: commonTags,
    });

    // DynamoDB Table for idempotency
    const idempotencyTable = new DynamodbTable(this, 'idempotency-table', {
      name: `payout-idempotency-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'idempotency_key',
      pointInTimeRecovery: {
        enabled: true,
      },
      attribute: [
        {
          name: 'idempotency_key',
          type: 'S',
        },
      ],
      ttl: {
        enabled: true,
        attributeName: 'ttl',
      },
      tags: commonTags,
    });

    // S3 Bucket for payout reports
    const payoutReportsBucket = new S3Bucket(this, 'payout-reports-bucket', {
      bucket: `payout-reports-${environmentSuffix}-${Date.now()}`,
      tags: commonTags,
    });

    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: payoutReportsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketVersioningA(this, 'payout-reports-versioning', {
      bucket: payoutReportsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'payout-reports-encryption',
      {
        bucket: payoutReportsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketLifecycleConfiguration(this, 'payout-reports-lifecycle', {
      bucket: payoutReportsBucket.id,
      rule: [
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // SNS Topic for reward notifications
    const rewardNotificationTopic = new SnsTopic(
      this,
      'reward-notification-topic',
      {
        name: `reward-notifications-${environmentSuffix}`,
        displayName: 'Referral Reward Notifications',
        tags: commonTags,
      }
    );

    // Dead Letter Queue for payout processing
    const payoutDlq = new SqsQueue(this, 'payout-dlq', {
      name: `payout-processing-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: commonTags,
    });

    // IAM Role for Reward Calculation Lambda
    const rewardCalcLambdaRole = new IamRole(this, 'reward-calc-lambda-role', {
      name: `reward-calc-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for Reward Calculation Lambda
    const rewardCalcPolicy = new IamPolicy(this, 'reward-calc-policy', {
      name: `reward-calc-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:TransactWriteItems',
            ],
            Resource: [referralTable.arn, `${referralTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: rewardNotificationTopic.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'reward-calc-policy-attachment', {
      role: rewardCalcLambdaRole.name,
      policyArn: rewardCalcPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'reward-calc-insights-attachment', {
      role: rewardCalcLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy',
    });

    // Create Lambda function code
    const lambdaDir = path.join(__dirname, 'lambda');
    if (!fs.existsSync(lambdaDir)) {
      fs.mkdirSync(lambdaDir, { recursive: true });
    }

    // Create archive for Lambda
    const rewardCalcArchive = new DataArchiveFile(this, 'reward-calc-archive', {
      type: 'zip',
      sourceDir: path.join(lambdaDir, 'reward-calculator'),
      outputPath: path.join(lambdaDir, 'reward-calculator.zip'),
    });

    // Lambda Function for Reward Calculation
    const rewardCalcLambda = new LambdaFunction(this, 'reward-calc-lambda', {
      functionName: `reward-calculation-${environmentSuffix}`,
      role: rewardCalcLambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      filename: rewardCalcArchive.outputPath,
      sourceCodeHash: rewardCalcArchive.outputBase64Sha256,
      timeout: 30,
      memorySize: 512,
      environment: {
        variables: {
          REFERRAL_TABLE_NAME: referralTable.name,
          SNS_TOPIC_ARN: rewardNotificationTopic.arn,
          REGION: awsRegion,
          BASE_TIER: '10',
          SILVER_TIER: '15',
          GOLD_TIER: '25',
        },
      },
      layers: [
        'arn:aws:lambda:us-east-2:580247275435:layer:LambdaInsightsExtension:38',
      ],
      tags: commonTags,
    });

    // IAM Role for Payout Processing Lambda
    const payoutLambdaRole = new IamRole(this, 'payout-lambda-role', {
      name: `payout-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for Payout Processing Lambda
    const payoutPolicy = new IamPolicy(this, 'payout-policy', {
      name: `payout-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
              'dynamodb:BatchWriteItem',
            ],
            Resource: [referralTable.arn, `${referralTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
            ],
            Resource: idempotencyTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${payoutReportsBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: rewardNotificationTopic.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
            Resource: payoutDlq.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'payout-policy-attachment', {
      role: payoutLambdaRole.name,
      policyArn: payoutPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'payout-insights-attachment', {
      role: payoutLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy',
    });

    const payoutArchive = new DataArchiveFile(this, 'payout-archive', {
      type: 'zip',
      sourceDir: path.join(lambdaDir, 'payout-processor'),
      outputPath: path.join(lambdaDir, 'payout-processor.zip'),
    });

    // Lambda Function for Payout Processing
    const payoutLambda = new LambdaFunction(this, 'payout-lambda', {
      functionName: `payout-processing-${environmentSuffix}`,
      role: payoutLambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      filename: payoutArchive.outputPath,
      sourceCodeHash: payoutArchive.outputBase64Sha256,
      timeout: 300,
      memorySize: 1024,
      reservedConcurrentExecutions: 5,
      deadLetterConfig: {
        targetArn: payoutDlq.arn,
      },
      environment: {
        variables: {
          REFERRAL_TABLE_NAME: referralTable.name,
          IDEMPOTENCY_TABLE_NAME: idempotencyTable.name,
          REPORTS_BUCKET_NAME: payoutReportsBucket.bucket,
          SNS_TOPIC_ARN: rewardNotificationTopic.arn,
          REGION: awsRegion,
        },
      },
      layers: [
        'arn:aws:lambda:us-east-2:580247275435:layer:LambdaInsightsExtension:38',
      ],
      tags: commonTags,
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'referral-api', {
      name: `referral-api-${environmentSuffix}`,
      description: 'Referral Management API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: commonTags,
    });

    // API Gateway Resource
    const signupResource = new ApiGatewayResource(this, 'signup-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'signup',
    });

    // API Gateway Method
    const signupMethod = new ApiGatewayMethod(this, 'signup-method', {
      restApiId: api.id,
      resourceId: signupResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    // API Gateway Integration
    const signupIntegration = new ApiGatewayIntegration(this, 'signup-integration', {
      restApiId: api.id,
      resourceId: signupResource.id,
      httpMethod: signupMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: rewardCalcLambda.invokeArn,
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: rewardCalcLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [signupMethod, signupIntegration],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: environmentSuffix,
      tags: commonTags,
    });

    // API Gateway Method Settings for rate limiting
    new ApiGatewayMethodSettings(this, 'api-method-settings', {
      restApiId: api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingRateLimit: 50, // requests per second
        throttlingBurstLimit: 100,
        metricsEnabled: true,
      },
    });

    // EventBridge Schedule Group
    const scheduleGroup = new SchedulerScheduleGroup(
      this,
      'payout-schedule-group',
      {
        name: `payout-schedules-${environmentSuffix}`,
        tags: commonTags,
      }
    );

    // IAM Role for EventBridge Scheduler
    const schedulerRole = new IamRole(this, 'scheduler-role', {
      name: `payout-scheduler-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'scheduler.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    const schedulerPolicy = new IamPolicy(this, 'scheduler-policy', {
      name: `scheduler-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'lambda:InvokeFunction',
            Resource: payoutLambda.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'scheduler-policy-attachment', {
      role: schedulerRole.name,
      policyArn: schedulerPolicy.arn,
    });

    // EventBridge Schedule for monthly payout processing
    new SchedulerSchedule(this, 'payout-schedule', {
      name: `monthly-payout-${environmentSuffix}`,
      groupName: scheduleGroup.name,
      scheduleExpression: 'cron(0 2 1 * ? *)', // 2 AM UTC on the 1st of each month
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      target: {
        arn: payoutLambda.arn,
        roleArn: schedulerRole.arn,
        input: JSON.stringify({
          source: 'scheduled',
          executionId: new Date().toISOString(),
        }),
      },
      description: 'Monthly payout processing schedule',
    });

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, 'referral-dashboard', {
      dashboardName: `referral-program-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApiGateway', 'Count'],
                ['AWS/ApiGateway', 'Latency'],
                ['AWS/ApiGateway', '4XXError'],
                ['AWS/ApiGateway', '5XXError'],
              ],
              period: 300,
              stat: 'Average',
              region: awsRegion,
              title: 'API Gateway Metrics',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { Dimensions: [{ Name: 'FunctionName', Value: rewardCalcLambda.functionName }] }],
                ['AWS/Lambda', 'Errors', { Dimensions: [{ Name: 'FunctionName', Value: rewardCalcLambda.functionName }] }],
                ['AWS/Lambda', 'Duration', { Dimensions: [{ Name: 'FunctionName', Value: rewardCalcLambda.functionName }] }],
                ['AWS/Lambda', 'Invocations', { Dimensions: [{ Name: 'FunctionName', Value: payoutLambda.functionName }] }],
                ['AWS/Lambda', 'Errors', { Dimensions: [{ Name: 'FunctionName', Value: payoutLambda.functionName }] }],
                ['AWS/Lambda', 'Duration', { Dimensions: [{ Name: 'FunctionName', Value: payoutLambda.functionName }] }],
              ],
              period: 300,
              stat: 'Sum',
              region: awsRegion,
              title: 'Lambda Function Metrics',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { Dimensions: [{ Name: 'TableName', Value: referralTable.name }] }],
                ['AWS/DynamoDB', 'ConsumedWriteCapacityUnits', { Dimensions: [{ Name: 'TableName', Value: referralTable.name }] }],
                ['AWS/DynamoDB', 'UserErrors', { Dimensions: [{ Name: 'TableName', Value: referralTable.name }] }],
                ['AWS/DynamoDB', 'SystemErrors', { Dimensions: [{ Name: 'TableName', Value: referralTable.name }] }],
              ],
              period: 300,
              stat: 'Sum',
              region: awsRegion,
              title: 'DynamoDB Metrics',
            },
          },
        ],
      }),
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `${api.id}.execute-api.${awsRegion}.amazonaws.com/${stage.stageName}`,
      description: 'API Gateway Endpoint',
    });

    new TerraformOutput(this, 'api-gateway-id', {
      value: api.id,
      description: 'API Gateway ID',
    });

    new TerraformOutput(this, 'referral-table-name', {
      value: referralTable.name,
      description: 'DynamoDB Referral Table Name',
    });

    new TerraformOutput(this, 'idempotency-table-name', {
      value: idempotencyTable.name,
      description: 'DynamoDB Idempotency Table Name',
    });

    new TerraformOutput(this, 's3-bucket', {
      value: payoutReportsBucket.bucket,
      description: 'S3 Bucket for Payout Reports',
    });

    new TerraformOutput(this, 'sns-topic', {
      value: rewardNotificationTopic.arn,
      description: 'SNS Topic ARN',
    });

    new TerraformOutput(this, 'reward-calc-lambda-name', {
      value: rewardCalcLambda.functionName,
      description: 'Reward Calculator Lambda Function Name',
    });

    new TerraformOutput(this, 'payout-lambda-name', {
      value: payoutLambda.functionName,
      description: 'Payout Processor Lambda Function Name',
    });

    new TerraformOutput(this, 'dlq-url', {
      value: payoutDlq.url,
      description: 'Dead Letter Queue URL',
    });

    new TerraformOutput(this, 'dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=referral-program-${environmentSuffix}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

## Main Entry Point

```typescript
// lib/main.ts
import { App } from 'cdktf';
import { TapStack } from './tap-stack';

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth63419782';

new TapStack(app, 'tap-stack', {
  environmentSuffix,
  awsRegion: 'us-east-2',
  stateBucket: process.env.STATE_BUCKET || 'iac-rlhf-tf-states',
  stateBucketRegion: process.env.STATE_BUCKET_REGION || 'us-east-1',
});

app.synth();
```

## Lambda Functions

### Reward Calculator Lambda
```javascript
// lib/lambda/reward-calculator/index.js
const { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Reward tiers
const REWARD_TIERS = {
  1: 10,    // First referral: $10
  5: 15,    // 5 referrals: $15 per referral
  10: 20,   // 10 referrals: $20 per referral
  25: 25,   // 25 referrals: $25 per referral
};

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { userId, referralCode, email } = body;

    if (!userId || !referralCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const timestamp = Date.now();

    // Get referrer details
    const getReferrerParams = {
      TableName: REFERRAL_TABLE,
      Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
    };

    const referrerData = await dynamodb.send(new GetItemCommand(getReferrerParams));

    if (!referrerData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Invalid referral code" }),
      };
    }

    const referrer = unmarshall(referrerData.Item);
    const currentReferralCount = (referrer.referral_count || 0) + 1;

    // Determine reward amount based on tier
    let rewardAmount = REWARD_TIERS[1];
    for (const [tier, amount] of Object.entries(REWARD_TIERS).sort((a, b) => b[0] - a[0])) {
      if (currentReferralCount >= parseInt(tier)) {
        rewardAmount = amount;
        break;
      }
    }

    // Prepare transaction items
    const transactItems = [
      {
        Put: {
          TableName: REFERRAL_TABLE,
          Item: marshall({
            user_id: userId,
            referral_timestamp: timestamp,
            referrer_id: referralCode,
            email: email || "",
            signup_date: new Date().toISOString(),
            reward_amount: rewardAmount,
            status: "pending",
          }),
        },
      },
      {
        Update: {
          TableName: REFERRAL_TABLE,
          Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
          UpdateExpression: "SET referral_count = referral_count + :inc, total_rewards = total_rewards + :reward",
          ExpressionAttributeValues: marshall({
            ":inc": 1,
            ":reward": rewardAmount,
          }),
        },
      },
    ];

    // Execute transaction
    await dynamodb.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));

    // Send notification
    const message = `New referral signup! User ${userId} signed up with referral code ${referralCode}. Reward: $${rewardAmount}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "New Referral Signup",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Signup successful",
        rewardAmount: rewardAmount,
        referralCount: currentReferralCount,
      }),
    };

  } catch (error) {
    console.error("Error processing signup:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
```

### Payout Processor Lambda
```javascript
// lib/lambda/payout-processor/index.js
const { DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const s3 = new S3Client({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const IDEMPOTENCY_TABLE = process.env.IDEMPOTENCY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const REPORTS_BUCKET = process.env.REPORTS_BUCKET_NAME;

exports.handler = async (event) => {
  console.log("Starting monthly payout processing");

  const payoutDate = new Date();
  const payoutMonth = payoutDate.toISOString().slice(0, 7);
  const idempotencyKey = `payout-${payoutMonth}`;

  try {
    // Check idempotency
    const idempotencyCheck = await dynamodb.send(new GetItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Key: marshall({ idempotency_key: idempotencyKey }),
    }));

    if (idempotencyCheck.Item) {
      console.log("Payout already processed for this month");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Payout already processed" }),
      };
    }

    // Mark as processing
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "processing",
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90, // 90 days TTL
      }),
    }));

    // Query all pending rewards
    const queryParams = {
      TableName: REFERRAL_TABLE,
      IndexName: "referrer-index",
      FilterExpression: "#status = :pending",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":pending": "pending",
      }),
    };

    const pendingRewards = [];
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamodb.send(new QueryCommand(queryParams));

      if (result.Items) {
        pendingRewards.push(...result.Items.map(item => unmarshall(item)));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Group rewards by referrer
    const payoutsByReferrer = {};
    for (const reward of pendingRewards) {
      const referrerId = reward.referrer_id;
      if (!payoutsByReferrer[referrerId]) {
        payoutsByReferrer[referrerId] = {
          total: 0,
          count: 0,
          details: [],
        };
      }
      payoutsByReferrer[referrerId].total += reward.reward_amount;
      payoutsByReferrer[referrerId].count += 1;
      payoutsByReferrer[referrerId].details.push({
        userId: reward.user_id,
        amount: reward.reward_amount,
        date: reward.signup_date,
      });
    }

    // Generate CSV report
    let csvContent = "Referrer ID,Total Amount,Referral Count,Payment Status\n";
    const payoutSummary = [];

    for (const [referrerId, data] of Object.entries(payoutsByReferrer)) {
      csvContent += `${referrerId},${data.total},${data.count},Processed\n`;
      payoutSummary.push({
        referrerId,
        amount: data.total,
        count: data.count,
      });
    }

    // Save report to S3
    const reportKey = `payouts/${payoutMonth}/payout-report-${payoutDate.toISOString()}.csv`;
    await s3.send(new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: reportKey,
      Body: csvContent,
      ContentType: "text/csv",
    }));

    // Update reward statuses in batches
    const updateBatches = [];
    let currentBatch = [];

    for (const reward of pendingRewards) {
      currentBatch.push({
        PutRequest: {
          Item: marshall({
            ...reward,
            status: "paid",
            payout_date: payoutDate.toISOString(),
          }),
        },
      });

      if (currentBatch.length === 25) {
        updateBatches.push([...currentBatch]);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      updateBatches.push(currentBatch);
    }

    // Process updates
    for (const batch of updateBatches) {
      await dynamodb.send(new BatchWriteItemCommand({
        RequestItems: {
          [REFERRAL_TABLE]: batch,
        },
      }));
    }

    // Update idempotency record
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "completed",
        timestamp: payoutDate.toISOString(),
        report_location: reportKey,
        total_payouts: Object.keys(payoutsByReferrer).length,
        total_amount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
      }),
    }));

    // Send notification
    const message = `Monthly payout processing completed. Total referrers: ${Object.keys(payoutsByReferrer).length}. Total amount: $${Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0)}. Report saved to: ${reportKey}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "Monthly Payout Processing Completed",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payout processing completed",
        totalReferrers: Object.keys(payoutsByReferrer).length,
        totalAmount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        reportLocation: reportKey,
      }),
    };

  } catch (error) {
    console.error("Error processing payouts:", error);

    // Mark as failed in idempotency table
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "failed",
        error: error.message,
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 30,
      }),
    }));

    throw error;
  }
};
```

### Alternative Reward Calculator Implementation
```javascript
// lib/lambda/reward-calc.js
const { DynamoDBClient, TransactWriteItemsCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing referral sign-up:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { userId, referrerId } = body;
    const timestamp = Date.now();

    // Calculate reward based on tiers
    const rewardAmount = calculateReward(referrerId);

    // Store referral with transaction
    await dynamodb.send(new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.REFERRAL_TABLE,
            Item: {
              userId: { S: userId },
              referralTimestamp: { N: timestamp.toString() },
              referrerId: { S: referrerId },
              rewardAmount: { N: rewardAmount.toString() },
              status: { S: 'PENDING' },
            },
          },
        },
      ],
    }));

    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'New Referral Reward',
      Message: JSON.stringify({
        userId,
        referrerId,
        rewardAmount,
        timestamp,
      }),
    }));

    // Publish custom metric
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'RewardCalculated',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, rewardAmount }),
    };
  } catch (error) {
    console.error('Error processing referral:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function calculateReward(referrerId) {
  // Implement reward tier logic
  const baseTier = parseFloat(process.env.BASE_TIER || '10');
  const silverTier = parseFloat(process.env.SILVER_TIER || '15');
  const goldTier = parseFloat(process.env.GOLD_TIER || '25');

  // Simplified logic - would be more complex in production
  return baseTier;
}
```

### Alternative Payout Processor Implementation
```javascript
// lib/lambda/payout-processing.js
const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

const processedPayouts = new Set();

exports.handler = async (event) => {
  console.log('Processing monthly payouts:', JSON.stringify(event));

  const executionId = event.executionId || Date.now().toString();

  // Idempotency check
  if (processedPayouts.has(executionId)) {
    console.log('Payout already processed for execution:', executionId);
    return { statusCode: 200, message: 'Already processed' };
  }

  try {
    // Scan for pending rewards
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: process.env.REFERRAL_TABLE,
      FilterExpression: '#status = :pending',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':pending': { S: 'PENDING' } },
    }));

    const payoutReport = [];
    let totalPayout = 0;

    // Process each pending reward
    for (const item of scanResult.Items || []) {
      const userId = item.userId.S;
      const rewardAmount = parseFloat(item.rewardAmount.N);

      // Update status to PROCESSED
      await dynamodb.send(new UpdateItemCommand({
        TableName: process.env.REFERRAL_TABLE,
        Key: {
          userId: item.userId,
          referralTimestamp: item.referralTimestamp,
        },
        UpdateExpression: 'SET #status = :processed, processedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':processed': { S: 'PROCESSED' },
          ':now': { N: Date.now().toString() },
        },
      }));

      payoutReport.push({
        userId,
        rewardAmount,
        processedAt: new Date().toISOString(),
      });

      totalPayout += rewardAmount;
    }

    // Generate and upload report to S3
    const reportKey = `payouts/${new Date().getFullYear()}/${new Date().getMonth() + 1}/report-${executionId}.json`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.REPORTS_BUCKET,
      Key: reportKey,
      Body: JSON.stringify({
        executionId,
        processedAt: new Date().toISOString(),
        totalPayout,
        payouts: payoutReport,
      }),
      ContentType: 'application/json',
    }));

    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Monthly Payout Processed',
      Message: JSON.stringify({
        executionId,
        totalPayout,
        payoutCount: payoutReport.length,
        reportLocation: reportKey,
      }),
    }));

    // Publish metrics
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'PayoutsProcessed',
          Value: payoutReport.length,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'TotalPayoutAmount',
          Value: totalPayout,
          Unit: 'None',
          Timestamp: new Date(),
        },
      ],
    }));

    processedPayouts.add(executionId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        executionId,
        payoutCount: payoutReport.length,
        totalPayout,
      }),
    };
  } catch (error) {
    console.error('Error processing payouts:', error);

    // Publish error metric
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'PayoutErrors',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));

    throw error;
  }
};
```