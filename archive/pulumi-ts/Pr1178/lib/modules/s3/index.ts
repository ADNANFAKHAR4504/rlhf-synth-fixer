import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecureS3BucketArgs {
  bucketName?: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: Record<string, string>;
  lifecycleRules?: any[];
  enableBucketPolicy?: boolean; // Optional flag to enable/disable bucket policy
  enableAccessLogging?: boolean; // Optional flag to enable/disable access logging
}

export class SecureS3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly accessLogsBucket?: aws.s3.Bucket;

  constructor(
    name: string,
    args: SecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureS3Bucket', name, {}, opts);

    // Input validation
    if (!args.kmsKeyId) {
      throw new Error(`KMS Key ID is required for secure S3 bucket ${name}`);
    }

    // Validate bucket name if provided
    if (args.bucketName) {
      const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
      if (
        !bucketNameRegex.test(args.bucketName) ||
        args.bucketName.length < 3 ||
        args.bucketName.length > 63
      ) {
        throw new Error(
          `Invalid bucket name ${args.bucketName}. Must be 3-63 characters, lowercase, and follow S3 naming rules.`
        );
      }
    }

    // Create access logs bucket only if logging is enabled (default: true)
    const enableLogging = args.enableAccessLogging !== false;

    if (enableLogging) {
      this.accessLogsBucket = new aws.s3.Bucket(
        `${name}-access-logs`,
        {
          bucket: args.bucketName
            ? `${args.bucketName}-access-logs`
            : undefined,
          forceDestroy: false,
          tags: { ...commonTags, ...args.tags, Purpose: 'Access Logs' },
        },
        { parent: this }
      );

      // Block public access for logs bucket
      new aws.s3.BucketPublicAccessBlock(
        `${name}-logs-public-access-block`,
        {
          bucket: this.accessLogsBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { parent: this }
      );
    }

    // Create S3 bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: args.bucketName,
        forceDestroy: false,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enable versioning with error handling
    try {
      new aws.s3.BucketVersioning(
        `${name}-versioning`,
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
            mfaDelete: 'Disabled', // Can be enabled if MFA delete is required
          },
        },
        {
          parent: this,
          dependsOn: [this.bucket],
        }
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure versioning for bucket ${name}:`,
        error
      );
      // Versioning is important for security, so we should still try to continue
    }

    // Configure server-side encryption with error handling
    try {
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${name}-encryption`,
        {
          bucket: this.bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: args.kmsKeyId,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        {
          parent: this,
          dependsOn: [this.bucket],
        }
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure encryption for bucket ${name}:`,
        error
      );
      throw new Error(
        `Critical: Cannot create secure S3 bucket without encryption: ${error}`
      );
    }

    // Block all public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Secure bucket policy with error handling (optional)
    if (args.enableBucketPolicy !== false) {
      const bucketPolicyDocument = pulumi
        .all([
          this.bucket.arn,
          aws.getCallerIdentity().then(id => id.accountId),
        ])
        .apply(([bucketArn, accountId]) => {
          try {
            if (!bucketArn || !accountId) {
              throw new Error(
                'Missing required values for bucket policy creation'
              );
            }

            return {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowRootAccountFullAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'AllowCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AllowCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
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
            };
          } catch (error) {
            console.warn(
              `Warning: Error creating bucket policy for ${name}:`,
              error
            );
            // Return a minimal policy that still enforces security
            return {
              Version: '2012-10-17',
              Statement: [
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
            };
          }
        });

      this.bucketPolicy = new aws.s3.BucketPolicy(
        `${name}-policy`,
        {
          bucket: this.bucket.id,
          policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
        },
        { parent: this, dependsOn: [this.publicAccessBlock] }
      );
    }

    // Configure lifecycle rules with validation and error handling
    if (args.lifecycleRules && args.lifecycleRules.length > 0) {
      try {
        // Validate lifecycle rules structure
        const validatedRules = args.lifecycleRules.filter(rule => {
          if (!rule.id || !rule.status) {
            console.warn(
              `Warning: Skipping invalid lifecycle rule for bucket ${name}:`,
              rule
            );
            return false;
          }
          return true;
        });

        if (validatedRules.length > 0) {
          new aws.s3.BucketLifecycleConfiguration(
            `${name}-lifecycle`,
            {
              bucket: this.bucket.id,
              rules: validatedRules,
            },
            {
              parent: this,
              dependsOn: [this.bucket],
            }
          );
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to configure lifecycle rules for bucket ${name}:`,
          error
        );
      }
    }

    // Enable access logging with proper dependency management and error resilience
    if (enableLogging && this.accessLogsBucket) {
      new aws.s3.BucketLogging(
        `${name}-logging`,
        {
          bucket: this.bucket.id,
          targetBucket: this.accessLogsBucket.id,
          targetPrefix: 'access-logs/',
        },
        {
          parent: this,
          dependsOn: [this.accessLogsBucket, this.publicAccessBlock],
          // Add error handling through resource options
          ignoreChanges: [], // Allow updates if needed
          retainOnDelete: false, // Clean up on deletion
        }
      );
    }

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
      accessLogsBucketName: this.accessLogsBucket?.id,
      accessLogsBucketArn: this.accessLogsBucket?.arn,
    });
  }
}
