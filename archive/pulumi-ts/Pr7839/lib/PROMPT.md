# Infrastructure QA and Management - Tag-Based Compliance Monitoring

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

You need to implement a tag-based compliance monitoring system for EC2 instances using AWS services. The system should monitor EC2 instances for required tags and send notifications when instances are non-compliant.

**CRITICAL CONSTRAINT**: AWS Config has an account-level limit of ONE Configuration Recorder per account/region. Since one already exists in this account, you CANNOT use AWS Config Recorder, Delivery Channel, or Config Rules in this implementation.

## Problem Statement

Design and implement a tag-based compliance monitoring system that:

1. Monitors EC2 instances for required tags (Environment, Owner, Application)
2. Detects non-compliant instances (missing any required tags)
3. Sends notifications via SNS when non-compliant instances are found
4. Provides visibility through CloudWatch Dashboard showing compliance metrics
5. Stores compliance scan logs in S3
6. Triggers compliance checks on EC2 instance state changes

**Alternative Implementation Strategy** (without AWS Config):
- Use CloudWatch Events to detect EC2 instance state changes
- Trigger Lambda function to scan EC2 tags directly using AWS SDK
- Lambda evaluates compliance and publishes metrics to CloudWatch
- SNS sends notifications for non-compliant instances
- S3 stores scan logs and compliance reports
- CloudWatch Dashboard displays compliance status

## Required Tags for Compliance

Each EC2 instance must have these tags:
- Environment (values: dev, staging, prod)
- Owner (team or individual owner)
- Application (application name)

## Architecture Components

1. **Lambda Function**: Tag compliance checker
   - Triggered by CloudWatch Events
   - Scans EC2 instances for required tags
   - Publishes custom metrics to CloudWatch
   - Sends SNS notifications for violations
   - Writes scan logs to S3

2. **CloudWatch Events Rule**: EC2 state change detector
   - Detects: EC2 instance state changes (running, stopped, terminated)
   - Targets: Lambda function

3. **SNS Topic**: Compliance notifications
   - Receives alerts from Lambda
   - Email subscription for notifications

4. **S3 Bucket**: Compliance logs storage
   - Stores scan results
   - Lifecycle policy for log retention

5. **CloudWatch Dashboard**: Compliance visibility
   - Displays compliance metrics
   - Shows compliant vs non-compliant instance counts
   - Displays recent scan results

6. **CloudWatch Alarms**: Alert on high non-compliance
   - Triggers when non-compliant instances exceed threshold
   - Publishes to SNS topic

## Constraints and Requirements

- Do NOT use AWS Config Recorder, Delivery Channel, or Config Rules (account limit reached)
- Use CloudWatch Events + Lambda as alternative to AWS Config
- All resources must include environmentSuffix in their names
- Lambda must use AWS SDK v3 for Node.js 18.x+
- S3 bucket must have encryption enabled
- All resources must be destroyable (no RETAIN policies)
- IAM roles must follow least privilege principle
- Integration tests must validate actual deployed resources using cfn-outputs/flat-outputs.json

## Environment Setup

- AWS credentials with appropriate permissions
- Pulumi CLI tools installed
- TypeScript runtime/SDK configured
- Node.js 18.x or later

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Lambda Function Requirements

The tag compliance checker Lambda should:

1. **Input**: Triggered by CloudWatch Events with EC2 instance details
2. **Process**:
   - Extract instance ID from event
   - Use EC2 SDK to describe instance tags
   - Evaluate tags against required tags list
   - Determine compliance status
3. **Output**:
   - Publish CloudWatch custom metrics (CompliantInstances, NonCompliantInstances)
   - Write scan log to S3
   - Send SNS notification if non-compliant
   - Return compliance status

**Lambda Code Structure** (example):
```typescript
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const REQUIRED_TAGS = ['Environment', 'Owner', 'Application'];

export async function handler(event: any) {
  // Extract instance ID from CloudWatch Events
  // Scan EC2 instance tags
  // Evaluate compliance
  // Publish metrics and notifications
}
```

### CloudWatch Events Rule

- Event pattern: EC2 instance state changes
- Event source: aws.ec2
- Detail type: EC2 Instance State-change Notification
- Target: Lambda function

### Security and Compliance
- Implement encryption at rest for S3 using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with 100% coverage
- Integration tests must validate:
  - Lambda function is triggered by EC2 state changes
  - Tags are correctly evaluated
  - SNS notifications are sent for non-compliant instances
  - CloudWatch metrics are published
  - S3 logs are created
  - Dashboard displays metrics
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Avoid DeletionPolicy: Retain
- Use `retainOnDelete: false` for all Pulumi resources

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `compliance-logs-${environmentSuffix}`
  - Lambda Function: `tag-compliance-checker-${environmentSuffix}`
  - SNS Topic: `compliance-alerts-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `roleName`, `topicName` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- Use `retainOnDelete: false` for Pulumi resources
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### AWS Config
- **CRITICAL**: Do NOT create AWS Config Recorder, Delivery Channel, or Config Rules
- AWS Config allows only ONE Configuration Recorder per account/region
- This account already has a Configuration Recorder
- Use CloudWatch Events + Lambda as alternative

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { EC2Client } from '@aws-sdk/client-ec2'`
- **Reserved Concurrency**: Avoid setting unless required

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs
  - Regions in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const bucket = new aws.s3.Bucket("complianceLogsBucket", {
  bucket: `compliance-logs-${environmentSuffix}`,  // ✅ CORRECT
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "AES256",
      },
    },
  },
});

// ❌ WRONG:
// bucket: 'compliance-logs-prod'  // Hardcoded, will fail
```

### Correct Lambda Function (Pulumi TypeScript)
```typescript
const lambdaRole = new aws.iam.Role("tagComplianceCheckerRole", {
  name: `tag-compliance-checker-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
    }],
  }),
});

const lambda = new aws.lambda.Function("tagComplianceChecker", {
  name: `tag-compliance-checker-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: "index.handler",
  role: lambdaRole.arn,
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(`
      // Lambda code here using AWS SDK v3
    `),
  }),
  environment: {
    variables: {
      SNS_TOPIC_ARN: snsTopic.arn,
      S3_BUCKET_NAME: bucket.id,
    },
  },
});
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully without AWS Config resources
- Lambda function correctly evaluates EC2 tag compliance
- CloudWatch Events trigger Lambda on EC2 state changes
- SNS notifications sent for non-compliant instances
- CloudWatch Dashboard displays compliance metrics
- S3 stores compliance scan logs
- All tests pass with 100% coverage
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
