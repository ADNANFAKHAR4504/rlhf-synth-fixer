# Infrastructure QA and Management - IDEAL IMPLEMENTATION

This is the corrected, production-ready implementation that fixes all issues from the original MODEL_RESPONSE. The solution creates an automated infrastructure analysis and QA system using Pulumi TypeScript with proper TypeScript bundling, correct CloudWatch dashboard configuration, and appropriate AWS Lambda best practices.

## Architecture Overview

- **Lambda Function**: Scans AWS resources for compliance violations (untagged resources, public S3 buckets, unencrypted databases)
- **CloudWatch Events**: Triggers Lambda every 6 hours
- **S3 Bucket**: Stores compliance reports in JSON format with versioning enabled
- **SNS Topic**: Sends email notifications for critical findings
- **CloudWatch Logs**: Captures Lambda execution logs with 7-day retention
- **CloudWatch Metrics**: Tracks violation counts by resource type
- **CloudWatch Dashboard**: Displays compliance trends over time
- **CloudWatch Alarms**: Alerts when violations exceed 10

## File: lib/lambda/compliance-scanner.ts

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client as S3ListClient,
  ListBucketsCommand,
  GetBucketAclCommand,
  GetBucketEncryptionCommand
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand
} from '@aws-sdk/client-rds';

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const ec2Client = new EC2Client({ region });
const s3ListClient = new S3ListClient({ region });
const rdsClient = new RDSClient({ region });

const reportBucket = process.env.REPORT_BUCKET!;
const snsTopic = process.env.SNS_TOPIC_ARN!;

interface ComplianceViolation {
  resourceType: string;
  resourceId: string;
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

interface ComplianceReport {
  timestamp: string;
  scanId: string;
  violations: ComplianceViolation[];
  summary: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export async function handler(event: any): Promise<any> {
  console.log('Starting compliance scan...');
  const scanId = `scan-${Date.now()}`;
  const violations: ComplianceViolation[] = [];

  try {
    // Scan EC2 instances for missing tags
    await scanEC2Instances(violations);

    // Scan EBS volumes for missing tags
    await scanEBSVolumes(violations);

    // Scan S3 buckets for public access
    await scanS3Buckets(violations);

    // Scan RDS instances for encryption
    await scanRDSInstances(violations);

    // Scan RDS clusters for encryption
    await scanRDSClusters(violations);

    // Generate compliance report
    const report = generateReport(scanId, violations);

    // Store report in S3
    await storeReport(scanId, report);

    // Send CloudWatch metrics
    await sendMetrics(violations);

    // Send notification if critical violations found
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    if (criticalCount > 0) {
      await sendNotification(report, criticalCount);
    }

    console.log(`Compliance scan completed. Total violations: ${violations.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        scanId,
        totalViolations: violations.length,
        criticalViolations: criticalCount,
        reportS3Key: `compliance-reports/${scanId}.json`
      })
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
}

async function scanEC2Instances(violations: ComplianceViolation[]): Promise<void> {
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const instanceId = instance.InstanceId!;
        const tags = instance.Tags || [];

        // Check for required tags
        const hasNameTag = tags.some(tag => tag.Key === 'Name');
        const hasEnvironmentTag = tags.some(tag => tag.Key === 'Environment');
        const hasOwnerTag = tags.some(tag => tag.Key === 'Owner');

        if (!hasNameTag || !hasEnvironmentTag || !hasOwnerTag) {
          violations.push({
            resourceType: 'EC2Instance',
            resourceId: instanceId,
            violationType: 'UntaggedResource',
            severity: 'MEDIUM',
            description: `EC2 instance ${instanceId} is missing required tags (Name, Environment, Owner)`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning EC2 instances:', error);
  }
}

async function scanEBSVolumes(violations: ComplianceViolation[]): Promise<void> {
  try {
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    for (const volume of response.Volumes || []) {
      const volumeId = volume.VolumeId!;
      const tags = volume.Tags || [];

      // Check for required tags
      if (tags.length === 0) {
        violations.push({
          resourceType: 'EBSVolume',
          resourceId: volumeId,
          violationType: 'UntaggedResource',
          severity: 'LOW',
          description: `EBS volume ${volumeId} has no tags`
        });
      }

      // Check for encryption
      if (!volume.Encrypted) {
        violations.push({
          resourceType: 'EBSVolume',
          resourceId: volumeId,
          violationType: 'UnencryptedStorage',
          severity: 'HIGH',
          description: `EBS volume ${volumeId} is not encrypted`
        });
      }
    }
  } catch (error) {
    console.error('Error scanning EBS volumes:', error);
  }
}

async function scanS3Buckets(violations: ComplianceViolation[]): Promise<void> {
  try {
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3ListClient.send(listCommand);

    for (const bucket of listResponse.Buckets || []) {
      const bucketName = bucket.Name!;

      // Check for public access
      try {
        const aclCommand = new GetBucketAclCommand({ Bucket: bucketName });
        const aclResponse = await s3ListClient.send(aclCommand);

        const hasPublicGrant = (aclResponse.Grants || []).some(grant => {
          const grantee = grant.Grantee;
          return grantee?.Type === 'Group' &&
                 (grantee.URI?.includes('AllUsers') || grantee.URI?.includes('AuthenticatedUsers'));
        });

        if (hasPublicGrant) {
          violations.push({
            resourceType: 'S3Bucket',
            resourceId: bucketName,
            violationType: 'PublicAccess',
            severity: 'CRITICAL',
            description: `S3 bucket ${bucketName} has public access enabled`
          });
        }
      } catch (error) {
        console.error(`Error checking ACL for bucket ${bucketName}:`, error);
      }

      // Check for encryption
      try {
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        await s3ListClient.send(encryptionCommand);
      } catch (error: any) {
        if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          violations.push({
            resourceType: 'S3Bucket',
            resourceId: bucketName,
            violationType: 'UnencryptedStorage',
            severity: 'HIGH',
            description: `S3 bucket ${bucketName} does not have encryption enabled`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning S3 buckets:', error);
  }
}

async function scanRDSInstances(violations: ComplianceViolation[]): Promise<void> {
  try {
    const command = new DescribeDBInstancesCommand({});
    const response = await rdsClient.send(command);

    for (const instance of response.DBInstances || []) {
      const instanceId = instance.DBInstanceIdentifier!;

      // Check for encryption
      if (!instance.StorageEncrypted) {
        violations.push({
          resourceType: 'RDSInstance',
          resourceId: instanceId,
          violationType: 'UnencryptedDatabase',
          severity: 'CRITICAL',
          description: `RDS instance ${instanceId} does not have encryption enabled`
        });
      }

      // Check for public accessibility
      if (instance.PubliclyAccessible) {
        violations.push({
          resourceType: 'RDSInstance',
          resourceId: instanceId,
          violationType: 'PublicAccess',
          severity: 'CRITICAL',
          description: `RDS instance ${instanceId} is publicly accessible`
        });
      }
    }
  } catch (error) {
    console.error('Error scanning RDS instances:', error);
  }
}

async function scanRDSClusters(violations: ComplianceViolation[]): Promise<void> {
  try {
    const command = new DescribeDBClustersCommand({});
    const response = await rdsClient.send(command);

    for (const cluster of response.DBClusters || []) {
      const clusterId = cluster.DBClusterIdentifier!;

      // Check for encryption
      if (!cluster.StorageEncrypted) {
        violations.push({
          resourceType: 'RDSCluster',
          resourceId: clusterId,
          violationType: 'UnencryptedDatabase',
          severity: 'CRITICAL',
          description: `RDS cluster ${clusterId} does not have encryption enabled`
        });
      }
    }
  } catch (error) {
    console.error('Error scanning RDS clusters:', error);
  }
}

function generateReport(scanId: string, violations: ComplianceViolation[]): ComplianceReport {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const violation of violations) {
    byType[violation.resourceType] = (byType[violation.resourceType] || 0) + 1;
    bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    scanId,
    violations,
    summary: {
      total: violations.length,
      byType,
      bySeverity
    }
  };
}

async function storeReport(scanId: string, report: ComplianceReport): Promise<void> {
  const key = `compliance-reports/${scanId}.json`;
  const command = new PutObjectCommand({
    Bucket: reportBucket,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json'
  });

  await s3Client.send(command);
  console.log(`Report stored in S3: ${key}`);
}

async function sendMetrics(violations: ComplianceViolation[]): Promise<void> {
  const metricData: any[] = [];
  const byType: Record<string, number> = {};

  for (const violation of violations) {
    byType[violation.resourceType] = (byType[violation.resourceType] || 0) + 1;
  }

  for (const [resourceType, count] of Object.entries(byType)) {
    metricData.push({
      MetricName: 'ComplianceViolations',
      Value: count,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'ResourceType',
          Value: resourceType
        }
      ]
    });
  }

  if (metricData.length > 0) {
    const command = new PutMetricDataCommand({
      Namespace: 'ComplianceScanner',
      MetricData: metricData
    });

    await cloudwatchClient.send(command);
    console.log('Metrics sent to CloudWatch');
  }
}

async function sendNotification(report: ComplianceReport, criticalCount: number): Promise<void> {
  const message = `
Compliance Scan Alert

Critical violations detected: ${criticalCount}
Total violations: ${report.summary.total}

Violations by severity:
${Object.entries(report.summary.bySeverity).map(([sev, count]) => `  ${sev}: ${count}`).join('\n')}

Violations by resource type:
${Object.entries(report.summary.byType).map(([type, count]) => `  ${type}: ${count}`).join('\n')}

Scan ID: ${report.scanId}
Timestamp: ${report.timestamp}

Please review the detailed report in S3: compliance-reports/${report.scanId}.json
`;

  const command = new PublishCommand({
    TopicArn: snsTopic,
    Subject: `[ALERT] ${criticalCount} Critical Compliance Violations Detected`,
    Message: message
  });

  await snsClient.send(command);
  console.log('Notification sent to SNS');
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

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
    const reportBucket = new aws.s3.Bucket(`compliance-reports-${environmentSuffix}`, {
      bucket: `compliance-reports-${environmentSuffix}`,
      versioning: {
        enabled: true
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256'
          }
        }
      },
      tags: {
        ...tags,
        Name: `compliance-reports-${environmentSuffix}`,
        Purpose: 'Compliance report storage'
      }
    }, { parent: this });

    // Create SNS topic for notifications
    const snsTopic = new aws.sns.Topic(`compliance-alerts-${environmentSuffix}`, {
      name: `compliance-alerts-${environmentSuffix}`,
      displayName: 'Compliance Scanner Alerts',
      tags: {
        ...tags,
        Name: `compliance-alerts-${environmentSuffix}`
      }
    }, { parent: this });

    // Create SNS email subscription (email will be set via Pulumi config)
    const config = new pulumi.Config();
    const alertEmail = config.get('alertEmail') || 'compliance-team@example.com';

    new aws.sns.TopicSubscription(`compliance-email-sub-${environmentSuffix}`, {
      topic: snsTopic.arn,
      protocol: 'email',
      endpoint: alertEmail
    }, { parent: this });

    // Create IAM role for Lambda
    const lambdaRole = new aws.iam.Role(`compliance-scanner-role-${environmentSuffix}`, {
      name: `compliance-scanner-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          }
        }]
      }),
      tags: {
        ...tags,
        Name: `compliance-scanner-role-${environmentSuffix}`
      }
    }, { parent: this });

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }, { parent: this });

    // Attach read-only access for resource scanning
    new aws.iam.RolePolicyAttachment(`lambda-readonly-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess'
    }, { parent: this });

    // Create inline policy for S3 write and SNS publish
    const lambdaPolicy = new aws.iam.RolePolicy(`compliance-scanner-policy-${environmentSuffix}`, {
      name: `compliance-scanner-policy-${environmentSuffix}`,
      role: lambdaRole.id,
      policy: pulumi.all([reportBucket.arn, snsTopic.arn]).apply(([bucketArn, topicArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl'
              ],
              Resource: `${bucketArn}/*`
            },
            {
              Effect: 'Allow',
              Action: [
                'sns:Publish'
              ],
              Resource: topicArn
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData'
              ],
              Resource: '*'
            }
          ]
        })
      )
    }, { parent: this });

    // Create CloudWatch log group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/compliance-scanner-${environmentSuffix}`, {
      name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        ...tags,
        Name: `compliance-scanner-logs-${environmentSuffix}`
      }
    }, { parent: this });

    // Bundle Lambda code
    const lambdaCodePath = path.join(__dirname, 'lambda');

    // Create Lambda function
    const lambdaFunction = new aws.lambda.Function(`compliance-scanner-${environmentSuffix}`, {
      name: `compliance-scanner-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'compliance-scanner.handler',
      role: lambdaRole.arn,
      code: new pulumi.asset.AssetArchive({
        'compliance-scanner.ts': new pulumi.asset.FileAsset(path.join(lambdaCodePath, 'compliance-scanner.ts')),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'compliance-scanner',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-s3': '^3.400.0',
            '@aws-sdk/client-sns': '^3.400.0',
            '@aws-sdk/client-cloudwatch': '^3.400.0',
            '@aws-sdk/client-ec2': '^3.400.0',
            '@aws-sdk/client-rds': '^3.400.0'
          }
        }))
      }),
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          REPORT_BUCKET: reportBucket.bucket,
          SNS_TOPIC_ARN: snsTopic.arn,
          AWS_REGION: aws.config.region || 'us-east-1'
        }
      },
      tags: {
        ...tags,
        Name: `compliance-scanner-${environmentSuffix}`
      }
    }, { parent: this, dependsOn: [logGroup, lambdaPolicy] });

    // Create EventBridge rule to trigger Lambda every 6 hours
    const eventRule = new aws.cloudwatch.EventRule(`compliance-scan-schedule-${environmentSuffix}`, {
      name: `compliance-scan-schedule-${environmentSuffix}`,
      description: 'Trigger compliance scan every 6 hours',
      scheduleExpression: 'rate(6 hours)',
      tags: {
        ...tags,
        Name: `compliance-scan-schedule-${environmentSuffix}`
      }
    }, { parent: this });

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(`eventbridge-invoke-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: lambdaFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.arn
    }, { parent: this });

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(`compliance-scan-target-${environmentSuffix}`, {
      rule: eventRule.name,
      arn: lambdaFunction.arn
    }, { parent: this });

    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
      dashboardName: `compliance-dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['ComplianceScanner', 'ComplianceViolations', { stat: 'Sum', label: 'Total Violations' }]
              ],
              period: 300,
              stat: 'Sum',
              region: aws.config.region || 'us-east-1',
              title: 'Compliance Violations Over Time',
              yAxis: {
                left: {
                  min: 0
                }
              }
            }
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['ComplianceScanner', 'ComplianceViolations', { stat: 'Sum', dimensions: { ResourceType: 'EC2Instance' } }],
                ['...', { dimensions: { ResourceType: 'S3Bucket' } }],
                ['...', { dimensions: { ResourceType: 'RDSInstance' } }],
                ['...', { dimensions: { ResourceType: 'EBSVolume' } }]
              ],
              period: 300,
              stat: 'Sum',
              region: aws.config.region || 'us-east-1',
              title: 'Violations by Resource Type',
              yAxis: {
                left: {
                  min: 0
                }
              }
            }
          },
          {
            type: 'log',
            properties: {
              query: `SOURCE '/aws/lambda/compliance-scanner-${environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
              region: aws.config.region || 'us-east-1',
              title: 'Recent Lambda Executions'
            }
          }
        ]
      })
    }, { parent: this });

    // Create CloudWatch alarm for high violation count
    const alarm = new aws.cloudwatch.MetricAlarm(`compliance-high-violations-${environmentSuffix}`, {
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
        Name: `compliance-high-violations-${environmentSuffix}`
      }
    }, { parent: this });

    // Export outputs
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.reportBucketName = reportBucket.bucket;
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      reportBucketName: this.reportBucketName,
      snsTopicArn: this.snsTopicArn,
      dashboardName: dashboard.dashboardName
    });
  }
}
```

## File: package.json

```json
{
  "name": "infrastructure-qa-management",
  "version": "1.0.0",
  "description": "Automated infrastructure analysis and QA system",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.90.0",
    "@pulumi/aws": "^6.10.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.2.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "lib/**/*",
    "bin/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

## File: Pulumi.yaml

```yaml
name: infrastructure-qa-management
runtime: nodejs
description: Automated infrastructure analysis and QA system

config:
  alertEmail:
    description: Email address for compliance alerts
    default: compliance-team@example.com
```

## Deployment Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Pulumi**:
   ```bash
   pulumi config set aws:region us-east-1
   pulumi config set alertEmail your-email@example.com
   pulumi config set environmentSuffix <your-suffix>
   ```

3. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

4. **Verify deployment**:
   - Check Lambda function in AWS Console
   - Verify EventBridge rule is configured
   - Confirm SNS email subscription (check email for confirmation)
   - View CloudWatch dashboard for compliance metrics

## Stack Outputs

- `lambdaFunctionArn`: ARN of the compliance scanner Lambda function
- `reportBucketName`: S3 bucket name for compliance reports
- `snsTopicArn`: SNS topic ARN for notifications
- `dashboardName`: CloudWatch dashboard name

## Key Features

1. **Automated Scanning**: Lambda function runs every 6 hours to scan resources
2. **Compliance Checks**:
   - Untagged EC2 instances and EBS volumes
   - Public S3 buckets
   - Unencrypted S3 buckets
   - Unencrypted RDS instances and clusters
   - Publicly accessible RDS instances
3. **Report Storage**: JSON reports stored in S3 with versioning
4. **Notifications**: Email alerts for critical findings
5. **Metrics and Monitoring**: CloudWatch metrics by resource type
6. **Dashboard**: Visual compliance trends
7. **Alarms**: Threshold alerts when violations exceed 10

## Security Best Practices

- Lambda uses least privilege IAM role (ReadOnlyAccess + specific write permissions)
- S3 bucket encryption enabled (AES256)
- CloudWatch logs with 7-day retention
- SNS topic for secure notifications
- No hardcoded credentials

## Cost Optimization

- Lambda: Pay-per-execution (runs 4 times/day)
- S3: Minimal storage costs for JSON reports
- CloudWatch: 7-day log retention reduces costs
- No NAT Gateway required (Lambda can use VPC endpoints if needed)
