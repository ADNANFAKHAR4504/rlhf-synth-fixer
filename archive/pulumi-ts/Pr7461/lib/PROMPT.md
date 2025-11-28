# Application Deployment - Serverless Cryptocurrency Price Alert System

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to deploy a serverless cryptocurrency price alert system.

### MANDATORY REQUIREMENTS (Must complete)

1. **DynamoDB Table**: Create a DynamoDB table named 'crypto-alerts' with partition key 'userId' (string) and sort key 'alertId' (string), plus a global secondary index on 'coinSymbol' (CORE: DynamoDB).

2. **Price Checker Lambda**: Deploy a Lambda function 'price-checker' that fetches prices from exchanges and compares against user thresholds stored in DynamoDB (CORE: Lambda).

3. **EventBridge Scheduler**: Create an EventBridge rule that triggers the price-checker Lambda every minute using a cron expression.

4. **Alert Processor Lambda**: Deploy a second Lambda function 'alert-processor' that sends notifications via SNS when price thresholds are met.

5. **SNS Topic**: Create an SNS topic 'price-alerts' with email subscription endpoint for notifications.

6. **IAM Roles**: Implement proper IAM roles for each Lambda with least-privilege access to only required DynamoDB operations.

7. **CloudWatch Logs**: Add CloudWatch Logs groups for both Lambda functions with 14-day retention.

8. **Environment Variables**: Configure Lambda environment variables for exchange API endpoints (encrypted with KMS).

9. **DynamoDB Streams**: Set up DynamoDB streams to trigger alert-processor when new alerts are added.

### OPTIONAL ENHANCEMENTS (If time permits)

- Add API Gateway HTTP API for users to manage alerts via REST endpoints (OPTIONAL: API Gateway) - enables direct alert management.
- Implement SQS queue between price-checker and alert-processor for decoupling (OPTIONAL: SQS) - improves reliability under load.
- Add state machine for complex alert logic like multi-condition alerts (OPTIONAL: Step Functions) - enables advanced alert rules.

Expected output: A complete Pulumi TypeScript program that provisions all infrastructure components, with type-safe resource definitions and proper error handling for the Lambda function code inline.

---

## Background

A fintech startup needs to process cryptocurrency price alerts in real-time, checking multiple exchanges every minute and notifying users when their price thresholds are met. The system must handle 100,000+ active alerts while maintaining sub-second notification delivery.

---

## Environment Setup

Serverless infrastructure deployed in us-east-1 using Lambda functions for price checking and alert processing, DynamoDB for storing user alerts and price history, EventBridge for scheduling, and SNS for notifications. Requires Node.js 18+, Pulumi 3.x, AWS CLI configured with appropriate permissions. No VPC required as all services are managed. Lambda functions connect to external cryptocurrency exchange APIs. KMS key for encrypting sensitive environment variables.

---

## Constraints and Requirements

- Lambda functions must use ARM64 architecture for cost optimization
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- All Lambda functions must have reserved concurrent executions set to prevent throttling
- EventBridge rules must use cron expressions with UTC timezone
- SNS topics must have server-side encryption using AWS managed keys
- Lambda environment variables containing API keys must be encrypted using KMS
- DynamoDB global secondary indexes must project only required attributes
- Lambda functions must implement exponential backoff for external API calls
- All resources must have Cost Allocation tags with 'Environment' and 'Service' keys

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

---

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

---

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket(`data-bucket-${environmentSuffix}`, {
  bucket: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Lambda Function (Pulumi TypeScript)
```typescript
const priceChecker = new aws.lambda.Function(`price-checker-${environmentSuffix}`, {
  name: `price-checker-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  architectures: ["arm64"],  // Cost optimization
  handler: "index.handler",
  role: priceCheckerRole.arn,
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(`
      // Use AWS SDK v3
      import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

      export const handler = async (event) => {
        // Implementation
      };
    `)
  }),
  environment: {
    variables: {
      TABLE_NAME: cryptoAlertsTable.name,
      KMS_KEY_ID: kmsKey.id,
    }
  }
});
```

---

## Target Region
All resources should be deployed to: **us-east-1**

---

## Success Criteria
- Infrastructure deploys successfully to us-east-1
- All MANDATORY requirements are implemented
- Security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
