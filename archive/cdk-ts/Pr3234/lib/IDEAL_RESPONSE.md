# CDK TypeScript Infrastructure for Static Website Portfolio

Complete production-ready CDK TypeScript infrastructure for hosting a static website portfolio with CloudFront CDN, S3 storage, Route 53 DNS, WAF protection, and CloudWatch monitoring.

## Infrastructure Components

### Core Files

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StaticWebsiteStack } from './static-website-stack';
import { WafStack } from './waf-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const domainName = 'example.com';
    const subDomain = 'portfolio';

    // Check if we're in us-east-1 (for WAF and Certificate requirements)
    const isUsEast1 = this.region === 'us-east-1';

    // Create WAF stack if we're in us-east-1, otherwise skip
    let webAclArn: string | undefined;
    if (isUsEast1) {
      const wafStack = new WafStack(this, 'WafStack', {
        environmentSuffix,
      });
      webAclArn = wafStack.webAclArn;
    }

    // Create the static website stack with all components
    const websiteStack = new StaticWebsiteStack(this, 'StaticWebsiteStack', {
      environmentSuffix,
      domainName,
      subDomain,
      webAclArn,
      env: props?.env,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
      exportName: `environment-suffix-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for deployment',
      exportName: `region-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Main stack name',
      exportName: `stack-name-${environmentSuffix}`,
    });

    // Aggregate important outputs at the top level for easier access
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteStack.websiteBucket.bucketName,
      description: 'S3 Website Bucket Name',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: websiteStack.logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: websiteStack.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: websiteStack.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: websiteStack.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: websiteStack.hostedZone.zoneName,
      description: 'Route 53 Hosted Zone Name',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${subDomain}-${environmentSuffix}.${domainName}`,
      description: 'Full Website URL',
    });

    if (webAclArn) {
      new cdk.CfnOutput(this, 'WafWebAclArn', {
        value: webAclArn,
        description: 'WAF Web ACL ARN',
      });
    }
  }
}
```

**lib/static-website-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface StaticWebsiteStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName: string;
  subDomain: string;
  webAclArn?: string;
  certificate?: certificatemanager.ICertificate;
}

export class StaticWebsiteStack extends cdk.NestedStack {
  public readonly websiteBucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;
  public readonly hostedZone: route53.IHostedZone;
  public readonly logsBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: StaticWebsiteStackProps) {
    super(scope, id, props);

    const siteDomain = `${props.subDomain}-${props.environmentSuffix}.${props.domainName}`;

    // S3 bucket for website content with environment suffix
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `portfolio-website-${props.environmentSuffix}-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          prefix: 'logs/',
          expiration: cdk.Duration.days(90),
        },
      ],
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 bucket for CloudFront logs with environment suffix
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `portfolio-logs-${props.environmentSuffix}-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldCloudFrontLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    // Grant CloudFront permission to write logs
    this.logsBucket.grantWrite(
      new iam.ServicePrincipal('cloudfront.amazonaws.com')
    );

    // Route 53 hosted zone
    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: `${props.environmentSuffix}.${props.domainName}`,
    });

    // If certificate is not provided, create one locally (for non us-east-1 regions)
    const certificate =
      props.certificate ||
      new certificatemanager.Certificate(this, 'SiteCertificate', {
        domainName: siteDomain,
        certificateName: `portfolio-cert-${props.environmentSuffix}`,
        validation: certificatemanager.CertificateValidation.fromDns(
          this.hostedZone
        ),
      });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      'OAC',
      {
        description: `Origin access control for portfolio website ${props.environmentSuffix}`,
      }
    );

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.websiteBucket,
          {
            originAccessControl,
          }
        ),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      domainNames: [siteDomain],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: this.logsBucket,
      logFilePrefix: 'cloudfront-logs/',
      defaultRootObject: 'index.html',
      webAclId: props.webAclArn,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      comment: `Portfolio distribution for ${props.environmentSuffix}`,
    });

    this.distribution = distribution;

    // Route 53 A record
    new route53.ARecord(this, 'SiteAliasRecord', {
      zone: this.hostedZone,
      recordName: `${props.subDomain}-${props.environmentSuffix}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // CloudWatch dashboard with environment suffix
    const dashboard = new cloudwatch.Dashboard(this, 'WebsiteDashboard', {
      dashboardName: `portfolio-website-dashboard-${props.environmentSuffix}`,
    });

    // CloudWatch metrics
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

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Total Requests',
        left: [requestsMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bytes Downloaded',
        left: [bytesDownloadedMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: '4xx Error Rate',
        left: [errorRate4xxMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: '5xx Error Rate',
        left: [errorRate5xxMetric],
        width: 12,
        height: 6,
      })
    );

    // CloudWatch alarm for high error rates
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRate4xxMetric,
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: `High 4xx error rate for ${props.environmentSuffix}`,
      alarmName: `portfolio-high-error-rate-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${siteDomain}`,
      description: 'Website URL',
      exportName: `website-url-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.websiteBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `bucket-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
      exportName: `logs-bucket-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `distribution-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `distribution-domain-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `hosted-zone-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: this.hostedZone.zoneName,
      description: 'Route 53 Hosted Zone Name',
      exportName: `hosted-zone-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `dashboard-url-${props.environmentSuffix}`,
    });
  }
}
```

**lib/waf-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class WafStack extends cdk.NestedStack {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    // WAF Web ACL for CloudFront (must be in us-east-1)
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `portfolio-waf-${props.environmentSuffix}`,
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimitRule-${props.environmentSuffix}`,
          },
        },
        {
          name: 'CommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `CommonRuleSet-${props.environmentSuffix}`,
          },
        },
        {
          name: 'KnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `KnownBadInputs-${props.environmentSuffix}`,
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebACL-${props.environmentSuffix}`,
      },
    });

    this.webAclArn = webAcl.attrArn;

    // Output for cross-stack reference
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAclArn,
      description: 'WAF Web ACL ARN',
      exportName: `waf-webacl-arn-${props.environmentSuffix}`,
    });
  }
}
```

**lib/certificate-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface CertificateStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName: string;
  subDomain: string;
  hostedZone: route53.IHostedZone;
}

export class CertificateStack extends cdk.NestedStack {
  public readonly certificate: certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const siteDomain = `${props.subDomain}-${props.environmentSuffix}.${props.domainName}`;

    // ACM certificate (must be in us-east-1 for CloudFront)
    this.certificate = new certificatemanager.Certificate(
      this,
      'SiteCertificate',
      {
        domainName: siteDomain,
        certificateName: `portfolio-cert-${props.environmentSuffix}`,
        validation: certificatemanager.CertificateValidation.fromDns(
          props.hostedZone
        ),
      }
    );

    // Output
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM Certificate ARN',
      exportName: `certificate-arn-${props.environmentSuffix}`,
    });
  }
}
```

**bin/tap.ts**
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');

// Deploy with specified region
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-1',
  },
});

app.synth();
```

## Key Features

### 1. S3 Storage
- **Website Bucket**: Stores static content with versioning and encryption
- **Logs Bucket**: Stores CloudFront access logs with 90-day retention
- **Security**: Block all public access, access only via CloudFront OAC
- **Lifecycle**: Automatic deletion of old logs to control costs

### 2. CloudFront CDN
- **Global Distribution**: Edge locations worldwide for low latency
- **HTTPS Only**: Automatic redirect from HTTP to HTTPS
- **Origin Access Control**: Modern OAC instead of legacy OAI
- **Custom Error Pages**: Handles 404/403 errors gracefully
- **Compression**: Automatic gzip compression for better performance
- **TLS 1.2+**: Modern security protocols only

### 3. Route 53 DNS
- **Hosted Zone**: Manages DNS for the domain
- **A Record**: Points to CloudFront distribution
- **Certificate Validation**: Automatic DNS validation for SSL certificates

### 4. WAF Protection
- **Rate Limiting**: 2000 requests per IP per 5 minutes
- **AWS Managed Rules**: Common rule set for basic protection
- **Known Bad Inputs**: Protection against malicious requests
- **CloudWatch Integration**: Full metrics and monitoring

### 5. Monitoring & Observability
- **CloudWatch Dashboard**: Real-time metrics visualization
- **Key Metrics**: Requests, bytes downloaded, error rates
- **Alarms**: Automatic alerting for high error rates (>5%)
- **WAF Metrics**: Attack patterns and blocked requests

### 6. Environment Isolation
- **Environment Suffix**: All resources include suffix for isolation
- **Multi-Environment Support**: Dev, staging, production deployments
- **No Resource Conflicts**: Unique naming prevents collisions
- **Stack Exports**: Easy cross-stack references

### 7. Security Best Practices
- **Principle of Least Privilege**: Minimal IAM permissions
- **Encryption at Rest**: S3 buckets encrypted with AES256
- **Encryption in Transit**: HTTPS enforced for all connections
- **No Public S3 Access**: All access through CloudFront only
- **Modern Security**: OAC replaces deprecated OAI

### 8. Cost Optimization
- **Lifecycle Policies**: Auto-delete logs after 90 days
- **CloudFront Caching**: Reduces origin requests
- **S3 Intelligent Tiering**: Optional for long-term storage
- **RemovalPolicy.DESTROY**: Clean resource deletion

## Production Considerations

1. **Domain Configuration**: Update `domainName` and `subDomain` in tap-stack.ts
2. **WAF Rules**: Adjust rate limits based on expected traffic
3. **Monitoring**: Set up SNS topics for alarm notifications
4. **Backup**: Consider S3 versioning and cross-region replication
5. **Performance**: Enable CloudFront field-level encryption if needed
6. **Compliance**: Add additional WAF rules for specific requirements

## Architecture Benefits

- **Scalability**: CloudFront handles millions of requests
- **Performance**: Global edge locations ensure low latency
- **Security**: Multiple layers of protection (WAF, OAC, HTTPS)
- **Cost-Effective**: Pay only for what you use
- **Maintainable**: Clean code structure with separation of concerns
- **Testable**: Comprehensive test coverage ensures reliability