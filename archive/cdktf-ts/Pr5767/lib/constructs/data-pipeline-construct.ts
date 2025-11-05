import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { DataArchiveFile } from '../../.gen/providers/archive/data-archive-file';
import { ArchiveProvider } from '../../.gen/providers/archive/provider';
import * as path from 'path';

export interface DataPipelineConfig {
  environment: string;
  environmentSuffix: string;
  lambdaMemory: number;
  dynamodbReadCapacity: number;
  dynamodbWriteCapacity: number;
  dynamodbBillingMode: string;
  s3LifecycleDays: number;
  enableXrayTracing: boolean;
  snsEmail: string;
  costCenter: string;
}

export class DataPipelineConstruct extends Construct {
  public readonly dataBucket: S3Bucket;
  public readonly metadataTable: DynamodbTable;
  public readonly processorFunction: LambdaFunction;
  public readonly alertTopic: SnsTopic;
  public readonly s3EventRule: CloudwatchEventRule;

  constructor(scope: Construct, id: string, config: DataPipelineConfig) {
    super(scope, id);

    // Initialize Archive provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Create S3 Bucket for data ingestion
    this.dataBucket = new S3Bucket(this, 'DataBucket', {
      bucket: `myapp-${config.environment}-data-${config.environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `myapp-${config.environment}-data-${config.environmentSuffix}`,
        Purpose: 'Data Ingestion',
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'DataBucketVersioning', {
      bucket: this.dataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure S3 bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'DataBucketEncryption',
      {
        bucket: this.dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'DataBucketPublicAccessBlock', {
      bucket: this.dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Configure lifecycle policy
    new S3BucketLifecycleConfiguration(this, 'DataBucketLifecycle', {
      bucket: this.dataBucket.id,
      rule: [
        {
          id: `expire-after-${config.s3LifecycleDays}-days`,
          status: 'Enabled',
          filter: [{}],
          expiration: [
            {
              days: config.s3LifecycleDays,
            },
          ],
        },
      ],
    });

    // Create DynamoDB table for metadata storage
    const billingModeConfig =
      config.dynamodbBillingMode === 'PAY_PER_REQUEST'
        ? {
            billingMode: 'PAY_PER_REQUEST',
          }
        : {
            billingMode: 'PROVISIONED',
            readCapacity: config.dynamodbReadCapacity,
            writeCapacity: config.dynamodbWriteCapacity,
          };

    this.metadataTable = new DynamodbTable(this, 'MetadataTable', {
      name: `myapp-${config.environment}-metadata-${config.environmentSuffix}`,
      hashKey: 'id',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      ...billingModeConfig,
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `myapp-${config.environment}-metadata-${config.environmentSuffix}`,
        Purpose: 'Metadata Storage',
      },
    });

    // Create SNS Topic for alerts
    this.alertTopic = new SnsTopic(this, 'AlertTopic', {
      name: `myapp-${config.environment}-alerts-${config.environmentSuffix}`,
      displayName: `Data Pipeline Alerts - ${config.environment}`,
      tags: {
        Name: `myapp-${config.environment}-alerts-${config.environmentSuffix}`,
        Purpose: 'Alert Notifications',
      },
    });

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, 'AlertTopicSubscription', {
      topicArn: this.alertTopic.arn,
      protocol: 'email',
      endpoint: config.snsEmail,
    });

    // Create IAM role for Lambda function
    const lambdaRole = new IamRole(this, 'LambdaExecutionRole', {
      name: `myapp-${config.environment}-lambda-role-${config.environmentSuffix}`,
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
      tags: {
        Name: `myapp-${config.environment}-lambda-role-${config.environmentSuffix}`,
        Purpose: 'Lambda Execution Role',
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Create custom IAM policy for Lambda
    const lambdaPolicy = new IamPolicy(this, 'LambdaCustomPolicy', {
      name: `myapp-${config.environment}-lambda-policy-${config.environmentSuffix}`,
      description: 'Custom policy for Lambda data processor',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
            Resource: [this.dataBucket.arn, `${this.dataBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: this.metadataTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: this.alertTopic.arn,
          },
          ...(config.enableXrayTracing
            ? [
                {
                  Effect: 'Allow',
                  Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                  Resource: '*',
                },
              ]
            : []),
        ],
      }),
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, 'LambdaCustomPolicyAttachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Package Lambda function code
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: path.join(__dirname, '../lambda/data-processor'),
      outputPath: path.join(__dirname, '../../dist/lambda-processor.zip'),
    });

    // Create Lambda function
    this.processorFunction = new LambdaFunction(this, 'ProcessorFunction', {
      functionName: `myapp-${config.environment}-processor-${config.environmentSuffix}`,
      description: `Data processor for ${config.environment} environment`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: config.lambdaMemory,
      timeout: 300,
      environment: {
        variables: {
          ENVIRONMENT: config.environment,
          DYNAMODB_TABLE: this.metadataTable.name,
          SNS_TOPIC_ARN: this.alertTopic.arn,
          S3_BUCKET: this.dataBucket.bucket,
        },
      },
      tracingConfig: {
        mode: config.enableXrayTracing ? 'Active' : 'PassThrough',
      },
      tags: {
        Name: `myapp-${config.environment}-processor-${config.environmentSuffix}`,
        Purpose: 'Data Processing',
      },
    });

    // Create EventBridge rule for S3 events
    this.s3EventRule = new CloudwatchEventRule(this, 'S3EventRule', {
      name: `myapp-${config.environment}-s3-events-${config.environmentSuffix}`,
      description: `Trigger Lambda on S3 object creation in ${config.environment}`,
      eventPattern: JSON.stringify({
        source: ['aws.s3'],
        'detail-type': ['Object Created'],
        detail: {
          bucket: {
            name: [this.dataBucket.bucket],
          },
        },
      }),
      tags: {
        Name: `myapp-${config.environment}-s3-events-${config.environmentSuffix}`,
        Purpose: 'Event Routing',
      },
    });

    // Add Lambda as EventBridge target
    new CloudwatchEventTarget(this, 'S3EventTarget', {
      rule: this.s3EventRule.name,
      arn: this.processorFunction.arn,
    });

    // Grant EventBridge permission to invoke Lambda
    new LambdaPermission(this, 'EventBridgeInvokeLambda', {
      statementId: 'AllowEventBridgeInvoke',
      action: 'lambda:InvokeFunction',
      functionName: this.processorFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: this.s3EventRule.arn,
    });

    // Configure S3 bucket notification to EventBridge
    new S3BucketNotification(this, 'S3BucketNotification', {
      bucket: this.dataBucket.id,
      eventbridge: true,
    });
  }
}
