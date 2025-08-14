import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export interface S3SecurityPoliciesStackProps extends cdk.StackProps {
  readonly bucketName: string;
  readonly kmsKeyArn: string;
  readonly allowedPrincipals: string[];
  readonly cloudTrailLogBucket?: string;
}

export class TapStack extends cdk.Stack {
  public readonly securedBucket: s3.IBucket;
  public readonly cloudTrail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: S3SecurityPoliciesStackProps) {
    super(scope, id, props);

    // Reference existing S3 bucket
    this.securedBucket = s3.Bucket.fromBucketName(
      this,
      'ExistingBucket',
      props.bucketName
    );

    // Extract KMS key ID from ARN for policy conditions
    const kmsKeyId = this.extractKmsKeyId(props.kmsKeyArn);

    // Create comprehensive bucket policy with deny statements
    const bucketPolicy = new s3.BucketPolicy(this, 'SecureBucketPolicy', {
      bucket: this.securedBucket,
    });

    // Bucket-level denies
    bucketPolicy.document.addStatements(
      // Deny non-TLS requests
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false'
          }
        }
      }),

      // Deny access to unauthorized principals
      new iam.PolicyStatement({
        sid: 'DenyUnauthorizedPrincipals',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetBucketLocation',
          's3:ListBucket'
        ],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          StringNotLike: {
            'aws:PrincipalArn': [
              ...props.allowedPrincipals,
              // Allow CloudTrail service
              'arn:aws:iam::*:role/aws-service-role/cloudtrail.amazonaws.com/*'
            ]
          }
        }
      })
    );

    // Object-level denies for encryption
    bucketPolicy.document.addStatements(
      // Deny uploads without SSE-KMS
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      }),

      // Deny uploads with wrong KMS key (supports both key ID and ARN)
      new iam.PolicyStatement({
        sid: 'DenyWrongKMSKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': [
              props.kmsKeyArn,
              kmsKeyId
            ]
          },
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      })
    );

    // Create CloudTrail for S3 data events
    const trailLogBucket = props.cloudTrailLogBucket 
      ? s3.Bucket.fromBucketName(this, 'CloudTrailLogBucket', props.cloudTrailLogBucket)
      : new s3.Bucket(this, 'CloudTrailLogBucket', {
          bucketName: `${props.bucketName}-cloudtrail-logs-${this.account}`,
          encryption: s3.BucketEncryption.S3_MANAGED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          enforceSSL: true,
          versioned: true,
          lifecycleRules: [{
            id: 'DeleteOldLogs',
            expiration: cdk.Duration.days(90)
          }]
        });

    this.cloudTrail = new cloudtrail.Trail(this, 'S3DataEventsTrail', {
      trailName: `${props.bucketName}-data-events-trail`,
      bucket: trailLogBucket,
      includeGlobalServiceEvents: false,
      isMultiRegionTrail: false,
      enableFileValidation: true
    });

    // Add S3 data events for the secured bucket
    this.cloudTrail.addS3EventSelector([{
      bucket: this.securedBucket,
      objectPrefix: '',
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false
    });

    // Outputs for reusability
    new cdk.CfnOutput(this, 'SecuredBucketName', {
      value: this.securedBucket.bucketName,
      description: 'Name of the secured S3 bucket'
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: this.cloudTrail.trailArn,
      description: 'ARN of the CloudTrail monitoring S3 data events'
    });

    new cdk.CfnOutput(this, 'CloudTrailLogBucketName', {
      value: trailLogBucket.bucketName,
      description: 'Name of the CloudTrail log bucket'
    });
  }

  private extractKmsKeyId(kmsKeyArn: string): string {
    // Extract key ID from ARN format: arn:aws:kms:region:account:key/key-id
    const parts = kmsKeyArn.split('/');
    return parts[parts.length - 1];
  }
}