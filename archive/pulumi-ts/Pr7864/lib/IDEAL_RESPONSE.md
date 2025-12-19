# Infrastructure Compliance Monitoring System - Production-Ready Implementation

This is the corrected, production-ready implementation of an automated infrastructure compliance monitoring system using Pulumi and TypeScript.

## Key Corrections from MODEL_RESPONSE

1. Fixed EventBridge imports (EventRule → cloudwatch.EventRule)
2. Added proper resource dependencies
3. Fixed Lambda function environment variable references
4. Added CloudWatch Log Subscription Filter to trigger analyzer Lambda
5. Fixed SNS subscription email address to use parameter
6. Added proper error handling and validation
7. Fixed typo in weeklyScannRule variable name
8. Added bucket versioning and lifecycle policies
9. Enhanced IAM policies with specific permissions
10. Added proper Lambda log group creation

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

const stack = new TapStack(
  'compliance-monitoring',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

export const reportBucketName = stack.reportBucketName;
export const complianceTopicArn = stack.complianceTopicArn;
export const dashboardName = stack.dashboardName;
export const analyzerFunctionName = stack.analyzerFunctionName;
export const reportGeneratorFunctionName = stack.reportGeneratorFunctionName;
export const deepScannerFunctionName = stack.deepScannerFunctionName;
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
  public readonly analyzerFunctionName: pulumi.Output<string>;
  public readonly reportGeneratorFunctionName: pulumi.Output<string>;
  public readonly deepScannerFunctionName: pulumi.Output<string>;

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
    this.analyzerFunctionName = complianceStack.analyzerFunctionName;
    this.reportGeneratorFunctionName = complianceStack.reportGeneratorFunctionName;
    this.deepScannerFunctionName = complianceStack.deepScannerFunctionName;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceTopicArn: this.complianceTopicArn,
      dashboardName: this.dashboardName,
      analyzerFunctionName: this.analyzerFunctionName,
      reportGeneratorFunctionName: this.reportGeneratorFunctionName,
      deepScannerFunctionName: this.deepScannerFunctionName,
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
  public readonly analyzerFunctionName: pulumi.Output<string>;
  public readonly reportGeneratorFunctionName: pulumi.Output<string>;
  public readonly deepScannerFunctionName: pulumi.Output<string>;

  constructor(name: string, args: ComplianceMonitoringStackArgs, opts?: ResourceOptions) {
    super('tap:compliance:ComplianceMonitoringStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // S3 Bucket for compliance reports
    const reportBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
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
            noncurrentVersionExpiration: {
              days: 30,
            },
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Block public access to S3 bucket
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-block-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
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

    // SNS Email Subscription (using configurable email)
    const securityEmail = process.env.SECURITY_EMAIL || 'security-team@example.com';
    const emailSubscription = new aws.sns.TopicSubscription(
      `compliance-email-sub-${environmentSuffix}`,
      {
        topic: complianceTopic.arn,
        protocol: 'email',
        endpoint: securityEmail,
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
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:FilterLogEvents',
                    'logs:GetLogEvents',
                  ],
                  Resource: logGroupArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for Analyzer Lambda
    const analyzerLogGroup = new aws.cloudwatch.LogGroup(
      `analyzer-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-analyzer-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
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
    // Parse CloudWatch Logs event
    const logEvent = event.awslogs?.data
      ? JSON.parse(Buffer.from(event.awslogs.data, 'base64').toString('utf-8'))
      : event;

    const logEvents = logEvent.logEvents || [];

    for (const logEntry of logEvents) {
      const message = logEntry.message;

      // Parse compliance event from log message
      let complianceEvent;
      try {
        complianceEvent = typeof message === 'string' ? JSON.parse(message) : message;
      } catch (e) {
        console.warn('Could not parse log message:', message);
        continue;
      }

      const resourceType = complianceEvent.resourceType || 'Unknown';
      const complianceType = complianceEvent.complianceType || 'UNKNOWN';

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
        if (resourceType.includes('S3') || resourceType.includes('IAM') || resourceType.includes('Security')) {
          await sns.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: 'CRITICAL: Compliance Violation Detected',
            Message: \`Critical compliance violation detected:
Resource Type: \${resourceType}
Compliance Status: \${complianceType}
Time: \${new Date().toISOString()}
Resource ID: \${complianceEvent.resourceId || 'N/A'}\`
          }));
        }
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
        memorySize: 256,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy, analyzerLogGroup] }
    );

    // CloudWatch Logs Subscription Filter to trigger analyzer
    const logSubscription = new aws.cloudwatch.LogSubscriptionFilter(
      `config-subscription-${environmentSuffix}`,
      {
        name: `config-events-subscription-${environmentSuffix}`,
        logGroup: configLogGroup.name,
        filterPattern: '',
        destinationArn: analyzerFunction.arn,
      },
      { parent: this }
    );

    // Permission for CloudWatch Logs to invoke analyzer Lambda
    const analyzerLogPermission = new aws.lambda.Permission(
      `analyzer-log-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: analyzerFunction.name,
        principal: 'logs.amazonaws.com',
        sourceArn: configLogGroup.arn,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Report Generator Lambda
    const reportGeneratorLogGroup = new aws.cloudwatch.LogGroup(
      `report-generator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-report-generator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
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

    const compliantRules = response.ComplianceByConfigRules?.filter(
      r => r.Compliance?.ComplianceType === 'COMPLIANT'
    ) || [];

    const nonCompliantRules = response.ComplianceByConfigRules?.filter(
      r => r.Compliance?.ComplianceType === 'NON_COMPLIANT'
    ) || [];

    const report = {
      generatedAt: new Date().toISOString(),
      totalRules: response.ComplianceByConfigRules?.length || 0,
      compliantRules: compliantRules.length,
      nonCompliantRules: nonCompliantRules.length,
      compliancePercentage: response.ComplianceByConfigRules?.length > 0
        ? ((compliantRules.length / response.ComplianceByConfigRules.length) * 100).toFixed(2)
        : 0,
      rules: response.ComplianceByConfigRules || [],
      nonCompliantDetails: nonCompliantRules.map(r => ({
        ruleName: r.ConfigRuleName,
        complianceType: r.Compliance?.ComplianceType
      }))
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
    console.log(\`Compliance Rate: \${report.compliantRules}/\${report.totalRules} (\${report.compliancePercentage}%)\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Report generated successfully',
        location: reportKey,
        complianceRate: report.compliancePercentage
      })
    };
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
        memorySize: 512,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy, reportGeneratorLogGroup] }
    );

    // CloudWatch Log Group for Deep Scanner Lambda
    const deepScannerLogGroup = new aws.cloudwatch.LogGroup(
      `deep-scanner-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-deep-scanner-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
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

    console.log(\`Found \${rules.length} Config rules to scan\`);

    const detailedResults = [];
    let totalNonCompliant = 0;
    let totalEvaluations = 0;

    for (const rule of rules) {
      try {
        const details = await configClient.send(new GetComplianceDetailsByConfigRuleCommand({
          ConfigRuleName: rule.ConfigRuleName,
          Limit: 100
        }));

        const evaluationResults = details.EvaluationResults || [];
        const nonCompliantCount = evaluationResults.filter(
          e => e.ComplianceType === 'NON_COMPLIANT'
        ).length;

        totalEvaluations += evaluationResults.length;
        totalNonCompliant += nonCompliantCount;

        detailedResults.push({
          ruleName: rule.ConfigRuleName,
          ruleDescription: rule.Description,
          totalEvaluations: evaluationResults.length,
          nonCompliantCount: nonCompliantCount,
          evaluationResults: evaluationResults.map(e => ({
            resourceType: e.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceType,
            resourceId: e.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceId,
            complianceType: e.ComplianceType,
            resultRecordedTime: e.ResultRecordedTime
          }))
        });
      } catch (err) {
        console.warn(\`Could not get details for rule \${rule.ConfigRuleName}:\`, err.message);
      }
    }

    const report = {
      scanType: 'weekly-deep-scan',
      scanDate: new Date().toISOString(),
      totalRules: rules.length,
      detailedResults: detailedResults,
      summary: {
        totalEvaluations: totalEvaluations,
        nonCompliantResources: totalNonCompliant,
        complianceRate: totalEvaluations > 0
          ? (((totalEvaluations - totalNonCompliant) / totalEvaluations) * 100).toFixed(2)
          : 100
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

    console.log(\`Deep scan report stored at s3://\${process.env.BUCKET_NAME}/\${reportKey}\`);

    // Send summary notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Weekly Compliance Deep Scan Complete',
      Message: \`Weekly compliance deep scan completed:

Total Rules Scanned: \${report.totalRules}
Total Evaluations: \${report.summary.totalEvaluations}
Non-Compliant Resources: \${report.summary.nonCompliantResources}
Compliance Rate: \${report.summary.complianceRate}%

Report Location: s3://\${process.env.BUCKET_NAME}/\${reportKey}

Top Non-Compliant Rules:
\${detailedResults
  .filter(r => r.nonCompliantCount > 0)
  .sort((a, b) => b.nonCompliantCount - a.nonCompliantCount)
  .slice(0, 5)
  .map(r => \`  - \${r.ruleName}: \${r.nonCompliantCount} violations\`)
  .join('\\n')}
\`
    }));

    console.log('Weekly scan complete');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Scan completed successfully',
        complianceRate: report.summary.complianceRate,
        nonCompliantResources: report.summary.nonCompliantResources
      })
    };
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
        memorySize: 1024,
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy, deepScannerLogGroup] }
    );

    // EventBridge Rule: Daily Report Generation
    const dailyReportRule = new aws.cloudwatch.EventRule(
      `daily-report-rule-${environmentSuffix}`,
      {
        name: `daily-compliance-report-${environmentSuffix}`,
        description: 'Trigger daily compliance report generation at 8 AM UTC',
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
    const weeklyScanRule = new aws.cloudwatch.EventRule(
      `weekly-scan-rule-${environmentSuffix}`,
      {
        name: `weekly-compliance-scan-${environmentSuffix}`,
        description: 'Trigger weekly deep compliance scan every Monday at 9 AM UTC',
        scheduleExpression: 'cron(0 9 ? * MON *)',
        tags: tags,
      },
      { parent: this }
    );

    const weeklyScanTarget = new aws.cloudwatch.EventTarget(
      `weekly-scan-target-${environmentSuffix}`,
      {
        rule: weeklyScanRule.name,
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
        sourceArn: weeklyScanRule.arn,
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
        alarmDescription: 'Trigger when compliance violations exceed 5 in 5 minutes',
        alarmActions: [complianceTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-monitoring-${environmentSuffix}`,
        dashboardBody: pulumi.all([
          configLogGroup.name,
          analyzerFunction.arn,
          reportGenerator.arn,
          deepScanner.arn,
        ]).apply(([logGroupName, analyzerArn, reportGenArn, scannerArn]) =>
          JSON.stringify({
            widgets: [
              {
                type: 'metric',
                x: 0,
                y: 0,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    ['ComplianceMonitoring', 'ComplianceViolations', { stat: 'Sum', label: 'Total Violations' }]
                  ],
                  period: 300,
                  stat: 'Sum',
                  region: 'us-east-1',
                  title: 'Compliance Violations (5 min)',
                  yAxis: { left: { min: 0 } }
                }
              },
              {
                type: 'metric',
                x: 12,
                y: 0,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    ['ComplianceMonitoring', 'ComplianceViolations', { stat: 'Sum' }]
                  ],
                  period: 3600,
                  stat: 'Sum',
                  region: 'us-east-1',
                  title: 'Hourly Violation Trend',
                  yAxis: { left: { min: 0 } }
                }
              },
              {
                type: 'log',
                x: 0,
                y: 6,
                width: 24,
                height: 6,
                properties: {
                  query: \`SOURCE '\${logGroupName}' | fields @timestamp, @message | sort @timestamp desc | limit 20\`,
                  region: 'us-east-1',
                  title: 'Recent Config Events'
                }
              },
              {
                type: 'metric',
                x: 0,
                y: 12,
                width: 8,
                height: 6,
                properties: {
                  metrics: [
                    ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
                    ['.', 'Errors', { stat: 'Sum' }]
                  ],
                  period: 300,
                  stat: 'Sum',
                  region: 'us-east-1',
                  title: 'Lambda Performance',
                  yAxis: { left: { min: 0 } }
                }
              },
              {
                type: 'metric',
                x: 8,
                y: 12,
                width: 8,
                height: 6,
                properties: {
                  metrics: [
                    ['AWS/Lambda', 'Duration', { stat: 'Average' }]
                  ],
                  period: 300,
                  stat: 'Average',
                  region: 'us-east-1',
                  title: 'Lambda Duration (ms)',
                  yAxis: { left: { min: 0 } }
                }
              },
              {
                type: 'metric',
                x: 16,
                y: 12,
                width: 8,
                height: 6,
                properties: {
                  metrics: [
                    ['AWS/SNS', 'NumberOfMessagesPublished', { stat: 'Sum' }]
                  ],
                  period: 3600,
                  stat: 'Sum',
                  region: 'us-east-1',
                  title: 'SNS Notifications Sent',
                  yAxis: { left: { min: 0 } }
                }
              }
            ]
          })
        ),
      },
      { parent: this }
    );

    this.reportBucketName = reportBucket.bucket;
    this.complianceTopicArn = complianceTopic.arn;
    this.dashboardName = dashboard.dashboardName;
    this.analyzerFunctionName = analyzerFunction.name;
    this.reportGeneratorFunctionName = reportGenerator.name;
    this.deepScannerFunctionName = deepScanner.name;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceTopicArn: this.complianceTopicArn,
      dashboardName: this.dashboardName,
      analyzerFunctionName: this.analyzerFunctionName,
      reportGeneratorFunctionName: this.reportGeneratorFunctionName,
      deepScannerFunctionName: this.deepScannerFunctionName,
    });
  }
}
```

## Deployment Instructions

1. Ensure you have Pulumi CLI installed and AWS credentials configured
2. Set the required environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX="your-unique-suffix"
   export AWS_REGION="us-east-1"
   export SECURITY_EMAIL="your-security-team@example.com"  # Optional
   ```
3. Initialize Pulumi stack:
   ```bash
   pulumi stack init dev
   ```
4. Deploy the stack:
   ```bash
   pulumi up
   ```
5. Verify the deployment:
   ```bash
   pulumi stack output
   ```
6. Test the Lambda functions manually:
   ```bash
   aws lambda invoke --function-name compliance-report-generator-${ENVIRONMENT_SUFFIX} response.json
   ```

## Testing

The infrastructure can be tested by:
1. Manually invoking Lambda functions via AWS Console or CLI
2. Creating AWS Config rules to trigger compliance events
3. Checking CloudWatch Logs for function execution
4. Verifying reports are created in S3
5. Confirming SNS email subscription and receiving test alerts

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Key Features

- Automated compliance monitoring from AWS Config events
- Real-time violation analysis and alerting via CloudWatch Logs subscription
- Daily compliance reports stored in S3 with versioning
- Weekly deep compliance scans with detailed resource analysis
- CloudWatch dashboards for real-time visualization
- SNS notifications for critical violations with configurable email
- Proper error handling and logging for all Lambda functions
- Cost-optimized with appropriate retention policies

## AWS Services Used

1. **AWS Config** - Infrastructure change tracking and compliance rules
2. **AWS Lambda** - Three serverless functions for analysis, reporting, and scanning
3. **Amazon CloudWatch** - Logs, metrics, alarms, dashboards, and metric filters
4. **Amazon SNS** - Alert notifications with email subscriptions
5. **Amazon S3** - Report storage with versioning and encryption
6. **Amazon EventBridge** - Scheduled Lambda triggers for daily and weekly tasks
