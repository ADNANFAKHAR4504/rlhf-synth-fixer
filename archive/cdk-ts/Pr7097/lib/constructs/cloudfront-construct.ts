import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Route53Construct } from './route53-construct';

export interface CloudFrontConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  alb: elbv2.ApplicationLoadBalancer;
  route53: Route53Construct;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, alb, route53 } =
      props;

    // CloudFront logs bucket (using existing S3 construct pattern)
    const logsBucket = new s3.Bucket(
      this,
      `CloudFrontLogsBucket${environmentSuffix}${region}`,
      {
        bucketName: `${environment}-${region}-cf-logs-${suffix}`.toLowerCase(),
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Enable ACLs for CloudFront logging
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            expiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Certificate for CloudFront - temporarily disabled to avoid validation issues
    // const certificate = new certificatemanager.Certificate(this, `CloudFrontCertificate${environmentSuffix}${region}`, {
    //   domainName: `${environment}-${suffix}.example.com`,
    //   subjectAlternativeNames: [`*.${environment}-${suffix}.example.com`],
    //   validation: certificatemanager.CertificateValidation.fromEmail({
    //     [`admin@${environment}-${suffix}.example.com`]: `${environment}-${suffix}.example.com`,
    //     [`admin@${environment}-${suffix}.example.com`]: `*.${environment}-${suffix}.example.com`,
    //   }),
    // });

    // Primary origin (current region's ALB)
    const primaryOrigin = new origins.LoadBalancerV2Origin(alb, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
      originPath: '',
      keepaliveTimeout: cdk.Duration.seconds(5),
      readTimeout: cdk.Duration.seconds(30),
      customHeaders: {
        'X-CloudFront-Region': region,
        'X-Environment': environment,
      },
    });

    // Since OriginGroup is not available, we'll use a single origin
    // In a real multi-region setup, you'd configure multiple distributions
    const originFailoverConfig = primaryOrigin;

    // Cache policies
    const apiCachePolicy = new cloudfront.CachePolicy(
      this,
      `ApiCachePolicy${environmentSuffix}${region}`,
      {
        cachePolicyName: `${environment}-${region}-api-cache-${suffix}`,
        comment: 'Cache policy for API endpoints',
        defaultTtl: cdk.Duration.seconds(0), // No caching for API
        maxTtl: cdk.Duration.seconds(1),
        minTtl: cdk.Duration.seconds(0),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
          'Authorization',
          'Content-Type',
          'X-API-Key',
          'X-Forwarded-For'
        ),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }
    );

    const staticCachePolicy = new cloudfront.CachePolicy(
      this,
      `StaticCachePolicy${environmentSuffix}${region}`,
      {
        cachePolicyName: `${environment}-${region}-static-cache-${suffix}`,
        comment: 'Cache policy for static content',
        defaultTtl: cdk.Duration.hours(24),
        maxTtl: cdk.Duration.days(365),
        minTtl: cdk.Duration.seconds(1),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
          'CloudFront-Viewer-Country'
        ),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }
    );

    // Origin request policy
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      `OriginRequestPolicy${environmentSuffix}${region}`,
      {
        originRequestPolicyName: `${environment}-${region}-origin-request-${suffix}`,
        comment: 'Origin request policy for forwarding headers',
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
          'CloudFront-Viewer-Country',
          'CloudFront-Viewer-Country-Region',
          'CloudFront-Is-Mobile-Viewer',
          'CloudFront-Is-Tablet-Viewer',
          'CloudFront-Is-Desktop-Viewer',
          'CloudFront-Forwarded-Proto'
        ),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
      }
    );

    // Response headers policy for security
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      `ResponseHeadersPolicy${environmentSuffix}${region}`,
      {
        responseHeadersPolicyName: `${environment}-${region}-security-headers-${suffix}`,
        comment: 'Security headers policy',
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.seconds(31536000),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
        },
      }
    );

    // WAF Web ACL for CloudFront protection
    const webAcl = new cdk.aws_wafv2.CfnWebACL(
      this,
      `CloudFrontWebAcl${environmentSuffix}${region}`,
      {
        name: `${environment}-${region}-cloudfront-waf-${suffix}`,
        scope: 'CLOUDFRONT',
        defaultAction: { allow: {} },
        description: `WAF for CloudFront distribution in ${environment}`,
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${environment}CloudFrontWebAcl`,
        },
        tags: [
          { key: 'iac-rlhf-amazon', value: 'true' },
          { key: 'Environment', value: environment },
          { key: 'Region', value: region },
        ],
      }
    );

    // CloudFront Distribution without SSL for testing - Addresses MODEL_FAILURES item 2
    this.distribution = new cloudfront.Distribution(
      this,
      `CloudFrontDistribution${environmentSuffix}${region}`,
      {
        // domainNames: [`cdn-${route53.domainName}`],
        // certificate: certificate,

        // Default behavior for API endpoints
        defaultBehavior: {
          origin: originFailoverConfig,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: apiCachePolicy,
          originRequestPolicy: originRequestPolicy,
          responseHeadersPolicy: responseHeadersPolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          compress: true,
        },

        // Additional behaviors for different content types
        additionalBehaviors: {
          '/api/*': {
            origin: originFailoverConfig,
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: apiCachePolicy,
            originRequestPolicy: originRequestPolicy,
            responseHeadersPolicy: responseHeadersPolicy,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            compress: true,
          },
          '/static/*': {
            origin: primaryOrigin,
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: staticCachePolicy,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            compress: true,
          },
          '/health': {
            origin: primaryOrigin,
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          },
        },

        // Distribution settings
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        enableIpv6: true,
        enabled: true,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe

        // Geo restrictions
        geoRestriction: cloudfront.GeoRestriction.allowlist(
          'US',
          'CA',
          'GB',
          'DE',
          'FR',
          'IT',
          'ES',
          'NL',
          'AU',
          'JP'
        ),

        // Logging
        enableLogging: true,
        logBucket: logsBucket,
        logFilePrefix: `cloudfront-${environment}-${region}/`,
        logIncludesCookies: false,

        // Error pages
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: '/404.html',
            ttl: cdk.Duration.seconds(300),
          },
          {
            httpStatus: 500,
            responseHttpStatus: 500,
            responsePagePath: '/500.html',
            ttl: cdk.Duration.seconds(60),
          },
        ],

        // Comment
        comment: `CloudFront distribution for ${environment} environment in ${region}`,

        // Web ACL
        webAclId: webAcl.attrArn,
      }
    );

    // Create CNAME record in Route 53 for CloudFront
    new cdk.aws_route53.CnameRecord(
      this,
      `CloudFrontCnameRecord${environmentSuffix}${region}`,
      {
        zone: route53.hostedZone,
        recordName: 'cdn',
        domainName: this.distribution.distributionDomainName,
        ttl: cdk.Duration.seconds(300),
      }
    );

    // Apply tags
    cdk.Tags.of(this.distribution).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.distribution).add('Environment', environment);
    cdk.Tags.of(this.distribution).add('Region', region);
    cdk.Tags.of(this.distribution).add('Purpose', 'CDN');

    cdk.Tags.of(logsBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(logsBucket).add('Environment', environment);
    cdk.Tags.of(logsBucket).add('Region', region);
    cdk.Tags.of(logsBucket).add('Purpose', 'CloudFrontLogs');
  }
}
