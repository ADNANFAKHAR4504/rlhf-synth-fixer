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
