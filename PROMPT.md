# Application Deployment

> CRITICAL REQUIREMENT: This task MUST be implemented using CDK with TypeScript
>
> Platform: cdk
> Language: ts
> Region: us-east-1
>
> Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to process real-time stock market data feeds and generate alerts when specific trading patterns are detected. The system must handle variable load patterns during market hours and scale down to zero during off-hours to minimize costs.

## Problem Statement
Create a CDK TypeScript program to deploy a serverless stock pattern detection system. The configuration must:

1. Deploy an API Gateway REST API with /patterns and /alerts endpoints with request validation
2. Create a Lambda function 'PatternDetector' that processes incoming market data with 512MB memory
3. Set up a DynamoDB table 'TradingPatterns' with partition key 'patternId' and sort key 'timestamp'
4. Configure an SQS queue 'AlertQueue' with visibility timeout of 300 seconds for alert processing
5. Implement a Lambda function 'AlertProcessor' that reads from the SQS queue with batch size of 10
6. Create an EventBridge rule that triggers every 5 minutes to check pattern thresholds
7. Add a Lambda function 'ThresholdChecker' triggered by EventBridge with environment variables for thresholds
8. Implement CloudWatch Logs retention of 7 days for all Lambda functions
9. Create SNS topic 'TradingAlerts' with email subscription for critical alerts
10. Set up Lambda DLQ for AlertProcessor with maximum receive count of 3
11. Configure CloudWatch alarms for Lambda errors exceeding 1% error rate
12. Output the API Gateway URL and SQS queue URL for integration testing

Expected output: A fully deployed serverless architecture with API endpoints for pattern submission, automated pattern detection and alerting, proper error handling with DLQs, and monitoring through CloudWatch. The system should automatically scale based on load and provide cost-effective processing of trading patterns.

## Constraints and Requirements
- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- SQS queues must have message retention period of exactly 4 days
- EventBridge rules must use custom event patterns with at least 3 matching conditions
- All Lambda functions must have X-Ray tracing enabled with custom segments
- Lambda functions must use Lambda Layers for shared dependencies with versioning
- Use AWS Lambda with reserved concurrency of exactly 50 for the pattern detection function
- API Gateway must implement request throttling at 1000 requests per second with burst of 2000
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled

## Environment Setup
Serverless infrastructure deployed in us-east-1 region for proximity to financial markets. Architecture uses API Gateway REST API, Lambda functions with Graviton2 processors, DynamoDB for pattern storage, SQS for message queuing, and EventBridge for event routing. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. No VPC required as all services are fully managed. IAM roles follow least-privilege principle with boundary policies.

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in TypeScript
- Follow CDK best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Important: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- MANDATORY: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- Validation: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- MANDATORY: All resources MUST be destroyable after testing
- FORBIDDEN:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- Rationale: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- CRITICAL: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- CRITICAL: If creating AWS Config roles, use correct managed policy:
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- Alternative: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- Node.js 18.x+: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- Reserved Concurrency: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues
  - Note: This task REQUIRES reserved concurrency of exactly 50 for PatternDetector

#### CloudWatch Synthetics
- CRITICAL: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- Prefer: Aurora Serverless v2 (faster provisioning, auto-scaling)
- If Multi-AZ required: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- Note: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- Cost Warning: NAT Gateways cost ~$32/month each
- Prefer: VPC Endpoints for S3, DynamoDB (free)
- If NAT required: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- DO NOT hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- USE: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `DependsOn` in CloudFormation, `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // CORRECT
  // ...
});

// WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
```

### Correct AWS Config IAM Role (CDK TypeScript)
```typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // CORRECT
    )
  ]
});

// WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
Deploy all resources to: us-east-1

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
