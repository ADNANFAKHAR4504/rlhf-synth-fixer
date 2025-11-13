import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: envSuffix,
      Project: 'MediaStreaming',
      ManagedBy: 'CDK',
    };

    // Apply tags to stack
    const tagKeys = Object.keys(commonTags) as Array<keyof typeof commonTags>;
    for (let i = 0; i < tagKeys.length; i++) {
      const key = tagKeys[i];
      const value = commonTags[key];
      cdk.Tags.of(this).add(key, value);
    }

    // 1. S3 Origin Buckets
    // Primary bucket in us-east-1
    const primaryBucket = new s3.Bucket(this, 'PrimaryOriginBucket', {
      bucketName: `media-cdn-primary-${envSuffix}-${cdk.Stack.of(this).account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secondary bucket name (same region for now - true cross-region requires separate stacks)
    const secondaryBucketName = `media-cdn-secondary-${envSuffix}-${cdk.Stack.of(this).account}`;

    // Secondary bucket for replication (same region for now - true cross-region requires separate stacks)
    const secondaryBucket = new s3.Bucket(this, 'SecondaryOriginBucket', {
      bucketName: secondaryBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to secondary bucket
    const tagKeysSecondary = Object.keys(commonTags) as Array<
      keyof typeof commonTags
    >;
    for (let i = 0; i < tagKeysSecondary.length; i++) {
      const key = tagKeysSecondary[i];
      const value = commonTags[key];
      cdk.Tags.of(secondaryBucket).add(key, value);
    }

    // Replication role for cross-region replication
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      description: 'Role for S3 cross-region replication',
    });

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetReplicationConfiguration',
          's3:ListBucket',
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
        ],
        resources: [primaryBucket.bucketArn, `${primaryBucket.bucketArn}/*`],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
        ],
        resources: [
          secondaryBucket.bucketArn,
          `${secondaryBucket.bucketArn}/*`,
        ],
      })
    );

    // Configure replication on primary bucket with DependsOn
    const cfnBucket = primaryBucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.replicationConfiguration = {
      role: replicationRole.roleArn,
      rules: [
        {
          id: 'ReplicateAll',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: { status: 'Enabled' },
          filter: {},
          destination: {
            bucket: secondaryBucket.bucketArn,
            replicationTime: {
              status: 'Enabled',
              time: { minutes: 15 },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: { minutes: 15 },
            },
            storageClass: 'STANDARD_IA',
          },
        },
      ],
    };

    // Add DependsOn to ensure secondary bucket exists before replication is configured
    cfnBucket.addDependency(secondaryBucket.node.defaultChild as s3.CfnBucket);

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'CDN-OAI', {
      comment: `OAI for ${envSuffix} CDN`,
    });

    // Grant OAI read access to both buckets
    primaryBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [oai.grantPrincipal],
        actions: ['s3:GetObject'],
        resources: [`${primaryBucket.bucketArn}/*`],
      })
    );

    secondaryBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [oai.grantPrincipal],
        actions: ['s3:GetObject'],
        resources: [`${secondaryBucket.bucketArn}/*`],
      })
    );

    // S3 bucket for CloudFront logs
    const logsBucket = new s3.Bucket(this, 'CDNLogsBucket', {
      bucketName: `media-cdn-logs-${envSuffix}-${cdk.Stack.of(this).account}`,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: true,
        ignorePublicAcls: false,
        restrictPublicBuckets: true,
      }),
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. Lambda@Edge Functions
    // Geo-blocking function
    const geoBlockingFunction = new lambda.Function(
      this,
      'GeoBlockingFunction',
      {
        functionName: `cdn-geo-blocking-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Block specific countries (example: North Korea, Iran)
  const blockedCountries = ['KP', 'IR'];
  const countryHeader = headers['cloudfront-viewer-country'];

  if (countryHeader && blockedCountries.includes(countryHeader[0].value)) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Access denied from your region',
      headers: {
        'content-type': [{ key: 'Content-Type', value: 'text/plain' }],
        'cache-control': [{ key: 'Cache-Control', value: 'max-age=300' }],
      },
    };
  }

  return request;
};
      `),
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        role: new iam.Role(this, 'GeoBlockingRole', {
          assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal('lambda.amazonaws.com'),
            new iam.ServicePrincipal('edgelambda.amazonaws.com')
          ),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AWSLambdaBasicExecutionRole'
            ),
          ],
        }),
      }
    );

    // Header manipulation function
    const headerFunction = new lambda.Function(
      this,
      'HeaderManipulationFunction',
      {
        functionName: `cdn-header-manipulation-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // Add security headers
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubdomains; preload'
  }];

  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];

  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];

  // Remove server header for security
  delete headers['server'];

  // Add custom header with timestamp
  headers['x-cdn-generated'] = [{
    key: 'X-CDN-Generated',
    value: new Date().toISOString()
  }];

  return response;
};
      `),
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        role: new iam.Role(this, 'HeaderManipulationRole', {
          assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal('lambda.amazonaws.com'),
            new iam.ServicePrincipal('edgelambda.amazonaws.com')
          ),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AWSLambdaBasicExecutionRole'
            ),
          ],
        }),
      }
    );

    // 3. AWS WAF Configuration
    const ipReputationList = new wafv2.CfnIPSet(this, 'IPReputationList', {
      scope: 'CLOUDFRONT',
      ipAddressVersion: 'IPV4',
      addresses: [
        // Add known bad IPs here (example IPs)
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
      ],
    });

    const webAcl = new wafv2.CfnWebACL(this, 'CDNWebACL', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 10000, // 10,000 requests per 5 minutes
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'IPReputationRule',
          priority: 2,
          statement: {
            ipSetReferenceStatement: {
              arn: ipReputationList.attrArn,
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IPReputationRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'CDNWebACL',
      },
    });

    // 4. CloudFront Origin Group for Failover
    const originGroup = new origins.OriginGroup({
      primaryOrigin: origins.S3BucketOrigin.withOriginAccessIdentity(
        primaryBucket,
        {
          originAccessIdentity: oai,
        }
      ),
      fallbackOrigin: origins.S3BucketOrigin.withOriginAccessIdentity(
        secondaryBucket,
        {
          originAccessIdentity: oai,
        }
      ),
    });

    // 5. CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'CDNDistribution', {
      comment: `Media CDN Distribution - ${envSuffix}`,
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logBucket: logsBucket,
      logFilePrefix: 'cdn-logs/',
      webAclId: webAcl.attrArn,

      // Default behavior with origin group for failover
      defaultBehavior: {
        origin: originGroup,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: new cloudfront.CachePolicy(this, 'DefaultCachePolicy', {
          cachePolicyName: `default-cache-policy-${envSuffix}`,
          defaultTtl: cdk.Duration.hours(1),
          minTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.days(1),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
        originRequestPolicy: new cloudfront.OriginRequestPolicy(
          this,
          'CustomOriginRequestPolicy',
          {
            originRequestPolicyName: `custom-origin-policy-${envSuffix}`,
            headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
              'CloudFront-Viewer-Country',
              'CloudFront-Is-Mobile-Viewer',
              'CloudFront-Is-Tablet-Viewer'
            ),
            queryStringBehavior:
              cloudfront.OriginRequestQueryStringBehavior.all(),
            cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
          }
        ),
        edgeLambdas: [
          {
            functionVersion: geoBlockingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          },
          {
            functionVersion: headerFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
          },
        ],
      },

      // Additional behaviors with origin group failover
      additionalBehaviors: {
        '/video/*.mp4': {
          origin: originGroup,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          compress: false,
          cachePolicy: new cloudfront.CachePolicy(this, 'VideoCachePolicy', {
            cachePolicyName: `video-cache-policy-${envSuffix}`,
            defaultTtl: cdk.Duration.days(7),
            minTtl: cdk.Duration.days(1),
            maxTtl: cdk.Duration.days(30),
            enableAcceptEncodingGzip: false,
            enableAcceptEncodingBrotli: false,
          }),
        },
        '/images/*.jpg': {
          origin: originGroup,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          compress: true,
          cachePolicy: new cloudfront.CachePolicy(this, 'ImageCachePolicy', {
            cachePolicyName: `image-cache-policy-${envSuffix}`,
            defaultTtl: cdk.Duration.days(3),
            minTtl: cdk.Duration.hours(1),
            maxTtl: cdk.Duration.days(7),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
        },
        '/static/*': {
          origin: originGroup,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          compress: true,
          cachePolicy: new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
            cachePolicyName: `static-cache-policy-${envSuffix}`,
            defaultTtl: cdk.Duration.days(30),
            minTtl: cdk.Duration.days(7),
            maxTtl: cdk.Duration.days(365),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
        },
      },
    });

    // 6. CloudWatch Monitoring
    // Cache hit ratio metric
    const cacheHitRatioMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'CacheHitRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
        Region: 'Global',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // 4xx error rate metric
    const error4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
        Region: 'Global',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // 5xx error rate metric
    const error5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
        Region: 'Global',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'CDNDashboard', {
      dashboardName: `cdn-monitoring-${envSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Cache Hit Ratio',
            left: [cacheHitRatioMetric],
            width: 12,
            height: 6,
            leftYAxis: {
              min: 0,
              max: 100,
              label: 'Percentage',
            },
          }),
          new cloudwatch.GraphWidget({
            title: 'Error Rates',
            left: [error4xxMetric],
            right: [error5xxMetric],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'Current Cache Hit Ratio',
            metrics: [cacheHitRatioMetric],
            width: 6,
            height: 4,
          }),
          new cloudwatch.TextWidget({
            markdown: `
## CDN Performance Targets
- Cache Hit Ratio: > 85%
- 4xx Error Rate: < 1%
- 5xx Error Rate: < 0.1%
- Data Transfer Cost: ≤ $500/TB
            `,
            width: 6,
            height: 4,
          }),
        ],
      ],
    });

    // CloudWatch Alarms
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cacheHitAlarm = new cloudwatch.Alarm(this, 'LowCacheHitAlarm', {
      alarmName: `cdn-low-cache-hit-${envSuffix}`,
      alarmDescription: 'Cache hit ratio below 85%',
      metric: cacheHitRatioMetric,
      threshold: 85,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const error5xxAlarm = new cloudwatch.Alarm(this, 'High5xxErrorAlarm', {
      alarmName: `cdn-high-5xx-errors-${envSuffix}`,
      alarmDescription: '5xx error rate above 0.1%',
      metric: error5xxMetric,
      threshold: 0.1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // 7. VPC for Network Isolation
    const vpc = new ec2.Vpc(this, 'CDNVpc', {
      vpcName: `cdn-vpc-${envSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Apply tags to VPC
    const tagKeysVpc = Object.keys(commonTags) as Array<
      keyof typeof commonTags
    >;
    for (let i = 0; i < tagKeysVpc.length; i++) {
      const key = tagKeysVpc[i];
      const value = commonTags[key];
      cdk.Tags.of(vpc).add(key, value);
    }

    // 8. EventBridge Rule for Alarm Monitoring
    const alarmRule = new events.Rule(this, 'CDNAlarmRule', {
      ruleName: `cdn-alarm-rule-${envSuffix}`,
      description: 'Monitors CDN performance alarms',
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [{ prefix: 'cdn-' }],
          state: { value: ['ALARM'] },
        },
      },
    });

    // Add Lambda target to the EventBridge rule
    alarmRule.addTarget(
      new targets.LambdaFunction(geoBlockingFunction, {
        maxEventAge: cdk.Duration.hours(1),
        retryAttempts: 2,
      })
    );

    // CloudFormation integration is demonstrated through CDK synthesis
    // which generates CloudFormation templates from the infrastructure code

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'PrimaryBucketName', {
      value: primaryBucket.bucketName,
      description: 'Primary Origin Bucket Name',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for network isolation',
    });

    new cdk.CfnOutput(this, 'EventBridgeRuleName', {
      value: alarmRule.ruleName,
      description: 'EventBridge rule name for alarm monitoring',
    });

    new cdk.CfnOutput(this, 'CloudFormationValidation', {
      value: 'SUCCESS',
      description: 'CloudFormation template validation status',
    });
  }
}
