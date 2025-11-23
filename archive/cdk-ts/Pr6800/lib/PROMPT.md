# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDK with TypeScript**
> 
> Platform: **cdk**  
> Language: **ts**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDK TypeScript program to deploy a production-ready AWS environment for a financial trading analytics platform. The configuration must:

1. Set up a VPC with CIDR 10.0.0.0/16 spanning exactly 3 availability zones, with public and private subnets in each AZ.
2. Deploy an Aurora Serverless v2 PostgreSQL cluster in private subnets with automated backups and encryption using KMS.
3. Create DynamoDB tables for user sessions and API keys with on-demand billing and point-in-time recovery.
4. Configure an S3 bucket hierarchy for raw data ingestion, processed analytics, and long-term archival with appropriate lifecycle rules.
5. Implement Lambda functions using Graviton2 processors for data processing pipelines with environment-specific configuration.
6. Set up API Gateway REST APIs with usage plans, API keys, and request throttling at 1000 RPS per key.
7. Configure CloudWatch Log Groups for all services with 30-day retention and subscription filters for alerting.
8. Create KMS keys for database encryption, S3 encryption, and Lambda environment variables.
9. Implement IAM roles and policies following least-privilege principles with explicit regional restrictions.
10. Deploy AWS Config with rules for PCI-DSS compliance checking including encryption validation and access logging.
11. Tag all resources with Environment, CostCenter, Compliance, and DataClassification tags.
12. Output the VPC ID, database endpoint, API Gateway URL, and S3 bucket names for application configuration.

Expected output: A fully functional CDK TypeScript application with proper stack organization, type safety, and modular construction. The synthesized CloudFormation template should create all resources with appropriate dependencies and be deployable in a single command.

---

## Background

A financial services startup needs to establish their first production AWS environment for a new trading analytics platform. The platform processes real-time market data and provides insights to institutional clients through a web dashboard. They require a secure, compliant infrastructure that meets PCI-DSS requirements while maintaining cost efficiency.

---

## Environment Setup

Production financial services environment deployed in us-east-1 across 3 availability zones. Core services include Aurora Serverless v2 PostgreSQL for transactional data, DynamoDB for session management, Lambda functions on Graviton2 for data processing, API Gateway for client access, and S3 for data archival. VPC configured with 10.0.0.0/16 CIDR, public subnets for NAT gateways, private subnets for compute and database resources. Requires AWS CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate credentials. All resources tagged for cost allocation and compliance tracking.

---

## Constraints and Requirements

- All S3 buckets must have versioning enabled and lifecycle policies for 90-day archival
- All data must be encrypted at rest using AWS KMS customer-managed keys
- All IAM roles must follow least-privilege principle with explicit deny for unused regions
- CloudWatch Logs retention must be set to 30 days for all log groups
- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- RDS instances must use Aurora Serverless v2 to optimize costs during low-traffic periods
- Infrastructure must include AWS Config rules for PCI-DSS compliance monitoring
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- API Gateway must implement request throttling at 1000 requests per second per API key
- VPC must span exactly 3 availability zones with CIDR 10.0.0.0/16

---

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)

## Target Region
All resources should be deployed to: **us-east-1**
