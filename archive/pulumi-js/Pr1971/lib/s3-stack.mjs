/**
 * S3 Stack with KMS encryption for multi-region deployment
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class S3Stack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:s3:S3Stack', name, args, opts);

    const { region, kmsKeyId, environmentSuffix = 'dev', tags = {} } = args;

    // S3 bucket with encryption
    this.bucket = new aws.s3.Bucket(`tap-secure-bucket-${region}-${environmentSuffix}`, {
      tags: {
        ...tags,
        Region: region,
        Environment: environmentSuffix,
        Purpose: 'SecureStorage',
      },
    }, { parent: this });

    // S3 bucket versioning
    this.bucketVersioning = new aws.s3.BucketVersioning(`tap-bucket-versioning-${region}-${environmentSuffix}`, {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // S3 bucket server-side encryption with KMS
    this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`tap-bucket-encryption-${region}-${environmentSuffix}`, {
      bucket: this.bucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          kmsMasterKeyId: kmsKeyId,
          sseAlgorithm: 'aws:kms',
        },
        bucketKeyEnabled: true, // Enable S3 bucket keys to reduce KMS costs
      }],
    }, { parent: this });

    // S3 bucket public access block
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-bucket-pab-${region}-${environmentSuffix}`, {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // S3 bucket policy for SSL/TLS enforcement
    this.bucketPolicy = new aws.s3.BucketPolicy(`tap-bucket-policy-${region}-${environmentSuffix}`, {
      bucket: this.bucket.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "DenyInsecureConnections",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
              "${this.bucket.arn}",
              "${this.bucket.arn}/*"
            ],
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            }
          },
          {
            "Sid": "RequireKMSEncryption",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "${this.bucket.arn}/*",
            "Condition": {
              "StringNotEquals": {
                "s3:x-amz-server-side-encryption": "aws:kms"
              }
            }
          }
        ]
      }`,
    }, { parent: this });

    // S3 bucket logging (requires a separate logging bucket)
    // Note: Self-logging (bucket logging to itself) is not recommended in production
    // For now, we'll create a separate logging bucket
    this.loggingBucket = new aws.s3.Bucket(`tap-logs-${region}-${environmentSuffix}`, {
      tags: {
        ...tags,
        Purpose: 'LogStorage',
      },
    }, { parent: this });

    // Configure logging bucket encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(`tap-logs-encryption-${region}-${environmentSuffix}`, {
      bucket: this.loggingBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    }, { parent: this });

    // Block public access to logging bucket
    new aws.s3.BucketPublicAccessBlock(`tap-logs-pab-${region}-${environmentSuffix}`, {
      bucket: this.loggingBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    this.bucketLogging = new aws.s3.BucketLogging(`tap-bucket-logging-${region}-${environmentSuffix}`, {
      bucket: this.bucket.id,
      targetBucket: this.loggingBucket.id,
      targetPrefix: 'access-logs/',
    }, { parent: this });

    this.registerOutputs({
      bucketId: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
      loggingBucketId: this.loggingBucket.id,
    });
  }
}