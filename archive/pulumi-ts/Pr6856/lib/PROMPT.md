# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to deploy a serverless transaction processing system. The configuration must:

1. Create an API Gateway REST API with /transaction POST endpoint that validates request body against OpenAPI schema.
2. Deploy a transaction validator Lambda function that processes incoming requests and writes to DynamoDB.
3. Set up a DynamoDB table with partition key 'transactionId' and sort key 'timestamp', with streams enabled.
4. Create a fraud detection Lambda triggered by DynamoDB streams to analyze transaction patterns.
5. Implement SQS FIFO queue for maintaining transaction order with visibility timeout of 30 seconds.
6. Configure a notification Lambda that reads from SQS and sends results to SNS topic.
7. Set up dead letter queues for both fraud detection and notification Lambdas.
8. Create custom KMS key for encrypting Lambda environment variables.
9. Configure API Gateway usage plan with API key requirement and throttling.
10. Set up CloudWatch Log groups with 30-day retention for all Lambda functions.
11. Export API Gateway invoke URL and API key for client access.

Expected output: A fully deployed serverless architecture that processes transactions through API Gateway, validates and stores them in DynamoDB, performs asynchronous fraud detection, and sends notifications while maintaining transaction ordering through SQS FIFO queues.

---

## Additional Context

### Background

A fintech startup needs to process credit card transactions in real-time, validate them against fraud patterns, and store results for compliance auditing. The system must handle variable loads during peak shopping seasons while maintaining sub-second response times.

### Constraints and Requirements

- Use SQS FIFO queues for transaction sequencing
- DynamoDB streams must trigger fraud detection Lambda asynchronously
- Lambda environment variables must be encrypted with a custom KMS key
- All Lambda functions must use Go 1.x runtime
- Lambda functions must have reserved concurrent executions of exactly 100
- API Gateway must use request validation with OpenAPI 3.0 schema
- API Gateway must have usage plans with 10000 requests/day limit
- Use DynamoDB with on-demand billing for transaction storage
- Dead letter queues must retain failed messages for 14 days

### Environment Setup

Serverless infrastructure deployed in us-east-1 region using API Gateway REST API, Lambda functions with Go runtime, DynamoDB for transaction storage, SQS FIFO queues for message ordering, and KMS for encryption. Requires Pulumi CLI 3.x with Go SDK, AWS CLI configured with appropriate credentials. No VPC required as all services are serverless. CloudWatch Logs for monitoring with 30-day retention. IAM roles follow least-privilege principle with separate roles for each Lambda function.

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

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - ✅ CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - ❌ WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `DependsOn` in CloudFormation, `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("dataBucket", {
    bucket: pulumi.interpolate`data-bucket-${environmentSuffix}`,  // ✅ CORRECT
    // ...
});

// ❌ WRONG:
// bucket: "data-bucket-prod"  // Hardcoded, will fail
```

### Correct Removal Policy (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("dataBucket", {
    forceDestroy: true,  // ✅ CORRECT - allows destroy
    // ...
});

// ❌ WRONG:
// No forceDestroy or forceDestroy: false  // Will block cleanup
```

### Correct Lambda Reserved Concurrency (Pulumi TypeScript)
```typescript
const lambda = new aws.lambda.Function("myFunction", {
    // ✅ CORRECT - no reservedConcurrentExecutions (unlimited)
    // OR use low values if absolutely required:
    // reservedConcurrentExecutions: 1,
});

// ❌ WRONG:
// reservedConcurrentExecutions: 100  // Will exceed account limits
```

## Target Region
All resources should be deployed to: **us-east-1**
