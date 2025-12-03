import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly invalidationCommand: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Centralized tagging strategy (Requirement 6)
    const centralTags = pulumi.output(args.tags || {}).apply(tags => ({
      ...tags,
      environment: environmentSuffix,
      team: 'platform',
      costCenter: 'engineering',
    }));

    // Get region from Pulumi config (Requirement 7 - Region-agnostic)
    const config = new pulumi.Config('aws');
    // Region is used for documentation purposes and Lambda@Edge region enforcement
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _region =
      config.get('region') || process.env.AWS_REGION || 'us-east-1';

    // S3 Bucket Consolidation (Requirement 1)
    // Add timestamp to ensure uniqueness and avoid conflicts
    const bucketSuffix = `${environmentSuffix}-${Date.now()}`;
    const contentBucket = new aws.s3.Bucket(
      `content-bucket-${environmentSuffix}`,
      {
        bucket: `content-bucket-${bucketSuffix}`,
        tags: centralTags,
        forceDestroy: true, // Requirement: Destroyability
      },
      { parent: this }
    );

    // Intelligent tiering lifecycle rule (Requirement 1)
    // Note: lifecycleRule is applied automatically once created
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _lifecycleRule = new aws.s3.BucketLifecycleConfiguration(
      `bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: contentBucket.id,
        rules: [
          {
            id: 'intelligent-tiering-rule',
            status: 'Enabled',
            transitions: [
              {
                days: 0,
                storageClass: 'INTELLIGENT_TIERING',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    const blockPublicAccess = new aws.s3.BucketPublicAccessBlock(
      `bucket-public-access-${environmentSuffix}`,
      {
        bucket: contentBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Origin Access Identity (Requirement 4 - Security)
    const oai = new aws.cloudfront.OriginAccessIdentity(
      `cloudfront-oai-${environmentSuffix}`,
      {
        comment: `OAI for content bucket ${environmentSuffix}`,
      },
      { parent: this }
    );

    // S3 Bucket Policy - Restrict to CloudFront only (Requirement 4)
    const bucketPolicy = new aws.s3.BucketPolicy(
      `bucket-policy-${environmentSuffix}`,
      {
        bucket: contentBucket.id,
        policy: pulumi
          .all([contentBucket.arn, oai.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontOAI',
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      {
        parent: this,
        dependsOn: [blockPublicAccess],
      }
    );

    // Lambda@Edge functions (Requirement 5 - Optimized from 4 to 2)
    // Use us-east-1 provider for Lambda@Edge (Requirement: Lambda@Edge must be in us-east-1)
    const usEast1Provider = new aws.Provider(
      `us-east-1-provider-${environmentSuffix}`,
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // IAM role for Lambda@Edge
    const lambdaRole = new aws.iam.Role(
      `lambda-edge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
              },
            },
          ],
        }),
        tags: centralTags,
      },
      { parent: this, provider: usEast1Provider }
    );

    // Policy attachment is implicit once created
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _lambdaPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-edge-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this, provider: usEast1Provider }
    );

    // Viewer Request Lambda@Edge (combines viewer logic)
    const viewerRequestFunction = new aws.lambda.Function(
      `viewer-request-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Add security headers
  request.headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
  request.headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];

  // Normalize URI - remove trailing slashes
  if (request.uri.endsWith('/') && request.uri.length > 1) {
    request.uri = request.uri.slice(0, -1);
  }

  return request;
};
        `),
        }),
        publish: true,
        tags: centralTags,
      },
      { parent: this, provider: usEast1Provider }
    );

    // Origin Request Lambda@Edge (combines origin logic)
    const originRequestFunction = new aws.lambda.Function(
      `origin-request-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Add default index document
  if (request.uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!request.uri.includes('.')) {
    request.uri += '/index.html';
  }

  // Add origin custom headers
  request.headers['x-origin-verify'] = [{ key: 'X-Origin-Verify', value: 'true' }];

  return request;
};
        `),
        }),
        publish: true,
        tags: centralTags,
      },
      { parent: this, provider: usEast1Provider }
    );

    // Use AWS Managed Cache Policies instead of custom ones to avoid naming conflicts
    // AWS Managed Cache Policy IDs (Requirement 3)
    // Managed-CachingOptimized: Optimized for static content with compression
    const managedCachePolicyId = '658327ea-f89d-4fab-a63d-7e88639e58f6';

    // CloudFront Distribution Consolidation (Requirement 2)
    // Price Class Optimization (Requirement 8)
    const distribution = new aws.cloudfront.Distribution(
      `cdn-distribution-${environmentSuffix}`,
      {
        enabled: true,
        priceClass: 'PriceClass_100', // Requirement 8
        comment: `Optimized content delivery for ${environmentSuffix}`,
        tags: centralTags,

        // Single origin pointing to consolidated S3 bucket
        origins: [
          {
            originId: 'S3-content-origin',
            domainName: contentBucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: oai.cloudfrontAccessIdentityPath,
            },
          },
        ],

        // Default cache behavior
        defaultCacheBehavior: {
          targetOriginId: 'S3-content-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          // Use AWS managed cache policy for caching optimized content
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
          lambdaFunctionAssociations: [
            {
              eventType: 'viewer-request',
              lambdaArn: viewerRequestFunction.qualifiedArn,
              includeBody: false,
            },
            {
              eventType: 'origin-request',
              lambdaArn: originRequestFunction.qualifiedArn,
              includeBody: false,
            },
          ],
        },

        // Cache behaviors for different file types (Requirement 3)
        // Using AWS Managed CachingOptimized policy for all static content
        orderedCacheBehaviors: [
          {
            pathPattern: '*.jpg',
            targetOriginId: 'S3-content-origin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            cachePolicyId: managedCachePolicyId,
          },
          {
            pathPattern: '*.png',
            targetOriginId: 'S3-content-origin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            cachePolicyId: managedCachePolicyId,
          },
          {
            pathPattern: '*.css',
            targetOriginId: 'S3-content-origin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            cachePolicyId: managedCachePolicyId,
          },
          {
            pathPattern: '*.js',
            targetOriginId: 'S3-content-origin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            cachePolicyId: managedCachePolicyId,
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // Stack Outputs (Requirement 9)
    this.distributionUrl = pulumi.interpolate`https://${distribution.domainName}`;
    this.bucketName = contentBucket.id;
    this.invalidationCommand = pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${distribution.id} --paths "/*"`;

    this.registerOutputs({
      distributionUrl: this.distributionUrl,
      bucketName: this.bucketName,
      invalidationCommand: this.invalidationCommand,
    });
  }
}
