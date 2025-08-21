import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
  s3AccessRole: iam.Role;
}

export class StorageStack extends cdk.NestedStack {
  public readonly contentBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for web content with encryption
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      // Let CloudFormation generate a unique bucket name automatically
      // This prevents naming conflicts and ensures uniqueness
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Make bucket deletable when stack is deleted
      autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // S3 bucket policy for restricted access
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RestrictToSpecificRole',
        effect: iam.Effect.ALLOW,
        principals: [props.s3AccessRole],
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [this.contentBucket.arnForObjects('*')],
      })
    );

    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.contentBucket.bucketArn,
          this.contentBucket.arnForObjects('*'),
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Origin Access Control for CloudFront
    new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: `webapp-oac-${props.environmentSuffix}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Distribution with S3 origin
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `WebApp CDN ${props.environmentSuffix}`,
      defaultBehavior: {
        origin: new origins.S3Origin(this.contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logBucket: this.contentBucket,
      logFilePrefix: 'cloudfront-logs/',
    });

    // Update S3 bucket policy for CloudFront OAC
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.contentBucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Allow CloudFront to write access logs
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontLogs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [this.contentBucket.arnForObjects('cloudfront-logs/*')],
      })
    );

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Storage');
  }
}
