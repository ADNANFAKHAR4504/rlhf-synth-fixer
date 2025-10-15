import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export interface GlobalStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  primaryApiEndpoint: string;
  secondaryApiEndpoint: string;
  primaryHealthCheckPath: string;
  primaryBucketName: string;
  secondaryBucketName: string;
  environmentSuffix: string;
}

export class GlobalStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Route53 health checks for primary region API Gateway
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `PrimaryHealthCheck-${props.environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: props.primaryHealthCheckPath,
          fullyQualifiedDomainName: cdk.Fn.select(
            0,
            cdk.Fn.split(
              '/',
              cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
            )
          ),
          port: 443,
          failureThreshold: 3,
          requestInterval: 30,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `primary-api-health-check-${props.environmentSuffix}`,
          },
        ],
      }
    );

    // Import buckets by name to avoid circular dependency
    const primaryBucket = s3.Bucket.fromBucketName(
      this,
      `PrimaryBucket-${props.environmentSuffix}`,
      props.primaryBucketName
    );

    const secondaryBucket = s3.Bucket.fromBucketName(
      this,
      `SecondaryBucket-${props.environmentSuffix}`,
      props.secondaryBucketName
    );

    // Create CloudFront origin access identity for primary bucket
    const primaryOai = new cloudfront.OriginAccessIdentity(
      this,
      `PrimaryOAI-${props.environmentSuffix}`,
      {
        comment: `OAI for primary bucket ${props.primaryBucketName}`,
      }
    );

    // Grant read permissions via bucket policy
    primaryBucket.grantRead(primaryOai);

    // Create CloudFront distribution with S3 origin
    this.cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `CloudfrontDistribution-${props.environmentSuffix}`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(primaryBucket, {
            originAccessIdentity: primaryOai,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(
              cdk.Fn.select(
                0,
                cdk.Fn.split(
                  '/',
                  cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
                )
              ),
              {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                originPath: '/prod',
              }
            ),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      }
    );

    this.distributionId = this.cloudfrontDistribution.distributionId;

    // Deploy website content to primary bucket
    new s3deploy.BucketDeployment(
      this,
      `PrimaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: primaryBucket,
        distribution: this.cloudfrontDistribution,
        distributionPaths: ['/*'],
        memoryLimit: 512,
      }
    );

    // Deploy website content to secondary bucket (for failover)
    new s3deploy.BucketDeployment(
      this,
      `SecondaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: secondaryBucket,
        memoryLimit: 512,
      }
    );

    // Output values
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: this.cloudfrontDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `CloudFrontDomain-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.cloudfrontDistribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `CloudFrontDistributionId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApplicationUrl', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}`,
      description: 'Application URL',
      exportName: `ApplicationUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: primaryHealthCheck.attrHealthCheckId,
      description: 'Primary Health Check ID',
      exportName: `PrimaryHealthCheckId-${props.environmentSuffix}`,
    });
  }
}
