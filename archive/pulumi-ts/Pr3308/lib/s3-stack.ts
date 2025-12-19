import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    // Create S3 bucket for static assets
    const staticBucket = new aws.s3.Bucket(
      `${name}-static-${args.environmentSuffix}`,
      {
        acl: 'private',
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            noncurrentVersionExpiration: {
              days: 90,
            },
          },
          {
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: {
          Name: `${name}-static-${args.environmentSuffix}`,
          Purpose: 'Static Assets',
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${name}-static-pab-${args.environmentSuffix}`,
      {
        bucket: staticBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create bucket policy for ALB/CloudFront access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketPolicy = new aws.s3.BucketPolicy(
      `${name}-static-policy-${args.environmentSuffix}`,
      {
        bucket: staticBucket.id,
        policy: pulumi
          .all([staticBucket.arn, aws.getCallerIdentity()])
          .apply(([bucketArn, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontOAI',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com',
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      'AWS:SourceAccount': identity.accountId,
                    },
                  },
                },
                {
                  Sid: 'AllowALBAccess',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'elasticloadbalancing.amazonaws.com',
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.bucketName = staticBucket.bucket;
    this.bucketArn = staticBucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
