import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly imageBucket: s3.Bucket;
  public readonly detectionTable: dynamodb.Table;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // S3 Bucket for image storage with security and lifecycle configurations
    this.imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: `serverlessapp-pet-detector-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      publicReadAccess: false,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Always DESTROY for LocalStack compatibility
      autoDeleteObjects: true, // Always true for LocalStack compatibility
    });

    // Note: BucketDeployment removed for LocalStack compatibility
    // Folder structure will be created automatically when objects are uploaded
    // Original code: BucketDeployment with Source.data() for input/, cats/, dogs/, others/ folders

    // DynamoDB table for detection logs with performance and backup configurations
    this.detectionTable = new dynamodb.Table(this, 'DetectionTable', {
      tableName: `serverlessapp-detection-logs-${environmentSuffix}`,
      partitionKey: {
        name: 'ImageID',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'Timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environmentSuffix === 'prod',
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'TTL',
      deletionProtection: false, // Disabled for LocalStack compatibility
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Always DESTROY for LocalStack compatibility
    });

    // Global Secondary Index for querying by detection status
    this.detectionTable.addGlobalSecondaryIndex({
      indexName: 'ProcessingStatusIndex',
      partitionKey: {
        name: 'ProcessingStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'Timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI for querying by detected animal type
    this.detectionTable.addGlobalSecondaryIndex({
      indexName: 'DetectedAnimalIndex',
      partitionKey: {
        name: 'DetectedAnimal',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'ConfidenceScore',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // SNS Topic for notifications with encryption
    this.notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `serverlessapp-notifications-${environmentSuffix}`,
      displayName: 'Image Detection Notifications',
      masterKey: undefined, // Use default AWS managed key
    });

    // Add resource tags for better organization and cost tracking
    cdk.Tags.of(this).add('Component', 'Storage');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
