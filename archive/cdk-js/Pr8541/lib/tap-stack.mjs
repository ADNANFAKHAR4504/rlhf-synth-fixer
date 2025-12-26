import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Check if running in LocalStack
    const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;


    // Create a KMS Key for S3 bucket encryption
    const encryptionKey = new kms.Key(this, `NewsEncryptionKey${environmentSuffix}`, {
      enableKeyRotation: true,
      description: `KMS key for news website content encryption - ${environmentSuffix}`,
      alias: `alias/news-website-${environmentSuffix}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Grant CloudFront service principal access to the KMS key (only if not LocalStack)
    if (!isLocalStack) {
      encryptionKey.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowCloudFrontServicePrincipalSSE',
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
          actions: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:GenerateDataKey',
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/*`,
            },
          },
        })
      );
    }

    // Create an S3 bucket to store the news articles
    const websiteBucket = new s3.Bucket(this, `NewsWebsiteBucket${environmentSuffix}`, {
      bucketName: `news-website-content-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
    });

    // Create CloudWatch metrics for S3 bucket (will be created in dashboard)
    const bucketRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'AllRequests',
      dimensionsMap: {
        BucketName: websiteBucket.bucketName,
        FilterId: 'EntireBucket'
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    // CloudFront resources - only create if not running in LocalStack
    let distribution;
    let originAccessControl;
    
    if (!isLocalStack) {
      // Create a CloudFront Origin Access Control (OAC) - modern replacement for OAI
      originAccessControl = new cloudfront.S3OriginAccessControl(this, `NewsOAC${environmentSuffix}`, {
        description: `OAC for news website - ${environmentSuffix}`,
      });

      // Create bucket policy for CloudFront access
      const bucketPolicyStatement = new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${websiteBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/*`,
          },
        },
      });

      websiteBucket.addToResourcePolicy(bucketPolicyStatement);
    }


    // CloudFront log bucket and distribution - only create if not running in LocalStack
    if (!isLocalStack) {
      // Create CloudFront log bucket
      const logBucket = new s3.Bucket(this, `NewsWebsiteLogBucket${environmentSuffix}`, {
        bucketName: `news-website-logs-${environmentSuffix}-${this.account}`,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        blockPublicAccess: new s3.BlockPublicAccess({
          blockPublicAcls: false,
          blockPublicPolicy: true,
          ignorePublicAcls: false,
          restrictPublicBuckets: true,
        }),
        lifecycleRules: [
          {
            id: 'DeleteLogs',
            enabled: true,
            expiration: Duration.days(90),
          },
        ],
      });

      // Create a CloudFront distribution
      distribution = new cloudfront.Distribution(this, `NewsDistribution${environmentSuffix}`, {
        comment: `News website distribution - ${environmentSuffix}`,
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
            originAccessControl,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
              originAccessControl,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          },
        },
        enableLogging: true,
        logBucket: logBucket,
        logFilePrefix: 'cloudfront-logs/',
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 404,
            responsePagePath: '/404.html',
            ttl: Duration.minutes(5),
          },
          {
            httpStatus: 404,
            responsePagePath: '/404.html',
            ttl: Duration.minutes(5),
          },
        ],
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      });

      // Apply removal policy to underlying CloudFormation resource for easier cleanup
      const cfnDistribution = distribution.node.defaultChild;
      cfnDistribution.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }



    // Create CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, `NewsWebsiteDashboard${environmentSuffix}`, {
      dashboardName: `NewsWebsiteMetrics-${environmentSuffix}`,
    });

    // CloudFront metrics and dashboard widgets - only if not running in LocalStack
    if (!isLocalStack && distribution) {
      const requestsMetric = distribution.metricRequests({
        statistic: 'Sum',
        period: Duration.minutes(5),
      });

      const errorRateMetric = distribution.metricTotalErrorRate({
        statistic: 'Average',
        period: Duration.minutes(5),
      });

      const bytesDownloadedMetric = distribution.metricBytesDownloaded({
        statistic: 'Sum',
        period: Duration.minutes(5),
      });

      // Add widgets to dashboard
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'CloudFront Requests',
          left: [requestsMetric],
          width: 12,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: 'CloudFront Error Rate (%)',
          left: [errorRateMetric],
          width: 12,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: 'CloudFront Bytes Downloaded',
          left: [bytesDownloadedMetric],
          width: 12,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: 'S3 Bucket Requests',
          left: [bucketRequestsMetric],
          width: 12,
          height: 6,
        }),
      );

      // Create CloudWatch Alarms
      new cloudwatch.Alarm(this, `HighErrorRateAlarm${environmentSuffix}`, {
        metric: errorRateMetric,
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High error rate detected for news website - ${environmentSuffix}`,
        alarmName: `news-website-high-error-rate-${environmentSuffix}`,
      });

      // CloudFront outputs
      new cdk.CfnOutput(this, `DistributionId${environmentSuffix}`, {
        value: distribution.distributionId,
        description: 'CloudFront distribution ID',
      });

      new cdk.CfnOutput(this, `DistributionDomainName${environmentSuffix}`, {
        value: distribution.distributionDomainName,
        description: 'CloudFront distribution domain name',
      });
    } else {
      // Add S3 widget only for LocalStack
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'S3 Bucket Requests',
          left: [bucketRequestsMetric],
          width: 12,
          height: 6,
        }),
      );
    }

    // Store important values as stack outputs
    // Stack outputs without exports to allow easy cleanup
    new cdk.CfnOutput(this, `WebsiteBucketName${environmentSuffix}`, {
      value: websiteBucket.bucketName,
      description: 'Name of the S3 bucket storing website content',
    });

    new cdk.CfnOutput(this, `KMSKeyId${environmentSuffix}`, {
      value: encryptionKey.keyId,
      description: 'KMS key ID for encryption',
    });

    // Store references for testing
    this.websiteBucket = websiteBucket;
    this.distribution = distribution;
    this.encryptionKey = encryptionKey;
    this.dashboard = dashboard;
    this.environmentSuffix = environmentSuffix;
  }
}

export { TapStack };
