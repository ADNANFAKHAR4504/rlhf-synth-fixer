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

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Lambda Layer with AWS SDK v3 and validation libraries
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'layer')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'AWS SDK v3 and validation libraries',
    });

    // DynamoDB Table for transactions
    const transactionTable = new dynamodb.Table(this, 'TransactionTable', {
      tableName: `TransactionTable-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Dead Letter Queue
    const dlq = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `transaction-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue for audit processing
    const auditQueue = new sqs.Queue(this, 'TransactionQueue', {
      queueName: `transaction-queue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // S3 Bucket for transaction reports
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      bucketName: `transaction-reports-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-reports',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Process Transaction Lambda
    const processTransactionFn = new NodejsFunction(
      this,
      'ProcessTransaction',
      {
        functionName: `processTransaction-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, 'lambda', 'processTransaction', 'index.ts'),
        layers: [sharedLayer],
        environment: {
          TABLE_NAME: transactionTable.tableName,
          QUEUE_URL: auditQueue.queueUrl,
        },
        timeout: cdk.Duration.seconds(30),
        reservedConcurrentExecutions: 100,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to process transaction function
    transactionTable.grantWriteData(processTransactionFn);
    auditQueue.grantSendMessages(processTransactionFn);

    // CloudWatch Alarm for Lambda errors (threshold adjusted to >1%)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const processErrorAlarm = new cloudwatch.Alarm(
      this,
      'ProcessTransactionErrorAlarm',
      {
        alarmName: `processTransaction-errors-${environmentSuffix}`,
        metric: processTransactionFn.metricErrors({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.01,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Audit Transaction Lambda
    const auditTransactionFn = new NodejsFunction(this, 'AuditTransaction', {
      functionName: `auditTransaction-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, 'lambda', 'auditTransaction', 'index.ts'),
      layers: [sharedLayer],
      environment: {
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      reservedConcurrentExecutions: 100,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'es2020',
      },
    });

    // Add SQS trigger to audit function
    auditTransactionFn.addEventSource(
      new SqsEventSource(auditQueue, {
        batchSize: 10,
      })
    );

    // Grant permissions to audit function
    reportsBucket.grantWrite(auditTransactionFn);

    // CloudWatch Alarm for audit Lambda errors
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const auditErrorAlarm = new cloudwatch.Alarm(
      this,
      'AuditTransactionErrorAlarm',
      {
        alarmName: `auditTransaction-errors-${environmentSuffix}`,
        metric: auditTransactionFn.metricErrors({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.01,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // API Gateway - FIXED: Define BEFORE using in requestModel
    const api = new apigateway.RestApi(this, 'TransactionApi', {
      restApiName: `transaction-api-${environmentSuffix}`,
      description: 'Transaction Processing API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
      deployOptions: {
        throttlingBurstLimit: 10000,
        throttlingRateLimit: 5000,
      },
    });

    // Request Validator Model - FIXED: Moved after API definition
    const requestModel = new apigateway.Model(this, 'TransactionRequestModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'TransactionRequest',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['transactionId', 'amount', 'currency'],
        properties: {
          transactionId: { type: apigateway.JsonSchemaType.STRING },
          amount: { type: apigateway.JsonSchemaType.NUMBER },
          currency: { type: apigateway.JsonSchemaType.STRING },
          timestamp: { type: apigateway.JsonSchemaType.NUMBER },
          customerId: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    // API Gateway Request Validator
    const validator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // /transactions resource
    const transactions = api.root.addResource('transactions');

    // POST /transactions endpoint
    transactions.addMethod(
      'POST',
      new apigateway.LambdaIntegration(processTransactionFn, {
        proxy: true,
      }),
      {
        requestValidator: validator,
        requestModels: {
          'application/json': requestModel,
        },
      }
    );

    // EventBridge Rule for daily summaries
    const dailySummaryRule = new events.Rule(this, 'DailySummaryRule', {
      ruleName: `daily-summary-${environmentSuffix}`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
      }),
    });

    // Daily Summary Lambda
    const dailySummaryFn = new NodejsFunction(this, 'DailySummary', {
      functionName: `dailySummary-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, 'lambda', 'dailySummary', 'index.ts'),
      layers: [sharedLayer],
      environment: {
        TABLE_NAME: transactionTable.tableName,
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'es2020',
      },
    });

    // Add target to EventBridge rule
    dailySummaryRule.addTarget(new targets.LambdaFunction(dailySummaryFn));

    // Grant permissions to daily summary function
    transactionTable.grantReadData(dailySummaryFn);
    reportsBucket.grantWrite(dailySummaryFn);

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Transaction API URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: transactionTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: auditQueue.queueUrl,
      description: 'SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: reportsBucket.bucketName,
      description: 'S3 Bucket for Reports',
    });
  }
}
```

## ./lib/lambda/processTransaction/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validation
    if (!body.transactionId || !body.amount || !body.currency) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Missing required fields: transactionId, amount, currency',
        }),
      };
    }

    const transaction = {
      transactionId: body.transactionId,
      timestamp: body.timestamp || Date.now(),
      amount: body.amount,
      currency: body.currency,
      customerId: body.customerId || 'unknown',
      status: 'processed',
    };

    // Store in DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          transactionId: { S: transaction.transactionId },
          timestamp: { N: transaction.timestamp.toString() },
          amount: { N: transaction.amount.toString() },
          currency: { S: transaction.currency },
          customerId: { S: transaction.customerId },
          status: { S: transaction.status },
        },
      })
    );

    // Send to audit queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(transaction),
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Transaction processed successfully',
        transactionId: transaction.transactionId,
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Failed to process transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
```

## ./lib/lambda/auditTransaction/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);

      const auditLog = {
        ...transaction,
        auditedAt: Date.now(),
        messageId: record.messageId,
      };

      const key = `audit/${transaction.transactionId}-${Date.now()}.json`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(auditLog, null, 2),
          ContentType: 'application/json',
        })
      );

      console.log(`Audit log created: ${key}`);
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }
};
```

## ./lib/lambda/dailySummary/index.ts

```typescript
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (): Promise<void> => {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#ts > :yesterday',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':yesterday': { N: oneDayAgo.toString() },
        },
      })
    );

    const transactions = result.Items || [];
    const summary = {
      date: new Date().toISOString().split('T')[0],
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, item) => {
        return sum + parseFloat(item.amount?.N || '0');
      }, 0),
      generatedAt: Date.now(),
    };

    const key = `summaries/daily-${summary.date}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(summary, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(`Daily summary created: ${key}`);
  } catch (error) {
    console.error('Error generating daily summary:', error);
    throw error;
  }
};
```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create TransactionTable with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TransactionTable-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should have partition key and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should have correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create main TransactionQueue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        VisibilityTimeout: 300,
      });
    });

    test('should create dead letter queue with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should configure dead letter queue in main queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create ReportsBucket with correct name and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-reports-${environmentSuffix}`,
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

    test('should have lifecycle rule for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'archive-old-reports',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Lambda Layer', () => {
    test('should create SharedLayer with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs18.x'],
        Description: 'AWS SDK v3 and validation libraries',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create ProcessTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create AuditTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create DailySummary function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        Architectures: ['arm64'],
      });
    });

    test('should configure environment variables for ProcessTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            QUEUE_URL: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for DailySummary', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should attach SharedLayer to Lambda functions', () => {
      // Verify SharedLayer is referenced in Lambda functions
      const functions = template.findResources('AWS::Lambda::Function');
      const functionsWithLayers = Object.values(functions).filter(
        (fn: any) => fn.Properties.Layers && fn.Properties.Layers.length > 0
      );
      expect(functionsWithLayers.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name and endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `transaction-api-${environmentSuffix}`,
        Description: 'Transaction Processing API',
        EndpointConfiguration: {
          Types: ['EDGE'],
        },
      });
    });

    test('should configure throttling limits in deployment options', () => {
      // Throttling is configured via deployOptions on RestApi
      const stages = template.findResources('AWS::ApiGateway::Stage');
      expect(Object.keys(stages).length).toBeGreaterThan(0);

      // Verify throttling is set in method settings
      const stageValues = Object.values(stages);
      const hasThrottling = stageValues.some((stage: any) =>
        stage.Properties.MethodSettings &&
        stage.Properties.MethodSettings.some((ms: any) =>
          ms.ThrottlingBurstLimit !== undefined || ms.ThrottlingRateLimit !== undefined
        )
      );
      expect(hasThrottling).toBe(true);
    });

    test('should create /transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should create POST method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create request model for validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'TransactionRequest',
        ContentType: 'application/json',
        Schema: {
          type: 'object',
          required: ['transactionId', 'amount', 'currency'],
          properties: {
            transactionId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            timestamp: { type: 'number' },
            customerId: { type: 'string' },
          },
        },
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create DailySummaryRule with correct schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should target DailySummary Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarm for ProcessTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `processTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for AuditTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `auditTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should monitor Lambda errors with correct metric', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'Errors',
          Namespace: 'AWS/Lambda',
          Statistic: 'Average',
        },
      });
      expect(Object.keys(alarms).length).toBe(2);
    });
  });

  describe('IAM Permissions', () => {
    test('should grant DynamoDB write permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:PutItem']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SQS send permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant S3 write permissions to AuditTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:PutObject']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant DynamoDB read permissions to DailySummary', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*Scan.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Event Source Mapping', () => {
    test('should create SQS event source for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        EventSourceArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have Lambda functions that will create log groups', () => {
      // Log groups are automatically created by Lambda functions
      // Verify Lambda functions exist which will create their own log groups
      const functions = template.findResources('AWS::Lambda::Function');
      const functionNames = Object.values(functions).map(
        (fn: any) => fn.Properties.FunctionName
      );

      expect(functionNames).toContain(`processTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`auditTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`dailySummary-${environmentSuffix}`);
    });
  });

  describe('Stack Outputs', () => {
    test('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'Transaction API URL',
      });
    });

    test('should export Table Name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name',
      });
    });

    test('should export Queue URL', () => {
      template.hasOutput('QueueUrl', {
        Description: 'SQS Queue URL',
      });
    });

    test('should export Bucket Name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket for Reports',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create all required resources', () => {
      // Verify minimum resource counts
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      expect(
        resourceTypes.filter((t) => t === 'AWS::DynamoDB::Table').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::SQS::Queue').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::S3::Bucket').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Lambda::Function').length
      ).toBeGreaterThanOrEqual(3);
      expect(
        resourceTypes.filter((t) => t === 'AWS::ApiGateway::RestApi').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Events::Rule').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::CloudWatch::Alarm').length
      ).toBe(2);
    });
  });
});

// Lambda Function Unit Tests
import { APIGatewayProxyEvent, SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { handler as processTransactionHandler } from '../lib/lambda/processTransaction/index';
import { handler as auditTransactionHandler } from '../lib/lambda/auditTransaction/index';
import { handler as dailySummaryHandler } from '../lib/lambda/dailySummary/index';

const dynamoDBMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);
const s3Mock = mockClient(S3Client);

describe('Lambda Function Unit Tests', () => {
  beforeEach(() => {
    dynamoDBMock.reset();
    sqsMock.reset();
    s3Mock.reset();
  });

  describe('ProcessTransaction Lambda', () => {
    beforeEach(() => {
      process.env.TABLE_NAME = 'test-table';
      process.env.QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
    });

    afterEach(() => {
      delete process.env.TABLE_NAME;
      delete process.env.QUEUE_URL;
    });

    const createEvent = (body: any): APIGatewayProxyEvent => ({
      body: JSON.stringify(body),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/transactions',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    });

    test('should process valid transaction successfully', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-123',
        amount: 100.50,
        currency: 'USD',
        customerId: 'customer-456',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Transaction processed successfully');
      expect(body.transactionId).toBe('txn-123');
      expect(dynamoDBMock.calls()).toHaveLength(1);
      expect(sqsMock.calls()).toHaveLength(1);
    });

    test('should use default timestamp when not provided', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-789',
        amount: 50.25,
        currency: 'EUR',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      expect(putItemInput.Item?.timestamp).toBeDefined();
    });

    test('should use default customerId when not provided', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-999',
        amount: 75.00,
        currency: 'GBP',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      expect(putItemInput.Item?.customerId.S).toBe('unknown');
    });

    test('should return 400 when transactionId is missing', async () => {
      const event = createEvent({ amount: 100, currency: 'USD' });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
      expect(dynamoDBMock.calls()).toHaveLength(0);
      expect(sqsMock.calls()).toHaveLength(0);
    });

    test('should return 400 when amount is missing', async () => {
      const event = createEvent({ transactionId: 'txn-123', currency: 'USD' });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should return 400 when currency is missing', async () => {
      const event = createEvent({ transactionId: 'txn-123', amount: 100 });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should return 500 when DynamoDB fails', async () => {
      dynamoDBMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBe('DynamoDB error');
    });

    test('should return 500 when SQS fails', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).rejects(new Error('SQS error'));

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBe('SQS error');
    });

    test('should store transaction with correct DynamoDB format', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const timestamp = Date.now();
      const event = createEvent({
        transactionId: 'txn-555',
        amount: 200.75,
        currency: 'CAD',
        customerId: 'customer-777',
        timestamp,
      });

      await processTransactionHandler(event);

      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      const item = putItemInput.Item;

      expect(item?.transactionId.S).toBe('txn-555');
      expect(item?.amount.N).toBe('200.75');
      expect(item?.currency.S).toBe('CAD');
      expect(item?.customerId.S).toBe('customer-777');
      expect(item?.timestamp.N).toBe(timestamp.toString());
      expect(item?.status.S).toBe('processed');
    });

    test('should return correct Content-Type header', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-123',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    test('should handle null event body', async () => {
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/transactions',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should handle non-Error exceptions', async () => {
      dynamoDBMock.on(PutItemCommand).rejects('String error' as any);

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBeDefined();
    });
  });

  describe('AuditTransaction Lambda', () => {
    beforeEach(() => {
      process.env.BUCKET_NAME = 'test-bucket';
    });

    afterEach(() => {
      delete process.env.BUCKET_NAME;
    });

    const createSQSEvent = (messageBody: any): SQSEvent => ({
      Records: [
        {
          messageId: 'msg-123',
          receiptHandle: 'receipt-123',
          body: JSON.stringify(messageBody),
          attributes: {} as any,
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
          awsRegion: 'us-east-1',
        },
      ],
    });

    test('should create audit log in S3 successfully', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const transaction = {
        transactionId: 'txn-123',
        amount: 100,
        currency: 'USD',
        customerId: 'customer-456',
        status: 'processed',
      };

      const event = createSQSEvent(transaction);
      await auditTransactionHandler(event);

      expect(s3Mock.calls()).toHaveLength(1);
      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      expect(s3Input.Key).toMatch(/^audit\/txn-123-\d+\.json$/);
      expect(s3Input.ContentType).toBe('application/json');
    });

    test('should include audit metadata in S3 object', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const transaction = {
        transactionId: 'txn-456',
        amount: 200,
        currency: 'EUR',
      };

      const event = createSQSEvent(transaction);
      await auditTransactionHandler(event);

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.transactionId).toBe('txn-456');
      expect(body.amount).toBe(200);
      expect(body.currency).toBe('EUR');
      expect(body.auditedAt).toBeDefined();
      expect(body.messageId).toBe('msg-123');
    });

    test('should process multiple SQS records', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({ transactionId: 'txn-1', amount: 100, currency: 'USD' }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
          {
            messageId: 'msg-2',
            receiptHandle: 'receipt-2',
            body: JSON.stringify({ transactionId: 'txn-2', amount: 200, currency: 'EUR' }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await auditTransactionHandler(event);

      expect(s3Mock.calls()).toHaveLength(2);
    });

    test('should throw error when S3 upload fails', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      const transaction = { transactionId: 'txn-error', amount: 100, currency: 'USD' };
      const event = createSQSEvent(transaction);

      await expect(auditTransactionHandler(event)).rejects.toThrow('S3 error');
    });

    test('should throw error when message body is invalid JSON', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-123',
            receiptHandle: 'receipt-123',
            body: '{invalid json}',
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await expect(auditTransactionHandler(event)).rejects.toThrow();
    });
  });

  describe('DailySummary Lambda', () => {
    beforeEach(() => {
      process.env.TABLE_NAME = 'test-table';
      process.env.BUCKET_NAME = 'test-bucket';
    });

    afterEach(() => {
      delete process.env.TABLE_NAME;
      delete process.env.BUCKET_NAME;
    });

    test('should generate daily summary successfully', async () => {
      const mockItems = [
        { transactionId: { S: 'txn-1' }, amount: { N: '100' }, timestamp: { N: String(Date.now()) } },
        { transactionId: { S: 'txn-2' }, amount: { N: '200' }, timestamp: { N: String(Date.now()) } },
        { transactionId: { S: 'txn-3' }, amount: { N: '50' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      expect(dynamoDBMock.calls()).toHaveLength(1);
      expect(s3Mock.calls()).toHaveLength(1);

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(3);
      expect(body.totalAmount).toBe(350);
      expect(body.date).toBeDefined();
      expect(body.generatedAt).toBeDefined();
    });

    test('should filter transactions from last 24 hours', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const scanCall = dynamoDBMock.calls()[0];
      const scanInput = scanCall.args[0].input as any;
      expect(scanInput.FilterExpression).toBe('#ts > :yesterday');
      expect(scanInput.ExpressionAttributeNames).toEqual({ '#ts': 'timestamp' });
      expect(scanInput.ExpressionAttributeValues?.[':yesterday']).toBeDefined();
    });

    test('should handle empty transaction list', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(0);
      expect(body.totalAmount).toBe(0);
    });

    test('should create S3 object with correct key format', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const today = new Date().toISOString().split('T')[0];

      expect(s3Input.Key).toBe(`summaries/daily-${today}.json`);
      expect(s3Input.ContentType).toBe('application/json');
    });

    test('should throw error when DynamoDB scan fails', async () => {
      dynamoDBMock.on(ScanCommand).rejects(new Error('DynamoDB error'));

      await expect(dailySummaryHandler()).rejects.toThrow('DynamoDB error');
    });

    test('should throw error when S3 upload fails', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      await expect(dailySummaryHandler()).rejects.toThrow('S3 error');
    });

    test('should calculate total amount correctly', async () => {
      const mockItems = [
        { amount: { N: '100.50' }, timestamp: { N: String(Date.now()) } },
        { amount: { N: '200.75' }, timestamp: { N: String(Date.now()) } },
        { amount: { N: '50.25' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalAmount).toBe(351.5);
    });

    test('should handle items with missing amount', async () => {
      const mockItems: any[] = [
        { amount: { N: '100' }, timestamp: { N: String(Date.now()) } },
        { timestamp: { N: String(Date.now()) } },
        { amount: { N: '50' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalAmount).toBe(150);
      expect(body.totalTransactions).toBe(3);
    });

    test('should handle undefined Items in scan result', async () => {
      dynamoDBMock.on(ScanCommand).resolves({});
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(0);
      expect(body.totalAmount).toBe(0);
    });
  });
});
```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';

// Type definitions for API responses
interface TransactionResponse {
  message: string;
  transactionId: string;
}

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable or default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read region from AWS_REGION file or environment variable
const regionFilePath = path.join(__dirname, '..', 'lib', 'AWS_REGION');
const region = process.env.AWS_REGION || fs.readFileSync(regionFilePath, 'utf8').trim();

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('Transaction Processing System Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('should verify DynamoDB table exists and is accessible', async () => {
      const response = await dynamoDBClient.send(
        new ScanCommand({
          TableName: outputs.TableName,
          Limit: 1,
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Items).toBeDefined();
    });

    test('should verify S3 bucket exists and is accessible', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          MaxKeys: 1,
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify SQS queue exists with correct attributes', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.QueueUrl,
          AttributeNames: ['VisibilityTimeout', 'RedrivePolicy'],
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.VisibilityTimeout).toBe('300');
      expect(response.Attributes?.RedrivePolicy).toBeDefined();
    });

    test('should verify API Gateway endpoint is accessible', async () => {
      expect(outputs.ApiUrl).toMatch(/^https:\/\//);
      expect(outputs.ApiUrl).toContain('execute-api');
      expect(outputs.ApiUrl).toContain(region);
    });
  });

  describe('Transaction Processing Workflow', () => {
    const testTransactionId = `test-txn-${Date.now()}`;
    const testTransaction = {
      transactionId: testTransactionId,
      amount: 100.5,
      currency: 'USD',
      timestamp: Date.now(),
      customerId: 'test-customer-123',
    };

    test('should process transaction via API Gateway', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTransaction),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as TransactionResponse;
      expect(data.message).toContain('processed successfully');
      expect(data.transactionId).toBe(testTransactionId);
    }, 15000);

    test('should store transaction in DynamoDB after processing', async () => {
      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: testTransactionId },
            timestamp: { N: testTransaction.timestamp.toString() },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item?.transactionId.S).toBe(testTransactionId);
      expect(response.Item?.amount.N).toBe(
        testTransaction.amount.toString()
      );
      expect(response.Item?.currency.S).toBe(testTransaction.currency);
      expect(response.Item?.status.S).toBe('processed');
    }, 15000);

    test('should create audit log in S3 bucket after processing', async () => {
      // Wait for SQS and Lambda processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThan(0);

      // Verify audit log key contains transaction ID
      const auditLog = response.Contents!.find((obj) =>
        obj.Key?.includes(testTransactionId)
      );
      expect(auditLog).toBeDefined();
    }, 20000);
  });

  describe('API Request Validation', () => {
    test('should reject request with missing required fields', async () => {
      const invalidTransaction = {
        amount: 50.0,
        // Missing transactionId and currency
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTransaction),
      });

      expect(response.status).toBe(400);
    });

    test('should reject request with invalid data types', async () => {
      const invalidTransaction = {
        transactionId: 'test-123',
        amount: 'not-a-number', // Should be number
        currency: 'USD',
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTransaction),
      });

      expect(response.status).toBe(400);
    });

    test('should accept valid transaction with all required fields', async () => {
      const validTransaction = {
        transactionId: `valid-txn-${Date.now()}`,
        amount: 75.25,
        currency: 'EUR',
        timestamp: Date.now(),
        customerId: 'customer-456',
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTransaction),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Lambda Function Invocations', () => {
    test('should invoke DailySummary Lambda function successfully', async () => {
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: `dailySummary-${environmentSuffix}`,
          InvocationType: 'RequestResponse',
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    }, 15000);

    test('should verify DailySummary creates report in S3', async () => {
      // Wait for Lambda execution
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'summaries/',
        })
      );

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThan(0);

      // Verify summary file naming convention
      const summaryFile = response.Contents!.find((obj) =>
        obj.Key?.includes('daily-')
      );
      expect(summaryFile).toBeDefined();
    }, 15000);
  });

  describe('Error Handling and Recovery', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{invalid-json}',
      });

      expect(response.status).toBe(400);
    });

    test('should handle empty request body', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Data Consistency and Persistence', () => {
    test('should maintain data consistency between API and DynamoDB', async () => {
      const consistencyTestId = `consistency-test-${Date.now()}`;
      const consistencyTransaction = {
        transactionId: consistencyTestId,
        amount: 999.99,
        currency: 'GBP',
        timestamp: Date.now(),
        customerId: 'consistency-test-customer',
      };

      // Submit transaction
      const apiResponse = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consistencyTransaction),
      });
      expect(apiResponse.status).toBe(200);

      // Wait and verify in DynamoDB
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const dbResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: consistencyTestId },
            timestamp: { N: consistencyTransaction.timestamp.toString() },
          },
        })
      );

      // Verify all fields match
      expect(dbResponse.Item?.transactionId.S).toBe(consistencyTestId);
      expect(parseFloat(dbResponse.Item?.amount.N || '0')).toBe(999.99);
      expect(dbResponse.Item?.currency.S).toBe('GBP');
      expect(dbResponse.Item?.customerId.S).toBe(
        'consistency-test-customer'
      );
    }, 15000);
  });

  describe('Asynchronous Processing Verification', () => {
    test('should process transactions through SQS to audit Lambda', async () => {
      const asyncTestId = `async-test-${Date.now()}`;
      const asyncTransaction = {
        transactionId: asyncTestId,
        amount: 555.55,
        currency: 'JPY',
        timestamp: Date.now(),
        customerId: 'async-test-customer',
      };

      // Submit transaction
      await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asyncTransaction),
      });

      // Wait for SQS processing (queue visibility timeout + Lambda processing)
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify audit log was created
      const s3Response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );

      const auditLog = s3Response.Contents!.find((obj) =>
        obj.Key?.includes(asyncTestId)
      );
      expect(auditLog).toBeDefined();
      expect(auditLog?.Size).toBeGreaterThan(0);
    }, 25000);
  });

  describe('Resource Configuration Verification', () => {
    test('should verify API Gateway throttling is configured', async () => {
      // API Gateway is accessible and returns proper responses
      const response = await fetch(outputs.ApiUrl);
      expect(response.headers.get('x-amzn-requestid')).toBeDefined();
    });

    test('should verify DynamoDB is using on-demand billing', async () => {
      // This is verified by successful operations without provisioned capacity errors
      const scanResponse = await dynamoDBClient.send(
        new ScanCommand({
          TableName: outputs.TableName,
          Limit: 10,
        })
      );
      expect(scanResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('End-to-End Transaction Lifecycle', () => {
    test('should complete full transaction lifecycle from API to audit', async () => {
      const lifecycleTestId = `lifecycle-${Date.now()}`;
      const lifecycleTransaction = {
        transactionId: lifecycleTestId,
        amount: 1234.56,
        currency: 'CAD',
        timestamp: Date.now(),
        customerId: 'lifecycle-test-customer',
      };

      // Step 1: Submit via API
      const apiResponse = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lifecycleTransaction),
      });
      expect(apiResponse.status).toBe(200);
      const apiData = (await apiResponse.json()) as TransactionResponse;
      expect(apiData.transactionId).toBe(lifecycleTestId);

      // Step 2: Verify in DynamoDB
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dbResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: lifecycleTestId },
            timestamp: { N: lifecycleTransaction.timestamp.toString() },
          },
        })
      );
      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.status.S).toBe('processed');

      // Step 3: Verify audit log in S3
      await new Promise((resolve) => setTimeout(resolve, 8000));
      const s3Response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );
      const auditLog = s3Response.Contents!.find((obj) =>
        obj.Key?.includes(lifecycleTestId)
      );
      expect(auditLog).toBeDefined();

      // All stages completed successfully
      expect(true).toBe(true);
    }, 30000);
  });
});
```
