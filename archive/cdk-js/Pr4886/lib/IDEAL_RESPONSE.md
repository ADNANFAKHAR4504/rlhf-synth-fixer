# AWS CDK News Platform Infrastructure

I'll help you create a comprehensive AWS CDK stack for a news platform that can deliver 5,000 daily articles with low latency and HTTPS. This solution will use CloudFront for global distribution, S3 for content storage, and include monitoring and security features.

## Implementation

```javascript
import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // ========================================================================
    // PARAMETERS & CONFIGURATION
    // ========================================================================

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const region = this.region;

    // Domain configuration
    const domainName = this.node.tryGetContext('domainName') || '';
    const certificateArn = this.node.tryGetContext('certificateArn') || '';
    const createHostedZone =
      this.node.tryGetContext('createHostedZone') === 'true' || false;

    // CloudFront configuration
    const priceClass =
      this.node.tryGetContext('priceClass') || 'PriceClass_100';
    const cacheTtlSeconds =
      Number(this.node.tryGetContext('cacheTtlSeconds')) || 3600;
    const maxTtlSeconds =
      Number(this.node.tryGetContext('maxTtlSeconds')) || 86400;

    // ========================================================================
    // S3 LOGGING BUCKET
    // ========================================================================

    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `news-platform-logs-${environmentSuffix}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    // Grant CloudFront access to write logs
    loggingBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${loggingBucket.bucketArn}/*`],
      })
    );

    cdk.Tags.of(loggingBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(loggingBucket).add('Purpose', 'CloudFront and Access Logs');

    // ========================================================================
    // S3 CONTENT BUCKET
    // ========================================================================

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `news-platform-content-${environmentSuffix}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 's3-access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    cdk.Tags.of(contentBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(contentBucket).add('Purpose', 'Article Content Storage');

    // ========================================================================
    // ORIGIN ACCESS CONTROL (OAC) - Secure S3 access from CloudFront
    // ========================================================================

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // Grant CloudFront OAC access to content bucket
    contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipalReadOnly',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${contentBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': this.account,
          },
        },
      })
    );

    // ========================================================================
    // CLOUDFRONT CACHE POLICY
    // ========================================================================

    const cachePolicy = new cloudfront.CachePolicy(this, 'ArticleCachePolicy', {
      cachePolicyName: `news-platform-cache-policy-${environmentSuffix}`,
      comment: 'Cache policy for static article content',
      defaultTtl: cdk.Duration.seconds(cacheTtlSeconds),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(maxTtlSeconds),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // ========================================================================
    // CLOUDFRONT ORIGIN REQUEST POLICY
    // ========================================================================

    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      'OriginRequestPolicy',
      {
        originRequestPolicyName: `news-platform-origin-policy-${environmentSuffix}`,
        comment: 'Origin request policy for S3 content',
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.none(),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.none(),
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
      }
    );

    // ========================================================================
    // ACM CERTIFICATE (if ARN provided)
    // ========================================================================

    let certificate;
    if (certificateArn && domainName) {
      certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        certificateArn
      );
    }

    // ========================================================================
    // CLOUDFRONT DISTRIBUTION
    // ========================================================================

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `News Platform Distribution - ${environmentSuffix}`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(contentBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cachePolicy,
        originRequestPolicy: originRequestPolicy,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass[priceClass],
      enableLogging: true,
      logBucket: loggingBucket,
      logFilePrefix: 'cloudfront-logs/',
      logIncludesCookies: false,
      certificate: certificate,
      domainNames: certificate && domainName ? [domainName] : undefined,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    cdk.Tags.of(distribution).add('Environment', environmentSuffix);

    // ========================================================================
    // ROUTE 53 (Optional)
    // ========================================================================

    let hostedZone;
    if (domainName) {
      if (createHostedZone) {
        // Create new hosted zone
        hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
          zoneName: domainName,
          comment: `Hosted zone for ${domainName} - ${environmentSuffix}`,
        });

        cdk.Tags.of(hostedZone).add('Environment', environmentSuffix);

        new cdk.CfnOutput(this, 'HostedZoneId', {
          value: hostedZone.hostedZoneId,
          description: 'Route 53 Hosted Zone ID',
        });

        new cdk.CfnOutput(this, 'NameServers', {
          value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers || []),
          description: 'Name servers for the hosted zone',
        });
      } else if (certificateArn) {
        // Import existing hosted zone by domain name
        hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
          domainName: domainName,
        });
      }

      // Create A and AAAA records if we have a hosted zone
      if (hostedZone && certificate) {
        new route53.ARecord(this, 'AliasRecord', {
          zone: hostedZone,
          recordName: domainName,
          target: route53.RecordTarget.fromAlias(
            new targets.CloudFrontTarget(distribution)
          ),
        });

        new route53.AaaaRecord(this, 'AliasRecordAAAA', {
          zone: hostedZone,
          recordName: domainName,
          target: route53.RecordTarget.fromAlias(
            new targets.CloudFrontTarget(distribution)
          ),
        });
      }
    }

    // ========================================================================
    // CLOUDWATCH METRICS & ALARMS
    // ========================================================================

    // CloudFront Metrics
    const requestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'Requests',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const errorRate4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const errorRate5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const cacheHitRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'CacheHitRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const originLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'OriginLatency',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // High 4xx Error Rate Alarm
    const alarm4xx = new cloudwatch.Alarm(this, 'High4xxErrorRate', {
      alarmName: `news-platform-high-4xx-${environmentSuffix}-${region}`,
      alarmDescription: 'Alert when 4xx error rate exceeds 5%',
      metric: errorRate4xxMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cdk.Tags.of(alarm4xx).add('Environment', environmentSuffix);

    // High 5xx Error Rate Alarm
    const alarm5xx = new cloudwatch.Alarm(this, 'High5xxErrorRate', {
      alarmName: `news-platform-high-5xx-${environmentSuffix}-${region}`,
      alarmDescription: 'Alert when 5xx error rate exceeds 1%',
      metric: errorRate5xxMetric,
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cdk.Tags.of(alarm5xx).add('Environment', environmentSuffix);

    // Low Cache Hit Rate Alarm
    const alarmCacheHit = new cloudwatch.Alarm(this, 'LowCacheHitRate', {
      alarmName: `news-platform-low-cache-hit-${environmentSuffix}-${region}`,
      alarmDescription: 'Alert when cache hit rate falls below 80%',
      metric: cacheHitRateMetric,
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cdk.Tags.of(alarmCacheHit).add('Environment', environmentSuffix);

    // High Origin Latency Alarm
    const alarmLatency = new cloudwatch.Alarm(this, 'HighOriginLatency', {
      alarmName: `news-platform-high-latency-${environmentSuffix}-${region}`,
      alarmDescription: 'Alert when origin latency exceeds 1000ms',
      metric: originLatencyMetric,
      threshold: 1000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cdk.Tags.of(alarmLatency).add('Environment', environmentSuffix);

    // ========================================================================
    // CLOUDWATCH DASHBOARD
    // ========================================================================

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `news-platform-${environmentSuffix}-${region}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [requestsMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Cache Hit Rate (%)',
        left: [cacheHitRateMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100,
        },
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error Rates (%)',
        left: [errorRate4xxMetric, errorRate5xxMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Origin Latency (ms)',
        left: [originLatencyMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        alarms: [alarm4xx, alarm5xx, alarmCacheHit, alarmLatency],
        width: 24,
        height: 4,
      })
    );

    // ========================================================================
    // IAM ROLE FOR CI/CD INVALIDATION
    // ========================================================================

    const invalidationRole = new iam.Role(this, 'InvalidationRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        // Allow assumption by other AWS accounts if needed
        new iam.AccountPrincipal(this.account)
      ),
      description: `Role for CI/CD to invalidate CloudFront cache - ${environmentSuffix}`,
      maxSessionDuration: cdk.Duration.hours(1),
    });

    invalidationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontInvalidation',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetInvalidation',
          'cloudfront:ListInvalidations',
        ],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        ],
      })
    );

    invalidationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3ContentUpload',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:GetObject',
          's3:ListBucket',
          's3:DeleteObject',
        ],
        resources: [contentBucket.bucketArn, `${contentBucket.bucketArn}/*`],
      })
    );

    cdk.Tags.of(invalidationRole).add('Environment', environmentSuffix);
    cdk.Tags.of(invalidationRole).add('Purpose', 'CI/CD Invalidation');

    // ========================================================================
    // OUTPUTS
    // ========================================================================

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
      description: 'S3 bucket for article content',
      exportName: `ContentBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucketName,
      description: 'S3 bucket for logs',
      exportName: `LoggingBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `DistributionId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `DistributionDomain-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'InvalidationRoleArn', {
      value: invalidationRole.roleArn,
      description: 'IAM Role ARN for CI/CD invalidation tasks',
      exportName: `InvalidationRole-${environmentSuffix}`,
    });

    if (domainName && certificate) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${domainName}`,
        description: 'Custom domain URL',
      });
    }

    // ========================================================================
    // HELPFUL INFORMATION OUTPUT
    // ========================================================================

    new cdk.CfnOutput(this, 'DeploymentInstructions', {
      value: JSON.stringify({
        uploadContent: `aws s3 sync ./articles s3://${contentBucket.bucketName}/`,
        invalidateCache: `aws cloudfront create-invalidation --distribution-id ${distribution.distributionId} --paths "/*"`,
        viewDashboard: `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`,
      }),
      description: 'Deployment commands (JSON format)',
    });
  }
}

export { TapStack };
```

## Key Features

1. **S3 Content Bucket**: Secure storage for article content with versioning and blocked public access
2. **S3 Logging Bucket**: Dedicated bucket for CloudFront and access logs with lifecycle management
3. **CloudFront Distribution**: Global CDN with HTTPS, custom caching policies, and error handling
4. **Origin Access Control (OAC)**: Secure access to S3 from CloudFront using modern OAC instead of OAI
5. **ACM Certificate Integration**: Support for custom domains with TLS certificates
6. **Route 53**: Optional DNS configuration with A/AAAA records
7. **CloudWatch Monitoring**: Comprehensive metrics, alarms, and dashboard for monitoring
8. **IAM Roles**: Least-privilege roles for CI/CD invalidation tasks

## Configuration Parameters

The stack accepts several configuration parameters through CDK context:
- `environmentSuffix`: Environment identifier (dev/stage/prod)
- `domainName`: Custom domain for the distribution
- `certificateArn`: ARN of existing ACM certificate
- `createHostedZone`: Whether to create a new Route 53 hosted zone
- `priceClass`: CloudFront price class for edge location coverage
- `cacheTtlSeconds`: Default cache TTL for articles
- `maxTtlSeconds`: Maximum cache TTL

## Deployment

Deploy the stack with:
```bash
cdk deploy --context environmentSuffix=prod --context domainName=news.example.com
```

## Quality Improvements

This ideal response includes several improvements over the original:
1. **Proper Environment Suffix Handling**: Added fallback to `process.env.ENVIRONMENT_SUFFIX` for better CI/CD integration
2. **Resource Naming**: Fixed the order of environment suffix in resource names for consistency (`${environmentSuffix}-${region}` instead of `${region}-${environmentSuffix}`)
3. **Resource Cleanup**: Changed removal policies to `DESTROY` to ensure resources can be cleaned up properly during testing
4. **Consistent Naming**: Applied consistent naming patterns across all resources and alarms