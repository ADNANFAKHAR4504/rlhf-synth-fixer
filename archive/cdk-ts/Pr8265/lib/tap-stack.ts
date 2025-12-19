import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

export class TapStack extends cdk.Stack {
  public readonly securedBucket: s3.IBucket;
  public readonly cloudTrail?: cloudtrail.Trail;
  public readonly kmsKey?: kms.IKey;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create KMS key for S3 encryption (only for non-LocalStack environments)
    if (!isLocalStack) {
      this.kmsKey = new kms.Key(this, 'S3EncryptionKey', {
        description: `KMS key for S3 bucket encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        alias: `alias/s3-encryption-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Simplified bucket name for LocalStack (lowercase for S3 requirements)
    const bucketName = isLocalStack
      ? `secure-bucket-${environmentSuffix.toLowerCase()}`
      : `secure-bucket-${environmentSuffix}-${this.account}-${this.region}`;

    // Create the target S3 bucket with appropriate encryption
    this.securedBucket = new s3.Bucket(this, 'SecuredBucket', {
      bucketName,
      // Use S3-managed encryption for LocalStack, KMS for AWS
      encryption: isLocalStack
        ? s3.BucketEncryption.S3_MANAGED
        : s3.BucketEncryption.KMS,
      encryptionKey: isLocalStack ? undefined : this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Disable autoDeleteObjects for LocalStack to avoid custom resource/Lambda
      autoDeleteObjects: !isLocalStack,
    });

    // Define allowed principals (example IAM roles)
    const allowedPrincipals = [
      `arn:aws:iam::${this.account}:role/allowed-role-1-${environmentSuffix}`,
      `arn:aws:iam::${this.account}:role/allowed-role-2-${environmentSuffix}`,
      `arn:aws:iam::${this.account}:root`,
    ];

    // Add bucket policy statements for security enforcement
    this.securedBucket.addToResourcePolicy(
      // Deny non-TLS requests
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Simplified IAM policy for LocalStack
    if (isLocalStack) {
      // LocalStack: simplified policy without complex conditions
      this.securedBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowAuthorizedAccess',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [
            this.securedBucket.bucketArn,
            `${this.securedBucket.bucketArn}/*`,
          ],
        })
      );
    } else {
      // AWS: Full security policies
      // Deny access to unauthorized principals
      this.securedBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'DenyUnauthorizedPrincipals',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [
            this.securedBucket.bucketArn,
            `${this.securedBucket.bucketArn}/*`,
          ],
          conditions: {
            StringNotLike: {
              'aws:PrincipalArn': [
                ...allowedPrincipals,
                // Allow CloudTrail service
                'arn:aws:iam::*:role/aws-service-role/cloudtrail.amazonaws.com/*',
                // Allow AWS S3 service for logging
                'arn:aws:*:*:s3:*',
              ],
            },
          },
        })
      );

      // Object-level denies for encryption
      this.securedBucket.addToResourcePolicy(
        // Deny uploads without SSE-KMS
        new iam.PolicyStatement({
          sid: 'DenyUnencryptedUploads',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:PutObject'],
          resources: [`${this.securedBucket.bucketArn}/*`],
          conditions: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'aws:kms',
            },
          },
        })
      );

      // Deny uploads with wrong KMS key (supports both key ID and ARN)
      if (this.kmsKey) {
        this.securedBucket.addToResourcePolicy(
          new iam.PolicyStatement({
            sid: 'DenyWrongKMSKey',
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['s3:PutObject'],
            resources: [`${this.securedBucket.bucketArn}/*`],
            conditions: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption-aws-kms-key-id': [
                  this.kmsKey.keyArn,
                  this.kmsKey.keyId,
                ],
              },
              StringEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          })
        );
      }
    }

    // CloudTrail is only created for non-LocalStack environments
    if (!isLocalStack) {
      // Create CloudTrail log bucket
      const trailLogBucket = new s3.Bucket(this, 'CloudTrailLogBucket', {
        bucketName: `cloudtrail-logs-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            expiration: cdk.Duration.days(90),
          },
        ],
      });

      this.cloudTrail = new cloudtrail.Trail(this, 'S3DataEventsTrail', {
        trailName: `s3-data-events-trail-${environmentSuffix}`,
        bucket: trailLogBucket,
        includeGlobalServiceEvents: false,
        isMultiRegionTrail: false,
        enableFileValidation: true,
      });

      // Add S3 data events for the secured bucket
      this.cloudTrail.addS3EventSelector(
        [
          {
            bucket: this.securedBucket,
            objectPrefix: '',
          },
        ],
        {
          readWriteType: cloudtrail.ReadWriteType.ALL,
          includeManagementEvents: false,
        }
      );

      // CloudTrail outputs
      new cdk.CfnOutput(this, 'CloudTrailArn', {
        value: this.cloudTrail.trailArn,
        description: 'ARN of the CloudTrail monitoring S3 data events',
      });

      new cdk.CfnOutput(this, 'CloudTrailLogBucketName', {
        value: trailLogBucket.bucketName,
        description: 'Name of the CloudTrail log bucket',
      });
    }

    // Outputs for reusability and integration tests
    new cdk.CfnOutput(this, 'SecuredBucketName', {
      value: this.securedBucket.bucketName,
      description: 'Name of the secured S3 bucket',
    });

    new cdk.CfnOutput(this, 'SecuredBucketArn', {
      value: this.securedBucket.bucketArn,
      description: 'ARN of the secured S3 bucket',
    });

    // KMS outputs only for non-LocalStack
    if (this.kmsKey) {
      new cdk.CfnOutput(this, 'KmsKeyArn', {
        value: this.kmsKey.keyArn,
        description: 'ARN of the KMS key for encryption',
      });

      new cdk.CfnOutput(this, 'KmsKeyId', {
        value: this.kmsKey.keyId,
        description: 'ID of the KMS key for encryption',
      });
    }

    new cdk.CfnOutput(this, 'AllowedPrincipals', {
      value: allowedPrincipals.join(','),
      description: 'List of allowed principal ARNs',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'IsLocalStack', {
      value: isLocalStack ? 'true' : 'false',
      description: 'Whether deployed to LocalStack',
    });
  }
}
