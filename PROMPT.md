# Application Deployment

> CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Python
> 
> Platform: **cdk**  
> Language: **py**  
> Region: **us-east-1**
>
> Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to implement automated deployment pipelines for their microservices architecture. Each service requires isolated testing environments and strict security controls before production deployment. The team wants Infrastructure as Code to manage their CI/CD pipelines alongside their application infrastructure.

## Problem Statement
Create a CDK Python program to deploy a multi-stage CI/CD pipeline for containerized applications. The configuration must: 

1. Set up with source, build, test, and deploy stages across three AWS accounts (dev, staging, prod)
2. Configure projects for each stage using ECR-hosted build images with compute type BUILD_GENERAL1_SMALL
3. Implement manual approval actions before staging and production deployments with SNS notifications
4. Create S3 buckets for pipeline artifacts with versioning, encryption, and 90-day lifecycle rules
5. Deploy ECS Fargate services using with blue/green deployment configuration
6. Set up cross-account IAM roles for pipeline execution with explicit deny for ec2:TerminateInstances
7. Configure CloudWatch event rules to trigger SNS alerts only on pipeline failures
8. Implement caching using S3 with 7-day expiration for dependency management
9. Create entries for Docker registry credentials with SecureString type
10. Add CloudWatch dashboards showing pipeline execution metrics and success rates

Expected output: A complete CDK Python application that deploys a production-ready CI/CD pipeline with proper security controls, cross-account deployments, and monitoring. The stack should output the pipeline ARN, artifact bucket name, and SNS topic ARN for notifications.

## Constraints and Requirements
- All projects must use custom Docker images stored in ECR
- Pipeline artifacts must be encrypted with customer-managed KMS keys
- Each pipeline stage must have separate IAM roles with least-privilege permissions
- All build logs must be retained in CloudWatch for exactly 30 days
- Pipeline notifications must use SNS with email subscriptions for failures only
- Must use S3 versioning for artifact storage with lifecycle policies

## Environment Setup
AWS multi-account setup in us-east-1 region for CI/CD infrastructure. Uses for orchestration, for build/test stages, ECR for Docker image storage, and for ECS Fargate deployments. Requires CDK 2.x with Python 3.9+, AWS CLI v2 configured with appropriate permissions. for S3, ECR, and to keep traffic private. Separate AWS accounts for dev, staging, and production environments with cross-account IAM roles for deployment. CloudWatch Logs for centralized logging with metric filters for error detection.

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in Python
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
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
