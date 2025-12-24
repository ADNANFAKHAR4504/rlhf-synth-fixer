import { aws_iam as iam, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  encryptionKey: import('aws-cdk-lib').aws_kms.Key;
  bucketName?: string;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      bucketKeyEnabled: true,
      enforceSSL: true,
    });

    // Enforce KMS + correct key on PUT
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionHeader',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: { 's3:x-amz-server-side-encryption': 'aws:kms' },
        },
      })
    );

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnEncryptedOrWrongKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              props.encryptionKey.keyArn,
          },
        },
      })
    );
  }
}
