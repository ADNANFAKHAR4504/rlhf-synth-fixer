import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface StorageStackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  destinationBucket?: s3.IBucket;
}

export class StorageStack extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly sessionTable?: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    const { environmentSuffix, region, isPrimary } = props;

    // S3 Bucket with versioning
    const bucketName = `tapstack${environmentSuffix.toLowerCase()}data${region.replace(/-/g, '')}`;

    this.bucket = new s3.Bucket(this, 'DataBucket', {
      bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
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
    });

    // Note: Cross-Region Replication removed for single region deployment

    // DynamoDB Table (single region)
    if (isPrimary) {
      this.sessionTable = new dynamodb.TableV2(this, 'SessionTable', {
        tableName: `TapStack${environmentSuffix}Sessions`,
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billing: dynamodb.Billing.onDemand(),
        encryption: dynamodb.TableEncryptionV2.dynamoOwnedKey(),
        pointInTimeRecovery: true,
        timeToLiveAttribute: 'ttl',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Output for session table
      new cdk.CfnOutput(this, 'SessionTableName', {
        value: this.sessionTable.tableName,
        description: 'DynamoDB Table Name',
      });

      new cdk.CfnOutput(this, 'SessionTableArn', {
        value: this.sessionTable.tableArn,
        description: 'DynamoDB Table ARN',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Bucket ARN',
    });
  }
}
