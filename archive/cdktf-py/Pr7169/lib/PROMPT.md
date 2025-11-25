# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
> 
> Platform: **cdktf**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDKTF Python program to implement a multi-region disaster recovery architecture for a payment processing system. The configuration must:

1. Set up Aurora Global Database with a primary cluster in us-east-1 and secondary in us-west-2, using db.r6g.large instances.
2. Configure DynamoDB global tables for session data with on-demand billing mode.
3. Deploy identical Lambda functions in both regions for payment webhook processing with 1GB memory.
4. Create S3 buckets in both regions with versioning and cross-region replication rules.
5. Implement Route 53 failover routing policy with primary and secondary record sets.
6. Configure CloudWatch alarms for Aurora lag monitoring (threshold: 60 seconds).
7. Set up topics in both regions for operational alerts.
8. Create EventBridge rules to trigger Lambda functions on payment events.
9. Implement AWS Backup plans for Aurora with 7-day retention.
10. Configure VPC peering between regions for secure database replication.

Expected output: A CDKTF Python application that deploys a complete multi-region DR setup with automated failover capabilities, ensuring the payment system remains operational during regional outages with minimal data loss.

---

## Background

A financial services company requires a disaster recovery solution for their critical payment processing system. The system must maintain business continuity with minimal data loss in case of regional AWS outages. They need automated failover capabilities and continuous data replication between regions.

## Environment Setup

Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary). Deployment includes Aurora Global Database with MySQL 8.0 for transactional data, DynamoDB global tables for session management, Lambda functions for payment processing logic, and S3 with cross-region replication for document storage. Route 53 manages DNS failover with health checks. VPCs in both regions with private subnets for databases and Lambda functions. Requires Python 3.9+, CDKTF 0.20+, AWS CDK 2.x, and appropriate IAM permissions for multi-region deployments.

## Constraints and Requirements

- Primary region must be us-east-1 with failover to us-west-2
- Aurora Global Database must use MySQL 8.0 engine
- Route 53 health checks must monitor both regions every 30 seconds
- Lambda functions must be deployed identically in both regions
- DynamoDB global tables must have point-in-time recovery enabled
- S3 buckets must use cross-region replication with delete marker replication
- All resources must be tagged with Environment=DR and CostCenter=Finance
- IAM roles must use assume role policies with external ID validation
- CloudWatch alarms must trigger notifications for failover events
- Recovery Time Objective (RTO) must be under 5 minutes

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

## Target Region
All resources should be deployed to: **us-east-1** (primary) and **us-west-2** (secondary)
