import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly logsBucketDomainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:storage:StorageStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create logs bucket for CloudFront
    const logsBucket = new aws.s3.Bucket(
      `software-dist-logs-${environmentSuffix}`,
      {
        acl: 'private',
        lifecycleRules: [
          {
            enabled: true,
            expiration: { days: 30 },
          },
        ],
        tags,
      },
      { parent: this }
    );

    // Create main storage bucket with intelligent tiering
    const storageBucket = new aws.s3.Bucket(
      `software-dist-binaries-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 0,
                storageClass: 'INTELLIGENT_TIERING',
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
        tags,
      },
      { parent: this }
    );

    // Configure bucket public access block
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `software-dist-pab-${environmentSuffix}`,
      {
        bucket: storageBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create Origin Access Control for CloudFront
    const oac = new aws.cloudfront.OriginAccessControl(
      `software-dist-oac-${environmentSuffix}`,
      {
        description: 'OAC for Software Distribution',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
      { parent: this }
    );

    // Bucket policy to allow only CloudFront access
    new aws.s3.BucketPolicy(
      `software-dist-policy-${environmentSuffix}`,
      {
        bucket: storageBucket.id,
        policy: pulumi
          .all([storageBucket.arn, oac.id])
          .apply(([bucketArn, _oacId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontServicePrincipal',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com',
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      'AWS:SourceAccount': pulumi.output(
                        aws.getCallerIdentity()
                      ).accountId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this, dependsOn: [bucketPublicAccessBlock] }
    );

    this.bucketId = storageBucket.id;
    this.bucketArn = storageBucket.arn;
    this.bucketName = storageBucket.bucket;
    this.bucketDomainName = storageBucket.bucketDomainName;
    this.logsBucketDomainName = logsBucket.bucketDomainName;

    this.registerOutputs({
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
      bucketName: this.bucketName,
    });
  }
}
