import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchLogSubscriptionFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-subscription-filter';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';

interface MonitoringStackProps {
  environmentSuffix: string;
  notificationEmail: string;
  awsRegion: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environmentSuffix, notificationEmail, awsRegion } = props;

    // CloudWatch Log Group for centralized logging
    const logGroup = new CloudwatchLogGroup(this, 'app-logs', {
      name: `/aws/application/monitoring-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Environment: 'production',
        Team: 'platform',
        Name: `app-logs-${environmentSuffix}`,
      },
    });

    // SNS Topic for alarm notifications with encryption
    const snsTopic = new SnsTopic(this, 'alarm-topic', {
      name: `monitoring-alarms-${environmentSuffix}`,
      displayName: 'CloudWatch Monitoring Alarms',
      kmsMasterKeyId: 'alias/aws/sns',
      tags: {
        Environment: 'production',
        Team: 'platform',
        Name: `alarm-topic-${environmentSuffix}`,
      },
    });

    // SNS Topic Subscription for email notifications
    new SnsTopicSubscription(this, 'email-subscription', {
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: notificationEmail,
    });

    // IAM Role for Lambda execution
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `log-processor-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Environment: 'production',
        Team: 'platform',
        Name: `lambda-role-${environmentSuffix}`,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Custom policy for CloudWatch Logs access
    const cloudwatchPolicy = new IamPolicy(this, 'cloudwatch-policy', {
      name: `log-processor-cloudwatch-${environmentSuffix}`,
      description: 'Allows Lambda to write to CloudWatch Logs',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: [`${logGroup.arn}`, `${logGroup.arn}:*`],
          },
        ],
      }),
      tags: {
        Environment: 'production',
        Team: 'platform',
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-cloudwatch-attach', {
      role: lambdaRole.name,
      policyArn: cloudwatchPolicy.arn,
    });

    // Package Lambda function code
    const lambdaArchive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda/log-processor`,
      outputPath: `${__dirname}/lambda/log-processor.zip`,
    });

    // Lambda function for log processing
    const logProcessor = new LambdaFunction(this, 'log-processor', {
      functionName: `log-processor-${environmentSuffix}`,
      description: 'Processes log events and filters ERROR and CRITICAL levels',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      timeout: 60,
      memorySize: 256,
      environment: {
        variables: {
          LOG_GROUP_NAME: logGroup.name,
          ENVIRONMENT: environmentSuffix,
        },
      },
      tags: {
        Environment: 'production',
        Team: 'platform',
        Name: `log-processor-${environmentSuffix}`,
      },
    });

    // Lambda permission for CloudWatch Logs to invoke
    new LambdaPermission(this, 'cloudwatch-invoke-permission', {
      statementId: 'AllowExecutionFromCloudWatchLogs',
      action: 'lambda:InvokeFunction',
      functionName: logProcessor.functionName,
      principal: 'logs.amazonaws.com',
      sourceArn: `${logGroup.arn}:*`,
    });

    // CloudWatch Logs subscription filter
    new CloudwatchLogSubscriptionFilter(this, 'log-subscription', {
      name: `error-filter-${environmentSuffix}`,
      logGroupName: logGroup.name,
      filterPattern:
        '[time, request_id, level = ERROR || level = CRITICAL, ...]',
      destinationArn: logProcessor.arn,
      dependsOn: [logProcessor],
    });

    // Metric filter for error counting
    const metricFilter = new CloudwatchLogMetricFilter(
      this,
      'error-metric-filter',
      {
        name: `error-count-${environmentSuffix}`,
        logGroupName: logGroup.name,
        pattern: '[time, request_id, level = ERROR || level = CRITICAL, ...]',
        metricTransformation: {
          name: 'ErrorCount',
          namespace: `Monitoring/${environmentSuffix}`,
          value: '1',
          defaultValue: '0',
          unit: 'Count',
        },
      }
    );

    // CloudWatch Alarm for error threshold
    const errorAlarm = new CloudwatchMetricAlarm(this, 'error-alarm', {
      alarmName: `high-error-rate-${environmentSuffix}`,
      alarmDescription:
        'Triggers when error count exceeds 10 in 5-minute period',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'ErrorCount',
      namespace: `Monitoring/${environmentSuffix}`,
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      treatMissingData: 'notBreaching',
      insufficientDataActions: [],
      alarmActions: [snsTopic.arn],
      okActions: [snsTopic.arn],
      tags: {
        Environment: 'production',
        Team: 'platform',
        Name: `error-alarm-${environmentSuffix}`,
      },
      dependsOn: [metricFilter],
    });

    // CloudWatch Dashboard with 2x2 layout
    new CloudwatchDashboard(this, 'monitoring-dashboard', {
      dashboardName: `monitoring-dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                [
                  `Monitoring/${environmentSuffix}`,
                  'ErrorCount',
                  {
                    stat: 'Sum',
                    period: 60,
                  },
                ],
              ],
              view: 'timeSeries',
              stacked: false,
              region: awsRegion,
              title: 'Error Count (per minute)',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
          {
            type: 'metric',
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Invocations',
                  'FunctionName',
                  logProcessor.functionName,
                  {
                    stat: 'Sum',
                  },
                ],
                [
                  '...',
                  'Errors',
                  '.',
                  '.',
                  {
                    stat: 'Sum',
                  },
                ],
              ],
              view: 'timeSeries',
              stacked: false,
              region: awsRegion,
              title: 'Lambda Function Metrics',
              period: 300,
            },
          },
          {
            type: 'alarm',
            x: 0,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              title: 'Alarm Status',
              alarms: [errorAlarm.arn],
            },
          },
          {
            type: 'log',
            x: 12,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              query: `SOURCE '${logGroup.name}'\n| fields @timestamp, level, @message\n| filter level = "ERROR" or level = "CRITICAL"\n| sort @timestamp desc\n| limit 20`,
              region: awsRegion,
              stacked: false,
              title: 'Recent Errors',
              view: 'table',
            },
          },
        ],
      }),
    });
  }
}
