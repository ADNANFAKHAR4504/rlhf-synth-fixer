import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rum from 'aws-cdk-lib/aws-rum';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StaticWebsiteStackProps extends cdk.StackProps {
  domainName?: string;
  environmentSuffix?: string;
}

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StaticWebsiteStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create S3 bucket for static website content
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `marketing-campaign-website-${environmentSuffix}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create S3 bucket for CloudFront logs
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `marketing-campaign-logs-${environmentSuffix}-${this.account}`,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false, // CloudFront requires ACL access
        blockPublicPolicy: true,
        ignorePublicAcls: false,
        restrictPublicBuckets: true,
      }),
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Required for CloudFront logging
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'transition-and-delete-logs',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
          expiration: cdk.Duration.days(90),
          enabled: true,
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Grant CloudFront permission to write logs
    logBucket.grantWrite(
      new iam.ServicePrincipal('cloudfront.amazonaws.com'),
      'cloudfront-logs/*'
    );

    // Create custom cache policies
    const htmlCachePolicy = new cloudfront.CachePolicy(
      this,
      'HtmlCachePolicy',
      {
        defaultTtl: cdk.Duration.hours(1),
        maxTtl: cdk.Duration.hours(24),
        minTtl: cdk.Duration.seconds(0),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }
    );

    const staticAssetsCachePolicy = new cloudfront.CachePolicy(
      this,
      'StaticAssetsCachePolicy',
      {
        defaultTtl: cdk.Duration.hours(24),
        maxTtl: cdk.Duration.days(7),
        minTtl: cdk.Duration.hours(1),
      }
    );

    const imageCachePolicy = new cloudfront.CachePolicy(
      this,
      'ImageCachePolicy',
      {
        defaultTtl: cdk.Duration.days(7),
        maxTtl: cdk.Duration.days(30),
        minTtl: cdk.Duration.days(1),
      }
    );

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      'WebsiteDistribution',
      {
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: htmlCachePolicy,
        },
        additionalBehaviors: {
          '*.css': {
            origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
            cachePolicy: staticAssetsCachePolicy,
          },
          '*.js': {
            origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
            cachePolicy: staticAssetsCachePolicy,
          },
          '*.jpg': {
            origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: imageCachePolicy,
          },
          '*.png': {
            origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: imageCachePolicy,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: '/404.html',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: '/403.html',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        logBucket: logBucket,
        logFilePrefix: 'cloudfront-logs/',
        enableLogging: true,
        enabled: true,
        comment: `Marketing campaign website distribution - ${environmentSuffix}`,
      }
    );

    // Create Route 53 hosted zone if domain name is provided
    let hostedZone: route53.HostedZone | undefined;
    if (props?.domainName) {
      hostedZone = new route53.HostedZone(this, 'WebsiteHostedZone', {
        zoneName: props.domainName,
        comment: `Hosted zone for marketing campaign website - ${environmentSuffix}`,
      });

      // Create A record pointing to CloudFront distribution
      new route53.ARecord(this, 'WebsiteARecord', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53targets.CloudFrontTarget(distribution)
        ),
        ttl: cdk.Duration.minutes(5),
        comment: 'A record for marketing campaign website',
      });

      // Create www subdomain record
      new route53.ARecord(this, 'WebsiteWwwRecord', {
        zone: hostedZone,
        recordName: `www.${props.domainName}`,
        target: route53.RecordTarget.fromAlias(
          new route53targets.CloudFrontTarget(distribution)
        ),
        ttl: cdk.Duration.minutes(5),
        comment: 'WWW subdomain for marketing campaign website',
      });
    }

    // Create CloudWatch RUM application
    const rumApp = new rum.CfnAppMonitor(this, 'WebsiteRUM', {
      name: `marketing-campaign-rum-${environmentSuffix}`,
      domain: props?.domainName || distribution.distributionDomainName,
      cwLogEnabled: true,
      tags: [
        { key: 'Environment', value: environmentSuffix },
        { key: 'Purpose', value: 'Marketing Campaign RUM' },
      ],
      appMonitorConfiguration: {
        allowCookies: true,
        enableXRay: false,
        sessionSampleRate: 0.1,
        telemetries: ['errors', 'performance', 'http'],
        favoritePages: ['index.html'],
        guestRoleArn: new iam.Role(this, 'RUMGuestRole', {
          assumedBy: new iam.ServicePrincipal('rum.amazonaws.com'),
          inlinePolicies: {
            RUMPolicy: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['rum:PutRumEvents'],
                  resources: [
                    `arn:aws:rum:${this.region}:${this.account}:appmonitor/marketing-campaign-rum-${environmentSuffix}`,
                  ],
                }),
              ],
            }),
          },
        }).roleArn,
      },
    });

    // Create CloudWatch alarms
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: '4xxErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
          Region: 'Global',
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when 4xx error rate exceeds 5%',
    });

    new cloudwatch.Alarm(this, 'High5xxErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: '5xxErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
          Region: 'Global',
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when 5xx error rate exceeds 1%',
    });

    new cloudwatch.Alarm(this, 'UnusualTrafficAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'Requests',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
          Region: 'Global',
        },
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 50000,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when requests exceed 50,000 per hour',
    });

    // CloudWatch dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'WebsiteDashboard', {
      dashboardName: `marketing-campaign-dashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Request Count',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'Requests',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                statistic: 'Sum',
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Error Rates',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: '4xxErrorRate',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: '5xxErrorRate',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                statistic: 'Average',
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Bandwidth Usage',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'BytesDownloaded',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                statistic: 'Sum',
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Cache Hit Rate',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'CacheHitRate',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                statistic: 'Average',
              }),
            ],
            width: 12,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Name of the S3 bucket hosting the website',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    if (hostedZone) {
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: hostedZone.hostedZoneId,
        description: 'Route 53 hosted zone ID',
      });

      new cdk.CfnOutput(this, 'NameServers', {
        value: cdk.Fn.join(',', hostedZone.hostedZoneNameServers || []),
        description: 'Name servers for the hosted zone',
      });
    }

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: logBucket.bucketName,
      description: 'Name of the S3 bucket for logs',
    });

    new cdk.CfnOutput(this, 'RUMAppMonitorId', {
      value: rumApp.attrId,
      description: 'CloudWatch RUM application monitor ID',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Project', 'MarketingCampaign');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Marketing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
