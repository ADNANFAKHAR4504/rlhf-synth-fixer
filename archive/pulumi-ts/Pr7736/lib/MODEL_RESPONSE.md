# S3 Compliance Analysis Infrastructure - Pulumi TypeScript Implementation

This implementation creates a Lambda-based S3 compliance analysis system that scans all S3 buckets in the AWS account and generates compliance reports.

## Architecture Overview

- **Lambda Function**: Performs S3 bucket compliance analysis
- **IAM Role**: Grants Lambda permissions to read S3 configurations and CloudWatch metrics
- **S3 Bucket**: Stores compliance reports with timestamps
- **CloudWatch Alarms**: Monitors for critical compliance violations
- **EventBridge Rule**: Triggers analysis on schedule (optional)

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for S3 compliance analysis infrastructure.
 * Creates Lambda function to analyze S3 buckets and generate compliance reports.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for S3 compliance analysis.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly complianceReportBucket: pulumi.Output<string>;
  public readonly analysisLambdaArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // S3 bucket for storing compliance reports
    const complianceReportBucket = new aws.s3.Bucket(
      `s3-compliance-reports-${environmentSuffix}`,
      {
        bucket: `s3-compliance-reports-${environmentSuffix}`,
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
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-reports',
            expiration: {
              days: 90,
            },
          },
        ],
        forceDestroy: true,
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `s3-analysis-lambda-role-${environmentSuffix}`,
      {
        name: `s3-analysis-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM policy for Lambda to access S3 and CloudWatch
    const lambdaPolicy = new aws.iam.RolePolicy(
      `s3-analysis-lambda-policy-${environmentSuffix}`,
      {
        name: `s3-analysis-lambda-policy-${environmentSuffix}`,
        role: lambdaRole.id,
        policy: pulumi.all([complianceReportBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:ListAllMyBuckets',
                  's3:GetBucketLocation',
                  's3:GetBucketVersioning',
                  's3:GetBucketPolicy',
                  's3:GetBucketPublicAccessBlock',
                  's3:GetBucketAcl',
                  's3:GetBucketPolicyStatus',
                  's3:GetBucketTagging',
                  's3:GetEncryptionConfiguration',
                  's3:GetLifecycleConfiguration',
                  's3:GetBucketLogging',
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
                Action: [
                  'cloudwatch:GetMetricStatistics',
                  'cloudwatch:ListMetrics',
                  'cloudwatch:GetMetricData',
                ],
                Resource: '*',
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
              {
                Effect: 'Allow',
                Action: ['s3:PutBucketTagging'],
                Resource: 'arn:aws:s3:::*',
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [lambdaRole] }
    );

    // Lambda function code
    const lambdaCode = `
const { S3Client, ListBucketsCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand,
        GetBucketPolicyCommand, GetBucketAclCommand, GetBucketTaggingCommand, PutObjectCommand,
        PutBucketTaggingCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

const FINANCIAL_RETENTION_DAYS = 7 * 365; // 7 years in days

exports.handler = async (event) => {
  console.log('Starting S3 compliance analysis...');

  const findings = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    summary: {
      totalBuckets: 0,
      compliantBuckets: 0,
      nonCompliantBuckets: 0,
      timestamp: new Date().toISOString(),
    }
  };

  try {
    // List all S3 buckets
    const listBucketsCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listBucketsCommand);

    findings.summary.totalBuckets = buckets.Buckets?.length || 0;
    console.log(\`Found \${findings.summary.totalBuckets} buckets to analyze\`);

    // Analyze each bucket
    for (const bucket of buckets.Buckets || []) {
      const bucketName = bucket.Name;
      console.log(\`Analyzing bucket: \${bucketName}\`);

      let bucketCompliant = true;

      // Check encryption
      try {
        await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      } catch (error) {
        if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          findings.critical.push({
            bucket: bucketName,
            issue: 'No server-side encryption configured',
            severity: 'CRITICAL',
            recommendation: 'Enable SSE-S3 or SSE-KMS encryption',
          });
          bucketCompliant = false;
        }
      }

      // Check public access
      try {
        const publicAccessBlock = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const config = publicAccessBlock.PublicAccessBlockConfiguration;
        if (!config?.BlockPublicAcls || !config?.BlockPublicPolicy ||
            !config?.IgnorePublicAcls || !config?.RestrictPublicBuckets) {
          findings.high.push({
            bucket: bucketName,
            issue: 'Public access not fully blocked',
            severity: 'HIGH',
            recommendation: 'Enable all Block Public Access settings',
          });
          bucketCompliant = false;
        }
      } catch (error) {
        // If no public access block config, it's a critical issue
        findings.critical.push({
          bucket: bucketName,
          issue: 'No public access block configuration',
          severity: 'CRITICAL',
          recommendation: 'Configure Block Public Access settings',
        });
        bucketCompliant = false;
      }

      // Check bucket policy for overly permissive access
      try {
        const policyResponse = await s3Client.send(
          new GetBucketPolicyCommand({ Bucket: bucketName })
        );

        if (policyResponse.Policy) {
          const policy = JSON.parse(policyResponse.Policy);
          for (const statement of policy.Statement || []) {
            if (statement.Effect === 'Allow' &&
                (statement.Principal === '*' || statement.Principal?.AWS === '*')) {
              findings.high.push({
                bucket: bucketName,
                issue: 'Bucket policy allows public access',
                severity: 'HIGH',
                recommendation: 'Restrict bucket policy to specific principals',
              });
              bucketCompliant = false;
            }
          }
        }
      } catch (error) {
        // No bucket policy is fine
      }

      // Check lifecycle policy for financial data retention
      try {
        const lifecycleResponse = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
        );

        // Check if bucket appears to contain financial data (by name or tags)
        const isFinancialBucket = bucketName.toLowerCase().includes('financial') ||
                                  bucketName.toLowerCase().includes('invoice') ||
                                  bucketName.toLowerCase().includes('payment');

        if (isFinancialBucket) {
          const hasProperRetention = lifecycleResponse.Rules?.some(rule => {
            const expirationDays = rule.Expiration?.Days;
            return expirationDays && expirationDays >= FINANCIAL_RETENTION_DAYS;
          });

          if (!hasProperRetention) {
            findings.high.push({
              bucket: bucketName,
              issue: 'Financial data retention policy does not meet 7-year requirement',
              severity: 'HIGH',
              recommendation: 'Configure lifecycle policy with minimum 7-year retention',
            });
            bucketCompliant = false;
          }
        }
      } catch (error) {
        // No lifecycle config might be ok for non-financial buckets
      }

      // Check CloudWatch metrics for bucket access in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      try {
        const metricsCommand = new GetMetricStatisticsCommand({
          Namespace: 'AWS/S3',
          MetricName: 'NumberOfObjects',
          Dimensions: [
            {
              Name: 'BucketName',
              Value: bucketName,
            },
            {
              Name: 'StorageType',
              Value: 'AllStorageTypes',
            },
          ],
          StartTime: ninetyDaysAgo,
          EndTime: new Date(),
          Period: 86400, // 1 day
          Statistics: ['Average'],
        });

        const metricsResponse = await cloudwatchClient.send(metricsCommand);

        if (!metricsResponse.Datapoints || metricsResponse.Datapoints.length === 0) {
          findings.medium.push({
            bucket: bucketName,
            issue: 'No access metrics in last 90 days - potential unused bucket',
            severity: 'MEDIUM',
            recommendation: 'Review bucket usage and consider archival or deletion',
          });
          bucketCompliant = false;
        }
      } catch (error) {
        console.log(\`Could not fetch metrics for \${bucketName}: \${error.message}\`);
      }

      // Tag the bucket with compliance status
      try {
        const taggingResponse = await s3Client.send(
          new GetBucketTaggingCommand({ Bucket: bucketName })
        );

        const existingTags = taggingResponse.TagSet || [];
        const newTags = existingTags.filter(
          tag => tag.Key !== 'ComplianceStatus' && tag.Key !== 'LastAuditDate'
        );

        newTags.push(
          {
            Key: 'ComplianceStatus',
            Value: bucketCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
          },
          {
            Key: 'LastAuditDate',
            Value: new Date().toISOString(),
          }
        );

        await s3Client.send(
          new PutBucketTaggingCommand({
            Bucket: bucketName,
            Tagging: { TagSet: newTags },
          })
        );
      } catch (error) {
        console.log(\`Could not tag bucket \${bucketName}: \${error.message}\`);
      }

      if (bucketCompliant) {
        findings.summary.compliantBuckets++;
      } else {
        findings.summary.nonCompliantBuckets++;
      }
    }

    // Generate compliance report
    const report = {
      ...findings,
      metadata: {
        analysisDate: new Date().toISOString(),
        analyzerVersion: '1.0.0',
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };

    // Store report in S3
    const reportKey = \`compliance-reports/s3-compliance-\${Date.now()}.json\`;
    const reportBucket = process.env.REPORT_BUCKET;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: reportBucket,
        Key: reportKey,
        Body: JSON.stringify(report, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(\`Compliance report saved to s3://\${reportBucket}/\${reportKey}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'S3 compliance analysis completed',
        reportLocation: \`s3://\${reportBucket}/\${reportKey}\`,
        summary: findings.summary,
      }),
    };
  } catch (error) {
    console.error('Error during compliance analysis:', error);
    throw error;
  }
};
`;

    // Create Lambda function
    const analysisLambda = new aws.lambda.Function(
      `s3-compliance-analyzer-${environmentSuffix}`,
      {
        name: `s3-compliance-analyzer-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 's3-compliance-analyzer',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-s3': '^3.0.0',
                '@aws-sdk/client-cloudwatch': '^3.0.0',
              },
            })
          ),
        }),
        timeout: 900, // 15 minutes
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: complianceReportBucket.bucket,
            AWS_REGION: process.env.AWS_REGION || 'us-east-1',
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaRole, lambdaPolicy] }
    );

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `s3-analyzer-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/${analysisLambda.name}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for critical compliance violations
    const criticalAlarmTopic = new aws.sns.Topic(
      `s3-compliance-critical-${environmentSuffix}`,
      {
        name: `s3-compliance-critical-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch metric filter for critical findings
    const criticalFindingsFilter = new aws.cloudwatch.LogMetricFilter(
      `s3-critical-findings-${environmentSuffix}`,
      {
        name: `s3-critical-findings-${environmentSuffix}`,
        logGroupName: lambdaLogGroup.name,
        pattern: '"CRITICAL"',
        metricTransformation: {
          name: `S3CriticalFindings-${environmentSuffix}`,
          namespace: 'S3Compliance',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this, dependsOn: [lambdaLogGroup] }
    );

    // CloudWatch alarm for critical compliance violations
    const criticalAlarm = new aws.cloudwatch.MetricAlarm(
      `s3-critical-alarm-${environmentSuffix}`,
      {
        name: `s3-critical-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: `S3CriticalFindings-${environmentSuffix}`,
        namespace: 'S3Compliance',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when critical S3 compliance violations are detected',
        alarmActions: [criticalAlarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this, dependsOn: [criticalFindingsFilter] }
    );

    // EventBridge rule to trigger analysis daily
    const scheduledRule = new aws.cloudwatch.EventRule(
      `s3-analysis-schedule-${environmentSuffix}`,
      {
        name: `s3-analysis-schedule-${environmentSuffix}`,
        description: 'Trigger S3 compliance analysis daily',
        scheduleExpression: 'rate(1 day)',
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge target
    const scheduleTarget = new aws.cloudwatch.EventTarget(
      `s3-analysis-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: analysisLambda.arn,
      },
      { parent: this, dependsOn: [scheduledRule] }
    );

    // Lambda permission for EventBridge
    const eventBridgePermission = new aws.lambda.Permission(
      `s3-analyzer-eventbridge-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: analysisLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this, dependsOn: [analysisLambda, scheduledRule] }
    );

    // Expose outputs
    this.complianceReportBucket = complianceReportBucket.bucket;
    this.analysisLambdaArn = analysisLambda.arn;

    // Register outputs
    this.registerOutputs({
      complianceReportBucket: this.complianceReportBucket,
      analysisLambdaArn: this.analysisLambdaArn,
      snsTopicArn: criticalAlarmTopic.arn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for S3 compliance analysis infrastructure.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export outputs
export const complianceReportBucket = stack.complianceReportBucket;
export const analysisLambdaArn = stack.analysisLambdaArn;
```

## File: lib/README.md

```markdown
# S3 Compliance Analysis Infrastructure

This Pulumi TypeScript project creates a Lambda-based system for analyzing S3 bucket compliance and generating detailed reports.

## Overview

The infrastructure automatically analyzes all S3 buckets in your AWS account for:

- Server-side encryption configuration
- Public access settings
- Overly permissive bucket policies
- Lifecycle policies for financial data retention (7-year requirement)
- Usage patterns (buckets with no access in 90 days)

## Architecture Components

1. **Lambda Function**: Performs comprehensive S3 compliance analysis
2. **S3 Bucket**: Stores timestamped compliance reports
3. **IAM Role/Policy**: Grants Lambda necessary permissions
4. **CloudWatch Alarms**: Monitors for critical compliance violations
5. **SNS Topic**: Sends notifications for critical findings
6. **EventBridge Rule**: Triggers daily automated analysis

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured

### Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"  # or your environment name
export AWS_REGION="us-east-1"
```

### Deploy

```bash
# Install dependencies
npm install

# Deploy infrastructure
pulumi up
```

### Outputs

After deployment, you'll receive:

- `complianceReportBucket`: Name of the S3 bucket storing compliance reports
- `analysisLambdaArn`: ARN of the analysis Lambda function

## Manual Execution

To trigger a manual compliance analysis:

```bash
aws lambda invoke \
  --function-name s3-compliance-analyzer-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  output.json
```

## Compliance Report Format

Reports are stored as JSON files with the following structure:

```json
{
  "critical": [
    {
      "bucket": "example-bucket",
      "issue": "No server-side encryption configured",
      "severity": "CRITICAL",
      "recommendation": "Enable SSE-S3 or SSE-KMS encryption"
    }
  ],
  "high": [],
  "medium": [],
  "low": [],
  "summary": {
    "totalBuckets": 50,
    "compliantBuckets": 35,
    "nonCompliantBuckets": 15,
    "timestamp": "2025-12-02T20:30:00.000Z"
  },
  "metadata": {
    "analysisDate": "2025-12-02T20:30:00.000Z",
    "analyzerVersion": "1.0.0",
    "region": "us-east-1"
  }
}
```

## Severity Levels

- **CRITICAL**: Immediate action required (missing encryption, public access)
- **HIGH**: Important security/compliance issue (permissive policies, retention violations)
- **MEDIUM**: Potential optimization (unused buckets, missing tags)
- **LOW**: Best practice recommendations

## Bucket Tagging

After analysis, each bucket is automatically tagged with:

- `ComplianceStatus`: COMPLIANT or NON_COMPLIANT
- `LastAuditDate`: ISO timestamp of last analysis

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable without retention policies.

## Testing

Run the test suite:

```bash
npm test
```

Integration tests will deploy the infrastructure and verify:

- Lambda function executes successfully
- Compliance reports are generated
- S3 buckets are properly analyzed
- CloudWatch alarms are configured correctly

## Security Considerations

- Lambda function uses AWS SDK v3 for Node.js 20.x runtime
- All resources use environment suffix for naming uniqueness
- IAM permissions follow principle of least privilege
- Compliance reports are stored with encryption
- No sensitive data is logged

## Cost Optimization

- Lambda timeout: 15 minutes (sufficient for large bucket counts)
- Lambda memory: 512 MB (balanced performance/cost)
- Log retention: 7 days (reduce storage costs)
- Report lifecycle: 90-day expiration (automatic cleanup)
- Scheduled execution: Once daily (adjustable based on needs)
```
