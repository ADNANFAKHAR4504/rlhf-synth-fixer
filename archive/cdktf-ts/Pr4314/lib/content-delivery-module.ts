import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface ContentDeliveryModuleProps {
  environmentSuffix: string;
}

export class ContentDeliveryModule extends Construct {
  public readonly contentBucket: S3Bucket;
  public readonly artifactBucket: S3Bucket;
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, props: ContentDeliveryModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for educational content
    this.contentBucket = new S3Bucket(this, 'content-bucket', {
      bucket: `edu-content-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `edu-content-${environmentSuffix}`,
        Purpose: 'Educational Content Storage',
      },
    });

    // Enable versioning for content bucket
    new S3BucketVersioningA(this, 'content-bucket-versioning', {
      bucket: this.contentBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption for content bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'content-bucket-encryption',
      {
        bucket: this.contentBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access to content bucket
    new S3BucketPublicAccessBlock(this, 'content-bucket-public-access-block', {
      bucket: this.contentBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy for content bucket
    new S3BucketLifecycleConfiguration(this, 'content-bucket-lifecycle', {
      bucket: this.contentBucket.id,
      rule: [
        {
          id: 'archive-old-versions',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          noncurrentVersionTransition: [
            {
              noncurrentDays: 30,
              storageClass: 'GLACIER',
            },
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 90,
            },
          ],
        },
      ],
    });

    // Create S3 bucket for pipeline artifacts
    this.artifactBucket = new S3Bucket(this, 'artifact-bucket', {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `pipeline-artifacts-${environmentSuffix}`,
        Purpose: 'Pipeline Artifacts',
      },
    });

    // Enable versioning for artifact bucket
    new S3BucketVersioningA(this, 'artifact-bucket-versioning', {
      bucket: this.artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption for artifact bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'artifact-bucket-encryption',
      {
        bucket: this.artifactBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access to artifact bucket
    new S3BucketPublicAccessBlock(this, 'artifact-bucket-public-access-block', {
      bucket: this.artifactBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy for artifact bucket
    new S3BucketLifecycleConfiguration(this, 'artifact-bucket-lifecycle', {
      bucket: this.artifactBucket.id,
      rule: [
        {
          id: 'archive-old-artifacts',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          transition: [
            {
              days: 30,
              storageClass: 'GLACIER',
            },
          ],
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // Create CloudFront Origin Access Control
    const oac = new CloudfrontOriginAccessControl(this, 'oac', {
      name: `edu-content-oac-${environmentSuffix}`,
      description: 'Origin Access Control for educational content',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // Create CloudFront distribution
    this.distribution = new CloudfrontDistribution(this, 'distribution', {
      enabled: true,
      comment: `Educational content distribution - ${environmentSuffix}`,
      priceClass: 'PriceClass_100',
      defaultRootObject: 'index.html',

      origin: [
        {
          domainName: this.contentBucket.bucketRegionalDomainName,
          originId: 'S3-edu-content',
          originAccessControlId: oac.id,
        },
      ],

      defaultCacheBehavior: {
        targetOriginId: 'S3-edu-content',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
      },

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      tags: {
        Name: `edu-content-cdn-${environmentSuffix}`,
        Purpose: 'Content Delivery Network',
      },
    });

    // S3 bucket policy to allow CloudFront OAC access
    const bucketPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'content-bucket-policy-doc',
      {
        statement: [
          {
            sid: 'AllowCloudFrontServicePrincipal',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudfront.amazonaws.com'],
              },
            ],
            actions: ['s3:GetObject'],
            resources: [`${this.contentBucket.arn}/*`],
            condition: [
              {
                test: 'StringEquals',
                variable: 'AWS:SourceArn',
                values: [this.distribution.arn],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'content-bucket-policy', {
      bucket: this.contentBucket.id,
      policy: bucketPolicyDoc.json,
    });
  }
}
