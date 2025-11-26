# Automated Infrastructure Compliance Scanning System

This implementation provides a complete Pulumi TypeScript solution for automated compliance scanning with AWS Config, Lambda, DynamoDB, and CloudWatch integration.

## Architecture Overview

The system deploys:
- AWS Config with custom compliance rules
- Lambda functions for compliance analysis and S3 remediation
- DynamoDB for compliance history tracking
- S3 for HTML report storage
- EventBridge for hourly scheduling
- SNS for critical alerts
- SQS dead letter queue for failed executions
- CloudWatch dashboard for compliance trends

## Implementation Files

### File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly configRecorderName: pulumi.Output<string>;
  public readonly complianceTableArn: pulumi.Output<string>;
  public readonly reportBucketUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(`compliance-kms-${environmentSuffix}`, {
      description: 'KMS key for compliance system encryption',
      enableKeyRotation: true,
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`compliance-kms-alias-${environmentSuffix}`, {
      name: `alias/compliance-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // S3 Bucket for compliance reports
    const reportBucket = new aws.s3.Bucket(`compliance-reports-${environmentSuffix}`, {
      bucket: `compliance-reports-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    const reportBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-pab-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // DynamoDB Table for compliance history
    const complianceTable = new aws.dynamodb.Table(`compliance-history-${environmentSuffix}`, {
      name: `compliance-history-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'ResourceId',
      rangeKey: 'Timestamp',
      attributes: [
        { name: 'ResourceId', type: 'S' },
        { name: 'Timestamp', type: 'S' },
      ],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
      },
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    // SQS Dead Letter Queue
    const dlq = new aws.sqs.Queue(`compliance-dlq-${environmentSuffix}`, {
      name: `compliance-dlq-${environmentSuffix}`,
      kmsMasterKeyId: kmsKey.id,
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    // SNS Topic for critical alerts
    const alertTopic = new aws.sns.Topic(`compliance-alerts-${environmentSuffix}`, {
      name: `compliance-alerts-${environmentSuffix}`,
      kmsMasterKeyId: kmsKey.id,
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    // IAM Role for Lambda execution
    const lambdaRole = new aws.iam.Role(`compliance-lambda-role-${environmentSuffix}`, {
      name: `compliance-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: { Service: 'lambda.amazonaws.com' },
          Effect: 'Allow',
        }],
      }),
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Lambda policy for accessing resources
    const lambdaPolicy = new aws.iam.RolePolicy(`compliance-lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([complianceTable.arn, reportBucket.arn, alertTopic.arn, kmsKey.arn])
        .apply(([tableArn, bucketArn, topicArn, keyArn]) => JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:GetObject',
                's3:PutBucketEncryption',
              ],
              Resource: [`${bucketArn}/*`, bucketArn],
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: topicArn,
            },
            {
              Effect: 'Allow',
              Action: ['config:DescribeComplianceByConfigRule', 'config:GetComplianceDetailsByConfigRule'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
              Resource: keyArn,
            },
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
          ],
        })),
    }, { parent: this });

    // Compliance Analysis Lambda Function
    const analysisFunction = new aws.lambda.Function(
      `compliance-analysis-${environmentSuffix}`,
      {
        name: `compliance-analysis-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 3008,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } = require('@aws-sdk/client-config-service');

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});
const sns = new SNSClient({});
const config = new ConfigServiceClient({});

exports.handler = async (event) => {
  console.log('Starting compliance analysis', JSON.stringify(event));

  try {
    // Fetch compliance data from AWS Config
    const complianceData = await config.send(new DescribeComplianceByConfigRuleCommand({}));

    // Calculate compliance score
    const totalRules = complianceData.ComplianceByConfigRules?.length || 0;
    const compliantRules = complianceData.ComplianceByConfigRules?.filter(
      r => r.Compliance?.ComplianceType === 'COMPLIANT'
    ).length || 0;

    const score = totalRules > 0 ? Math.round((compliantRules / totalRules) * 100) : 100;
    const timestamp = new Date().toISOString();

    // Store in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.COMPLIANCE_TABLE,
      Item: {
        ResourceId: { S: 'global-compliance' },
        Timestamp: { S: timestamp },
        Score: { N: score.toString() },
        TotalRules: { N: totalRules.toString() },
        CompliantRules: { N: compliantRules.toString() },
      },
    }));

    // Generate HTML report
    const htmlReport = \`
      <html>
        <head><title>Compliance Report</title></head>
        <body>
          <h1>Compliance Report</h1>
          <p>Generated: \${timestamp}</p>
          <p>Compliance Score: \${score}%</p>
          <p>Total Rules: \${totalRules}</p>
          <p>Compliant: \${compliantRules}</p>
        </body>
      </html>
    \`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.REPORT_BUCKET,
      Key: \`compliance-report-\${timestamp}.html\`,
      Body: htmlReport,
      ContentType: 'text/html',
    }));

    // Send alert if critical
    if (score < 70) {
      await sns.send(new PublishCommand({
        TopicArn: process.env.ALERT_TOPIC,
        Subject: 'Critical Compliance Violation',
        Message: \`Compliance score dropped to \${score}% at \${timestamp}\`,
      }));
    }

    return { statusCode: 200, body: JSON.stringify({ score, timestamp }) };
  } catch (error) {
    console.error('Error in compliance analysis:', error);
    throw error;
  }
};
          `),
        }),
        environment: {
          variables: {
            COMPLIANCE_TABLE: complianceTable.name,
            REPORT_BUCKET: reportBucket.id,
            ALERT_TOPIC: alertTopic.arn,
          },
        },
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          ...tags,
          CostCenter: 'compliance',
          Compliance: 'high',
        },
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // S3 Remediation Lambda Function
    const remediationFunction = new aws.lambda.Function(
      `compliance-remediation-${environmentSuffix}`,
      {
        name: `compliance-remediation-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 3008,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { S3Client, PutBucketEncryptionCommand, GetBucketEncryptionCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({});

exports.handler = async (event) => {
  console.log('Starting S3 encryption remediation', JSON.stringify(event));

  try {
    const bucketName = event.detail?.configRuleName || event.bucketName;

    if (!bucketName) {
      throw new Error('Bucket name not found in event');
    }

    // Check current encryption
    try {
      await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      console.log(\`Bucket \${bucketName} already has encryption\`);
      return { statusCode: 200, body: 'Already encrypted' };
    } catch (error) {
      if (error.name !== 'ServerSideEncryptionConfigurationNotFoundError') {
        throw error;
      }
    }

    // Enable encryption
    await s3.send(new PutBucketEncryptionCommand({
      Bucket: bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [{
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        }],
      },
    }));

    console.log(\`Enabled encryption for bucket \${bucketName}\`);
    return { statusCode: 200, body: \`Encryption enabled for \${bucketName}\` };
  } catch (error) {
    console.error('Error in S3 remediation:', error);
    throw error;
  }
};
          `),
        }),
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          ...tags,
          CostCenter: 'compliance',
          Compliance: 'high',
        },
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge Rule for hourly scans
    const scanRule = new aws.cloudwatch.EventRule(`compliance-scan-${environmentSuffix}`, {
      name: `compliance-scan-${environmentSuffix}`,
      description: 'Trigger compliance scan hourly',
      scheduleExpression: 'rate(1 hour)',
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    const scanTarget = new aws.cloudwatch.EventTarget(
      `compliance-scan-target-${environmentSuffix}`,
      {
        rule: scanRule.name,
        arn: analysisFunction.arn,
      },
      { parent: this }
    );

    const scanPermission = new aws.lambda.Permission(
      `compliance-scan-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: analysisFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scanRule.arn,
      },
      { parent: this }
    );

    // AWS Config Setup
    const configBucket = new aws.s3.Bucket(`compliance-config-${environmentSuffix}`, {
      bucket: `compliance-config-${environmentSuffix}`,
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    const configRole = new aws.iam.Role(`compliance-config-role-${environmentSuffix}`, {
      name: `compliance-config-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: { Service: 'config.amazonaws.com' },
          Effect: 'Allow',
        }],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      ],
      tags: {
        ...tags,
        CostCenter: 'compliance',
        Compliance: 'high',
      },
    }, { parent: this });

    const configBucketPolicy = new aws.iam.RolePolicy(
      `compliance-config-bucket-policy-${environmentSuffix}`,
      {
        role: configRole.id,
        policy: configBucket.arn.apply(arn => JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: ['s3:PutObject'],
            Resource: `${arn}/*`,
          }],
        })),
      },
      { parent: this }
    );

    const configRecorder = new aws.cfg.Recorder(`compliance-recorder-${environmentSuffix}`, {
      name: `compliance-recorder-${environmentSuffix}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    }, { parent: this, dependsOn: [configBucketPolicy] });

    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      `compliance-delivery-${environmentSuffix}`,
      {
        name: `compliance-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.id,
      },
      { parent: this }
    );

    const configRecorderStatus = new aws.cfg.RecorderStatus(
      `compliance-recorder-status-${environmentSuffix}`,
      {
        name: configRecorder.name,
        isEnabled: true,
      },
      { parent: this, dependsOn: [configDeliveryChannel] }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
      dashboardName: `compliance-dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'Analysis Invocations' }],
                ['.', 'Errors', { stat: 'Sum', label: 'Analysis Errors' }],
              ],
              period: 3600,
              stat: 'Average',
              region: 'us-east-1',
              title: 'Compliance Analysis Metrics',
              yAxis: { left: { min: 0 } },
            },
          },
        ],
      }),
    }, { parent: this });

    // Exports
    this.configRecorderName = configRecorder.name;
    this.complianceTableArn = complianceTable.arn;
    this.reportBucketUrl = reportBucket.bucketDomainName.apply(
      domain => `https://${domain}`
    );

    this.registerOutputs({
      configRecorderName: this.configRecorderName,
      complianceTableArn: this.complianceTableArn,
      reportBucketUrl: this.reportBucketUrl,
    });
  }
}
```

### File: bin/tap.ts

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
  CostCenter: 'compliance',
  Compliance: 'high',
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

export const configRecorderName = stack.configRecorderName;
export const complianceTableArn = stack.complianceTableArn;
export const reportBucketUrl = stack.reportBucketUrl;
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install @pulumi/pulumi @pulumi/aws
```

2. Configure AWS credentials and region:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
```

3. Deploy the stack:
```bash
pulumi up
```

4. View outputs:
```bash
pulumi stack output
```

## Verification

After deployment, verify:
- AWS Config recorder is running
- Lambda functions are created with correct runtime and memory
- DynamoDB table has correct schema (ResourceId, Timestamp)
- S3 buckets have encryption and lifecycle policies
- EventBridge rule triggers hourly
- CloudWatch dashboard displays metrics
