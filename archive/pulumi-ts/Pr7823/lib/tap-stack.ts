/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the AWS Compliance Checking System.
 * This stack creates a comprehensive compliance monitoring solution using AWS Config,
 * Lambda, CloudWatch, SNS, and S3.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly s3EncryptionRuleId: pulumi.Output<string>;
  public readonly ec2TaggingRuleId: pulumi.Output<string>;
  public readonly iamPasswordPolicyRuleId: pulumi.Output<string>;
  public readonly complianceAlarmArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const envSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const defaultTags = args.tags || {};

    // S3 bucket with environmentSuffix in name
    const configBucket = new aws.s3.Bucket(
      `compliance-reports-${envSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Bucket policy allowing AWS Config to write
    void new aws.s3.BucketPolicy(
      `config-bucket-policy-${envSuffix}`,
      {
        bucket: configBucket.bucket,
        policy: pulumi
          .all([configBucket.arn, configBucket.bucket])
          .apply(([arn, _bucket]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: { Service: 'config.amazonaws.com' },
                  Action: 's3:GetBucketAcl',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: { Service: 'config.amazonaws.com' },
                  Action: 's3:ListBucket',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigBucketPutObject',
                  Effect: 'Allow',
                  Principal: { Service: 'config.amazonaws.com' },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Note: AWS Config Recorder and Delivery Channel are not created here
    // because AWS allows only 1 Config Recorder per region per account.
    // This stack assumes an existing Config Recorder is already enabled in the account.
    // Config Rules will work with the existing recorder.

    // Config rule for S3 encryption
    const s3EncryptionRule = new aws.cfg.Rule(
      `s3-encryption-rule-${envSuffix}`,
      {
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      },
      { parent: this }
    );

    // Config rule for EC2 tagging
    const ec2TaggingRule = new aws.cfg.Rule(
      `ec2-tagging-rule-${envSuffix}`,
      {
        source: {
          owner: 'AWS',
          sourceIdentifier: 'REQUIRED_TAGS',
        },
        inputParameters: JSON.stringify({
          tag1Key: 'Environment',
          tag2Key: 'Owner',
          tag3Key: 'CostCenter',
        }),
      },
      { parent: this }
    );

    // Config rule for IAM password policy
    const iamPasswordPolicyRule = new aws.cfg.Rule(
      `iam-password-policy-rule-${envSuffix}`,
      {
        source: {
          owner: 'AWS',
          sourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
      },
      { parent: this }
    );

    // SNS topic for compliance alerts
    const alertTopic = new aws.sns.Topic(
      `compliance-alerts-${envSuffix}`,
      {
        displayName: 'Compliance Alerts',
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${envSuffix}`,
      {
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // Lambda policy for S3, Config, and SNS access
    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-policy-${envSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([configBucket.arn, alertTopic.arn])
          .apply(([bucketArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'config:DescribeComplianceByConfigRule',
                    'config:DescribeComplianceByResource',
                    'config:GetComplianceDetailsByConfigRule',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda function for compliance processing using Node.js 20.x with AWS SDK v3
    const complianceFunction = new aws.lambda.Function(
      `compliance-processor-${envSuffix}`,
      {
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
          const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } = require('@aws-sdk/client-config-service');
          const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

          const s3Client = new S3Client({});
          const configClient = new ConfigServiceClient({});
          const snsClient = new SNSClient({});

          exports.handler = async (event) => {
            console.log('Processing compliance results:', JSON.stringify(event));

            try {
              // Get compliance status from AWS Config
              const complianceData = await configClient.send(
                new DescribeComplianceByConfigRuleCommand({})
              );

              const report = {
                timestamp: new Date().toISOString(),
                totalRules: complianceData.ComplianceByConfigRules?.length || 0,
                compliantRules: complianceData.ComplianceByConfigRules?.filter(
                  r => r.Compliance?.ComplianceType === 'COMPLIANT'
                ).length || 0,
                nonCompliantRules: complianceData.ComplianceByConfigRules?.filter(
                  r => r.Compliance?.ComplianceType === 'NON_COMPLIANT'
                ).length || 0,
                rules: complianceData.ComplianceByConfigRules || [],
              };

              // Store report in S3
              const reportKey = \`compliance-reports/\${new Date().toISOString().split('T')[0]}/report.json\`;
              await s3Client.send(new PutObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: reportKey,
                Body: JSON.stringify(report, null, 2),
                ContentType: 'application/json',
              }));

              // Send SNS alert if non-compliant resources found
              if (report.nonCompliantRules > 0) {
                await snsClient.send(new PublishCommand({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: 'Non-Compliant Resources Detected',
                  Message: \`Compliance Report Summary:
Total Rules: \${report.totalRules}
Compliant: \${report.compliantRules}
Non-Compliant: \${report.nonCompliantRules}

Full report available at: s3://\${process.env.BUCKET_NAME}/\${reportKey}\`,
                }));
              }

              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Compliance report generated successfully',
                  report: report,
                }),
              };
            } catch (error) {
              console.error('Error processing compliance:', error);

              // Send error notification
              await snsClient.send(new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Subject: 'Compliance Report Generation Failed',
                Message: \`Error: \${error.message}\`,
              }));

              throw error;
            }
          };
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'compliance-processor',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-s3': '^3.0.0',
                '@aws-sdk/client-config-service': '^3.0.0',
                '@aws-sdk/client-sns': '^3.0.0',
              },
            })
          ),
        }),
        environment: {
          variables: {
            BUCKET_NAME: configBucket.bucket,
            SNS_TOPIC_ARN: alertTopic.arn,
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge schedule for daily 2 AM UTC execution
    const scheduleRule = new aws.cloudwatch.EventRule(
      `daily-schedule-${envSuffix}`,
      {
        scheduleExpression: 'cron(0 2 * * ? *)',
        description: 'Trigger compliance report generation daily at 2 AM UTC',
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `lambda-target-${envSuffix}`,
      {
        rule: scheduleRule.name,
        arn: complianceFunction.arn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `eventbridge-invoke-${envSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduleRule.arn,
      },
      { parent: this }
    );

    // CloudWatch alarm for non-compliant resources
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `non-compliant-alarm-${envSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'NonCompliantResourceCount',
        namespace: 'AWS/Config',
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'Alert when non-compliant resources are detected',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: defaultTags,
      },
      { parent: this }
    );

    this.bucketArn = configBucket.arn;
    this.lambdaFunctionName = complianceFunction.name;
    this.snsTopicArn = alertTopic.arn;
    this.s3EncryptionRuleId = s3EncryptionRule.id;
    this.ec2TaggingRuleId = ec2TaggingRule.id;
    this.iamPasswordPolicyRuleId = iamPasswordPolicyRule.id;
    this.complianceAlarmArn = complianceAlarm.arn;

    this.registerOutputs({
      bucketArn: this.bucketArn,
      lambdaFunctionName: this.lambdaFunctionName,
      snsTopicArn: this.snsTopicArn,
      s3EncryptionRuleId: this.s3EncryptionRuleId,
      ec2TaggingRuleId: this.ec2TaggingRuleId,
      iamPasswordPolicyRuleId: this.iamPasswordPolicyRuleId,
      complianceAlarmArn: this.complianceAlarmArn,
    });
  }
}
