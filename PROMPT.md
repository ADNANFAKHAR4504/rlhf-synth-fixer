# Failure Recovery and High Availability

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDKTF Python program to implement a multi-region disaster recovery architecture for a financial trading platform.

### MANDATORY REQUIREMENTS (Must complete):

1. Deploy Aurora Global Database cluster with PostgreSQL 15 in us-east-1 as primary (CORE: Aurora)
2. Configure Route53 failover routing policy with health checks for automatic DNS failover (CORE: Route53)
3. Create secondary Aurora read replica cluster in us-west-2 for standby region
4. Implement health check endpoints using Lambda functions that verify database connectivity
5. Configure CloudWatch alarms for replication lag monitoring with notifications
6. Set up KMS keys in both regions for encryption with automatic key rotation
7. Create DynamoDB Global Tables for session state with point-in-time recovery enabled
8. Implement least-privilege IAM roles for all services with no wildcard permissions

### OPTIONAL ENHANCEMENTS (If time permits):

- Add AWS Backup for automated cross-region backup management (OPTIONAL: AWS Backup) - provides additional recovery points
- Implement Step Functions for orchestrated failover procedures (OPTIONAL: Step Functions) - ensures consistent failover process
- Add EventBridge rules for automated incident response (OPTIONAL: EventBridge) - enables automated recovery workflows

### Expected Output

A complete CDKTF Python application with separate stacks for each region, shared constructs for reusable components, and automated health monitoring that enables sub-60-second failover between regions while maintaining data consistency.

---

## Background

A financial trading platform requires a disaster recovery solution that can handle regional failures with minimal data loss. The system processes time-sensitive transactions and must maintain sub-second failover capabilities. Current infrastructure lacks cross-region redundancy, risking significant financial losses during AWS regional outages.

## Environment Setup

Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (standby). Utilizes Aurora Global Database for PostgreSQL with automated failover, Route53 health checks for DNS-based traffic routing, and DynamoDB Global Tables for session state replication.

**Requirements:**
- CDKTF 0.20+ with Python 3.9+
- AWS CDK constructs library
- Proper IAM permissions for cross-region resource management
- VPCs in both regions with private subnets across 3 AZs each
- VPC peering for secure cross-region communication
- NAT Gateways for outbound connectivity

## Constraints and Requirements

- RTO (Recovery Time Objective) must be under 60 seconds for regional failover
- RPO (Recovery Point Objective) must be under 5 seconds for database transactions
- Health checks must detect failures within 10 seconds and trigger automatic failover
- All sensitive data must be encrypted at rest using customer-managed KMS keys
- Cross-region replication lag monitoring must alert if latency exceeds 3 seconds
- Primary region must be us-east-1 with failover to us-west-2
- Total monthly infrastructure cost must not exceed $5000 for the DR setup

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

## Target Region
All primary resources should be deployed to: **us-east-1**
Secondary/failover resources should be deployed to: **us-west-2**

## Success Criteria
- Infrastructure deploys successfully in both regions
- Aurora Global Database is configured with automatic failover
- Route53 health checks are working and can trigger failover
- DynamoDB Global Tables are replicating correctly
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- RTO and RPO objectives are met
