import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  kmsKey: kms.IKey;
  isPrimary: boolean;
  secondaryRegion?: string;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix, kmsKey, isPrimary, secondaryRegion } = props;

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

    if (isPrimary) {
      const replicationRole = new iam.Role(
        this,
        `ReplicationRole-${environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
          roleName: `dr-s3-replication-${environmentSuffix}`,
        }
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetReplicationConfiguration',
            's3:ListBucket',
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
          ],
          resources: [
            `arn:aws:s3:::dr-storage-${environmentSuffix}-us-east-2/*`,
          ],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['kms:Decrypt', 'kms:Encrypt'],
          resources: [kmsKey.keyArn],
        })
      );

      const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: `ReplicationRule-${environmentSuffix}`,
            status: 'Enabled',
            priority: 1,
            filter: {},
            destination: {
              bucket: `arn:aws:s3:::dr-storage-${environmentSuffix}-us-east-2`,
              replicationTime: {
                status: 'Enabled',
                time: { minutes: 15 },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: { minutes: 15 },
              },
            },
            deleteMarkerReplication: { status: 'Enabled' },
          },
        ],
      };
    }

    // For primary region with replicas, get the secondary KMS key ARN from SSM
    let replicaKmsKeyArn: string | undefined;
    if (isPrimary && secondaryRegion) {
      replicaKmsKeyArn = ssm.StringParameter.valueForStringParameter(
        this,
        `/dr/${environmentSuffix}/kms-key-arn/${secondaryRegion}`
      );
    }

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
        encryption: dynamodb.TableEncryptionV2.customerManagedKey(
          kmsKey,
          isPrimary && replicaKmsKeyArn
            ? { [secondaryRegion!]: replicaKmsKeyArn }
            : undefined
        ),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        contributorInsights: true,
        replicas: isPrimary
          ? [
              {
                region: secondaryRegion!,
                contributorInsights: true,
              },
            ]
          : undefined,
        timeToLiveAttribute: 'ttl',
      }
    );

    cdk.Tags.of(this.bucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.dynamoTable).add('Environment', environmentSuffix);
  }
}
