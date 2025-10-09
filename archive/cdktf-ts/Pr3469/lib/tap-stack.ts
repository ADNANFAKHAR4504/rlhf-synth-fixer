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
    const awsRegion = AWS_REGION_OVERRIDE; // Always override to us-east-2
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
      bucket: `payout-reports-${environmentSuffix}`,
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

    // Create Lambda function code archives
    const lambdaDir = path.join(__dirname, 'lambda');

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
    const signupIntegration = new ApiGatewayIntegration(
      this,
      'signup-integration',
      {
        restApiId: api.id,
        resourceId: signupResource.id,
        httpMethod: signupMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: rewardCalcLambda.invokeArn,
      }
    );

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
        // Removing logging configuration as it requires CloudWatch role ARN setup
        // loggingLevel: 'INFO',
        // dataTraceEnabled: true,
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

    // CloudWatch Dashboard - simplified for compatibility
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
                [
                  'AWS/Lambda',
                  'Invocations',
                  'FunctionName',
                  rewardCalcLambda.functionName,
                ],
                [
                  'AWS/Lambda',
                  'Errors',
                  'FunctionName',
                  rewardCalcLambda.functionName,
                ],
                [
                  'AWS/Lambda',
                  'Duration',
                  'FunctionName',
                  rewardCalcLambda.functionName,
                ],
                [
                  'AWS/Lambda',
                  'Invocations',
                  'FunctionName',
                  payoutLambda.functionName,
                ],
                [
                  'AWS/Lambda',
                  'Errors',
                  'FunctionName',
                  payoutLambda.functionName,
                ],
                [
                  'AWS/Lambda',
                  'Duration',
                  'FunctionName',
                  payoutLambda.functionName,
                ],
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
                [
                  'AWS/DynamoDB',
                  'ConsumedReadCapacityUnits',
                  'TableName',
                  referralTable.name,
                ],
                [
                  'AWS/DynamoDB',
                  'ConsumedWriteCapacityUnits',
                  'TableName',
                  referralTable.name,
                ],
                ['AWS/DynamoDB', 'UserErrors', 'TableName', referralTable.name],
                [
                  'AWS/DynamoDB',
                  'SystemErrors',
                  'TableName',
                  referralTable.name,
                ],
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
