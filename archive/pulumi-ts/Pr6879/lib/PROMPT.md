# Environment Migration

> CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript
>
> Platform: Pulumi
> Language: TypeScript
> Region: us-east-1
>
> Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company is migrating their payment processing infrastructure from their legacy on-premises setup to AWS. The current system processes credit card transactions through a Java-based application that connects to a PostgreSQL database. They need to replicate their production environment in AWS first, then create a migration strategy that allows for zero-downtime cutover.

## Problem Statement
Create a Pulumi TypeScript program to implement a migration infrastructure for moving an on-premises payment processing system to AWS. The configuration must:

1. Create a VPC with 3 public and 3 private subnets across different availability zones.
2. Deploy an RDS Aurora PostgreSQL cluster with one writer and two reader instances, encryption at rest, and point-in-time recovery enabled.
3. Set up an ECS cluster with a Fargate service running at least 3 tasks of the payment processing application.
4. Configure an Application Load Balancer with target group health checks pointing to the ECS service.
5. Implement AWS Database Migration Service with a replication instance and migration task for PostgreSQL to Aurora migration with CDC enabled.
6. Create a Lambda function that queries both source and target databases to validate record counts and data integrity.
7. Set up CloudWatch alarms for DMS replication lag, ECS task health, and RDS CPU utilization.
8. Configure security groups that allow traffic only between necessary components (ALB → ECS → RDS, DMS → RDS).
9. Implement proper IAM roles for ECS task execution, Lambda function, and DMS replication.
10. Apply consistent tagging across all resources with Environment='prod-migration', CostCenter='finance', and MigrationPhase='active'.

Expected output: A complete Pulumi TypeScript program that provisions the entire migration infrastructure, outputs the ALB DNS name, RDS cluster endpoint, and DMS replication task ARN. The program should use Pulumi's component resources to organize related infrastructure and include exported stack outputs for integration with monitoring dashboards.

## Environment Setup
Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Uses ECS Fargate for containerized Java application hosting, RDS Aurora PostgreSQL 13.7 for database, AWS DMS for database migration with ongoing replication. Requires Pulumi CLI 3.x, TypeScript 4.x, Node.js 16+, and AWS CLI configured with appropriate IAM permissions. VPC spans 10.0.0.0/16 with public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for ALB and private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for ECS tasks and RDS. NAT Gateways provide outbound internet access from private subnets.

## Constraints and Requirements
- All infrastructure must be tagged with Environment, CostCenter, and MigrationPhase tags
- Database migration must use AWS DMS with CDC enabled for real-time replication
- RDS Aurora PostgreSQL must be configured with encrypted storage and automated backups
- CloudWatch alarms must monitor DMS replication lag and alert if it exceeds 60 seconds
- The solution must include a Lambda function to validate data consistency post-migration
- The migration must support blue-green deployment pattern for zero-downtime cutover
- Network traffic between ECS tasks and RDS must remain within private subnets
- The application must run in ECS Fargate with at least 3 tasks across multiple AZs

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

## Target Region
Deploy all resources to: us-east-1

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
