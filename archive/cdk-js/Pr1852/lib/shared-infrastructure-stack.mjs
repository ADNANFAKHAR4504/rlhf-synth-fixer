import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class SharedInfrastructureStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Apply standardized tagging to this stack (will be inherited by children)
    const tags = {
      Department: props.accountConfig?.department || 'IT',
      Project: props.accountConfig?.project || 'SharedInfrastructure',
      Environment: props.accountConfig?.environment || 'dev',
      Owner: props.accountConfig?.owner || 'InfrastructureTeam',
      CostCenter: props.accountConfig?.costCenter || 'IT-OPS',
      ManagedBy: 'CDK'
    };
    
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
    
    // Get environment suffix for resource naming
    const environmentSuffix = props.environmentSuffix || props.stageName || 'dev';

    // Shared KMS key for encryption
    const sharedKmsKey = new kms.Key(this, 'SharedKmsKey', {
      description: `Shared KMS key for ${props.stageName} environment`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    sharedKmsKey.addAlias(`shared-key-${environmentSuffix}`);

    // Shared S3 bucket for artifacts and logging
    const sharedBucket = new s3.Bucket(this, 'SharedBucket', {
      // Let CDK auto-generate the bucket name to avoid token issues
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: sharedKmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          enabled: true
        }
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // SNS topic for notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `shared-notif-${environmentSuffix}`,
      displayName: `Shared Notifications - ${environmentSuffix}`,
      masterKey: sharedKmsKey
    });

    // SQS dead letter queue for failed messages
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `shared-dlq-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sharedKmsKey,
      retentionPeriod: cdk.Duration.days(14)
    });

    // SQS queue for processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `shared-proc-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sharedKmsKey,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3
      },
      visibilityTimeout: cdk.Duration.minutes(5)
    });

    // CloudWatch Log Group for centralized logging (without KMS to avoid permission issues)
    const logGroup = new logs.LogGroup(this, 'SharedLogGroup', {
      logGroupName: `/shared-infra/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'SharedDashboard', {
      dashboardName: `SharedInfra-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# Shared Infrastructure - ${props.stageName}\n\nThis dashboard monitors shared infrastructure resources.`,
            width: 24,
            height: 2
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'S3 Bucket Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: sharedBucket.bucketName,
                  StorageType: 'StandardStorage'
                },
                statistic: 'Average',
                period: cdk.Duration.days(1)
              })
            ],
            width: 12,
            height: 6
          }),
          new cloudwatch.GraphWidget({
            title: 'SQS Queue Metrics',
            left: [processingQueue.metricApproximateNumberOfMessagesVisible()],
            right: [deadLetterQueue.metricApproximateNumberOfMessagesVisible()],
            width: 12,
            height: 6
          })
        ]
      ]
    });

    // SSM Parameters for resource sharing
    new ssm.StringParameter(this, 'SharedBucketParameter', {
      parameterName: `/shared-infra/${environmentSuffix}/bucket-name`,
      stringValue: sharedBucket.bucketName,
      description: 'Shared S3 bucket name'
    });

    new ssm.StringParameter(this, 'SharedKmsKeyParameter', {
      parameterName: `/shared-infra/${environmentSuffix}/kms-key-id`,
      stringValue: sharedKmsKey.keyId,
      description: 'Shared KMS key ID'
    });

    new ssm.StringParameter(this, 'NotificationTopicParameter', {
      parameterName: `/shared-infra/${environmentSuffix}/notif-topic-arn`,
      stringValue: notificationTopic.topicArn,
      description: 'Shared notification topic ARN'
    });

    // Outputs
    new cdk.CfnOutput(this, 'SharedBucketName', {
      value: sharedBucket.bucketName,
      description: 'Name of the shared S3 bucket'
    });

    new cdk.CfnOutput(this, 'SharedKmsKeyId', {
      value: sharedKmsKey.keyId,
      description: 'ID of the shared KMS key'
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'ARN of the shared notification topic'
    });
  }
}