import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DataStack extends cdk.Stack {
  public readonly tradingPatternsTable: dynamodb.Table;
  public readonly approvalTrackingTable: dynamodb.Table;
  public readonly alertQueue: sqs.Queue;
  public readonly pendingApprovalsQueue: sqs.Queue;
  public readonly tradingAlertsTopic: sns.Topic;
  public readonly alertApprovalTopic: sns.Topic;
  public readonly marketDataStream: kinesis.Stream;
  public readonly wafLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'MarketDataKey', {
      description: `KMS key for market data encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 1. DynamoDB TradingPatterns table
    // Note: on-demand billing mode provides automatic scaling, so explicit auto-scaling is not needed/compatible
    this.tradingPatternsTable = new dynamodb.Table(this, 'TradingPatterns', {
      tableName: `TradingPatterns-${environmentSuffix}`,
      partitionKey: { name: 'patternId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // 2. DynamoDB ApprovalTracking table with TTL
    this.approvalTrackingTable = new dynamodb.Table(this, 'ApprovalTracking', {
      tableName: `ApprovalTracking-${environmentSuffix}`,
      partitionKey: { name: 'approvalId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'expiresAt',
    });

    // 3. SQS AlertQueue
    this.alertQueue = new sqs.Queue(this, 'AlertQueue', {
      queueName: `AlertQueue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4), // Exactly 4 days
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'AlertDLQ', {
          queueName: `AlertDLQ-${environmentSuffix}`,
          retentionPeriod: cdk.Duration.days(14),
        }),
      },
    });

    // 4. SQS PendingApprovals queue
    this.pendingApprovalsQueue = new sqs.Queue(this, 'PendingApprovals', {
      queueName: `PendingApprovals-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.hours(2), // 2-hour visibility timeout
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // 5. SNS TradingAlerts topic
    this.tradingAlertsTopic = new sns.Topic(this, 'TradingAlerts', {
      topicName: `TradingAlerts-${environmentSuffix}`,
      displayName: 'Stock Pattern Trading Alerts',
      masterKey: kmsKey,
    });

    // Add email subscription if ALERT_EMAIL environment variable is set
    const alertEmail = process.env.ALERT_EMAIL;
    if (alertEmail) {
      this.tradingAlertsTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(alertEmail)
      );
    }

    // 6. SNS AlertApprovalRequests topic
    this.alertApprovalTopic = new sns.Topic(this, 'AlertApprovalRequests', {
      topicName: `AlertApprovalRequests-${environmentSuffix}`,
      displayName: 'Alert Approval Requests',
      masterKey: kmsKey,
    });

    // 7. Kinesis Data Stream with ON_DEMAND mode
    this.marketDataStream = new kinesis.Stream(this, 'MarketDataStream', {
      streamName: `MarketDataStream-${environmentSuffix}`,
      streamMode: kinesis.StreamMode.ON_DEMAND,
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: kmsKey,
    });

    // Enable enhanced fan-out for Kinesis consumers
    const consumerName = `enhanced-consumer-${environmentSuffix}`;
    new kinesis.CfnStreamConsumer(this, 'EnhancedFanOutConsumer', {
      consumerName,
      streamArn: this.marketDataStream.streamArn,
    });

    // 8. S3 bucket for WAF logs with Intelligent-Tiering
    this.wafLogBucket = new s3.Bucket(this, 'WafLogBucket', {
      bucketName: `waf-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'IntelligentTieringRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
    });

    // Grant WAF write permissions to bucket
    this.wafLogBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('wafv2.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${this.wafLogBucket.bucketArn}/waf-logs/*`],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'AlertQueueUrl', {
      value: this.alertQueue.queueUrl,
      description: 'SQS AlertQueue URL',
      exportName: `AlertQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PendingApprovalsQueueUrl', {
      value: this.pendingApprovalsQueue.queueUrl,
      description: 'SQS PendingApprovals queue URL',
      exportName: `PendingApprovalsQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: this.marketDataStream.streamArn,
      description: 'Kinesis stream ARN',
      exportName: `KinesisStreamArn-${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
  }
}
