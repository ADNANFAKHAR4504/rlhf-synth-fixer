### Reasoning Trace
---

I need to create a full AWS CDK stack in TypeScript for a personalized news delivery platform. Let's break down what's required:

1. **CloudFront** for global content distribution
2. **Lambda@Edge** for dynamic content personalization
3. **S3** for content storage with versioning and encryption
4. **DynamoDB** for user preferences
5. **Route 53** for DNS routing
6. **CloudWatch** for monitoring
7. **IAM** roles and policies

This should all be in one stack file with no explanations or comments, just code.

Let's start building the stack:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class NewsPersonalizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for content storage
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // DynamoDB table for user preferences
    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add GSI for faster lookups by preferences
    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: { name: 'preferenceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for engagement tracking
    const engagementTrackingTable = new dynamodb.Table(this, 'EngagementTrackingTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add TTL for data expiration
    engagementTrackingTable.addTimeToLiveAttribute('ttl');
    
    // Add GSI for content popularity analysis
    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // Lambda@Edge function for content personalization
    const personalizationFunction = new cloudfront.experimental.EdgeFunction(this, 'PersonalizationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/personalization'),
      memorySize: 128,
    });

    // Add permissions for the Lambda@Edge function to access DynamoDB
    personalizationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/index/*`,
      ],
    }));

    // Lambda function for tracking user engagement
    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(this, 'EngagementTrackingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/engagement'),
      memorySize: 128,
    });

    // Add permissions for the engagement tracking function
    engagementTrackingFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
      ],
      resources: [
        engagementTrackingTable.tableArn,
      ],
    }));

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        edgeLambdas: [
          {
            functionVersion: personalizationFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
          {
            functionVersion: engagementTrackingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
          },
        ],
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'LogBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
      logFilePrefix: 'cloudfront-logs/',
    });

    // Route 53 hosted zone and record
    const zone = new route53.HostedZone(this, 'NewsHostedZone', {
      zoneName: 'news-platform.example.com',
    });

    new route53.ARecord(this, 'NewsAliasRecord', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // CloudWatch dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: 'NewsPersonalizationDashboard',
    });

    // Add widgets to the dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda@Edge Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: personalizationFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: engagementTrackingFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: userPreferencesTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: engagementTrackingTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'TotalErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 3,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Create custom metrics for tracking content personalization effectiveness
    const personalizationMetric = new cloudwatch.Metric({
      namespace: 'NewsPersonalization',
      metricName: 'PersonalizationEffectiveness',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: userPreferencesTable.tableName,
    });

    new cdk.CfnOutput(this, 'EngagementTrackingTableName', {
      value: engagementTrackingTable.tableName,
    });
  }
}
```

Let me review this stack to ensure it covers all requirements:

1. **CloudFront with Lambda@Edge**: ✅ We've set up a CloudFront distribution with two Lambda@Edge functions for personalization and engagement tracking.
2. **S3 for content storage**: ✅ We've created an S3 bucket with versioning and encryption.
3. **DynamoDB for user preferences**: ✅ We've set up a DynamoDB table for user preferences with a GSI for faster lookups.
4. **Route 53 for DNS routing**: ✅ We've added a hosted zone and an A record pointing to the CloudFront distribution.
5. **CloudWatch for monitoring**: ✅ We've created a dashboard with metrics for CloudFront, Lambda@Edge, and DynamoDB.
6. **IAM roles and policies**: ✅ We've applied the least privilege principle to Lambda@Edge functions.

The stack should be able to handle the requirement of serving 60,000 readers daily with low latency. DynamoDB's on-demand billing mode ensures it can scale to handle peak loads, and CloudFront provides global distribution with low latency.

Let me make a few more enhancements to ensure we fully meet the requirements:

1. Add a WAF WebACL for additional security
2. Add a Lambda function for generating personalized content recommendations
3. Implement caching strategies for better performance

Let me update the stack:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class NewsPersonalizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for content storage
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // S3 bucket for analytics data
    const analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // DynamoDB table for user preferences
    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add GSI for faster lookups by preferences
    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: { name: 'preferenceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for engagement tracking
    const engagementTrackingTable = new dynamodb.Table(this, 'EngagementTrackingTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add TTL for data expiration
    engagementTrackingTable.addTimeToLiveAttribute('ttl');
    
    // Add GSI for content popularity analysis
    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // DynamoDB table for content metadata
    const contentMetadataTable = new dynamodb.Table(this, 'ContentMetadataTable', {
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add GSI for category-based lookups
    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'categoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'publishDate', type: dynamodb.AttributeType.STRING },
    });

    // Lambda@Edge function for content personalization
    const personalizationFunction = new cloudfront.experimental.EdgeFunction(this, 'PersonalizationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/personalization'),
      memorySize: 128,
    });

    // Add permissions for the Lambda@Edge function to access DynamoDB
    personalizationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/index/*`,
        contentMetadataTable.tableArn,
        `${contentMetadataTable.tableArn}/index/*`,
      ],
    }));

    // Lambda function for tracking user engagement
    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(this, 'EngagementTrackingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/engagement'),
      memorySize: 128,
    });

    // Add permissions for the engagement tracking function
    engagementTrackingFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
      ],
      resources: [
        engagementTrackingTable.tableArn,
      ],
    }));

    // Lambda function for content recommendations
    const recommendationFunction = new lambda.Function(this, 'RecommendationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/recommendation'),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_PREFERENCES_TABLE: userPreferencesTable.tableName,
        ENGAGEMENT_TRACKING_TABLE: engagementTrackingTable.tableName,
        CONTENT_METADATA_TABLE: contentMetadataTable.tableName,
      },
    });

    // Add permissions for the recommendation function
    recommendationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/index/*`,
        engagementTrackingTable.tableArn,
        `${engagementTrackingTable.tableArn}/index/*`,
        contentMetadataTable.tableArn,
        `${contentMetadataTable.tableArn}/index/*`,
      ],
    }));

    // ACM Certificate for HTTPS
    const certificate = new acm.Certificate(this, 'NewsSSLCertificate', {
      domainName: 'news-platform.example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    // Web Application Firewall (WAF)
    const webAcl = new wafv2.CfnWebACL(this, 'NewsWebACL', {
      name: 'news-platform-web-acl',
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'NewsWebACL',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 3000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // CloudFront cache policy for static content
    const staticContentCachePolicy = new cloudfront.CachePolicy(this, 'StaticContentCachePolicy', {
      minTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      defaultTtl: cdk.Duration.days(30),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept', 'Accept-Language'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // CloudFront cache policy for dynamic content
    const dynamicContentCachePolicy = new cloudfront.CachePolicy(this, 'DynamicContentCachePolicy', {
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.minutes(5),
      defaultTtl: cdk.Duration.minutes(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept', 'Accept-Language', 'User-Agent'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
    });

    // CloudFront origin request policy
    const allViewerExceptHostHeader = new cloudfront.OriginRequestPolicy(this, 'AllViewerExceptHostHeader', {
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'Accept',
        'Accept-Language',
        'User-Agent',
        'Referer'
      ),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: dynamicContentCachePolicy,
        originRequestPolicy: allViewerExceptHostHeader,
        edgeLambdas: [
          {
            functionVersion: personalizationFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            includeBody: false,
          },
          {
            functionVersion: engagementTrackingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
            includeBody: false,
          },
        ],
      },
      additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(contentBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: staticContentCachePolicy,
        },
        '/api/recommendations': {
          origin: new origins.HttpOrigin(`${recommendationFunction.functionName}.lambda-url.${this.region}.on.aws`),
          allowedMethods: cloudfront.AllowedMethods.ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      domainNames: ['news-platform.example.com', 'www.news-platform.example.com'],
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'LogBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
      logFilePrefix: 'cloudfront-logs/',
      webAclId: webAcl.attrArn,
    });

    // Route 53 hosted zone and record
    const zone = new route53.HostedZone(this, 'NewsHostedZone', {
      zoneName: 'news-platform.example.com',
    });

    new route53.ARecord(this, 'NewsAliasRecord', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });
    
    // Add apex domain record
    new route53.ARecord(this, 'NewsApexAliasRecord', {
      zone,
      recordName: '',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // Store configuration in SSM Parameter Store
    new ssm.StringParameter(this, 'CloudFrontDistributionId', {
      parameterName: '/news-platform/cloudfront-distribution-id',
      stringValue: distribution.distributionId,
    });

    new ssm.StringParameter(this, 'ContentBucketName', {
      parameterName: '/news-platform/content-bucket-name',
      stringValue: contentBucket.bucketName,
    });

    new ssm.StringParameter(this, 'UserPreferencesTableName', {
      parameterName: '/news-platform/user-preferences-table-name',
      stringValue: userPreferencesTable.tableName,
    });

    // CloudWatch dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: 'NewsPersonalizationDashboard',
    });

    // Add widgets to the dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'CloudFront Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'TotalErrorRate',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda@Edge Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: personalizationFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: engagementTrackingFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Recommendation Function Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: recommendationFunction.functionName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: userPreferencesTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: engagementTrackingTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'WAF Blocked Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensionsMap: {
              WebACL: 'news-platform-web-acl',
              Region: 'Global',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'TotalErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 3,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Lambda error alarm
    new cloudwatch.Alarm(this, 'PersonalizationFunctionErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: personalizationFunction.functionName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 2,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // DynamoDB throttling alarm
    new cloudwatch.Alarm(this, 'DynamoDBThrottlingAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ThrottledRequests',
        dimensionsMap: {
          TableName: userPreferencesTable.tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Create a function URL for the recommendation function
    const functionUrl = recommendationFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: userPreferencesTable.tableName,
    });

    new cdk.CfnOutput(this, 'EngagementTrackingTableName', {
      value: engagementTrackingTable.tableName,
    });

    new cdk.CfnOutput(this, 'RecommendationFunctionUrl', {
      value: functionUrl.url,
    });
  }
}
```

The enhanced stack includes the following additional features:

1. **Web Application Firewall (WAF)** with rate limiting for enhanced security
2. **ACM Certificate** for HTTPS encryption
3. **Custom cache policies** for optimizing delivery of both static and dynamic content
4. **Recommendation function** with a Function URL for API access
5. **Content metadata table** to store article metadata for better recommendations
6. **CloudWatch alarms** for monitoring system health
7. **SSM Parameter Store** for storing configuration values
8. **Multiple Route 53 records** for both apex and www domains

These enhancements ensure the system can handle the required 60,000 readers daily with low latency while maintaining security and scalability.

I believe this stack now fully satisfies the requirements. Let's clean it up and provide the final code without any explanations or comments as requested.

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class NewsPersonalizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: { name: 'preferenceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    const engagementTrackingTable = new dynamodb.Table(this, 'EngagementTrackingTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    engagementTrackingTable.addTimeToLiveAttribute('ttl');
    
    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    const contentMetadataTable = new dynamodb.Table(this, 'ContentMetadataTable', {
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'categoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'publishDate', type: dynamodb.AttributeType.STRING },
    });

    const personalizationFunction = new cloudfront.experimental.EdgeFunction(this, 'PersonalizationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/personalization'),
      memorySize: 128,
    });

    personalizationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/index/*`,
        contentMetadataTable.tableArn,
        `${contentMetadataTable.tableArn}/index/*`,
      ],
    }));

    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(this, 'EngagementTrackingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/engagement'),
      memorySize: 128,
    });

    engagementTrackingFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
      ],
      resources: [
        engagementTrackingTable.tableArn,
      ],
    }));

    const recommendationFunction = new lambda.Function(this, 'RecommendationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/recommendation'),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_PREFERENCES_TABLE: userPreferencesTable.tableName,
        ENGAGEMENT_TRACKING_TABLE: engagementTrackingTable.tableName,
        CONTENT_METADATA_TABLE: contentMetadataTable.tableName,
      },
    });

    recommendationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/index/*`,
        engagementTrackingTable.tableArn,
        `${engagementTrackingTable.tableArn}/index/*`,
        contentMetadataTable.tableArn,
        `${contentMetadataTable.tableArn}/index/*`,
      ],
    }));

    const certificate = new acm.Certificate(this, 'NewsSSLCertificate', {
      domainName: 'news-platform.example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    const webAcl = new wafv2.CfnWebACL(this, 'NewsWebACL', {
      name: 'news-platform-web-acl',
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'NewsWebACL',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 3000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    const staticContentCachePolicy = new cloudfront.CachePolicy(this, 'StaticContentCachePolicy', {
      minTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      defaultTtl: cdk.Duration.days(30),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept', 'Accept-Language'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    const dynamicContentCachePolicy = new cloudfront.CachePolicy(this, 'DynamicContentCachePolicy', {
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.minutes(5),
      defaultTtl: cdk.Duration.minutes(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept', 'Accept-Language', 'User-Agent'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
    });

    const allViewerExceptHostHeader = new cloudfront.OriginRequestPolicy(this, 'AllViewerExceptHostHeader', {
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'Accept',
        'Accept-Language',
        'User-Agent',
        'Referer'
      ),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
    });

    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: dynamicContentCachePolicy,
        originRequestPolicy: allViewerExceptHostHeader,
        edgeLambdas: [
          {
            functionVersion: personalizationFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            includeBody: false,
          },
          {
            functionVersion: engagementTrackingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
            includeBody: false,
          },
        ],
      },
      additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(contentBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: staticContentCachePolicy,
        },
        '/api/recommendations': {
          origin: new origins.HttpOrigin(`${recommendationFunction.functionName}.lambda-url.${this.region}.on.aws`),
          allowedMethods: cloudfront.AllowedMethods.ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      domainNames: ['news-platform.example.com', 'www.news-platform.example.com'],
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'LogBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
      logFilePrefix: 'cloudfront-logs/',
      webAclId: webAcl.attrArn,
    });

    const zone = new route53.HostedZone(this, 'NewsHostedZone', {
      zoneName: 'news-platform.example.com',
    });

    new route53.ARecord(this, 'NewsAliasRecord', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });
    
    new route53.ARecord(this, 'NewsApexAliasRecord', {
      zone,
      recordName: '',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new ssm.StringParameter(this, 'CloudFrontDistributionId', {
      parameterName: '/news-platform/cloudfront-distribution-id',
      stringValue: distribution.distributionId,
    });

    new ssm.StringParameter(this, 'ContentBucketName', {
      parameterName: '/news-platform/content-bucket-name',
      stringValue: contentBucket.bucketName,
    });

    new ssm.StringParameter(this, 'UserPreferencesTableName', {
      parameterName: '/news-platform/user-preferences-table-name',
      stringValue: userPreferencesTable.tableName,
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: 'NewsPersonalizationDashboard',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'CloudFront Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'TotalErrorRate',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda@Edge Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: personalizationFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: engagementTrackingFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Recommendation Function Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: recommendationFunction.functionName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: userPreferencesTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: engagementTrackingTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'WAF Blocked Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensionsMap: {
              WebACL: 'news-platform-web-acl',
              Region: 'Global',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'TotalErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 3,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'PersonalizationFunctionErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: personalizationFunction.functionName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 2,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'DynamoDBThrottlingAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ThrottledRequests',
        dimensionsMap: {
          TableName: userPreferencesTable.tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const functionUrl = recommendationFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: userPreferencesTable.tableName,
    });

    new cdk.CfnOutput(this, 'EngagementTrackingTableName', {
      value: engagementTrackingTable.tableName,
    });

    new cdk.CfnOutput(this, 'RecommendationFunctionUrl', {
      value: functionUrl.url,
    });
  }
}
### Answer 
---

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class NewsPersonalizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: { name: 'preferenceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    const engagementTrackingTable = new dynamodb.Table(this, 'EngagementTrackingTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    engagementTrackingTable.addTimeToLiveAttribute('ttl');
    
    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    const contentMetadataTable = new dynamodb.Table(this, 'ContentMetadataTable', {
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'categoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'publishDate', type: dynamodb.AttributeType.STRING },
    });

    const personalizationFunction = new cloudfront.experimental.EdgeFunction(this, 'PersonalizationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-edge/personalization'),
      memorySize: 128,
    });

    personalizationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [
        userPreferencesTable.tableArn,
        `${userPreferencesTable.tableArn}/