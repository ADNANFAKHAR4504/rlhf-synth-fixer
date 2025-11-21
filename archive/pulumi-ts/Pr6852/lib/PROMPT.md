# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech company needs to maintain identical infrastructure across development, staging, and production environments to ensure consistent testing and deployment. They currently face configuration drift issues where environments diverge over time, causing deployment failures and security inconsistencies.

## Problem Statement
Create a Pulumi TypeScript program to deploy and maintain consistent infrastructure across three environments (dev, staging, prod) with controlled variations. The configuration must:

1. Define a reusable component class that accepts environment configuration as parameters.
2. Implement VPC creation with environment-specific CIDR blocks (dev: 10.0.0.0/16, staging: 10.1.0.0/16, prod: 10.2.0.0/16).
3. Create RDS PostgreSQL instances with environment-appropriate instance classes (dev: db.t3.micro, staging: db.t3.small, prod: db.m5.large).
4. Deploy Lambda functions for payment processing with consistent code but environment-specific environment variables.
5. Configure API Gateway with rate limiting that scales by environment (dev: 100 req/min, staging: 500 req/min, prod: 2000 req/min).
6. Set up DynamoDB tables for transaction history with consistent schema but varying capacity units.
7. Implement S3 buckets for audit logs with environment-specific lifecycle rules and retention policies.
8. Create CloudWatch dashboards that aggregate metrics across all resources within each environment.
9. Generate a comparison report showing resource configurations across all three environments.
10. Implement drift detection by comparing actual AWS resources against Pulumi state.
11. Ensure all resources are tagged with Environment, ManagedBy, and CostCenter tags.

Expected output: A Pulumi program that deploys three identical yet appropriately scaled environments, with a custom resource provider that validates cross-environment consistency and outputs a JSON report detailing any configuration differences between environments.

## Constraints and Requirements
- DynamoDB tables must have consistent GSI configurations but environment-specific read/write capacity
- CloudWatch alarms must have environment-adjusted thresholds (dev: 80%, staging: 70%, prod: 60%)
- Each environment must have its own isolated VPC with matching CIDR blocks offset by environment
- S3 buckets must have lifecycle policies that vary retention by environment (dev: 7 days, staging: 30 days, prod: 90 days)
- Lambda functions must have identical memory and timeout configurations across environments
- Secrets must be stored in AWS Secrets Manager and rotated every 30 days
- RDS instances must use encrypted storage with environment-specific KMS keys
- All environments must use identical resource naming conventions with environment prefixes
- API Gateway stages must have request throttling limits that scale with environment tier

## Environment Setup
Multi-environment AWS infrastructure spanning us-east-1 (production), us-east-2 (staging), and us-east-1 (development). Each environment requires isolated VPCs with 3 availability zones, private and public subnets, NAT gateways, and VPC endpoints for S3 and DynamoDB. Infrastructure includes RDS PostgreSQL 15.x instances, Lambda functions with Node.js 18.x runtime, API Gateway REST APIs, DynamoDB tables, S3 buckets, and CloudWatch monitoring. Requires Pulumi CLI 3.x with TypeScript, AWS CLI configured with appropriate credentials, Node.js 18+, and npm. Each environment uses separate AWS accounts for isolation with cross-account IAM roles for deployment.

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
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
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

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
  bucket: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("dataBucket", {
  forceDestroy: true,  // ✅ CORRECT - allows cleanup
  // ...
});

// ❌ WRONG:
// Not setting forceDestroy or setting it to false will block cleanup
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully across all three environments
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Drift detection report accurately identifies configuration differences
