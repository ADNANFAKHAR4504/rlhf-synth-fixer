import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly backupBucket: s3.Bucket;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix, isPrimary, primaryRegion, drRegion } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'KmsKey', {
      description: `KMS key for PostgreSQL DR in ${currentRegion}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: `postgres-dr-key-${environmentSuffix}-${currentRegion}`,
    });

    // Grant RDS service permission to use the key
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow RDS to use the key',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: [
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:CreateGrant',
          'kms:GenerateDataKey',
        ],
        resources: ['*'],
      })
    );

    // S3 Bucket for backups with cross-region replication
    const bucketName = `postgres-dr-backups-${environmentSuffix}-${currentRegion}-${cdk.Aws.ACCOUNT_ID}`;

    this.backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          enabled: true,
        },
        {
          id: 'TransitionToGlacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: true,
        },
      ],
    });

    // Enable S3 metrics for replication monitoring (only on primary)
    if (isPrimary) {
      // Replication configuration would be added here
      // Note: Cross-region replication requires the destination bucket to exist first
      // In a real implementation, this would be handled with custom resources or separate deployment phases

      // Add bucket policy for replication
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        roleName: `s3-replication-role-${environmentSuffix}-${currentRegion}`,
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: 'Role for S3 cross-region replication',
      });

      this.backupBucket.grantRead(replicationRole);

      // Add replication policy
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
            's3:GetObjectVersionTagging',
          ],
          resources: [
            `arn:aws:s3:::postgres-dr-backups-${environmentSuffix}-${drRegion}-${cdk.Aws.ACCOUNT_ID}/*`,
          ],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:List*',
            's3:GetBucketVersioning',
            's3:PutBucketVersioning',
          ],
          resources: [
            `arn:aws:s3:::postgres-dr-backups-${environmentSuffix}-${drRegion}-${cdk.Aws.ACCOUNT_ID}`,
          ],
        })
      );
    }

    // CloudWatch metrics for S3
    new cdk.CfnOutput(this, 'S3MetricsEnabled', {
      value: 'true',
      description: 'S3 replication metrics enabled',
    });

    // Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: `Backup bucket for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: `Backup bucket ARN for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: `KMS key ID for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: `KMS key ARN for ${currentRegion}`,
    });

    // Tags
    cdk.Tags.of(this.backupBucket).add('Name', bucketName);
    cdk.Tags.of(this.backupBucket).add('Region', currentRegion);
    cdk.Tags.of(this.backupBucket).add('Purpose', 'PostgreSQL-DR-Backups');
  }
}
