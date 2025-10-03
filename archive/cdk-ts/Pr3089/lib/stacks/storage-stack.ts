import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  /**
   * Prefix for resource names
   */
  prefix: string;

  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;
}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly metadataTable: dynamodb.Table;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { prefix, environment } = props;

    // Create KMS key for encryption
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for ${prefix} ${environment} environment`,
      alias: `alias/${prefix}-${environment}-key`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY, // For dev/test environments
    });

    // Create S3 bucket with encryption and versioning
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName:
        `${prefix}-data-${environment}-${this.node.addr.substring(0, 8)}`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(60),
            },
          ],
          enabled: true,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For dev/test environments
    });

    // Create DynamoDB table for metadata
    this.metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `${prefix}-metadata-${environment}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add global secondary index for querying by status
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
