# CloudWatch Monitoring Stack - CDKTF Implementation (Corrected)

This is the corrected implementation with all model failures fixed.

## File: lib/monitoring-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
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
                  'AWS/Lambda',
                  'Errors',
                  'FunctionName',
                  logProcessor.functionName,
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
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// Override AWS Region for ca-central-1 as specified in requirements
const AWS_REGION_OVERRIDE = 'ca-central-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags || [
      {
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Instantiate Monitoring Stack
    new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      notificationEmail: 'alerts@example.com', // Should be parameterized in production
      awsRegion,
    });
  }
}
```

## File: lib/lambda/log-processor/index.js

```javascript
/**
 * Lambda function to process CloudWatch log events
 * Filters ERROR and CRITICAL severity levels
 */

const zlib = require('zlib');

exports.handler = async (event) => {
  console.log('Log processor invoked');

  try {
    // Decode and decompress CloudWatch Logs data
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = zlib.gunzipSync(payload);
    const logData = JSON.parse(decompressed.toString('utf8'));

    console.log('Processing log group:', logData.logGroup);
    console.log('Processing log stream:', logData.logStream);

    let errorCount = 0;
    let criticalCount = 0;

    // Process each log event
    for (const logEvent of logData.logEvents) {
      const message = logEvent.message;

      // Check for ERROR or CRITICAL severity levels
      if (message.includes('ERROR') || message.includes('Error')) {
        errorCount++;
        console.log('ERROR detected:', message.substring(0, 200));
      }

      if (message.includes('CRITICAL') || message.includes('Critical')) {
        criticalCount++;
        console.log('CRITICAL detected:', message.substring(0, 200));
      }
    }

    // Log summary
    console.log(`Processed ${logData.logEvents.length} log events`);
    console.log(`Found ${errorCount} ERROR messages`);
    console.log(`Found ${criticalCount} CRITICAL messages`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: logData.logEvents.length,
        errors: errorCount,
        critical: criticalCount,
      }),
    };

  } catch (error) {
    console.error('Error processing log events:', error);
    throw error;
  }
};
```

## Key Corrections

1. **MonitoringStack extends Construct** (not TerraformStack) - CRITICAL fix
2. **Providers configured in TapStack** (not MonitoringStack) - Architecture fix
3. **Removed invalid use_lockfile** backend option - Configuration fix
4. **Explicit dashboard metrics** (not shorthand notation) - Maintainability fix

All code has been deployed successfully and meets the PROMPT requirements.
