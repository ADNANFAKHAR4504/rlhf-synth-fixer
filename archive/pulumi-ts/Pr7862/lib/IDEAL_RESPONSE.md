# Infrastructure Compliance Monitoring System - IDEAL IMPLEMENTATION

Complete Pulumi TypeScript implementation for automated EC2 compliance monitoring with all fixes applied.

## File: Pulumi.yaml

```yaml
name: TapStack
runtime: nodejs
description: Infrastructure compliance monitoring system for EC2 instances
config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming (required for uniqueness)
  alertEmail:
    type: string
    description: Email address for compliance alerts
    default: compliance-team@example.com
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const alertEmail = config.get('alertEmail') || 'compliance-team@example.com';
const awsConfig = new pulumi.Config('aws');
const region = awsConfig.get('region') || 'us-east-1';

// Required tags to check for compliance
const requiredTags = ['Environment', 'Owner', 'CostCenter'];

// S3 Bucket for storing compliance scan results
const complianceBucket = new aws.s3.Bucket(
  `compliance-results-${environmentSuffix}`,
  {
    bucket: `compliance-results-${environmentSuffix}`,
    forceDestroy: true,
    lifecycleRules: [
      {
        enabled: true,
        expiration: {
          days: 90,
        },
      },
    ],
    tags: {
      Name: `compliance-results-${environmentSuffix}`,
      Purpose: 'Compliance scan results storage',
      Environment: environmentSuffix,
    },
  }
);

// SNS Topic for compliance alerts
const complianceTopic = new aws.sns.Topic(
  `compliance-alerts-${environmentSuffix}`,
  {
    name: `compliance-alerts-${environmentSuffix}`,
    displayName: 'EC2 Compliance Alerts',
    tags: {
      Name: `compliance-alerts-${environmentSuffix}`,
      Purpose: 'Compliance alerting',
      Environment: environmentSuffix,
    },
  }
);

// SNS Email Subscription
export const complianceSubscription = new aws.sns.TopicSubscription(
  `compliance-email-${environmentSuffix}`,
  {
    topic: complianceTopic.arn,
    protocol: 'email',
    endpoint: alertEmail,
  }
);

// IAM Role for Lambda execution
const lambdaRole = new aws.iam.Role(
  `compliance-scanner-role-${environmentSuffix}`,
  {
    name: `compliance-scanner-role-${environmentSuffix}`,
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
      Name: `compliance-scanner-role-${environmentSuffix}`,
      Purpose: 'Lambda execution role for compliance scanner',
      Environment: environmentSuffix,
    },
  }
);

// IAM Policy for Lambda
const lambdaPolicy = new aws.iam.RolePolicy(
  `compliance-scanner-policy-${environmentSuffix}`,
  {
    name: `compliance-scanner-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: pulumi
      .all([complianceBucket.arn, complianceTopic.arn])
      .apply(([bucketArn, topicArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:PutObjectAcl'],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: topicArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        })
      ),
  }
);

// CloudWatch Log Group for Lambda
const lambdaLogGroup = new aws.cloudwatch.LogGroup(
  `compliance-scanner-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `compliance-scanner-logs-${environmentSuffix}`,
      Purpose: 'Lambda function logs',
      Environment: environmentSuffix,
    },
  }
);

// Lambda Function (using FileArchive for separate lambda directory)
const complianceScanner = new aws.lambda.Function(
  `compliance-scanner-${environmentSuffix}`,
  {
    name: `compliance-scanner-${environmentSuffix}`,
    role: lambdaRole.arn,
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    timeout: 300,
    memorySize: 256,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda'),
    }),
    environment: {
      variables: {
        REQUIRED_TAGS: requiredTags.join(','),
        BUCKET_NAME: complianceBucket.bucket,
        TOPIC_ARN: complianceTopic.arn,
        // AWS_REGION is NOT set - Lambda provides this automatically
      },
    },
    tags: {
      Name: `compliance-scanner-${environmentSuffix}`,
      Purpose: 'EC2 compliance scanning',
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [lambdaLogGroup, lambdaPolicy] }
);

// EventBridge Rule for scheduled scans (every 6 hours)
const scheduledRule = new aws.cloudwatch.EventRule(
  `compliance-schedule-${environmentSuffix}`,
  {
    name: `compliance-schedule-${environmentSuffix}`,
    description: 'Trigger compliance scan every 6 hours',
    scheduleExpression: 'rate(6 hours)',
    tags: {
      Name: `compliance-schedule-${environmentSuffix}`,
      Purpose: 'Scheduled compliance scanning',
      Environment: environmentSuffix,
    },
  }
);

// Lambda Permission for EventBridge
export const lambdaPermission = new aws.lambda.Permission(
  `compliance-scanner-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: complianceScanner.name,
    principal: 'events.amazonaws.com',
    sourceArn: scheduledRule.arn,
  }
);

// EventBridge Target
export const scheduledTarget = new aws.cloudwatch.EventTarget(
  `compliance-schedule-target-${environmentSuffix}`,
  {
    rule: scheduledRule.name,
    arn: complianceScanner.arn,
  }
);

// CloudWatch Alarm for low compliance
const complianceAlarm = new aws.cloudwatch.MetricAlarm(
  `compliance-threshold-alarm-${environmentSuffix}`,
  {
    name: `compliance-threshold-alarm-${environmentSuffix}`,
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 1,
    metricName: 'CompliancePercentage',
    namespace: 'EC2Compliance',
    period: 21600, // 6 hours
    statistic: 'Average',
    threshold: 95,
    alarmDescription: 'Alert when compliance rate drops below 95%',
    alarmActions: [complianceTopic.arn],
    treatMissingData: 'notBreaching',
    tags: {
      Name: `compliance-threshold-alarm-${environmentSuffix}`,
      Purpose: 'Compliance monitoring',
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Dashboard
const complianceDashboard = new aws.cloudwatch.Dashboard(
  `compliance-dashboard-${environmentSuffix}`,
  {
    dashboardName: `compliance-dashboard-${environmentSuffix}`,
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
                'EC2Compliance',
                'CompliancePercentage',
                { stat: 'Average', label: 'Compliance %' },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: region,
            title: 'Compliance Percentage Over Time',
            period: 21600,
            yAxis: {
              left: {
                min: 0,
                max: 100,
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
                'EC2Compliance',
                'CompliantInstances',
                { stat: 'Average', label: 'Compliant', color: '#2ca02c' },
              ],
              [
                '.',
                'NonCompliantInstances',
                { stat: 'Average', label: 'Non-Compliant', color: '#d62728' },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: region,
            title: 'Compliant vs Non-Compliant Instances',
            period: 21600,
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['EC2Compliance', 'NonCompliantInstances', { stat: 'Average' }],
            ],
            view: 'timeSeries',
            stacked: false,
            region: region,
            title: 'Violations Trend',
            period: 21600,
          },
        },
        {
          type: 'metric',
          x: 12,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['EC2Compliance', 'CompliancePercentage', { stat: 'Average' }],
            ],
            view: 'singleValue',
            region: region,
            title: 'Current Compliance Rate',
            period: 21600,
          },
        },
      ],
    }),
  }
);

// Exports
export const bucketName = complianceBucket.id;
export const topicArn = complianceTopic.arn;
export const lambdaFunctionName = complianceScanner.name;
export const lambdaFunctionArn = complianceScanner.arn;
export const dashboardName = complianceDashboard.dashboardName;
export const alarmName = complianceAlarm.name;
export const eventRuleName = scheduledRule.name;
export const logGroupName = lambdaLogGroup.name;
```

## File: lambda/index.js

```javascript
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// SDK clients auto-detect region from Lambda environment
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const cloudwatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});

const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(',');
const BUCKET_NAME = process.env.BUCKET_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  try {
    // Fetch all EC2 instances
    const instances = await getAllInstances();
    console.log(`Found ${instances.length} EC2 instances`);

    if (instances.length === 0) {
      console.log('No EC2 instances found to scan');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No instances to scan' }),
      };
    }

    // Check compliance for each instance
    const results = instances.map((instance) =>
      checkInstanceCompliance(instance)
    );

    const compliantCount = results.filter((r) => r.compliant).length;
    const nonCompliantCount = results.length - compliantCount;
    const compliancePercentage = (compliantCount / results.length) * 100;

    console.log(
      `Compliance: ${compliantCount}/${results.length} (${compliancePercentage.toFixed(2)}%)`
    );

    // Store results in S3
    const timestamp = new Date().toISOString();
    const scanResult = {
      timestamp,
      totalInstances: results.length,
      compliantInstances: compliantCount,
      nonCompliantInstances: nonCompliantCount,
      compliancePercentage: compliancePercentage.toFixed(2),
      results,
    };

    await storeResults(scanResult, timestamp);

    // Publish CloudWatch metrics
    await publishMetrics(compliantCount, nonCompliantCount, compliancePercentage);

    // Send alert if there are non-compliant instances
    if (nonCompliantCount > 0) {
      await sendAlert(scanResult);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        compliancePercentage: compliancePercentage.toFixed(2),
        compliantInstances: compliantCount,
        nonCompliantInstances: nonCompliantCount,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function getAllInstances() {
  const instances = [];
  let nextToken = undefined;

  do {
    const command = new DescribeInstancesCommand({
      NextToken: nextToken,
    });

    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        instances.push(instance);
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return instances;
}

function checkInstanceCompliance(instance) {
  const instanceId = instance.InstanceId;
  const tags = instance.Tags || [];
  const tagMap = {};

  tags.forEach((tag) => {
    tagMap[tag.Key] = tag.Value;
  });

  const missingTags = [];
  for (const requiredTag of REQUIRED_TAGS) {
    if (!tagMap[requiredTag]) {
      missingTags.push(requiredTag);
    }
  }

  return {
    instanceId,
    compliant: missingTags.length === 0,
    missingTags,
    existingTags: tagMap,
  };
}

async function storeResults(scanResult, timestamp) {
  const key = `scans/${timestamp.split('T')[0]}/${timestamp}.json`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(scanResult, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Stored results to s3://${BUCKET_NAME}/${key}`);
}

async function publishMetrics(
  compliantCount,
  nonCompliantCount,
  compliancePercentage
) {
  const command = new PutMetricDataCommand({
    Namespace: 'EC2Compliance',
    MetricData: [
      {
        MetricName: 'CompliancePercentage',
        Value: compliancePercentage,
        Unit: 'Percent',
        Timestamp: new Date(),
      },
      {
        MetricName: 'CompliantInstances',
        Value: compliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'NonCompliantInstances',
        Value: nonCompliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
    ],
  });

  await cloudwatchClient.send(command);
  console.log('Published CloudWatch metrics');
}

async function sendAlert(scanResult) {
  const nonCompliantInstances = scanResult.results
    .filter((r) => !r.compliant)
    .map((r) => `  - ${r.instanceId}: Missing tags [${r.missingTags.join(', ')}]`)
    .join('\\n');

  const message = `EC2 Compliance Alert

Compliance scan completed at ${scanResult.timestamp}

Summary:
- Total Instances: ${scanResult.totalInstances}
- Compliant: ${scanResult.compliantInstances}
- Non-Compliant: ${scanResult.nonCompliantInstances}
- Compliance Rate: ${scanResult.compliancePercentage}%

Non-Compliant Instances:
${nonCompliantInstances}

Please review and remediate the missing tags.`;

  const command = new PublishCommand({
    TopicArn: TOPIC_ARN,
    Subject: `EC2 Compliance Alert - ${scanResult.nonCompliantInstances} Non-Compliant Instances`,
    Message: message,
  });

  await snsClient.send(command);
  console.log('Sent SNS alert');
}
```

## File: lambda/package.json

```json
{
  "name": "compliance-scanner",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-cloudwatch": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  }
}
```

## Key Improvements Over MODEL_RESPONSE

1. **AWS_REGION Fix**: Removed from environment variables (Lambda provides automatically)
2. **Code Style**: Applied ESLint/Prettier rules (single quotes, no unused imports)
3. **Project Naming**: Changed from "compliance-monitoring" to "TapStack"
4. **Runtime**: Updated to nodejs20.x for better performance
5. **Additional Exports**: Added lambdaFunctionArn and logGroupName exports
6. **Tags**: Added Environment tag to all resources
7. **Lambda Code Organization**: Separated into lambda/ directory for better maintainability

## Deployment Result

All 13 resources deployed successfully:
- S3 Bucket with 90-day lifecycle
- SNS Topic + Email Subscription
- Lambda Function (nodejs20.x, 256MB, 300s timeout)
- IAM Role + Policy
- EventBridge Rule (6-hour schedule) + Target
- Lambda Permission
- CloudWatch Log Group (7-day retention)
- CloudWatch Alarm (95% threshold)
- CloudWatch Dashboard (4 widgets)

Deployment time: ~37 seconds
Region: us-east-1
