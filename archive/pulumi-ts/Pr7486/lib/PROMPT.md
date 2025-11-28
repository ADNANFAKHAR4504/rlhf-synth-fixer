# Failure Recovery and High Availability

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to implement a disaster recovery solution for their critical transaction processing system. The system must maintain RPO of under 1 hour and RTO of under 4 hours, with automated failover capabilities between regions.

## Problem Statement
Create a Pulumi TypeScript program to deploy a multi-region disaster recovery infrastructure for a transaction processing system. The configuration must:

1. Set up RDS Aurora Global Database with one writer cluster in us-east-1 and reader cluster in us-west-2.
2. Deploy identical Lambda functions in both regions for transaction processing with 3GB memory and 5-minute timeout.
3. Configure DynamoDB global tables for session management with on-demand billing mode.
4. Implement Route 53 hosted zone with weighted routing policy (100% to primary, 0% to DR initially).
5. Create health check endpoints using Lambda functions that verify database connectivity.
6. Set up CloudWatch alarms for RDS replication lag exceeding 30 seconds.
7. Configure SNS topics in both regions for alert notifications.
8. Implement automated DNS failover using Route 53 health checks with 30-second intervals.
9. Create S3 buckets with cross-region replication for application artifacts.
10. Deploy Application Load Balancers in both regions with target groups pointing to Lambda functions.
11. Ensure all resources are tagged with Environment=Production and DisasterRecovery=Enabled.

Expected output: A Pulumi program that creates a fully functional multi-region infrastructure with automated failover capabilities, meeting RPO/RTO requirements and allowing seamless disaster recovery testing.

## Constraints and Requirements
- Primary region must be us-east-1 with failover to us-west-2
- RDS Aurora Global Database must use PostgreSQL 15.x with encryption at rest
- Lambda functions must be replicated with identical configurations in both regions
- DynamoDB global tables must have point-in-time recovery enabled
- Route 53 health checks must trigger automatic DNS failover within 60 seconds
- All IAM roles must follow least-privilege principle with no AdminAccess policies

## Environment Setup
Multi-region AWS deployment spanning us-east-1 (primary) and us-west-2 (DR). Infrastructure includes RDS Aurora Global Database with PostgreSQL 15.x, Lambda functions for transaction processing, DynamoDB global tables for session data, and Route 53 for DNS failover. Each region has VPCs with 3 availability zones, private subnets for databases, and public subnets for ALBs. Requires Pulumi 3.x with TypeScript, AWS CLI configured with appropriate credentials, Node.js 18+, and access to both AWS regions. The environment uses Parameter Store for configuration management across regions.

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
- Tag all resources appropriately (Environment=Production, DisasterRecovery=Enabled)

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
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision
- **For this task**: Use RDS Aurora Global Database with PostgreSQL 15.x
  - Primary cluster in us-east-1 (writer)
  - Secondary cluster in us-west-2 (reader)
  - Set `skipFinalSnapshot: true` for both clusters
  - Enable encryption at rest

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
- Verify dependencies are explicit (use appropriate Pulumi dependency tracking)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket(`data-bucket-${environmentSuffix}`, {
  bucket: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Deletion Protection (Pulumi TypeScript)
```typescript
const cluster = new aws.rds.Cluster(`aurora-cluster-${environmentSuffix}`, {
  skipFinalSnapshot: true,  // CORRECT - allows cleanup
  deletionProtection: false,  // CORRECT - allows cleanup
  // ...
});

// WRONG:
// skipFinalSnapshot: false  // Will block cleanup
// deletionProtection: true  // Will block cleanup
```

### Multi-Region Setup (Pulumi TypeScript)
```typescript
// Primary region provider (us-east-1)
const primaryProvider = new aws.Provider("primary", {
  region: "us-east-1",
});

// DR region provider (us-west-2)
const drProvider = new aws.Provider("dr", {
  region: "us-west-2",
});

// Create resources in primary region
const primaryBucket = new aws.s3.Bucket(`app-bucket-primary-${environmentSuffix}`, {
  bucket: `app-bucket-primary-${environmentSuffix}`,
}, { provider: primaryProvider });

// Create resources in DR region
const drBucket = new aws.s3.Bucket(`app-bucket-dr-${environmentSuffix}`, {
  bucket: `app-bucket-dr-${environmentSuffix}`,
}, { provider: drProvider });
```

## Target Region
Primary region: **us-east-1**
DR region: **us-west-2**

## Success Criteria
- Infrastructure deploys successfully in both regions
- RDS Aurora Global Database is configured with us-east-1 as primary and us-west-2 as secondary
- Lambda functions are deployed identically in both regions
- DynamoDB global tables are configured with replication
- Route 53 hosted zone and health checks are properly configured
- CloudWatch alarms monitor RDS replication lag
- SNS topics are set up for alerts in both regions
- S3 cross-region replication is enabled
- Application Load Balancers are deployed in both regions
- All resources are properly tagged (Environment=Production, DisasterRecovery=Enabled)
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly named with environmentSuffix
- Infrastructure can be cleanly destroyed

## AWS Services Required
Based on the problem statement, this task requires:
- RDS Aurora (Global Database with PostgreSQL 15.x)
- Lambda (transaction processing functions in both regions)
- DynamoDB (global tables for session management)
- Route 53 (hosted zone, weighted routing, health checks)
- CloudWatch (alarms for replication lag)
- SNS (notification topics in both regions)
- S3 (buckets with cross-region replication)
- Application Load Balancer (ALB in both regions)
- VPC (networking in both regions)
- IAM (roles and policies following least-privilege)
- KMS (encryption keys for data at rest)
