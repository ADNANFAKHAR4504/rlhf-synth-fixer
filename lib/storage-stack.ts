import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  destinationBucket?: s3.IBucket;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly sessionTable?: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const { environmentSuffix, region, isPrimary, destinationBucket } = props;

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

    // Configure Cross-Region Replication for primary bucket
    if (isPrimary && destinationBucket) {
      // Create replication role
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        roleName: `TapStack${environmentSuffix}S3ReplicationRole`,
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });

      // Grant permissions to source bucket
      this.bucket.grantRead(replicationRole);

      // Grant permissions to destination bucket
      destinationBucket.grantWrite(replicationRole);

      // Add replication configuration
      const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateAll',
            status: 'Enabled',
            priority: 1,
            filter: {},
            deleteMarkerReplication: {
              status: 'Enabled',
            },
            destination: {
              bucket: destinationBucket.bucketArn,
              replicationTime: {
                status: 'Enabled',
                time: {
                  minutes: 15,
                },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: {
                  minutes: 15,
                },
              },
            },
          },
        ],
      };
    }

    // DynamoDB Global Table (only create in primary region)
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
        replicas: [
          {
            region: region === 'us-east-1' ? 'us-east-2' : 'us-east-1',
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Output for session table
      new cdk.CfnOutput(this, 'SessionTableName', {
        value: this.sessionTable.tableName,
        description: 'DynamoDB Global Table Name',
        exportName: `TapStack${environmentSuffix}SessionTableName`,
      });

      new cdk.CfnOutput(this, 'SessionTableArn', {
        value: this.sessionTable.tableArn,
        description: 'DynamoDB Global Table ARN',
        exportName: `TapStack${environmentSuffix}SessionTableArn`,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `TapStack${environmentSuffix}BucketName${region}`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: `TapStack${environmentSuffix}BucketArn${region}`,
    });
  }
}
