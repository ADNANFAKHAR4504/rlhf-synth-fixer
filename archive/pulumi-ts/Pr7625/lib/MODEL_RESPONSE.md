# AWS Infrastructure Compliance Analyzer - Implementation

This implementation provides a comprehensive AWS infrastructure compliance analysis system using Pulumi with TypeScript.

## Architecture Overview

The system uses serverless AWS services to analyze existing infrastructure:
- Lambda functions for compliance checks
- DynamoDB for tracking findings
- EventBridge for scheduling
- S3 for report storage
- CloudWatch for logging

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly complianceTable: pulumi.Output<string>;
  public readonly reportBucket: pulumi.Output<string>;
  public readonly scannerFunction: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // S3 bucket for compliance reports - ISSUE: Missing block public access
    const reportsBucket = new aws.s3.Bucket(`compliance-reports-${environmentSuffix}`, {
      bucket: `compliance-reports-${environmentSuffix}`,
      acl: 'private',
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      versioning: {
        enabled: true,
      },
      tags: tags,
    }, { parent: this });

    // DynamoDB table for compliance findings
    const complianceTable = new aws.dynamodb.Table(`compliance-findings-${environmentSuffix}`, {
      name: `compliance-findings-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'resourceId',
      rangeKey: 'timestamp',
      attributes: [
        { name: 'resourceId', type: 'S' },
        { name: 'timestamp', type: 'S' },
        { name: 'violationType', type: 'S' },
      ],
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      pointInTimeRecovery: {
        enabled: true,
      },
      globalSecondaryIndexes: [{
        name: 'ViolationTypeIndex',
        hashKey: 'violationType',
        rangeKey: 'timestamp',
        projectionType: 'ALL',
      }],
      tags: tags,
    }, { parent: this });

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(`compliance-scanner-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: tags,
    }, { parent: this });

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // Custom policy for read-only access
    const compliancePolicy = new aws.iam.Policy(`compliance-scanner-policy-${environmentSuffix}`, {
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeTags',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeVolumes',
              'ec2:CreateTags',
              's3:ListAllMyBuckets',
              's3:GetBucketEncryption',
              's3:GetBucketPublicAccessBlock',
              's3:PutObject',
              'iam:ListUsers',
              'iam:ListAccessKeys',
              'iam:GetAccessKeyLastUsed',
              'logs:DescribeLogGroups',
              'ec2:DescribeVpcs',
              'ec2:DescribeFlowLogs',
              'dynamodb:PutItem',
              'dynamodb:Query',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: tags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`compliance-policy-attach-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: compliancePolicy.arn,
    }, { parent: this });

    // Lambda function for compliance scanning
    const scannerFunction = new aws.lambda.Function(`compliance-scanner-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 900,
      memorySize: 512,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda/scanner')),
      }),
      environment: {
        variables: {
          DYNAMODB_TABLE: complianceTable.name,
          S3_BUCKET: reportsBucket.bucket,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      },
      tags: tags,
    }, { parent: this });

    // CloudWatch Log Group for Lambda - ISSUE: Missing resource name pattern
    const logGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/compliance-scanner-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: tags,
    }, { parent: this });

    // EventBridge rule for daily scanning
    const schedulerRule = new aws.cloudwatch.EventRule(`compliance-scan-schedule-${environmentSuffix}`, {
      scheduleExpression: 'cron(0 2 * * ? *)',
      description: 'Trigger compliance scan daily at 2 AM UTC',
      tags: tags,
    }, { parent: this });

    // EventBridge target
    const eventTarget = new aws.cloudwatch.EventTarget(`compliance-scan-target-${environmentSuffix}`, {
      rule: schedulerRule.name,
      arn: scannerFunction.arn,
    }, { parent: this });

    // Permission for EventBridge to invoke Lambda
    new aws.lambda.Permission(`eventbridge-invoke-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: scannerFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: schedulerRule.arn,
    }, { parent: this });

    // Stream processor Lambda
    const streamProcessor = new aws.lambda.Function(`compliance-stream-processor-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 300,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda/stream-processor')),
      }),
      environment: {
        variables: {
          S3_BUCKET: reportsBucket.bucket,
        },
      },
      tags: tags,
    }, { parent: this });

    // DynamoDB Stream event source
    new aws.lambda.EventSourceMapping(`dynamodb-stream-${environmentSuffix}`, {
      eventSourceArn: complianceTable.streamArn,
      functionName: streamProcessor.arn,
      startingPosition: 'LATEST',
      batchSize: 10,
    }, { parent: this });

    this.complianceTable = complianceTable.name;
    this.reportBucket = reportsBucket.bucket;
    this.scannerFunction = scannerFunction.arn;

    this.registerOutputs({
      complianceTableName: this.complianceTable,
      reportBucketName: this.reportBucket,
      scannerFunctionArn: this.scannerFunction,
    });
  }
}
```

## File: lib/lambda/scanner/index.ts

```typescript
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeVolumesCommand, DescribeVpcsCommand, DescribeFlowLogsCommand, CreateTagsCommand } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { IAMClient, ListUsersCommand, ListAccessKeysCommand, GetAccessKeyLastUsedCommand } from '@aws-sdk/client-iam';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const dynamoDbClient = new DynamoDBClient({});

interface ComplianceViolation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: string;
  description: string;
  remediation: string;
  timestamp: string;
}

interface ComplianceReport {
  scanId: string;
  timestamp: string;
  complianceScore: number;
  totalResources: number;
  violations: ComplianceViolation[];
  summary: {
    ec2: { checked: number; violations: number };
    securityGroups: { checked: number; violations: number };
    s3: { checked: number; violations: number };
    iam: { checked: number; violations: number };
    ebs: { checked: number; violations: number };
    flowLogs: { checked: number; violations: number };
  };
}

export const handler = async (event: any) => {
  console.log('Starting compliance scan...');

  const violations: ComplianceViolation[] = [];
  const timestamp = new Date().toISOString();
  const scanId = `scan-${Date.now()}`;

  try {
    // Check EC2 instances for missing tags
    const ec2Violations = await checkEC2Compliance();
    violations.push(...ec2Violations);

    // Check security groups
    const sgViolations = await checkSecurityGroups();
    violations.push(...sgViolations);

    // Check S3 buckets
    const s3Violations = await checkS3Compliance();
    violations.push(...s3Violations);

    // Check IAM access keys
    const iamViolations = await checkIAMAccessKeys();
    violations.push(...iamViolations);

    // Check EBS volumes
    const ebsViolations = await checkUnattachedVolumes();
    violations.push(...ebsViolations);

    // Check VPC flow logs
    const flowLogViolations = await checkVPCFlowLogs();
    violations.push(...flowLogViolations);

    // Calculate compliance score
    const complianceScore = calculateComplianceScore(violations);

    // Create report
    const report: ComplianceReport = {
      scanId,
      timestamp,
      complianceScore,
      totalResources: 0,
      violations,
      summary: {
        ec2: { checked: 0, violations: ec2Violations.length },
        securityGroups: { checked: 0, violations: sgViolations.length },
        s3: { checked: 0, violations: s3Violations.length },
        iam: { checked: 0, violations: iamViolations.length },
        ebs: { checked: 0, violations: ebsViolations.length },
        flowLogs: { checked: 0, violations: flowLogViolations.length },
      },
    };

    // Store violations in DynamoDB
    await storeViolations(violations);

    // Upload report to S3
    await uploadReport(report);

    console.log(`Compliance scan completed. Score: ${complianceScore}`);
    console.log(`Total violations: ${violations.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify(report),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function checkEC2Compliance(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  const requiredTags = ['Name', 'Environment', 'Owner'];

  const command = new DescribeInstancesCommand({});
  const response = await ec2Client.send(command);

  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      const tags = instance.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      const missingTags = requiredTags.filter(tag => !tagKeys.includes(tag));

      if (missingTags.length > 0) {
        violations.push({
          resourceId: instance.InstanceId!,
          resourceType: 'EC2Instance',
          violationType: 'MissingTags',
          severity: 'MEDIUM',
          description: `Instance missing required tags: ${missingTags.join(', ')}`,
          remediation: `Add the following tags: ${missingTags.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Tag resource with LastComplianceCheck
      try {
        await ec2Client.send(new CreateTagsCommand({
          Resources: [instance.InstanceId!],
          Tags: [{ Key: 'LastComplianceCheck', Value: new Date().toISOString() }],
        }));
      } catch (error) {
        console.error(`Failed to tag instance ${instance.InstanceId}:`, error);
      }
    }
  }

  return violations;
}

// ISSUE: Missing pagination handling for security groups
async function checkSecurityGroups(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  const command = new DescribeSecurityGroupsCommand({});
  const response = await ec2Client.send(command);

  for (const sg of response.SecurityGroups || []) {
    for (const rule of sg.IpPermissions || []) {
      for (const ipRange of rule.IpRanges || []) {
        if (ipRange.CidrIp === '0.0.0.0/0') {
          const port = rule.FromPort;

          // Allow 80 and 443
          if (port !== 80 && port !== 443) {
            violations.push({
              resourceId: sg.GroupId!,
              resourceType: 'SecurityGroup',
              violationType: 'OverlyPermissiveRule',
              severity: 'HIGH',
              description: `Security group allows 0.0.0.0/0 on port ${port}`,
              remediation: `Restrict access to specific IP ranges or remove the rule`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  return violations;
}

// ISSUE: No retry logic for API calls
async function checkS3Compliance(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  const listCommand = new ListBucketsCommand({});
  const bucketsResponse = await s3Client.send(listCommand);

  for (const bucket of bucketsResponse.Buckets || []) {
    const bucketName = bucket.Name!;

    // Check encryption
    try {
      await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    } catch (error: any) {
      if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
        violations.push({
          resourceId: bucketName,
          resourceType: 'S3Bucket',
          violationType: 'NoEncryption',
          severity: 'HIGH',
          description: `Bucket ${bucketName} does not have encryption enabled`,
          remediation: 'Enable server-side encryption on the bucket',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check public access block
    try {
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      if (!config?.BlockPublicAcls || !config?.BlockPublicPolicy ||
          !config?.IgnorePublicAcls || !config?.RestrictPublicBuckets) {
        violations.push({
          resourceId: bucketName,
          resourceType: 'S3Bucket',
          violationType: 'PublicAccessNotBlocked',
          severity: 'CRITICAL',
          description: `Bucket ${bucketName} does not have all public access settings blocked`,
          remediation: 'Enable all public access block settings',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Failed to check public access for ${bucketName}:`, error);
    }
  }

  return violations;
}

async function checkIAMAccessKeys(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  const maxKeyAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  const usersCommand = new ListUsersCommand({});
  const usersResponse = await iamClient.send(usersCommand);

  for (const user of usersResponse.Users || []) {
    const keysCommand = new ListAccessKeysCommand({ UserName: user.UserName });
    const keysResponse = await iamClient.send(keysCommand);

    for (const key of keysResponse.AccessKeyMetadata || []) {
      const keyAge = Date.now() - key.CreateDate!.getTime();

      if (keyAge > maxKeyAge) {
        violations.push({
          resourceId: `${user.UserName}:${key.AccessKeyId}`,
          resourceType: 'IAMAccessKey',
          violationType: 'OldAccessKey',
          severity: 'MEDIUM',
          description: `Access key for user ${user.UserName} is ${Math.floor(keyAge / (24 * 60 * 60 * 1000))} days old`,
          remediation: `Rotate access key for user ${user.UserName}`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return violations;
}

async function checkUnattachedVolumes(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  const command = new DescribeVolumesCommand({});
  const response = await ec2Client.send(command);

  for (const volume of response.Volumes || []) {
    if (!volume.Attachments || volume.Attachments.length === 0) {
      violations.push({
        resourceId: volume.VolumeId!,
        resourceType: 'EBSVolume',
        violationType: 'UnattachedVolume',
        severity: 'MEDIUM',
        description: `Volume ${volume.VolumeId} (${volume.Size} GB) is not attached to any instance`,
        remediation: `Review and delete volume if no longer needed, or attach to an instance`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return violations;
}

async function checkVPCFlowLogs(): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  const vpcsCommand = new DescribeVpcsCommand({});
  const vpcsResponse = await ec2Client.send(vpcsCommand);

  const flowLogsCommand = new DescribeFlowLogsCommand({});
  const flowLogsResponse = await ec2Client.send(flowLogsCommand);

  const vpcsWithFlowLogs = new Set(
    flowLogsResponse.FlowLogs?.map(fl => fl.ResourceId) || []
  );

  for (const vpc of vpcsResponse.Vpcs || []) {
    if (!vpcsWithFlowLogs.has(vpc.VpcId!)) {
      violations.push({
        resourceId: vpc.VpcId!,
        resourceType: 'VPC',
        violationType: 'NoFlowLogs',
        severity: 'MEDIUM',
        description: `VPC ${vpc.VpcId} does not have flow logs enabled`,
        remediation: 'Enable VPC flow logs with CloudWatch destination',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return violations;
}

function calculateComplianceScore(violations: ComplianceViolation[]): number {
  if (violations.length === 0) return 100;

  const severityWeights: { [key: string]: number } = {
    CRITICAL: 10,
    HIGH: 5,
    MEDIUM: 2,
    LOW: 1,
  };

  const totalPenalty = violations.reduce((sum, v) => {
    return sum + (severityWeights[v.severity] || 1);
  }, 0);

  const score = Math.max(0, 100 - totalPenalty);
  return Math.round(score);
}

async function storeViolations(violations: ComplianceViolation[]): Promise<void> {
  const tableName = process.env.DYNAMODB_TABLE!;

  for (const violation of violations) {
    const params = {
      TableName: tableName,
      Item: {
        resourceId: { S: violation.resourceId },
        timestamp: { S: violation.timestamp },
        resourceType: { S: violation.resourceType },
        violationType: { S: violation.violationType },
        severity: { S: violation.severity },
        description: { S: violation.description },
        remediation: { S: violation.remediation },
      },
    };

    await dynamoDbClient.send(new PutItemCommand(params));
  }
}

async function uploadReport(report: ComplianceReport): Promise<void> {
  const bucketName = process.env.S3_BUCKET!;
  const key = `compliance-reports/${report.scanId}.json`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Report uploaded to s3://${bucketName}/${key}`);
}
```

## File: lib/lambda/scanner/package.json

```json
{
  "name": "compliance-scanner",
  "version": "1.0.0",
  "description": "AWS infrastructure compliance scanner",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-iam": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/scanner/tsconfig.json

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

## File: lib/lambda/stream-processor/index.ts

```typescript
import { DynamoDBStreamEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing DynamoDB stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const newImage = record.dynamodb?.NewImage;

      if (newImage) {
        console.log('New violation detected:', {
          resourceId: newImage.resourceId?.S,
          violationType: newImage.violationType?.S,
          severity: newImage.severity?.S,
        });

        // You could add notifications here (SNS, Slack, etc.)
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: event.Records.length }),
  };
};
```

## File: lib/lambda/stream-processor/package.json

```json
{
  "name": "compliance-stream-processor",
  "version": "1.0.0",
  "description": "DynamoDB stream processor for compliance violations",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@types/aws-lambda": "^8.10.119"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/stream-processor/tsconfig.json

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
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/README.md

```markdown
# AWS Infrastructure Compliance Analyzer

Automated compliance scanning system for AWS infrastructure using Pulumi and Lambda.

## Overview

This system performs automated compliance checks on AWS resources:
- EC2 instances (tagging compliance)
- Security groups (overly permissive rules)
- S3 buckets (encryption and public access)
- IAM access keys (age verification)
- EBS volumes (unattached volumes)
- VPC flow logs (logging enabled)

## Architecture

- **Lambda Functions**: Execute compliance checks
- **DynamoDB**: Store compliance findings
- **S3**: Store detailed reports
- **EventBridge**: Schedule daily scans
- **CloudWatch**: Logging and monitoring

## Deployment

### Prerequisites

- Node.js 18+ and npm
- Pulumi CLI
- AWS credentials configured

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy with Pulumi
pulumi up
```

### Manual Trigger

```bash
# Invoke Lambda function manually
aws lambda invoke \
  --function-name compliance-scanner-dev \
  --payload '{}' \
  response.json
```

## Configuration

Environment variables:
- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: Target region (default: us-east-1)

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Compliance Scoring

- Critical violations: -10 points
- High violations: -5 points
- Medium violations: -2 points
- Low violations: -1 point

Starting score: 100
Minimum score: 0

## Reports

Reports are stored in S3 at:
```
s3://compliance-reports-{environmentSuffix}/compliance-reports/{scanId}.json
```

## Troubleshooting

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/compliance-scanner-dev --follow
```
```
