import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix: string;
  alertEmail?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly topicArn: pulumi.Output<string>;
  public readonly scannerFunctionName: pulumi.Output<string>;
  public readonly scannerFunctionArn: pulumi.Output<string>;
  public readonly reporterFunctionName: pulumi.Output<string>;
  public readonly reporterFunctionArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly scannerLogGroupName: pulumi.Output<string>;
  public readonly reporterLogGroupName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:compliance:TapStack', name, args, opts);

    const { environmentSuffix, alertEmail, tags } = args;
    const requiredTags = ['Environment', 'Owner', 'CostCenter'];
    const finalAlertEmail = alertEmail || 'compliance-team@example.com';

    // S3 Bucket for storing compliance scan results with versioning
    const complianceBucket = new aws.s3.BucketV2(
      `compliance-results-${environmentSuffix}`,
      {
        bucket: `compliance-results-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `compliance-results-${environmentSuffix}`,
          Purpose: 'Compliance scan results storage',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Enable versioning on S3 bucket
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketVersioning = new aws.s3.BucketVersioningV2(
      `compliance-results-versioning-${environmentSuffix}`,
      {
        bucket: complianceBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Lifecycle Configuration - transition to Glacier after 90 days
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
      `compliance-results-lifecycle-${environmentSuffix}`,
      {
        bucket: complianceBucket.id,
        rules: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // SNS Topic for compliance alerts
    const complianceTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: 'EC2 Compliance Alerts',
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
          Purpose: 'Compliance alerting',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // SNS Email Subscription
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _complianceSubscription = new aws.sns.TopicSubscription(
      `compliance-email-${environmentSuffix}`,
      {
        topic: complianceTopic.arn,
        protocol: 'email',
        endpoint: finalAlertEmail,
      },
      { parent: this }
    );

    // IAM Role for Scanner Lambda
    const scannerRole = new aws.iam.Role(
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
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
          Purpose: 'Lambda execution role for compliance scanner',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Policy for Scanner Lambda
    const scannerPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        name: `compliance-scanner-policy-${environmentSuffix}`,
        role: scannerRole.id,
        policy: pulumi
          .all([complianceBucket.arn, complianceTopic.arn])
          .apply(([bucketArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:DescribeInstances',
                    'ec2:DescribeTags',
                    'ec2:DescribeSecurityGroups',
                  ],
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
      },
      { parent: this }
    );

    // IAM Role for Reporter Lambda
    const reporterRole = new aws.iam.Role(
      `compliance-reporter-role-${environmentSuffix}`,
      {
        name: `compliance-reporter-role-${environmentSuffix}`,
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
          ...tags,
          Name: `compliance-reporter-role-${environmentSuffix}`,
          Purpose: 'Lambda execution role for report generator',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Policy for Reporter Lambda
    const reporterPolicy = new aws.iam.RolePolicy(
      `compliance-reporter-policy-${environmentSuffix}`,
      {
        name: `compliance-reporter-policy-${environmentSuffix}`,
        role: reporterRole.id,
        policy: pulumi.all([complianceBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: `${bucketArn}/*`,
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
      },
      { parent: this }
    );

    // CloudWatch Log Group for Scanner Lambda with 30-day retention
    const scannerLogGroup = new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `compliance-scanner-logs-${environmentSuffix}`,
          Purpose: 'Scanner Lambda function logs',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for Reporter Lambda with 30-day retention
    const reporterLogGroup = new aws.cloudwatch.LogGroup(
      `compliance-reporter-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-reporter-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `compliance-reporter-logs-${environmentSuffix}`,
          Purpose: 'Reporter Lambda function logs',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Scanner Lambda Function
    const complianceScanner = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        role: scannerRole.arn,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        timeout: 300,
        memorySize: 256,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda/scanner'),
        }),
        environment: {
          variables: {
            REQUIRED_TAGS: requiredTags.join(','),
            BUCKET_NAME: complianceBucket.bucket,
            TOPIC_ARN: complianceTopic.arn,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
          Purpose: 'EC2 compliance scanning',
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [scannerLogGroup, scannerPolicy] }
    );

    // Reporter Lambda Function
    const complianceReporter = new aws.lambda.Function(
      `compliance-reporter-${environmentSuffix}`,
      {
        name: `compliance-reporter-${environmentSuffix}`,
        role: reporterRole.arn,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        timeout: 300,
        memorySize: 256,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda/reporter'),
        }),
        environment: {
          variables: {
            BUCKET_NAME: complianceBucket.bucket,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-reporter-${environmentSuffix}`,
          Purpose: 'Daily compliance report generation',
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [reporterLogGroup, reporterPolicy] }
    );

    // EventBridge Rule for scanner (every 6 hours)
    const scannerRule = new aws.cloudwatch.EventRule(
      `compliance-scanner-schedule-${environmentSuffix}`,
      {
        name: `compliance-scanner-schedule-${environmentSuffix}`,
        description: 'Trigger compliance scan every 6 hours',
        scheduleExpression: 'rate(6 hours)',
        tags: {
          ...tags,
          Name: `compliance-scanner-schedule-${environmentSuffix}`,
          Purpose: 'Scheduled compliance scanning',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // EventBridge Rule for reporter (daily at midnight UTC)
    const reporterRule = new aws.cloudwatch.EventRule(
      `compliance-reporter-schedule-${environmentSuffix}`,
      {
        name: `compliance-reporter-schedule-${environmentSuffix}`,
        description: 'Trigger daily compliance report generation',
        scheduleExpression: 'cron(0 0 * * ? *)',
        tags: {
          ...tags,
          Name: `compliance-reporter-schedule-${environmentSuffix}`,
          Purpose: 'Daily compliance reporting',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Lambda Permission for Scanner EventBridge
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scannerPermission = new aws.lambda.Permission(
      `compliance-scanner-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceScanner.name,
        principal: 'events.amazonaws.com',
        sourceArn: scannerRule.arn,
      },
      { parent: this }
    );

    // Lambda Permission for Reporter EventBridge
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _reporterPermission = new aws.lambda.Permission(
      `compliance-reporter-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceReporter.name,
        principal: 'events.amazonaws.com',
        sourceArn: reporterRule.arn,
      },
      { parent: this }
    );

    // EventBridge Target for Scanner
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scannerTarget = new aws.cloudwatch.EventTarget(
      `compliance-scanner-target-${environmentSuffix}`,
      {
        rule: scannerRule.name,
        arn: complianceScanner.arn,
      },
      { parent: this }
    );

    // EventBridge Target for Reporter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _reporterTarget = new aws.cloudwatch.EventTarget(
      `compliance-reporter-target-${environmentSuffix}`,
      {
        rule: reporterRule.name,
        arn: complianceReporter.arn,
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scanner Lambda failures
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scannerFailureAlarm = new aws.cloudwatch.MetricAlarm(
      `scanner-failure-alarm-${environmentSuffix}`,
      {
        name: `scanner-failure-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when compliance scanner Lambda fails',
        alarmActions: [complianceTopic.arn],
        dimensions: {
          FunctionName: complianceScanner.name,
        },
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `scanner-failure-alarm-${environmentSuffix}`,
          Purpose: 'Scanner failure monitoring',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scanner Lambda duration >5 minutes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scannerDurationAlarm = new aws.cloudwatch.MetricAlarm(
      `scanner-duration-alarm-${environmentSuffix}`,
      {
        name: `scanner-duration-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Maximum',
        threshold: 300000, // 5 minutes in milliseconds
        alarmDescription:
          'Alert when scanner Lambda duration exceeds 5 minutes',
        alarmActions: [complianceTopic.arn],
        dimensions: {
          FunctionName: complianceScanner.name,
        },
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `scanner-duration-alarm-${environmentSuffix}`,
          Purpose: 'Scanner duration monitoring',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Reporter Lambda failures
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _reporterFailureAlarm = new aws.cloudwatch.MetricAlarm(
      `reporter-failure-alarm-${environmentSuffix}`,
      {
        name: `reporter-failure-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when compliance reporter Lambda fails',
        alarmActions: [complianceTopic.arn],
        dimensions: {
          FunctionName: complianceReporter.name,
        },
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `reporter-failure-alarm-${environmentSuffix}`,
          Purpose: 'Reporter failure monitoring',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Reporter Lambda duration >5 minutes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _reporterDurationAlarm = new aws.cloudwatch.MetricAlarm(
      `reporter-duration-alarm-${environmentSuffix}`,
      {
        name: `reporter-duration-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Maximum',
        threshold: 300000, // 5 minutes in milliseconds
        alarmDescription:
          'Alert when reporter Lambda duration exceeds 5 minutes',
        alarmActions: [complianceTopic.arn],
        dimensions: {
          FunctionName: complianceReporter.name,
        },
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `reporter-duration-alarm-${environmentSuffix}`,
          Purpose: 'Reporter duration monitoring',
          Environment: environmentSuffix,
        },
      },
      { parent: this }
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
                region: 'us-east-1',
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
                    {
                      stat: 'Average',
                      label: 'Non-Compliant',
                      color: '#d62728',
                    },
                  ],
                ],
                view: 'timeSeries',
                stacked: false,
                region: 'us-east-1',
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
                  [
                    'AWS/Lambda',
                    'Errors',
                    { stat: 'Sum', label: 'Scanner Errors' },
                  ],
                  ['...', { stat: 'Sum', label: 'Reporter Errors' }],
                ],
                view: 'timeSeries',
                stacked: false,
                region: 'us-east-1',
                title: 'Lambda Function Errors',
                period: 300,
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
                  [
                    'EC2Compliance',
                    'CompliancePercentage',
                    { stat: 'Average' },
                  ],
                ],
                view: 'singleValue',
                region: 'us-east-1',
                title: 'Current Compliance Rate',
                period: 21600,
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Set outputs
    this.bucketName = complianceBucket.id;
    this.topicArn = complianceTopic.arn;
    this.scannerFunctionName = complianceScanner.name;
    this.scannerFunctionArn = complianceScanner.arn;
    this.reporterFunctionName = complianceReporter.name;
    this.reporterFunctionArn = complianceReporter.arn;
    this.dashboardName = complianceDashboard.dashboardName;
    this.scannerLogGroupName = scannerLogGroup.name;
    this.reporterLogGroupName = reporterLogGroup.name;

    this.registerOutputs({
      bucketName: this.bucketName,
      topicArn: this.topicArn,
      scannerFunctionName: this.scannerFunctionName,
      scannerFunctionArn: this.scannerFunctionArn,
      reporterFunctionName: this.reporterFunctionName,
      reporterFunctionArn: this.reporterFunctionArn,
      dashboardName: this.dashboardName,
      scannerLogGroupName: this.scannerLogGroupName,
      reporterLogGroupName: this.reporterLogGroupName,
    });
  }
}
