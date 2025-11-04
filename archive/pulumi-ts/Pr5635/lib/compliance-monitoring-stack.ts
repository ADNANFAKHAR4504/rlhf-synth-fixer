/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { VpcStack } from './vpc-stack';
import { ComplianceScannerLambda } from './lambda/compliance-scanner';
import { RemediationLambda } from './lambda/remediation-lambda';
// Commented out due to Pulumi AWS provider limitations - services don't exist
// import { SecurityServicesStack } from './security-services-stack';

export interface ComplianceMonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  complianceEmailEndpoint?: string;
}

export class ComplianceMonitoringStack extends pulumi.ComponentResource {
  public readonly complianceBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComplianceMonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compliance:MonitoringStack', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;
    const complianceEmail =
      args.complianceEmailEndpoint || 'compliance-team@example.com';

    // Get the current AWS region
    const currentRegion = aws.getRegionOutput();
    const region = currentRegion.name;

    // VPC with private subnets and VPC endpoints
    const vpcStack = new VpcStack(
      `vpc-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // KMS key for SNS encryption
    const kmsKey = new aws.kms.Key(
      `compliance-kms-${suffix}`,
      {
        description: 'KMS key for SNS topic encryption',
        enableKeyRotation: true,
        tags: tags,
      },
      { parent: this }
    );

    // S3 bucket for compliance scan results
    const complianceBucket = new aws.s3.Bucket(
      `compliance-results-${suffix}`,
      {
        bucket: `compliance-results-${suffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for compliance alerts
    const snsTopic = new aws.sns.Topic(
      `compliance-alerts-${suffix}`,
      {
        name: `compliance-alerts-${suffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: tags,
      },
      { parent: this }
    );

    // SNS email subscription
    const _emailSubscription = new aws.sns.TopicSubscription(
      `compliance-email-${suffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: complianceEmail,
      },
      { parent: this }
    );

    // CloudWatch Log Group for compliance scanner
    const logGroup = new aws.cloudwatch.LogGroup(
      `compliance-logs-${suffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${suffix}`,
        retentionInDays: 90,
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch custom metrics namespace
    const metricsNamespace = 'ComplianceMonitoring';

    // SQS Dead Letter Queue for Lambda functions
    const dlq = new aws.sqs.Queue(
      `lambda-dlq-${suffix}`,
      {
        name: `lambda-dlq-${suffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // Lambda function for compliance scanning
    const complianceScanner = new ComplianceScannerLambda(
      `compliance-scanner-${suffix}`,
      {
        environmentSuffix: suffix,
        bucketName: complianceBucket.bucket,
        snsTopicArn: snsTopic.arn,
        vpcSubnetIds: vpcStack.privateSubnetIds,
        vpcSecurityGroupIds: [vpcStack.lambdaSecurityGroupId],
        metricsNamespace: metricsNamespace,
        deadLetterQueueArn: dlq.arn,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge rule for scheduled scans (every 15 minutes)
    const scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${suffix}`,
      {
        name: `compliance-schedule-${suffix}`,
        description: 'Trigger compliance scan every 15 minutes',
        scheduleExpression: 'rate(15 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    const _scheduledTarget = new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${suffix}`,
      {
        rule: scheduledRule.name,
        arn: complianceScanner.lambdaArn,
      },
      { parent: this }
    );

    const _scheduledPermission = new aws.lambda.Permission(
      `compliance-schedule-permission-${suffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceScanner.lambdaName,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // EventBridge rules for resource changes
    const ec2Rule = new aws.cloudwatch.EventRule(
      `ec2-change-rule-${suffix}`,
      {
        name: `ec2-change-rule-${suffix}`,
        description: 'Trigger scan on EC2 instance changes',
        eventPattern: JSON.stringify({
          source: ['aws.ec2'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventName: [
              'RunInstances',
              'ModifyInstanceAttribute',
              'CreateTags',
              'DeleteTags',
            ],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    const _ec2Target = new aws.cloudwatch.EventTarget(
      `ec2-change-target-${suffix}`,
      {
        rule: ec2Rule.name,
        arn: complianceScanner.lambdaArn,
      },
      { parent: this }
    );

    const _ec2Permission = new aws.lambda.Permission(
      `ec2-change-permission-${suffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceScanner.lambdaName,
        principal: 'events.amazonaws.com',
        sourceArn: ec2Rule.arn,
      },
      { parent: this }
    );

    const s3Rule = new aws.cloudwatch.EventRule(
      `s3-change-rule-${suffix}`,
      {
        name: `s3-change-rule-${suffix}`,
        description: 'Trigger scan on S3 bucket changes',
        eventPattern: JSON.stringify({
          source: ['aws.s3'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventName: [
              'CreateBucket',
              'PutBucketEncryption',
              'DeleteBucketEncryption',
            ],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    const _s3Target = new aws.cloudwatch.EventTarget(
      `s3-change-target-${suffix}`,
      {
        rule: s3Rule.name,
        arn: complianceScanner.lambdaArn,
      },
      { parent: this }
    );

    const _s3Permission = new aws.lambda.Permission(
      `s3-change-permission-${suffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceScanner.lambdaName,
        principal: 'events.amazonaws.com',
        sourceArn: s3Rule.arn,
      },
      { parent: this }
    );

    // CloudWatch Alarms
    const _unencryptedS3Alarm = new aws.cloudwatch.MetricAlarm(
      `unencrypted-s3-alarm-${suffix}`,
      {
        name: `unencrypted-s3-buckets-${suffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnencryptedS3Buckets',
        namespace: metricsNamespace,
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'Alert when unencrypted S3 buckets detected',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'breaching',
        tags: tags,
      },
      { parent: this }
    );

    const _missingTagsAlarm = new aws.cloudwatch.MetricAlarm(
      `missing-tags-alarm-${suffix}`,
      {
        name: `missing-required-tags-${suffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'MissingRequiredTags',
        namespace: metricsNamespace,
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription:
          'Alert when resources with missing required tags detected',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'breaching',
        tags: tags,
      },
      { parent: this }
    );

    const _insecureEc2Alarm = new aws.cloudwatch.MetricAlarm(
      `insecure-ec2-alarm-${suffix}`,
      {
        name: `insecure-ec2-instances-${suffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'InsecureEC2Instances',
        namespace: metricsNamespace,
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription:
          'Alert when EC2 instances without proper security groups detected',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'breaching',
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Logs metric filter for unauthorized API calls
    const _unauthorizedCallsFilter = new aws.cloudwatch.LogMetricFilter(
      `unauthorized-calls-filter-${suffix}`,
      {
        name: `unauthorized-api-calls-${suffix}`,
        logGroupName: logGroup.name,
        pattern: '[time, request_id, event_type = UnauthorizedOperation, ...]',
        metricTransformation: {
          name: 'UnauthorizedAPICalls',
          namespace: metricsNamespace,
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    const _unauthorizedCallsAlarm = new aws.cloudwatch.MetricAlarm(
      `unauthorized-calls-alarm-${suffix}`,
      {
        name: `unauthorized-api-calls-${suffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnauthorizedAPICalls',
        namespace: metricsNamespace,
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert on unauthorized API calls',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${suffix}`,
      {
        dashboardName: `compliance-dashboard-${suffix}`,
        dashboardBody: pulumi.interpolate`{
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["${metricsNamespace}", "UnencryptedS3Buckets"],
                [".", "MissingRequiredTags"],
                [".", "InsecureEC2Instances"],
                [".", "UnauthorizedAPICalls"]
              ],
              "period": 60,
              "stat": "Maximum",
              "region": "${region}",
              "title": "Compliance Violations",
              "yAxis": {
                "left": {
                  "min": 0
                }
              }
            }
          },
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                [".", "Errors", {"stat": "Sum"}],
                [".", "Duration", {"stat": "Average"}]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${region}",
              "title": "Lambda Performance"
            }
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Advanced Security Services
    // Commented out: Pulumi AWS provider doesn't support these services natively
    // Would need to implement via AWS SDK calls from Lambda functions
    // const securityServices = new SecurityServicesStack(
    //   `security-services-${suffix}`,
    //   {
    //     environmentSuffix: suffix,
    //     snsTopicArn: snsTopic.arn,
    //     vpcSubnetIds: vpcStack.privateSubnetIds,
    //     vpcSecurityGroupIds: [vpcStack.lambdaSecurityGroupId],
    //     tags: tags,
    //   },
    //   { parent: this }
    // );

    // Remediation Lambda
    const remediationLambda = new RemediationLambda(
      `remediation-lambda-${suffix}`,
      {
        environmentSuffix: suffix,
        snsTopicArn: snsTopic.arn,
        vpcSubnetIds: vpcStack.privateSubnetIds,
        vpcSecurityGroupIds: [vpcStack.lambdaSecurityGroupId],
        deadLetterQueueArn: dlq.arn,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge rule to trigger remediation from Security Hub findings
    const remediationRule = new aws.cloudwatch.EventRule(
      `remediation-rule-${suffix}`,
      {
        name: `security-hub-remediation-${suffix}`,
        description: 'Trigger automated remediation for Security Hub findings',
        eventPattern: JSON.stringify({
          source: ['aws.securityhub'],
          'detail-type': ['Security Hub Findings - Imported'],
          detail: {
            findings: {
              Severity: {
                Label: ['HIGH', 'CRITICAL'],
              },
            },
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    const _remediationTarget = new aws.cloudwatch.EventTarget(
      `remediation-target-${suffix}`,
      {
        rule: remediationRule.name,
        arn: remediationLambda.lambdaArn,
      },
      { parent: this }
    );

    const _remediationPermission = new aws.lambda.Permission(
      `remediation-permission-${suffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: remediationLambda.lambdaName,
        principal: 'events.amazonaws.com',
        sourceArn: remediationRule.arn,
      },
      { parent: this }
    );

    this.complianceBucketName = complianceBucket.bucket;
    this.snsTopicArn = snsTopic.arn;
    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      complianceBucketName: this.complianceBucketName,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
