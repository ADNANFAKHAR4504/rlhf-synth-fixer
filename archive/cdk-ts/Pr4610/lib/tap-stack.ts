import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName?: string;
  certificateArn?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
  projectName?: string;
  owner?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;
    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;
    const accountLast5 = account.slice(-5);

    // Get optional parameters from props
    const domainName = props.domainName;
    const certificateArn = props.certificateArn;
    const hostedZoneId = props.hostedZoneId;
    const hostedZoneName = props.hostedZoneName;
    const projectName = props.projectName || 'ContentDelivery';
    const owner = props.owner || 'Platform';

    // Common tags
    const commonTags = {
      Project: projectName,
      EnvironmentSuffix: environmentSuffix,
      Owner: owner,
    };

    // ========================================
    // S3 Logging Bucket
    // ========================================
    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Apply tags to logging bucket
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(loggingBucket).add(key, value);
    });

    // ========================================
    // S3 Content Bucket
    // ========================================
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 's3-access-logs/',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Apply tags to content bucket
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(contentBucket).add(key, value);
    });

    // ========================================
    // CloudFront Origin Access Identity
    // ========================================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for content delivery ${environmentSuffix}`,
      }
    );

    // Grant CloudFront read access to content bucket
    contentBucket.grantRead(originAccessIdentity);

    // ========================================
    // CloudFront Cache Policy
    // ========================================
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      cachePolicyName: `content-cache-policy-${region}-${accountLast5}-${environmentSuffix}`,
      comment: 'Cache policy for article content',
      defaultTtl: cdk.Duration.hours(24),
      minTtl: cdk.Duration.minutes(1),
      maxTtl: cdk.Duration.days(365),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
      ),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // ========================================
    // CloudFront Response Headers Policy
    // ========================================
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'ResponseHeadersPolicy',
      {
        responseHeadersPolicyName: `content-headers-policy-${region}-${accountLast5}-${environmentSuffix}`,
        comment: 'Security headers for content delivery',
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
            override: true,
          },
          xssProtection: { protection: true, modeBlock: true, override: true },
        },
        corsBehavior: {
          accessControlAllowOrigins: ['*'],
          accessControlAllowHeaders: ['*'],
          accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
          accessControlAllowCredentials: false,
          originOverride: true,
        },
      }
    );

    // ========================================
    // ACM Certificate (if provided)
    // ========================================
    let certificate: acm.ICertificate | undefined;
    if (certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        certificateArn
      );
    }

    // ========================================
    // CloudFront Distribution
    // ========================================
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `Content delivery distribution for ${environmentSuffix}`,
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cachePolicy,
        responseHeadersPolicy: responseHeadersPolicy,
      },
      domainNames: domainName ? [domainName] : undefined,
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logBucket: loggingBucket,
      logFilePrefix: 'cloudfront-logs/',
      logIncludesCookies: false,
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
    });

    // Apply tags to distribution
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(distribution).add(key, value);
    });

    // ========================================
    // Route 53 DNS Record (if hosted zone provided)
    // ========================================
    if (domainName && hostedZoneId && hostedZoneName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId: hostedZoneId,
          zoneName: hostedZoneName,
        }
      );

      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
      });

      new route53.AaaaRecord(this, 'AliasRecordIPv6', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
      });
    }

    // ========================================
    // IAM Role for CloudFront Invalidation
    // ========================================
    const invalidationRole = new iam.Role(this, 'InvalidationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for CloudFront invalidation in ${environmentSuffix}`,
      inlinePolicies: {
        CloudFrontInvalidation: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudfront:CreateInvalidation',
                'cloudfront:GetInvalidation',
                'cloudfront:ListInvalidations',
              ],
              resources: [
                `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`,
              ],
            }),
          ],
        }),
      },
    });

    // Apply tags to invalidation role
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(invalidationRole).add(key, value);
    });

    // ========================================
    // IAM Role for S3 Content Management
    // ========================================
    const contentManagementRole = new iam.Role(this, 'ContentManagementRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for S3 content management in ${environmentSuffix}`,
      inlinePolicies: {
        S3ContentAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                contentBucket.bucketArn,
                `${contentBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Apply tags to content management role
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(contentManagementRole).add(key, value);
    });

    // ========================================
    // CloudWatch Dashboard
    // ========================================
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `content-delivery-${region}-${accountLast5}-${environmentSuffix}`,
    });

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

    const bytesDownloadedMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'BytesDownloaded',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Sum',
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

    const errorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const serverErrorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [requestsMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Data Transfer (Bytes)',
        left: [bytesDownloadedMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cache Hit Rate (%)',
        left: [cacheHitRateMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Rates (%)',
        left: [errorRateMetric, serverErrorRateMetric],
        width: 12,
      })
    );

    // ========================================
    // CloudWatch Alarms
    // ========================================
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `content-delivery-high-error-rate-${region}-${accountLast5}-${environmentSuffix}`,
      alarmDescription: 'Alert when 4xx error rate is high',
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'HighServerErrorRateAlarm', {
      alarmName: `content-delivery-high-server-error-rate-${region}-${accountLast5}-${environmentSuffix}`,
      alarmDescription: 'Alert when 5xx error rate is high',
      metric: serverErrorRateMetric,
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LowCacheHitRateAlarm', {
      alarmName: `content-delivery-low-cache-hit-rate-${region}-${accountLast5}-${environmentSuffix}`,
      alarmDescription: 'Alert when cache hit rate is low',
      metric: cacheHitRateMetric,
      threshold: 70,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'DistributionIdOutput', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `content-delivery-distribution-id-${region}-${accountLast5}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DistributionDomainNameOutput', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `content-delivery-domain-name-${region}-${accountLast5}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ContentBucketNameOutput', {
      value: contentBucket.bucketName,
      description: 'S3 Content Bucket Name',
      exportName: `content-delivery-bucket-name-${region}-${accountLast5}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoggingBucketNameOutput', {
      value: loggingBucket.bucketName,
      description: 'S3 Logging Bucket Name',
      exportName: `content-delivery-logging-bucket-${region}-${accountLast5}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'InvalidationRoleArnOutput', {
      value: invalidationRole.roleArn,
      description: 'IAM Role ARN for CloudFront Invalidation',
      exportName: `content-delivery-invalidation-role-${region}-${accountLast5}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ContentManagementRoleArnOutput', {
      value: contentManagementRole.roleArn,
      description: 'IAM Role ARN for S3 Content Management',
      exportName: `content-delivery-content-role-${region}-${accountLast5}-${environmentSuffix}`,
    });
  }
}
