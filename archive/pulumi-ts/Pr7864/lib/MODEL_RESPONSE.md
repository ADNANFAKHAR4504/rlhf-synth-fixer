# Infrastructure Compliance Monitoring System - Pulumi TypeScript Implementation

This implementation creates an automated infrastructure compliance monitoring system using Pulumi and TypeScript. The solution monitors AWS Config events, analyzes compliance violations, generates reports, and sends alerts.

## Architecture Overview

The system consists of:
- CloudWatch Log Groups for AWS Config events
- Lambda functions for compliance analysis, reporting, and scanning
- CloudWatch Metrics and Alarms for violation tracking
- SNS topics for alerting
- S3 bucket for report storage
- EventBridge rules for scheduling

## File: bin/tap.ts

```typescript
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

new TapStack(
  'compliance-monitoring',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ComplianceMonitoringStack } from './compliance-monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly complianceTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const complianceStack = new ComplianceMonitoringStack(
      'compliance-monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    this.reportBucketName = complianceStack.reportBucketName;
    this.complianceTopicArn = complianceStack.complianceTopicArn;
    this.dashboardName = complianceStack.dashboardName;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceTopicArn: this.complianceTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
```

## File: lib/compliance-monitoring-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface ComplianceMonitoringStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ComplianceMonitoringStack extends pulumi.ComponentResource {
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly complianceTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: ComplianceMonitoringStackArgs, opts?: ResourceOptions) {
    super('tap:compliance:ComplianceMonitoringStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // S3 Bucket for compliance reports
    const reportBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Config events
    const configLogGroup = new aws.cloudwatch.LogGroup(
      `config-events-${environmentSuffix}`,
      {
        name: `/aws/config/events-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // SNS Topic for compliance alerts
    const complianceTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // SNS Email Subscription
    const emailSubscription = new aws.sns.TopicSubscription(
      `compliance-email-sub-${environmentSuffix}`,
      {
        topic: complianceTopic.arn,
        protocol: 'email',
        endpoint: 'security-team@example.com',
      },
      { parent: this }
    );

    // IAM Role for Lambda functions
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        name: `compliance-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Lambda execution policy
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([reportBucket.arn, complianceTopic.arn, configLogGroup.arn]).apply(
          ([bucketArn, topicArn, logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'config:DescribeConfigRules',
                    'config:GetComplianceDetailsByConfigRule',
                    'config:DescribeComplianceByConfigRule',
                  ],
                  Resource: '*',
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // Lambda: Compliance Rule Analyzer
    const analyzerFunction = new aws.lambda.Function(
      `compliance-analyzer-${environmentSuffix}`,
      {
        name: `compliance-analyzer-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const cloudwatch = new CloudWatchClient({});
const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log('Processing compliance event:', JSON.stringify(event, null, 2));

  try {
    const configEvent = JSON.parse(event.Records[0].Sns.Message);
    const resourceType = configEvent.configRuleInvokingEvent?.configurationItem?.resourceType || 'Unknown';
    const complianceType = configEvent.newEvaluationResult?.complianceType || 'UNKNOWN';

    // Put metric for violation
    if (complianceType === 'NON_COMPLIANT') {
      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: 'ComplianceMonitoring',
        MetricData: [{
          MetricName: 'ComplianceViolations',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ResourceType', Value: resourceType }
          ],
          Timestamp: new Date()
        }]
      }));

      // Send critical alert for high-severity violations
      if (resourceType.includes('S3') || resourceType.includes('IAM')) {
        await sns.send(new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: 'CRITICAL: Compliance Violation Detected',
          Message: \`Critical compliance violation detected:
Resource Type: \${resourceType}
Compliance Status: \${complianceType}
Time: \${new Date().toISOString()}\`
        }));
      }
    }

    return { statusCode: 200, body: 'Processed successfully' };
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
};
          `),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: complianceTopic.arn,
            LOG_GROUP_NAME: configLogGroup.name,
          },
        },
        timeout: 60,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // Lambda: Daily Report Generator
    const reportGenerator = new aws.lambda.Function(
      `compliance-report-generator-${environmentSuffix}`,
      {
        name: `compliance-report-generator-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } = require('@aws-sdk/client-config-service');

const s3 = new S3Client({});
const config = new ConfigServiceClient({});

exports.handler = async (event) => {
  console.log('Generating daily compliance report');

  try {
    // Get compliance status for all rules
    const response = await config.send(new DescribeComplianceByConfigRuleCommand({}));

    const report = {
      generatedAt: new Date().toISOString(),
      totalRules: response.ComplianceByConfigRules?.length || 0,
      compliantRules: response.ComplianceByConfigRules?.filter(r => r.Compliance?.ComplianceType === 'COMPLIANT').length || 0,
      nonCompliantRules: response.ComplianceByConfigRules?.filter(r => r.Compliance?.ComplianceType === 'NON_COMPLIANT').length || 0,
      rules: response.ComplianceByConfigRules || []
    };

    // Store report in S3
    const reportKey = \`reports/daily/\${new Date().toISOString().split('T')[0]}.json\`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: reportKey,
      Body: JSON.stringify(report, null, 2),
      ContentType: 'application/json'
    }));

    console.log(\`Report stored at s3://\${process.env.BUCKET_NAME}/\${reportKey}\`);
    return { statusCode: 200, body: 'Report generated successfully' };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
          `),
        }),
        environment: {
          variables: {
            BUCKET_NAME: reportBucket.bucket,
          },
        },
        timeout: 120,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // Lambda: Weekly Deep Scanner
    const deepScanner = new aws.lambda.Function(
      `compliance-deep-scanner-${environmentSuffix}`,
      {
        name: `compliance-deep-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { ConfigServiceClient, GetComplianceDetailsByConfigRuleCommand, DescribeConfigRulesCommand } = require('@aws-sdk/client-config-service');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const configClient = new ConfigServiceClient({});
const s3 = new S3Client({});
const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log('Starting weekly deep compliance scan');

  try {
    const rulesResponse = await configClient.send(new DescribeConfigRulesCommand({}));
    const rules = rulesResponse.ConfigRules || [];

    const detailedResults = [];
    for (const rule of rules) {
      try {
        const details = await configClient.send(new GetComplianceDetailsByConfigRuleCommand({
          ConfigRuleName: rule.ConfigRuleName
        }));
        detailedResults.push({
          ruleName: rule.ConfigRuleName,
          evaluationResults: details.EvaluationResults || []
        });
      } catch (err) {
        console.warn(\`Could not get details for rule \${rule.ConfigRuleName}:\`, err);
      }
    }

    const report = {
      scanDate: new Date().toISOString(),
      totalRules: rules.length,
      detailedResults: detailedResults,
      summary: {
        totalEvaluations: detailedResults.reduce((sum, r) => sum + r.evaluationResults.length, 0),
        nonCompliantResources: detailedResults.reduce((sum, r) =>
          sum + r.evaluationResults.filter(e => e.ComplianceType === 'NON_COMPLIANT').length, 0
        )
      }
    };

    // Store deep scan report
    const reportKey = \`reports/weekly/\${new Date().toISOString().split('T')[0]}.json\`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: reportKey,
      Body: JSON.stringify(report, null, 2),
      ContentType: 'application/json'
    }));

    // Send summary notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Weekly Compliance Deep Scan Complete',
      Message: \`Weekly compliance deep scan completed:
Total Rules Scanned: \${report.totalRules}
Total Evaluations: \${report.summary.totalEvaluations}
Non-Compliant Resources: \${report.summary.nonCompliantResources}
Report Location: s3://\${process.env.BUCKET_NAME}/\${reportKey}\`
    }));

    console.log('Weekly scan complete');
    return { statusCode: 200, body: 'Scan completed successfully' };
  } catch (error) {
    console.error('Error during deep scan:', error);
    throw error;
  }
};
          `),
        }),
        environment: {
          variables: {
            BUCKET_NAME: reportBucket.bucket,
            SNS_TOPIC_ARN: complianceTopic.arn,
          },
        },
        timeout: 300,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge Rule: Daily Report Generation
    const dailyReportRule = new aws.cloudwatch.EventRule(
      `daily-report-rule-${environmentSuffix}`,
      {
        name: `daily-compliance-report-${environmentSuffix}`,
        description: 'Trigger daily compliance report generation',
        scheduleExpression: 'cron(0 8 * * ? *)',
        tags: tags,
      },
      { parent: this }
    );

    const dailyReportTarget = new aws.cloudwatch.EventTarget(
      `daily-report-target-${environmentSuffix}`,
      {
        rule: dailyReportRule.name,
        arn: reportGenerator.arn,
      },
      { parent: this }
    );

    const dailyReportPermission = new aws.lambda.Permission(
      `daily-report-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: reportGenerator.name,
        principal: 'events.amazonaws.com',
        sourceArn: dailyReportRule.arn,
      },
      { parent: this }
    );

    // EventBridge Rule: Weekly Deep Scan
    const weeklyScannRule = new aws.cloudwatch.EventRule(
      `weekly-scan-rule-${environmentSuffix}`,
      {
        name: `weekly-compliance-scan-${environmentSuffix}`,
        description: 'Trigger weekly deep compliance scan',
        scheduleExpression: 'cron(0 9 ? * MON *)',
        tags: tags,
      },
      { parent: this }
    );

    const weeklyScanTarget = new aws.cloudwatch.EventTarget(
      `weekly-scan-target-${environmentSuffix}`,
      {
        rule: weeklyScannRule.name,
        arn: deepScanner.arn,
      },
      { parent: this }
    );

    const weeklyScanPermission = new aws.lambda.Permission(
      `weekly-scan-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: deepScanner.name,
        principal: 'events.amazonaws.com',
        sourceArn: weeklyScannRule.arn,
      },
      { parent: this }
    );

    // CloudWatch Metric Filter for Log Analysis
    const metricFilter = new aws.cloudwatch.LogMetricFilter(
      `compliance-violations-filter-${environmentSuffix}`,
      {
        name: `compliance-violations-${environmentSuffix}`,
        logGroupName: configLogGroup.name,
        pattern: '[timestamp, request_id, event_type = NON_COMPLIANT, ...]',
        metricTransformation: {
          name: 'ComplianceViolationCount',
          namespace: 'ComplianceMonitoring',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Violation Threshold
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `compliance-violation-alarm-${environmentSuffix}`,
      {
        name: `compliance-violations-threshold-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ComplianceViolations',
        namespace: 'ComplianceMonitoring',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Trigger when compliance violations exceed threshold',
        alarmActions: [complianceTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-monitoring-${environmentSuffix}`,
        dashboardBody: pulumi.interpolate`{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["ComplianceMonitoring", "ComplianceViolations", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Compliance Violations (5 min)",
        "yAxis": {"left": {"min": 0}}
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["ComplianceMonitoring", "ComplianceViolations", {"stat": "Sum", "label": "S3 Violations"}],
          ["...", {"stat": "Sum", "label": "IAM Violations"}]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Violations by Resource Type",
        "yAxis": {"left": {"min": 0}}
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '${configLogGroup.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20",
        "region": "us-east-1",
        "title": "Recent Config Events"
      }
    }
  ]
}`,
      },
      { parent: this }
    );

    this.reportBucketName = reportBucket.bucket;
    this.complianceTopicArn = complianceTopic.arn;
    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceTopicArn: this.complianceTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
```

## Deployment Instructions

1. Ensure you have Pulumi CLI installed and configured
2. Set the required environment variable:
   ```bash
   export ENVIRONMENT_SUFFIX="your-suffix"
   ```
3. Deploy the stack:
   ```bash
   pulumi up
   ```
4. Verify the deployment:
   ```bash
   pulumi stack output
   ```

## Key Features

- Automated compliance monitoring from AWS Config events
- Real-time violation analysis and alerting
- Daily compliance reports stored in S3
- Weekly deep compliance scans
- CloudWatch dashboards for visualization
- SNS notifications for critical violations

## AWS Services Used

1. AWS Config - Infrastructure change tracking
2. AWS Lambda - Compliance analysis and reporting
3. Amazon CloudWatch - Logs, metrics, alarms, and dashboards
4. Amazon SNS - Alert notifications
5. Amazon S3 - Report storage
6. Amazon EventBridge - Scheduled Lambda triggers
