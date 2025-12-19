import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  kmsKey: kms.IKey;
  isPrimary: boolean;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix, kmsKey } = props;

    this.bucket = new s3.Bucket(this, `Bucket-${environmentSuffix}`, {
      bucketName: `dr-storage-${environmentSuffix}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    this.dynamoTable = new dynamodb.TableV2(
      this,
      `DynamoTable-${environmentSuffix}`,
      {
        tableName: `dr-sessions-${environmentSuffix}`,
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        encryption: dynamodb.TableEncryptionV2.dynamoOwnedKey(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        contributorInsights: true,
        timeToLiveAttribute: 'ttl',
      }
    );

    cdk.Tags.of(this.bucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.dynamoTable).add('Environment', environmentSuffix);
  }
}
