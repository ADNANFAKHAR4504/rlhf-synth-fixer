# CloudWatch Monitoring Stack - CDKTF Implementation

This implementation provides a complete CloudWatch-based monitoring solution using CDKTF with TypeScript.

## File: lib/monitoring-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
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
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

interface MonitoringStackProps {
  environmentSuffix: string;
  notificationEmail: string;
  awsRegion: string;
}

export class MonitoringStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environmentSuffix, notificationEmail, awsRegion } = props;

    // Archive provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

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
            Resource: [
              `${logGroup.arn}`,
              `${logGroup.arn}:*`,
            ],
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
      filterPattern: '[time, request_id, level = ERROR || level = CRITICAL, ...]',
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
                  {
                    stat: 'Sum',
                  },
                  {
                    FunctionName: logProcessor.functionName,
                  },
                ],
                [
                  '.',
                  'Errors',
                  {
                    stat: 'Sum',
                  },
                  {
                    FunctionName: logProcessor.functionName,
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

## File: lib/lambda/log-processor/package.json

```json
{
  "name": "log-processor",
  "version": "1.0.0",
  "description": "CloudWatch log processor for error filtering",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "cloudwatch",
    "logs",
    "monitoring"
  ],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
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
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
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

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate Monitoring Stack
    new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      notificationEmail: 'alerts@example.com', // Should be parameterized in production
      awsRegion,
    });
  }
}
```

## File: lib/README.md

```markdown
# CloudWatch Monitoring Stack

A comprehensive monitoring solution built with CDKTF and TypeScript for AWS CloudWatch.

## Overview

This stack provides:
- Centralized CloudWatch Logs with 30-day retention
- Lambda-based log processing for ERROR and CRITICAL levels
- Metric filters and CloudWatch alarms
- SNS notifications via email
- Real-time monitoring dashboard

## Architecture

### Components

1. **CloudWatch Log Group**: `/aws/application/monitoring-{environmentSuffix}`
   - 30-day retention period
   - Enables CloudWatch Logs Insights
   - Tagged for cost allocation

2. **Lambda Function**: `log-processor-{environmentSuffix}`
   - Runtime: Node.js 18
   - Timeout: 60 seconds
   - Filters ERROR and CRITICAL severity levels
   - Processes compressed log events from CloudWatch

3. **Metric Filter**: Counts error occurrences per minute
   - Namespace: `Monitoring/{environmentSuffix}`
   - Metric: ErrorCount

4. **CloudWatch Alarm**: `high-error-rate-{environmentSuffix}`
   - Triggers when errors exceed 10 per 5-minute period
   - Default state: INSUFFICIENT_DATA
   - Notifies via SNS

5. **SNS Topic**: `monitoring-alarms-{environmentSuffix}`
   - Server-side encryption enabled (AWS managed key)
   - Email subscription for notifications

6. **CloudWatch Dashboard**: 2x2 widget layout
   - Error count timeline (per minute)
   - Lambda function metrics
   - Alarm status
   - Recent error logs

## Prerequisites

- Node.js 18 or higher
- AWS CLI configured with appropriate credentials
- Terraform CLI 1.0 or higher
- CDKTF CLI installed

## Installation

```bash
npm install
```

## Configuration

Update the following in `lib/tap-stack.ts`:
- `notificationEmail`: Set your email address for alarm notifications

The region is set to `ca-central-1` by default via `AWS_REGION_OVERRIDE`.

## Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy the stack
cdktf deploy

# Specify environment suffix
cdktf deploy --var="environmentSuffix=prod"
```

## Usage

### Sending Test Logs

```bash
aws logs put-log-events \
  --log-group-name /aws/application/monitoring-dev \
  --log-stream-name test-stream \
  --log-events timestamp=$(date +%s)000,message="ERROR: Test error message"
```

### Viewing Dashboard

1. Navigate to CloudWatch in AWS Console
2. Select "Dashboards" from the left menu
3. Open `monitoring-dashboard-{environmentSuffix}`

### Testing Alarms

Generate more than 10 errors within 5 minutes to trigger the alarm:

```bash
for i in {1..15}; do
  aws logs put-log-events \
    --log-group-name /aws/application/monitoring-dev \
    --log-stream-name test-stream \
    --log-events timestamp=$(date +%s)000,message="ERROR: Test error $i"
  sleep 1
done
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `log-processor-dev`
- `monitoring-alarms-prod`
- `high-error-rate-staging`

## IAM Permissions

The Lambda execution role has least-privilege access:
- Basic Lambda execution (AWS managed policy)
- CloudWatch Logs write access (custom policy)
- Limited to specific log group ARN

## Monitoring and Alerts

### Alarm States

- **OK**: Error count below threshold
- **ALARM**: Error count exceeded 10 in 5 minutes
- **INSUFFICIENT_DATA**: Not enough data (default state)

### Email Notifications

Confirm the SNS subscription via email after deployment. You will receive notifications when:
- Alarm enters ALARM state
- Alarm returns to OK state

## Cost Optimization

- Serverless architecture (Lambda, CloudWatch)
- 30-day log retention to manage storage costs
- No VPC resources required
- On-demand pricing for all services

## Troubleshooting

### Lambda Not Processing Logs

Check Lambda execution role permissions:
```bash
aws iam get-role --role-name log-processor-role-{environmentSuffix}
```

### No Alarms Triggering

Verify metric filter is publishing data:
```bash
aws cloudwatch get-metric-statistics \
  --namespace Monitoring/{environmentSuffix} \
  --metric-name ErrorCount \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

## Cleanup

```bash
cdktf destroy
```

Note: All resources are configured to be destroyable (no retention policies).

## Tags

All resources are tagged with:
- `Environment: production`
- `Team: platform`
- `Name: {resource-name}-{environmentSuffix}`

## Security

- SNS topic encrypted with AWS managed key
- IAM roles follow least-privilege principle
- No hardcoded credentials
- Lambda function uses environment variables

## Future Enhancements

- Add support for multiple log groups
- Implement log retention policies per service
- Add more sophisticated error pattern matching
- Integrate with third-party monitoring tools
- Add CloudWatch Insights saved queries
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install @cdktf/provider-aws @cdktf/provider-archive
   ```

2. Create Lambda function directory structure:
   ```bash
   mkdir -p lib/lambda/log-processor
   ```

3. Update notification email in `lib/tap-stack.ts`

4. Synthesize and deploy:
   ```bash
   cdktf synth
   cdktf deploy
   ```

5. Confirm SNS email subscription

6. Test by sending log events to the CloudWatch log group