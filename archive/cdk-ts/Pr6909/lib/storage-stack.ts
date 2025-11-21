import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly backupBucket: s3.Bucket;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'KmsKey', {
      description: `KMS key for PostgreSQL in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: `postgres-key-${environmentSuffix}`,
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

    // S3 Bucket for backups with versioning
    const bucketName = `postgres-backups-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`;

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

    // Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: `Backup bucket for ${region}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: `Backup bucket ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: `KMS key ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: `KMS key ARN for ${region}`,
    });

    // Tags
    cdk.Tags.of(this.backupBucket).add('Name', bucketName);
    cdk.Tags.of(this.backupBucket).add('Region', region);
    cdk.Tags.of(this.backupBucket).add('Purpose', 'PostgreSQL-Backups');
  }
}
