import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  replicationDestinationBucketArn?: string;
  replicationDestinationKmsArn?: string;
}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    this.encryptionKey = new kms.Key(
      this,
      `S3EncryptionKey-${props.environmentSuffix}`,
      {
        alias: `s3-key-${props.environmentSuffix}`,
        description: `Encryption key for S3 in ${props.region}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pendingWindow: cdk.Duration.days(7),
      }
    );

    const bucketProps: s3.BucketProps = {
      bucketName: `fintech-uploads-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    };

    if (props.isPrimary && props.replicationDestinationBucketArn) {
      const replicationRole = new iam.Role(
        this,
        `ReplicationRole-${props.environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        }
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
          resources: [
            `arn:aws:s3:::fintech-uploads-${props.environmentSuffix}`,
          ],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
          ],
          resources: [
            `arn:aws:s3:::fintech-uploads-${props.environmentSuffix}/*`,
          ],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
          resources: [`${props.replicationDestinationBucketArn}/*`],
        })
      );

      if (props.replicationDestinationKmsArn) {
        replicationRole.addToPolicy(
          new iam.PolicyStatement({
            actions: ['kms:Decrypt'],
            resources: [this.encryptionKey.keyArn],
          })
        );

        replicationRole.addToPolicy(
          new iam.PolicyStatement({
            actions: ['kms:Encrypt'],
            resources: [props.replicationDestinationKmsArn],
          })
        );
      }
    }

    this.bucket = new s3.Bucket(
      this,
      `UserUploadsBucket-${props.environmentSuffix}`,
      bucketProps
    );

    cdk.Tags.of(this.bucket).add('Region', props.region);
  }
}
