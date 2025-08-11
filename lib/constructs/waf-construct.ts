import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafConstructProps {
  environment: string;
}

export class WafConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafConstructProps) {
    super(scope, id);

    const { environment } = props;

    // CloudWatch Log Group for WAF logs - Removed as WAF logging requires Kinesis Data Firehose
    // TODO: Implement Kinesis Data Firehose delivery stream for proper WAF logging

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, `WebACL-${environment}`, {
      scope: 'CLOUDFRONT', // Use CLOUDFRONT for CloudFront, REGIONAL for ALB
      defaultAction: { allow: {} },
      name: `WebACL-${environment}`,
      description: `WAF Web ACL for ${environment} environment`,

      rules: [
        // AWS Managed Rule - Core Rule Set
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

        // AWS Managed Rule - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },

        // AWS Managed Rule - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
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

        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },

        // Custom XSS protection rule
        {
          name: 'XSSProtectionRule',
          priority: 5,
          action: { block: {} },
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                allQueryArguments: {},
              },
              textTransformations: [
                {
                  priority: 1,
                  type: 'URL_DECODE',
                },
                {
                  priority: 2,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'XSSProtectionMetric',
          },
        },
      ],

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebACL-${environment}`,
      },
    });

    // Create S3 bucket for WAF logs
    const wafLogBucket = new s3.Bucket(this, `WAFLogBucket-${environment}`, {
      bucketName: `waf-logs-${environment}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'WAFLogRetention',
          enabled: true,
          expiration: cdk.Duration.days(365), // 1 year retention
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
        },
      ],
    });

    // Create IAM role for Kinesis Data Firehose
    const firehoseRole = new iam.Role(
      this,
      `WAFLoggingFirehoseRole-${environment}`,
      {
        assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
        inlinePolicies: {
          FirehoseS3Policy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:AbortMultipartUpload',
                  's3:GetBucketLocation',
                  's3:GetObject',
                  's3:ListBucket',
                  's3:ListBucketMultipartUploads',
                  's3:PutObject',
                ],
                resources: [
                  wafLogBucket.bucketArn,
                  `${wafLogBucket.bucketArn}/*`,
                ],
              }),
            ],
          }),
        },
      }
    );

    // Create Kinesis Data Firehose delivery stream for WAF logging
    const wafLoggingStream = new kinesisfirehose.CfnDeliveryStream(
      this,
      `WAFLoggingStream-${environment}`,
      {
        deliveryStreamName: `waf-logs-${environment}`,
        deliveryStreamType: 'DirectPut',
        extendedS3DestinationConfiguration: {
          bucketArn: wafLogBucket.bucketArn,
          roleArn: firehoseRole.roleArn,
          prefix: `waf-logs/${environment}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/`,
          errorOutputPrefix: `waf-logs/${environment}/errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/`,
          compressionFormat: 'GZIP',
          bufferingHints: {
            intervalInSeconds: 60,
            sizeInMBs: 50,
          },
        },
      }
    );

    // Enable WAF Logging Configuration with Kinesis Data Firehose ARN
    new wafv2.CfnLoggingConfiguration(this, `WAFLoggingConfig-${environment}`, {
      resourceArn: this.webAcl.attrArn,
      logDestinationConfigs: [wafLoggingStream.attrArn],
    });

    // Tag WAF resources
    cdk.Tags.of(this.webAcl).add('Name', `WebACL-${environment}`);
    cdk.Tags.of(this.webAcl).add('Component', 'Security');
    cdk.Tags.of(this.webAcl).add('Environment', environment);

    // Tag WAF logging resources
    cdk.Tags.of(wafLogBucket).add('Name', `WAFLogBucket-${environment}`);
    cdk.Tags.of(wafLogBucket).add('Component', 'Security');
    cdk.Tags.of(wafLogBucket).add('Environment', environment);
    cdk.Tags.of(firehoseRole).add(
      'Name',
      `WAFLoggingFirehoseRole-${environment}`
    );
    cdk.Tags.of(firehoseRole).add('Component', 'Security');
    cdk.Tags.of(firehoseRole).add('Environment', environment);
    cdk.Tags.of(wafLoggingStream).add(
      'Name',
      `WAFLoggingStream-${environment}`
    );
    cdk.Tags.of(wafLoggingStream).add('Component', 'Security');
    cdk.Tags.of(wafLoggingStream).add('Environment', environment);
  }
}
