import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.Key;
}

export class StorageStack extends cdk.Stack {
  public readonly stateBucket: s3.Bucket;
  public readonly lockTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 bucket for Terraform state with versioning and encryption
    this.stateBucket = new s3.Bucket(
      this,
      `secure-${props.environmentSuffix}-state-bucket`,
      {
        bucketName: `secure-${props.environmentSuffix}-terraform-state-${cdk.Aws.ACCOUNT_ID}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: props.encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
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
            ],
          },
        ],
        serverAccessLogsPrefix: 'access-logs/',
        eventBridgeEnabled: true,
      }
    );

    // DynamoDB table for state locking
    this.lockTable = new dynamodb.Table(
      this,
      `secure-${props.environmentSuffix}-lock-table`,
      {
        tableName: `secure-${props.environmentSuffix}-terraform-lock`,
        partitionKey: {
          name: 'LockID',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: props.encryptionKey,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Additional secure S3 bucket for application data
    new s3.Bucket(this, `secure-${props.environmentSuffix}-data-bucket`, {
      bucketName: `secure-${props.environmentSuffix}-application-data-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // Apply tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');
  }
}
