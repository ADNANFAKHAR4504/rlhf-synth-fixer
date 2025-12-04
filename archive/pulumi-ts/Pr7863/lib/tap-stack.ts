import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { buildSync } from 'esbuild';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create S3 bucket for compliance reports
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
        tags: {
          ...tags,
          Name: `compliance-reports-${environmentSuffix}`,
          Purpose: 'Compliance report storage',
        },
      },
      { parent: this }
    );

    // Create SNS topic for notifications
    const snsTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: 'Compliance Scanner Alerts',
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create SNS email subscription (email will be set via Pulumi config)
    const config = new pulumi.Config();
    const alertEmail =
      config.get('alertEmail') || 'compliance-team@example.com';

    new aws.sns.TopicSubscription(
      `compliance-email-sub-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: alertEmail,
      },
      { parent: this }
    );

    // Create IAM role for Lambda
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
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach read-only access for resource scanning
    new aws.iam.RolePolicyAttachment(
      `lambda-readonly-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
      },
      { parent: this }
    );

    // Create inline policy for S3 write and SNS publish
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        name: `compliance-scanner-policy-${environmentSuffix}`,
        role: lambdaRole.id,
        policy: pulumi
          .all([reportBucket.arn, snsTopic.arn])
          .apply(([bucketArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
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
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CloudWatch log group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/compliance-scanner-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `compliance-scanner-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Bundle Lambda code
    const lambdaCodePath = path.join(__dirname, 'lambda');

    // Bundle Lambda function with esbuild
    const buildDir = path.join(__dirname, '..', '.build', 'lambda');
    /* istanbul ignore next */
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    buildSync({
      entryPoints: [path.join(lambdaCodePath, 'compliance-scanner.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(buildDir, 'index.js'),
      external: [
        '@aws-sdk/client-s3',
        '@aws-sdk/client-sns',
        '@aws-sdk/client-cloudwatch',
        '@aws-sdk/client-ec2',
        '@aws-sdk/client-rds',
      ],
    });

    // Create Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            path.join(buildDir, 'index.js')
          ),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.bucket,
            SNS_TOPIC_ARN: snsTopic.arn,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [logGroup, lambdaPolicy] }
    );

    // Create EventBridge rule to trigger Lambda every 6 hours
    const eventRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${environmentSuffix}`,
      {
        name: `compliance-scan-schedule-${environmentSuffix}`,
        description: 'Trigger compliance scan every 6 hours',
        scheduleExpression: 'rate(6 hours)',
        tags: {
          ...tags,
          Name: `compliance-scan-schedule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `eventbridge-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: eventRule.arn,
      },
      { parent: this }
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-scan-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this }
    );

    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-dashboard-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'ComplianceScanner',
                    'ComplianceViolations',
                    { stat: 'Sum', label: 'Total Violations' },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: aws.config.region || 'us-east-1',
                title: 'Compliance Violations Over Time',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'ComplianceScanner',
                    'ComplianceViolations',
                    'ResourceType',
                    'EC2Instance',
                  ],
                  [
                    'ComplianceScanner',
                    'ComplianceViolations',
                    'ResourceType',
                    'S3Bucket',
                  ],
                  [
                    'ComplianceScanner',
                    'ComplianceViolations',
                    'ResourceType',
                    'RDSInstance',
                  ],
                  [
                    'ComplianceScanner',
                    'ComplianceViolations',
                    'ResourceType',
                    'EBSVolume',
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: aws.config.region || 'us-east-1',
                title: 'Violations by Resource Type',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'log',
              properties: {
                query: `SOURCE '/aws/lambda/compliance-scanner-${environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
                region: aws.config.region || 'us-east-1',
                title: 'Recent Lambda Executions',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch alarm for high violation count
    new aws.cloudwatch.MetricAlarm(
      `compliance-high-violations-${environmentSuffix}`,
      {
        name: `compliance-high-violations-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ComplianceViolations',
        namespace: 'ComplianceScanner',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when compliance violations exceed 10',
        alarmActions: [snsTopic.arn],
        tags: {
          ...tags,
          Name: `compliance-high-violations-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.reportBucketName = reportBucket.bucket;
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      reportBucketName: this.reportBucketName,
      snsTopicArn: this.snsTopicArn,
      dashboardName: dashboard.dashboardName,
    });
  }
}
