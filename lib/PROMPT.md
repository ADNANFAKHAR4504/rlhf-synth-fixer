# IaC Program Optimization

> **️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **Pulumi**
> Language: **TypeScript**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to refactor and optimize an existing serverless webhook processing system. The configuration must:

1. **Consolidate Lambda Functions**: Consolidate three separate Lambda functions (webhook-receiver, webhook-validator, webhook-processor) into a single optimized function with proper handler routing.

2. **Fix DynamoDB Provisioning**: Fix the current DynamoDB table provisioning that uses on-demand billing for a predictable 500 RPS workload. Switch to provisioned capacity with appropriate RCU/WCU allocation.

3. **Replace API Gateway**: Replace the current API Gateway REST API with HTTP API for cost reduction.

4. **Implement Lambda Concurrency**: Implement proper Lambda reserved concurrency instead of the current unlimited setting causing throttling.

5. **Fix Memory Allocation**: Fix memory allocation issues where all functions use 3GB despite needing only 512MB.

6. **Add CloudWatch Log Retention**: Add missing CloudWatch log retention policies currently keeping logs indefinitely.

7. **Optimize IAM Policies**: Optimize IAM policies that currently use overly broad permissions with wildcards.

8. **Implement Error Handling**: Implement proper error handling and dead letter queue configuration.

9. **Add Cost Allocation Tags**: Add cost allocation tags that were missing from the original implementation.

10. **Configure X-Ray Tracing**: Configure X-Ray tracing which was partially implemented but not working.

---

## Background

This is an Infrastructure as Code optimization task focused on refactoring and improving an existing serverless webhook processing system.

## Constraints and Requirements

- Follow AWS security best practices
- Ensure all optimizations maintain or improve system reliability
- Implement proper error handling and monitoring
- Use cost-effective resource configurations
- Follow the principle of least privilege for IAM roles

## Environment Setup

- AWS credentials with appropriate permissions
- Pulumi CLI tools installed
- TypeScript runtime/SDK configured

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
  -  CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  -  Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  -  Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  -  CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  -  WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
const bucket = new aws.s3.Bucket("data-bucket", {
  bucket: `data-bucket-${environmentSuffix}`,  //  CORRECT
  // ...
});

//  WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Lambda Configuration (Pulumi TypeScript)
```typescript
const lambda = new aws.lambda.Function("webhook-processor", {
  name: `webhook-processor-${environmentSuffix}`,
  memorySize: 512,  //  CORRECT - appropriate for workload
  reservedConcurrentExecutions: 5,  //  CORRECT - limited concurrency
  // ...
});

//  WRONG:
// memorySize: 3072  // Unnecessarily high
// reservedConcurrentExecutions: undefined  // Unlimited concurrency
```

### Correct DynamoDB Configuration (Pulumi TypeScript)
```typescript
const table = new aws.dynamodb.Table("webhook-table", {
  name: `webhook-table-${environmentSuffix}`,
  billingMode: "PROVISIONED",  //  CORRECT for predictable workload
  readCapacity: 100,
  writeCapacity: 100,
  // ...
});

//  WRONG:
// billingMode: "PAY_PER_REQUEST"  // More expensive for predictable load
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All optimizations are implemented correctly
- Lambda functions are consolidated with proper routing
- DynamoDB uses provisioned capacity appropriately
- API Gateway HTTP API replaces REST API
- Lambda concurrency is properly configured
- Memory allocation is optimized to 512MB
- CloudWatch log retention policies are set
- IAM policies follow least privilege
- Dead letter queue is configured
- Cost allocation tags are present
- X-Ray tracing is fully functional
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
