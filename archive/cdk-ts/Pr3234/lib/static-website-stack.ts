import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as crypto from 'crypto';

export interface StaticWebsiteStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName: string;
  subDomain: string;
  webAclArn?: string;
  certificate?: certificatemanager.ICertificate;
  skipCertificate?: boolean;
}

export class StaticWebsiteStack extends cdk.NestedStack {
  public readonly websiteBucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;
  public readonly hostedZone: route53.IHostedZone;
  public readonly logsBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: StaticWebsiteStackProps) {
    super(scope, id, props);

    const siteDomain = `${props.subDomain}-${props.environmentSuffix}.${props.domainName}`;

    // Generate a unique suffix to avoid bucket name conflicts
    // Using stack ID hash to ensure deterministic but unique naming
    const stackIdHash = crypto
      .createHash('md5')
      .update(this.stackId)
      .digest('hex')
      .substring(0, 6);

    // S3 bucket for website content with environment suffix
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `pf-web-${props.environmentSuffix}-${this.account}-${this.region}-${stackIdHash}`,
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
      bucketName: `pf-logs-${props.environmentSuffix}-${this.account}-${this.region}-${stackIdHash}`,
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
      zoneName: siteDomain,
    });

    // Create certificate conditionally (skip for testing to avoid DNS validation issues)
    let certificate: certificatemanager.ICertificate | undefined;

    if (!props.skipCertificate) {
      certificate =
        props.certificate ||
        new certificatemanager.Certificate(this, 'SiteCertificate', {
          domainName: siteDomain,
          certificateName: `portfolio-cert-${props.environmentSuffix}`,
          validation: certificatemanager.CertificateValidation.fromDns(
            this.hostedZone
          ),
        });
    }

    // For testing/demo: Use email validation as alternative (commented out)
    // if (!props.skipCertificate && !props.certificate) {
    //   certificate = new certificatemanager.Certificate(this, 'SiteCertificate', {
    //     domainName: siteDomain,
    //     certificateName: `portfolio-cert-${props.environmentSuffix}`,
    //     validation: certificatemanager.CertificateValidation.fromEmail([
    //       `admin@${props.domainName}`
    //     ]),
    //   });
    // }

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      'OAC',
      {
        description: `Origin access control for portfolio website ${props.environmentSuffix}`,
      }
    );

    // CloudFront distribution configuration (conditional based on certificate availability)
    const distributionConfig: any = {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.websiteBucket,
          {
            originAccessControl,
          }
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
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
    };

    // Add certificate and domain configuration only if certificate exists
    if (certificate) {
      distributionConfig.domainNames = [siteDomain];
      distributionConfig.certificate = certificate;
      distributionConfig.minimumProtocolVersion =
        cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021;
    }

    const distribution = new cloudfront.Distribution(
      this,
      'Distribution',
      distributionConfig
    );

    this.distribution = distribution;

    // Route 53 A record - create regardless of certificate (points to CloudFront)
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
      value: certificate
        ? `https://${siteDomain}`
        : `https://${distribution.distributionDomainName}`,
      description: certificate
        ? 'Website URL (Custom Domain)'
        : 'Website URL (CloudFront Domain)',
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
