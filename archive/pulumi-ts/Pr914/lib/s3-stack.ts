/**
 * s3-stack.ts
 *
 * This module defines the secure S3 bucket for document storage with AWS managed encryption,
 * versioning, access logging, and restrictive bucket policies implementing least privilege access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  lambdaRoleArn?: pulumi.Input<string>; // Optional - if not provided, creates temporary role
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly accessLogsBucket: aws.s3.Bucket;
  public readonly bucketPolicy: aws.s3.BucketPolicy;
  public readonly tempLambdaRole?: aws.iam.Role;
  public readonly updatedBucketPolicy?: aws.s3.BucketPolicy;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const { environmentSuffix, lambdaRoleArn, tags } = args;

    // Create access logs bucket
    this.accessLogsBucket = new aws.s3.Bucket(
      `access-logs-bucket-${environmentSuffix}`,
      {
        tags: {
          Name: `access-logs-bucket-${environmentSuffix}`,
          Purpose: 'Access logs storage',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `access-logs-pab-${environmentSuffix}`,
      {
        bucket: this.accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create main S3 bucket
    this.bucket = new aws.s3.Bucket(
      `secure-doc-bucket-${environmentSuffix}`,
      {
        tags: {
          Name: `secure-doc-bucket-${environmentSuffix}`,
          Purpose: 'Secure document storage',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.s3.BucketVersioning(
      `bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `bucket-pab-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketLogging(
      `bucket-logging-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        targetBucket: this.accessLogsBucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    new aws.s3.BucketLifecycleConfiguration(
      `bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: `cleanup-incomplete-uploads-${environmentSuffix}`,
            status: 'Enabled',
            abortIncompleteMultipartUpload: {
              daysAfterInitiation: 7,
            },
          },
          {
            id: `transition-old-versions-${environmentSuffix}`,
            status: 'Enabled',
            noncurrentVersionTransitions: [
              {
                noncurrentDays: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                noncurrentDays: 90,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              noncurrentDays: 365,
            },
          },
        ],
      },
      { parent: this }
    );

    // If no Lambda role provided, create a temporary one
    if (!lambdaRoleArn) {
      this.tempLambdaRole = new aws.iam.Role(
        `temp-lambda-role-${environmentSuffix}`,
        {
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              },
            ],
          }),
          tags,
        },
        { parent: this }
      );
    }

    // Use provided role or temporary role for initial bucket policy
    const initialRoleArn = lambdaRoleArn || this.tempLambdaRole!.arn;

    this.bucketPolicy = new aws.s3.BucketPolicy(
      `bucket-policy-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        policy: pulumi
          .all([this.bucket.arn, initialRoleArn])
          .apply(([bucketArn, roleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Id: `SecureBucketPolicy-${environmentSuffix}`,
              Statement: [
                {
                  Sid: 'AllowLambdaAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      accessLogsBucketName: this.accessLogsBucket.id,
      accessLogsBucketArn: this.accessLogsBucket.arn,
      tempLambdaRoleArn: this.tempLambdaRole?.arn,
      bucketPolicyId: this.bucketPolicy.id,
    });
  }

  // Method to update bucket policy with real Lambda role
  public updateBucketPolicy(
    realLambdaRoleArn: pulumi.Input<string>
  ): aws.s3.BucketPolicy {
    return new aws.s3.BucketPolicy(
      'bucket-policy-updated-final',
      {
        bucket: this.bucket.id,
        policy: pulumi
          .all([this.bucket.arn, realLambdaRoleArn])
          .apply(([bucketArn, roleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Id: 'SecureBucketPolicy-simplified',
              Statement: [
                {
                  Sid: 'AllowLambdaAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );
  }
}
