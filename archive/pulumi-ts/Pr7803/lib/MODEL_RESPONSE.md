# AWS Infrastructure Compliance Analyzer - Implementation

This implementation provides a complete infrastructure compliance scanning system using Pulumi with TypeScript. The solution creates the necessary AWS infrastructure and Lambda function to scan existing resources for compliance violations.

## Architecture Overview

- **Lambda Function**: Scans EC2, S3, IAM, EBS resources for compliance
- **S3 Bucket**: Stores compliance reports with encryption
- **SNS Topic**: Sends critical violation alerts
- **CloudWatch Metrics**: Tracks violation counts
- **IAM Role**: Least-privilege permissions for Lambda

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
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // KMS key for SNS topic encryption
    const snsKmsKey = new aws.kms.Key(
      `compliance-sns-key-${environmentSuffix}`,
      {
        description: 'KMS key for SNS topic encryption',
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `compliance-sns-key-${environmentSuffix}`,
          Purpose: 'sns-encryption',
        },
      },
      { parent: this }
    );

    const snsKmsKeyAlias = new aws.kms.Alias(
      `compliance-sns-key-alias-${environmentSuffix}`,
      {
        name: `alias/compliance-sns-${environmentSuffix}`,
        targetKeyId: snsKmsKey.keyId,
      },
      { parent: this }
    );

    // SNS Topic for critical violation alerts
    const snsTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: 'Compliance Critical Alerts',
        kmsMasterKeyId: snsKmsKey.id,
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
          Purpose: 'compliance-notifications',
        },
      },
      { parent: this }
    );

    // S3 Bucket for compliance reports
    const reportBucket = new aws.s3.BucketV2(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `compliance-reports-${environmentSuffix}`,
          Purpose: 'compliance-reports',
        },
      },
      { parent: this }
    );

    // Enable versioning
    const bucketVersioning = new aws.s3.BucketVersioningV2(
      `compliance-reports-versioning-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-block-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable encryption
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `compliance-reports-encryption-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // IAM Role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
          Purpose: 'lambda-execution',
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `compliance-scanner-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for scanning and reporting
    const scannerPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([reportBucket.arn, snsTopic.arn]).apply(([bucketArn, topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeVolumes',
                  'ec2:DescribeTags',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:ListAllMyBuckets',
                  's3:GetBucketPublicAccessBlock',
                  's3:GetBucketPolicyStatus',
                  's3:GetBucketAcl',
                  's3:GetBucketPolicy',
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
                  'iam:ListRoles',
                  'iam:GetRole',
                  'iam:ListRolePolicies',
                  'iam:GetRolePolicy',
                  'iam:ListAttachedRolePolicies',
                  'iam:GetPolicy',
                  'iam:GetPolicyVersion',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'cloudwatch:namespace': 'ComplianceMonitoring',
                  },
                },
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

    // Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda', 'compliance-scanner')),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.bucket,
            SNS_TOPIC_ARN: snsTopic.arn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
          Purpose: 'compliance-scanning',
        },
      },
      { parent: this, dependsOn: [lambdaBasicExecution, scannerPolicy] }
    );

    // CloudWatch Log Group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
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

    // Outputs
    this.reportBucketName = reportBucket.bucket;
    this.snsTopicArn = snsTopic.arn;
    this.lambdaFunctionArn = lambdaFunction.arn;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      snsTopicArn: this.snsTopicArn,
      lambdaFunctionArn: this.lambdaFunctionArn,
    });
  }
}
```

## File: lib/lambda/compliance-scanner/index.ts

```typescript
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketPolicyStatusCommand,
  GetBucketAclCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const cloudwatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});

const REPORT_BUCKET = process.env.REPORT_BUCKET!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

interface Violation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  details?: any;
}

interface ComplianceReport {
  scanTimestamp: string;
  environment: string;
  totalViolations: number;
  criticalViolations: number;
  violations: Violation[];
}

export const handler = async (event: any): Promise<any> => {
  console.log('Starting compliance scan...');

  const violations: Violation[] = [];

  try {
    // 1. Check EC2 instance tag compliance
    console.log('Checking EC2 instance tags...');
    const ec2TagViolations = await checkEC2TagCompliance();
    violations.push(...ec2TagViolations);

    // 2. Check S3 bucket public access
    console.log('Checking S3 bucket public access...');
    const s3PublicViolations = await checkS3PublicAccess();
    violations.push(...s3PublicViolations);

    // 3. Check IAM role permissions
    console.log('Checking IAM role permissions...');
    const iamViolations = await checkIAMPermissions();
    violations.push(...iamViolations);

    // 4. Check EC2 CloudWatch monitoring
    console.log('Checking EC2 CloudWatch monitoring...');
    const ec2MonitoringViolations = await checkEC2Monitoring();
    violations.push(...ec2MonitoringViolations);

    // 5. Check EBS volume encryption
    console.log('Checking EBS volume encryption...');
    const ebsViolations = await checkEBSEncryption();
    violations.push(...ebsViolations);

    // Generate compliance report
    const report: ComplianceReport = {
      scanTimestamp: new Date().toISOString(),
      environment: ENVIRONMENT_SUFFIX,
      totalViolations: violations.length,
      criticalViolations: violations.filter((v) => v.severity === 'CRITICAL').length,
      violations,
    };

    // 6. Export report to S3
    console.log('Exporting report to S3...');
    await exportReportToS3(report);

    // 7. Publish CloudWatch custom metrics
    console.log('Publishing CloudWatch metrics...');
    await publishMetrics(violations);

    // 8. Send SNS notification for critical violations
    const criticalViolations = violations.filter((v) => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0) {
      console.log('Sending SNS notification for critical violations...');
      await sendCriticalAlert(criticalViolations);
    }

    console.log(`Compliance scan complete. Found ${violations.length} violations.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        totalViolations: violations.length,
        criticalViolations: criticalViolations.length,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function checkEC2TagCompliance(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const requiredTags = ['Environment', 'Owner', 'CostCenter'];

  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const tags = instance.Tags || [];
        const tagKeys = tags.map((t) => t.Key);
        const missingTags = requiredTags.filter((req) => !tagKeys.includes(req));

        if (missingTags.length > 0) {
          violations.push({
            resourceId: instance.InstanceId!,
            resourceType: 'EC2Instance',
            violationType: 'MissingRequiredTags',
            severity: 'MEDIUM',
            description: `EC2 instance missing required tags: ${missingTags.join(', ')}`,
            details: { missingTags, existingTags: tagKeys },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking EC2 tags:', error);
  }

  return violations;
}

async function checkS3PublicAccess(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);

    for (const bucket of listResponse.Buckets || []) {
      try {
        // Check bucket ACL
        const aclCommand = new GetBucketAclCommand({ Bucket: bucket.Name });
        const aclResponse = await s3Client.send(aclCommand);

        const hasPublicGrants =
          aclResponse.Grants?.some(
            (grant) =>
              grant.Grantee?.URI === 'http://acs.amazonaws.com/groups/global/AllUsers' ||
              grant.Grantee?.URI === 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'
          ) || false;

        if (hasPublicGrants) {
          violations.push({
            resourceId: bucket.Name!,
            resourceType: 'S3Bucket',
            violationType: 'PublicAccess',
            severity: 'CRITICAL',
            description: `S3 bucket has public access grants in ACL`,
            details: { bucketName: bucket.Name },
          });
        }

        // Check policy status
        try {
          const policyCommand = new GetBucketPolicyStatusCommand({ Bucket: bucket.Name });
          const policyResponse = await s3Client.send(policyCommand);

          if (policyResponse.PolicyStatus?.IsPublic) {
            violations.push({
              resourceId: bucket.Name!,
              resourceType: 'S3Bucket',
              violationType: 'PublicPolicy',
              severity: 'CRITICAL',
              description: `S3 bucket has public bucket policy`,
              details: { bucketName: bucket.Name },
            });
          }
        } catch (err: any) {
          // Ignore if no policy exists
          if (err.name !== 'NoSuchBucketPolicy') {
            console.warn(`Could not check policy for ${bucket.Name}:`, err.message);
          }
        }
      } catch (error: any) {
        console.warn(`Could not check bucket ${bucket.Name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error checking S3 buckets:', error);
  }

  return violations;
}

async function checkIAMPermissions(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const listCommand = new ListRolesCommand({});
    const listResponse = await iamClient.send(listCommand);

    for (const role of listResponse.Roles || []) {
      try {
        // Check inline policies
        const inlinePoliciesCommand = new ListRolePoliciesCommand({ RoleName: role.RoleName });
        const inlinePolicies = await iamClient.send(inlinePoliciesCommand);

        for (const policyName of inlinePolicies.PolicyNames || []) {
          const getPolicyCommand = new GetRolePolicyCommand({
            RoleName: role.RoleName,
            PolicyName: policyName,
          });
          const policyResponse = await iamClient.send(getPolicyCommand);
          const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

          if (hasOverlyPermissivePolicy(policyDoc)) {
            violations.push({
              resourceId: role.RoleName!,
              resourceType: 'IAMRole',
              violationType: 'OverlyPermissivePolicy',
              severity: 'HIGH',
              description: `IAM role has overly permissive inline policy: ${policyName}`,
              details: { roleName: role.RoleName, policyName },
            });
          }
        }

        // Check attached policies
        const attachedCommand = new ListAttachedRolePoliciesCommand({
          RoleName: role.RoleName,
        });
        const attachedResponse = await iamClient.send(attachedCommand);

        for (const policy of attachedResponse.AttachedPolicies || []) {
          // Skip AWS managed policies for this check
          if (!policy.PolicyArn?.includes(':aws:policy/')) {
            try {
              const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policy.PolicyArn });
              const policyInfo = await iamClient.send(getPolicyCommand);

              const versionCommand = new GetPolicyVersionCommand({
                PolicyArn: policy.PolicyArn,
                VersionId: policyInfo.Policy?.DefaultVersionId,
              });
              const versionResponse = await iamClient.send(versionCommand);
              const policyDoc = JSON.parse(
                decodeURIComponent(versionResponse.PolicyVersion?.Document!)
              );

              if (hasOverlyPermissivePolicy(policyDoc)) {
                violations.push({
                  resourceId: role.RoleName!,
                  resourceType: 'IAMRole',
                  violationType: 'OverlyPermissivePolicy',
                  severity: 'HIGH',
                  description: `IAM role has overly permissive attached policy: ${policy.PolicyName}`,
                  details: { roleName: role.RoleName, policyName: policy.PolicyName },
                });
              }
            } catch (err) {
              console.warn(`Could not check policy ${policy.PolicyArn}:`, err);
            }
          }
        }
      } catch (error: any) {
        console.warn(`Could not check role ${role.RoleName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error checking IAM roles:', error);
  }

  return violations;
}

function hasOverlyPermissivePolicy(policyDoc: any): boolean {
  const statements = Array.isArray(policyDoc.Statement)
    ? policyDoc.Statement
    : [policyDoc.Statement];

  for (const statement of statements) {
    if (statement.Effect === 'Allow') {
      const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      const resources = Array.isArray(statement.Resource)
        ? statement.Resource
        : [statement.Resource];

      // Check for wildcards in actions or resources
      if (actions.includes('*') || resources.includes('*')) {
        return true;
      }

      // Check for wildcards in individual actions
      if (actions.some((action: string) => action.includes('*'))) {
        return true;
      }
    }
  }

  return false;
}

async function checkEC2Monitoring(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        if (instance.Monitoring?.State !== 'enabled') {
          violations.push({
            resourceId: instance.InstanceId!,
            resourceType: 'EC2Instance',
            violationType: 'MonitoringDisabled',
            severity: 'LOW',
            description: `EC2 instance does not have detailed CloudWatch monitoring enabled`,
            details: { monitoringState: instance.Monitoring?.State },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking EC2 monitoring:', error);
  }

  return violations;
}

async function checkEBSEncryption(): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    for (const volume of response.Volumes || []) {
      if (!volume.Encrypted) {
        violations.push({
          resourceId: volume.VolumeId!,
          resourceType: 'EBSVolume',
          violationType: 'UnencryptedVolume',
          severity: 'CRITICAL',
          description: `EBS volume is not encrypted`,
          details: {
            volumeId: volume.VolumeId,
            attachments: volume.Attachments?.map((a) => a.InstanceId),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking EBS encryption:', error);
  }

  return violations;
}

async function exportReportToS3(report: ComplianceReport): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `compliance-reports/report-${timestamp}.json`;

  const command = new PutObjectCommand({
    Bucket: REPORT_BUCKET,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Report exported to s3://${REPORT_BUCKET}/${key}`);
}

async function publishMetrics(violations: Violation[]): Promise<void> {
  const metricsByType: Record<string, number> = {};

  for (const violation of violations) {
    metricsByType[violation.violationType] = (metricsByType[violation.violationType] || 0) + 1;
  }

  const metricData = Object.entries(metricsByType).map(([type, count]) => ({
    MetricName: type,
    Value: count,
    Unit: 'Count',
    Timestamp: new Date(),
  }));

  // Add total violations metric
  metricData.push({
    MetricName: 'TotalViolations',
    Value: violations.length,
    Unit: 'Count',
    Timestamp: new Date(),
  });

  // Add critical violations metric
  metricData.push({
    MetricName: 'CriticalViolations',
    Value: violations.filter((v) => v.severity === 'CRITICAL').length,
    Unit: 'Count',
    Timestamp: new Date(),
  });

  const command = new PutMetricDataCommand({
    Namespace: 'ComplianceMonitoring',
    MetricData: metricData,
  });

  await cloudwatchClient.send(command);
  console.log(`Published ${metricData.length} metrics to CloudWatch`);
}

async function sendCriticalAlert(violations: Violation[]): Promise<void> {
  const message = {
    subject: `CRITICAL: ${violations.length} Critical Compliance Violations Detected`,
    violations: violations.map((v) => ({
      resource: v.resourceId,
      type: v.violationType,
      description: v.description,
    })),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT_SUFFIX,
  };

  const command = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: message.subject,
    Message: JSON.stringify(message, null, 2),
  });

  await snsClient.send(command);
  console.log(`Critical alert sent to SNS topic`);
}
```

## File: lib/lambda/compliance-scanner/package.json

```json
{
  "name": "compliance-scanner",
  "version": "1.0.0",
  "description": "AWS infrastructure compliance scanner Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.450.0",
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/client-iam": "^3.450.0",
    "@aws-sdk/client-cloudwatch": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/compliance-scanner/tsconfig.json

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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: package.json

```json
{
  "name": "compliance-analyzer-infrastructure",
  "version": "1.0.0",
  "description": "Pulumi infrastructure for AWS compliance analyzer",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "deploy": "pulumi up",
    "destroy": "pulumi destroy",
    "preview": "pulumi preview"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.15.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["bin/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist", "lib/lambda"]
}
```

## File: lib/README.md

```markdown
# AWS Infrastructure Compliance Analyzer

Automated compliance scanning system for AWS infrastructure built with Pulumi and TypeScript.

## Overview

This solution scans existing AWS resources for compliance violations including:

- **EC2 instances** without required tags
- **S3 buckets** with public access
- **IAM roles** with overly permissive policies
- **EC2 instances** without CloudWatch monitoring
- **EBS volumes** without encryption

Reports are generated as JSON and stored in S3. Critical violations trigger SNS notifications.

## Architecture

- **Lambda Function**: Performs compliance scanning
- **S3 Bucket**: Stores compliance reports with versioning and encryption
- **SNS Topic**: Sends critical violation alerts with KMS encryption
- **CloudWatch Metrics**: Tracks violation counts by type
- **IAM Role**: Least-privilege permissions for Lambda execution

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with permissions to create resources

## Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Lambda dependencies**:
   ```bash
   cd lib/lambda/compliance-scanner
   npm install
   cd ../../..
   ```

3. **Set environment suffix**:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   ```

4. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

5. **Invoke Lambda function**:
   ```bash
   aws lambda invoke --function-name compliance-scanner-dev output.json
   ```

## Configuration

Environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')

## Compliance Checks

### 1. EC2 Tag Compliance
- Required tags: Environment, Owner, CostCenter
- Severity: MEDIUM

### 2. S3 Public Access
- Checks bucket ACLs and policies
- Severity: CRITICAL

### 3. IAM Permissions
- Identifies wildcard permissions in policies
- Severity: HIGH

### 4. CloudWatch Monitoring
- Verifies detailed monitoring enabled
- Severity: LOW

### 5. EBS Encryption
- Checks all volumes for encryption
- Severity: CRITICAL

## Reports

Reports are stored in S3 with the format:
```
s3://compliance-reports-{environmentSuffix}/compliance-reports/report-{timestamp}.json
```

Report structure:
```json
{
  "scanTimestamp": "2025-12-03T...",
  "environment": "dev",
  "totalViolations": 10,
  "criticalViolations": 2,
  "violations": [
    {
      "resourceId": "i-1234567890abcdef0",
      "resourceType": "EC2Instance",
      "violationType": "MissingRequiredTags",
      "severity": "MEDIUM",
      "description": "EC2 instance missing required tags: Owner, CostCenter",
      "details": {...}
    }
  ]
}
```

## Metrics

CloudWatch custom metrics in namespace `ComplianceMonitoring`:

- `TotalViolations`: Total count of all violations
- `CriticalViolations`: Count of critical severity violations
- `MissingRequiredTags`: Count of tag compliance violations
- `PublicAccess`: Count of public S3 bucket violations
- `OverlyPermissivePolicy`: Count of IAM policy violations
- `MonitoringDisabled`: Count of monitoring violations
- `UnencryptedVolume`: Count of encryption violations

## Notifications

SNS notifications are sent for critical violations only:
- Public S3 buckets
- Unencrypted EBS volumes

Subscribe to the SNS topic to receive alerts:
```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Security Considerations

- Lambda uses least-privilege IAM permissions
- S3 bucket has public access blocked
- SNS topic uses KMS encryption
- All data encrypted at rest and in transit
- CloudWatch Logs enabled for audit trail

## Troubleshooting

**Lambda timeout**: Increase timeout in `lib/tap-stack.ts` if scanning large number of resources

**Permission errors**: Verify Lambda IAM role has necessary read permissions

**Missing reports**: Check CloudWatch Logs for Lambda execution errors

**No metrics**: Verify CloudWatch namespace is `ComplianceMonitoring`
```

## Deployment Instructions

1. Install dependencies and build Lambda function
2. Set ENVIRONMENT_SUFFIX environment variable
3. Deploy with `pulumi up`
4. Invoke Lambda function manually or set up EventBridge schedule
5. Subscribe to SNS topic for critical alerts
6. View reports in S3 bucket and metrics in CloudWatch
