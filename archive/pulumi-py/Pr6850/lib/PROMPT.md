# Failure Recovery and High Availability

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Python**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company requires a multi-region disaster recovery solution for their critical payment processing application. The system must maintain sub-second RPO and ensure automatic failover capabilities while minimizing data loss.

## Problem Statement
Create a Pulumi Python program to deploy a multi-region disaster recovery infrastructure for a payment processing system. The configuration must: 1. Set up Aurora Global Database cluster in us-east-1 as primary with us-east-2 as secondary region. 2. Configure DynamoDB global tables for transaction data with point-in-time recovery enabled. 3. Deploy identical Lambda functions in both regions for payment validation logic. 4. Create S3 buckets with cross-region replication for audit logs and transaction receipts. 5. Implement Route 53 failover routing with health checks monitoring RDS endpoints. 6. Configure CloudWatch dashboards in both regions showing replication lag metrics. 7. Set up SNS topics for automated failover notifications to operations team. 8. Create IAM roles allowing cross-region resource access for disaster recovery operations. 9. Implement CloudWatch alarms monitoring Aurora replication lag exceeding 1 second. 10. Deploy API Gateway endpoints in both regions with custom domain names. Expected output: A Pulumi stack that provisions all resources in both regions with automated failover capabilities, monitoring dashboards showing replication health, and documented procedures for triggering manual failover if needed.

## Constraints and Requirements
- S3 buckets must use cross-region replication with versioning enabled
- Lambda functions must be replicated across regions with identical configurations
- Route 53 health checks must monitor both regions continuously
- Primary region must be us-east-1 with failover to us-east-2
- IAM roles must follow least-privilege principle with cross-region assume permissions
- RDS instances must use Aurora Global Database with automated backups
- DynamoDB global tables must be configured for bi-directional replication
- All resources must be tagged with Environment, Region, and DR-Role tags
- CloudWatch alarms must trigger SNS notifications for failover events

## Environment Setup
Multi-region AWS deployment spanning us-east-1 (primary) and us-east-2 (disaster recovery). Infrastructure includes Aurora Global Database for PostgreSQL 13.7, DynamoDB global tables, Lambda functions for payment processing, S3 buckets with cross-region replication, and Route 53 failover routing policies. Requires Pulumi 3.x with Python 3.9+, AWS CLI v2 configured with appropriate credentials. VPCs in both regions with private subnets across 3 availability zones, VPC peering for secure cross-region communication, and NAT gateways for outbound internet access.

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in Python
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
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) - Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) - Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) - Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) - Use `skip_final_snapshot: true`
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
Deploy all resources to: **us-east-1** (primary) and **us-east-2** (secondary)

## Success Criteria
- Infrastructure deploys successfully in both regions
- Aurora Global Database replication is configured and working
- DynamoDB global tables are properly synchronized
- Lambda functions are deployed identically in both regions
- S3 cross-region replication is active
- Route 53 failover routing responds to health check failures
- CloudWatch dashboards show replication metrics
- SNS notifications trigger on failover events
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
