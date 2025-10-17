import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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
  // Optional: Provide existing hosted zone name if available
  hostedZoneName?: string;
}

export class GlobalStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Route53 health checks for both regions' API Gateways
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

    const secondaryHealthCheck = new route53.CfnHealthCheck(
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
        healthCheckTags: [
          {
            key: 'Name',
            value: `secondary-api-health-check-${props.environmentSuffix}`,
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

    // Import CloudFront OAIs from Regional stacks
    // Regional stacks create the OAIs and manage bucket policies to avoid conflicts
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

    // Create S3 origins for automatic failover
    const primaryS3Origin = new origins.S3Origin(primaryBucket, {
      originAccessIdentity: primaryOai,
    });

    new origins.S3Origin(secondaryBucket, {
      originAccessIdentity: secondaryOai,
    });

    // Create or import Route 53 Hosted Zone for DNS failover
    // Using a clean domain name pattern: payment-gateway-{env}.com
    const zoneName =
      props.hostedZoneName || `payment-gateway-${props.environmentSuffix}.com`;

    const hostedZone = new route53.PublicHostedZone(
      this,
      `PaymentsHostedZone-${props.environmentSuffix}`,
      {
        zoneName: zoneName,
        comment: `Hosted zone for Global Payments Gateway (${props.environmentSuffix})`,
      }
    );

    // Extract API Gateway REST API IDs and regions from endpoints
    // Endpoint format: https://{restApiId}.execute-api.{region}.amazonaws.com/prod/
    const primaryApiDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
      )
    );

    const secondaryApiDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.secondaryApiEndpoint))
      )
    );

    // Extract REST API IDs
    const primaryApiId = cdk.Fn.select(0, cdk.Fn.split('.', primaryApiDomain));
    const secondaryApiId = cdk.Fn.select(
      0,
      cdk.Fn.split('.', secondaryApiDomain)
    );

    // Import API Gateways by ID for Route 53 alias targets
    apigateway.RestApi.fromRestApiId(
      this,
      `PrimaryApi-${props.environmentSuffix}`,
      primaryApiId
    );

    apigateway.RestApi.fromRestApiId(
      this,
      `SecondaryApi-${props.environmentSuffix}`,
      secondaryApiId
    );

    // Create Route 53 failover CNAME records for API Gateway
    // Using CNAME instead of Alias because default API Gateway endpoints don't support Alias records
    // PRIMARY record - points to us-east-1 API Gateway
    new route53.CfnRecordSet(
      this,
      `PrimaryApiFailoverRecord-${props.environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `api.${zoneName}`,
        type: 'CNAME',
        ttl: '60', // 60 seconds TTL for faster failover
        setIdentifier: 'primary-api',
        failover: 'PRIMARY',
        healthCheckId: primaryHealthCheck.attrHealthCheckId,
        resourceRecords: [primaryApiDomain],
      }
    );

    // SECONDARY record - points to us-east-2 API Gateway
    new route53.CfnRecordSet(
      this,
      `SecondaryApiFailoverRecord-${props.environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `api.${zoneName}`,
        type: 'CNAME',
        ttl: '60', // 60 seconds TTL for faster failover
        setIdentifier: 'secondary-api',
        failover: 'SECONDARY',
        healthCheckId: secondaryHealthCheck.attrHealthCheckId,
        resourceRecords: [secondaryApiDomain],
      }
    );

    // CloudFront API origin using direct API Gateway endpoints
    // Extract the domain from the primary API endpoint (format: https://xxx.execute-api.region.amazonaws.com/prod/)
    const primaryApiOriginDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
      )
    );

    // Create API Gateway origin with /prod origin path
    // CloudFront /api/* paths will be forwarded to API Gateway as /prod/api/*
    // API Gateway now has /api/health and /api/transfer routes
    const apiOrigin = new origins.HttpOrigin(primaryApiOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      originPath: '/prod',
    });

    // Create CloudFront distribution
    // For testing: Uses direct API Gateway endpoint (primary region)
    // For production: Configure to use Route 53 DNS failover (api.${zoneName})
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
          '/api/*': {
            origin: apiOrigin, // Uses primary API Gateway with /prod origin path
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        defaultRootObject: 'index.html',
        // Note: Error responses removed because they interfere with API Gateway responses
        // CloudFront error responses apply to ALL origins, including API Gateway
        // When API Gateway returns 403/404, we want to pass that to the client, not serve index.html
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        webAclId: props.webAclArn,
      }
    );

    // Route 53 DNS-based failover is configured for production use:
    // 1. Route 53 health checks monitor us-east-1 API Gateway every 30s
    // 2. If 3 consecutive failures, Route 53 updates DNS (api.${zoneName}) to point to us-east-2
    // 3. Manual failover available by updating CloudFront origin to use Route 53 DNS
    // 4. For testing without domain registration, CloudFront uses direct API Gateway endpoint

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

    // Output values for integration testing
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
      description: 'Global Application URL (for E2E testing)',
      exportName: `ApplicationUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontApiUrl', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}/api`,
      description: 'CloudFront API base URL',
      exportName: `CloudFrontApiUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontTransferEndpoint', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}/api/transfer`,
      description: 'CloudFront /transfer endpoint (for E2E testing)',
      exportName: `CloudFrontTransferEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontHealthEndpoint', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}/api/health`,
      description: 'CloudFront /health endpoint (for region detection)',
      exportName: `CloudFrontHealthEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: primaryHealthCheck.attrHealthCheckId,
      description: 'Primary Health Check ID (us-east-1)',
      exportName: `PrimaryHealthCheckId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryHealthCheckId', {
      value: secondaryHealthCheck.attrHealthCheckId,
      description: 'Secondary Health Check ID (us-east-2)',
      exportName: `SecondaryHealthCheckId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `HostedZoneId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: zoneName,
      description: 'Route 53 Hosted Zone Name',
      exportName: `HostedZoneName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiFailoverDnsName', {
      value: `api.${zoneName}`,
      description: 'Route 53 DNS name for API Gateway failover (for testing)',
      exportName: `ApiFailoverDnsName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiFailoverUrl', {
      value: `https://api.${zoneName}/prod`,
      description: 'Route 53 failover API base URL',
      exportName: `ApiFailoverUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(',', hostedZone.hostedZoneNameServers!),
      description: 'Name servers for the hosted zone (for DNS delegation)',
    });

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: props.primaryRegion,
      description: 'Primary region (us-east-1)',
      exportName: `PrimaryRegion-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: props.secondaryRegion,
      description: 'Secondary region (us-east-2)',
      exportName: `SecondaryRegion-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryBucketName', {
      value: props.primaryBucketName,
      description: 'Primary S3 bucket name',
      exportName: `PrimaryBucketName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryBucketName', {
      value: props.secondaryBucketName,
      description: 'Secondary S3 bucket name',
      exportName: `SecondaryBucketName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: props.webAclArn,
      description: 'WAF Web ACL ARN attached to CloudFront',
      exportName: `CloudFrontWebAclArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FailoverStrategy', {
      value: 'Route 53 DNS-based failover with health checks',
      description: 'Failover strategy description',
    });

    new cdk.CfnOutput(this, 'HealthCheckInterval', {
      value: '30 seconds',
      description: 'Health check interval',
    });

    new cdk.CfnOutput(this, 'FailoverThreshold', {
      value: '3 failures',
      description: 'Failover threshold',
    });

    new cdk.CfnOutput(this, 'DNSTTL', {
      value: '60 seconds',
      description: 'DNS TTL for failover records',
    });
  }
}
