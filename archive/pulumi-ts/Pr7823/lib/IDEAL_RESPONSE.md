# AWS Compliance Monitoring System - Correct Implementation

This is the correct, production-ready implementation of the AWS compliance monitoring system using Pulumi and TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly configRecorderName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const envSuffix = args.environmentSuffix || 'dev';
    const defaultTags = args.tags || {};

    // FIXED: S3 bucket with environmentSuffix in name
    const configBucket = new aws.s3.Bucket(`compliance-reports-${envSuffix}`, {
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
    }, { parent: this });

    // FIXED: Bucket policy allowing AWS Config to write
    const bucketPolicy = new aws.s3.BucketPolicy(`config-bucket-policy-${envSuffix}`, {
      bucket: configBucket.bucket,
      policy: pulumi.all([configBucket.arn, configBucket.bucket]).apply(([arn, bucket]) => JSON.stringify({
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
      })),
    }, { parent: this });

    // FIXED: Correct IAM policy with service-role/ prefix
    const configRole = new aws.iam.Role(`config-role-${envSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'config.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',  // CORRECT with service-role/ prefix
      ],
      tags: defaultTags,
    }, { parent: this });

    const configRecorder = new aws.cfg.Recorder(`config-recorder-${envSuffix}`, {
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    }, { parent: this });

    const deliveryChannel = new aws.cfg.DeliveryChannel(`config-delivery-${envSuffix}`, {
      s3BucketName: configBucket.bucket,
      dependsOn: [configRecorder, bucketPolicy],
    }, { parent: this });

    // FIXED: Correct Config rule source identifier
    const s3EncryptionRule = new aws.cfg.Rule(`s3-encryption-rule-${envSuffix}`, {
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',  // CORRECT identifier
      },
    }, { parent: this, dependsOn: [configRecorder] });

    const ec2TaggingRule = new aws.cfg.Rule(`ec2-tagging-rule-${envSuffix}`, {
      source: {
        owner: 'AWS',
        sourceIdentifier: 'REQUIRED_TAGS',
      },
      inputParameters: JSON.stringify({
        tag1Key: 'Environment',
        tag2Key: 'Owner',
        tag3Key: 'CostCenter',
      }),
    }, { parent: this, dependsOn: [configRecorder] });

    // FIXED: SNS topic with environmentSuffix
    const alertTopic = new aws.sns.Topic(`compliance-alerts-${envSuffix}`, {
      displayName: 'Compliance Alerts',
      tags: defaultTags,
    }, { parent: this });

    // FIXED: Lambda role with proper permissions
    const lambdaRole = new aws.iam.Role(`lambda-role-${envSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
      tags: defaultTags,
    }, { parent: this });

    // FIXED: Lambda policy for S3 and Config access
    const lambdaPolicy = new aws.iam.RolePolicy(`lambda-policy-${envSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([configBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
              's3:ListBucket',
            ],
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
            Resource: alertTopic.arn,
          },
        ],
      })),
    }, { parent: this });

    // FIXED: Lambda using Node.js 20.x with AWS SDK v3
    const complianceFunction = new aws.lambda.Function(`compliance-processor-${envSuffix}`, {
      runtime: 'nodejs20.x',  // CORRECT: Node.js 20.x
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
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'compliance-processor',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-s3': '^3.0.0',
            '@aws-sdk/client-config-service': '^3.0.0',
            '@aws-sdk/client-sns': '^3.0.0',
          },
        })),
      }),
      environment: {
        variables: {
          BUCKET_NAME: configBucket.bucket,
          SNS_TOPIC_ARN: alertTopic.arn,
        },
      },
      tags: defaultTags,
    }, { parent: this, dependsOn: [lambdaPolicy] });

    // FIXED: EventBridge schedule with correct cron format for 2 AM UTC
    const scheduleRule = new aws.cloudwatch.EventRule(`daily-schedule-${envSuffix}`, {
      scheduleExpression: 'cron(0 2 * * ? *)',  // 2 AM UTC daily
      description: 'Trigger compliance report generation daily at 2 AM UTC',
      tags: defaultTags,
    }, { parent: this });

    new aws.cloudwatch.EventTarget(`lambda-target-${envSuffix}`, {
      rule: scheduleRule.name,
      arn: complianceFunction.arn,
    }, { parent: this });

    new aws.lambda.Permission(`eventbridge-invoke-${envSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: complianceFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: scheduleRule.arn,
    }, { parent: this });

    // FIXED: CloudWatch alarm with proper configuration
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(`non-compliant-alarm-${envSuffix}`, {
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
    }, { parent: this });

    this.configRecorderName = configRecorder.name;
    this.bucketArn = configBucket.arn;
    this.lambdaFunctionName = complianceFunction.name;

    this.registerOutputs({
      configRecorderName: this.configRecorderName,
      bucketArn: this.bucketArn,
      lambdaFunctionName: this.lambdaFunctionName,
      snsTopicArn: alertTopic.arn,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('compliance-system', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'Compliance',
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

export const configRecorderName = stack.configRecorderName;
export const bucketArn = stack.bucketArn;
export const lambdaFunctionName = stack.lambdaFunctionName;
```

## File: package.json

```json
{
  "name": "aws-compliance-system",
  "version": "1.0.0",
  "main": "index.ts",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi:
```bash
pulumi config set environmentSuffix dev
pulumi config set aws:region us-east-1
```

3. Deploy the stack:
```bash
pulumi up
```

4. Verify deployment:
```bash
# Check Config recorder status
aws configservice describe-configuration-recorder-status

# List Config rules
aws configservice describe-config-rules

# Trigger Lambda manually for testing
aws lambda invoke --function-name $(pulumi stack output lambdaFunctionName) output.json
cat output.json
```

## Key Improvements

1. **All resources include environmentSuffix** - Prevents conflicts in parallel deployments
2. **Correct AWS Config IAM policy** - Uses `service-role/AWS_ConfigRole` ARN
3. **S3 bucket policy** - Allows AWS Config to write snapshots
4. **Correct Config rule identifiers** - Uses valid AWS managed rule names
5. **Lambda with Node.js 20.x** - Modern runtime with better performance
6. **AWS SDK v3** - Proper imports for Node.js 18+
7. **Comprehensive error handling** - Lambda catches and reports errors
8. **Proper IAM permissions** - Lambda can read Config and write to S3/SNS
9. **Valid EventBridge cron** - Correct format for 2 AM UTC daily
10. **Complete SNS integration** - Sends alerts for non-compliant resources
11. **Proper resource dependencies** - Ensures correct deployment order

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests (requires AWS credentials):
```bash
npm run test:integration
```