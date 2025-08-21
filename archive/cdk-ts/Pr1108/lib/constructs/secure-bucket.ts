import { aws_iam as iam, aws_kms as kms, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  bucketName?: string;
  encryptionKey: kms.IKey;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);
    if (!props.encryptionKey) {
      throw new Error('encryptionKey is required for SecureBucket');
    }
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      enforceSSL: true,
      bucketKeyEnabled: true,
    });

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
