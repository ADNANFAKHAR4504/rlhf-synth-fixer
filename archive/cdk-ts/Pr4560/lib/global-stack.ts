import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

export interface GlobalStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  primaryApiEndpoint: string;
  secondaryApiEndpoint: string;
  primaryHealthCheckPath: string;
  primaryBucketName: string;
  secondaryBucketName: string;
  primaryOaiId: string;
  secondaryOaiId: string;
  webAclArn: string;
  environmentSuffix: string;
  hostedZoneName?: string;
}

export class GlobalStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Route53 health checks for both regions' API Gateways
    new route53.CfnHealthCheck(
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
      }
    );

    new route53.CfnHealthCheck(
      this,
      `SecondaryHealthCheck-${props.environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: props.primaryHealthCheckPath,
          fullyQualifiedDomainName: cdk.Fn.select(
            0,
            cdk.Fn.split(
              '/',
              cdk.Fn.select(2, cdk.Fn.split('/', props.secondaryApiEndpoint))
            )
          ),
          port: 443,
          failureThreshold: 3,
          requestInterval: 30,
        },
      }
    );

    // Import existing S3 buckets
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

    // Import CloudFront OAIs
    const primaryOai =
      cloudfront.OriginAccessIdentity.fromOriginAccessIdentityId(
        this,
        `PrimaryOAI-${props.environmentSuffix}`,
        props.primaryOaiId
      );

    const secondaryOai =
      cloudfront.OriginAccessIdentity.fromOriginAccessIdentityId(
        this,
        `SecondaryOAI-${props.environmentSuffix}`,
        props.secondaryOaiId
      );

    // Create S3 origins
    const primaryS3Origin = new origins.S3Origin(primaryBucket, {
      originAccessIdentity: primaryOai,
    });

    new origins.S3Origin(secondaryBucket, {
      originAccessIdentity: secondaryOai,
    });

    // Hosted Zone setup
    const zoneName =
      props.hostedZoneName || `payment-gateway-${props.environmentSuffix}.com`;

    new route53.PublicHostedZone(
      this,
      `PaymentsHostedZone-${props.environmentSuffix}`,
      {
        zoneName: zoneName,
      }
    );

    // Extract API Gateway domain
    const primaryApiOriginDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
      )
    );

    // === 🧠 Lambda@Edge to rewrite /api/* → /prod/<rest-of-path> ===
    const apiRewriteLambda = new cloudfront.experimental.EdgeFunction(
      this,
      `ApiPathRewriteLambda-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            const request = event.Records[0].cf.request;
            if (request.uri.startsWith('/api/')) {
              // Strip /api and prepend /prod
              request.uri = '/prod' + request.uri.replace(/^\\/api/, '');
            }
            return request;
          };
        `),
      }
    );

    // === CloudFront API Origin ===
    const apiOrigin = new origins.HttpOrigin(primaryApiOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // === CloudFront Distribution ===
    this.cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `CloudfrontDistribution-${props.environmentSuffix}`,
      {
        defaultBehavior: {
          origin: primaryS3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },

        additionalBehaviors: {
          // ✅ FIXED: removed leading slash
          'api/*': {
            origin: apiOrigin,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy:
              cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            edgeLambdas: [
              {
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                functionVersion: apiRewriteLambda.currentVersion,
              },
            ],
          },
        },

        defaultRootObject: 'index.html',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        webAclId: props.webAclArn,
      }
    );

    this.distributionId = this.cloudfrontDistribution.distributionId;

    // === Deploy S3 content ===
    new s3deploy.BucketDeployment(
      this,
      `PrimaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: primaryBucket,
        distribution: this.cloudfrontDistribution,
        distributionPaths: ['/*'],
      }
    );

    new s3deploy.BucketDeployment(
      this,
      `SecondaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: secondaryBucket,
      }
    );

    // === Outputs ===
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: this.cloudfrontDistribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'CloudFrontApiUrl', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}/api`,
    });

    new cdk.CfnOutput(this, 'CloudFrontHealthEndpoint', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}/api/health`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', { value: props.webAclArn });
  }
}
