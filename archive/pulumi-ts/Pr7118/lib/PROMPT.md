# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to deploy their loan processing web application with strict compliance requirements for data residency and audit trails. The application handles sensitive financial data and must maintain detailed logs for regulatory audits while ensuring high availability across multiple availability zones.

## Problem Statement
Create a Pulumi TypeScript program to deploy a containerized loan processing web application with strict compliance requirements.

### MANDATORY REQUIREMENTS (Must complete)

1. Create VPC with 3 public and 3 private subnets across 3 AZs with NAT Gateways (CORE: VPC)
2. Deploy ECS Fargate cluster with service running 3 tasks minimum (CORE: ECS)
3. Configure RDS PostgreSQL instance with Multi-AZ deployment and automated backups (CORE: RDS)
4. Set up Application Load Balancer with target group pointing to ECS service
5. Implement CloudWatch Log Groups with 7-day retention for ECS container logs
6. Create S3 bucket for ALB access logs with lifecycle policy transitioning to Glacier after 90 days
7. Configure IAM roles with least-privilege policies for ECS task execution
8. Set up security groups allowing only HTTPS traffic to ALB and PostgreSQL traffic from ECS
9. Enable RDS encryption with customer-managed KMS key
10. Configure ECS service auto-scaling based on CPU utilization (target 70%)

### OPTIONAL ENHANCEMENTS (If time permits)

- Add AWS WAF to ALB for protection against common web exploits (OPTIONAL: WAF) - improves security posture
- Implement health checks with failover routing (OPTIONAL) - enhances availability
- Add ElastiCache Redis cluster for session management (OPTIONAL: ElastiCache) - improves performance

### Expected Output
A complete Pulumi TypeScript program that provisions all required AWS resources with proper networking, security, and compliance configurations. The program should use Pulumi's strong typing and include proper error handling and resource dependencies.

## Constraints and Requirements

- All RDS backups must be encrypted with customer-managed KMS keys
- ALB access logs must be stored in S3 with lifecycle policies for 7-year retention
- ECS task definitions must use specific CPU and memory limits (256 CPU units, 512MB memory)
- All inter-service communication must occur over private subnets only
- CloudWatch Logs must use custom log groups with specific naming convention: /ecs/fintech/{service-name}
- S3 buckets must have versioning enabled and MFA delete protection
- Security groups must explicitly deny all traffic except required ports (80, 443, 5432)

## Environment Setup

Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Core services include:
- ECS Fargate for containerized web application
- RDS PostgreSQL Multi-AZ for primary database
- Application Load Balancer for traffic distribution
- VPC with 3 public subnets for ALB and 3 private subnets for ECS tasks and RDS
- NAT Gateways in each AZ for outbound connectivity

### Required Tools
- Pulumi CLI 3.x
- TypeScript 4.x
- Node.js 18+
- AWS CLI configured with appropriate IAM permissions
- CloudWatch Logs for centralized logging with custom retention policies

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in ts
- Follow pulumi best practices for resource organization
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
  forceDestroy: true,  // ✅ CORRECT - allows bucket deletion
  // ...
});

// ❌ WRONG:
// forceDestroy: false  // Will block cleanup
```

### Correct RDS Configuration (Pulumi TypeScript)
```typescript
const db = new aws.rds.Instance("database", {
  skipFinalSnapshot: true,  // ✅ CORRECT - allows clean deletion
  deletionProtection: false,  // ✅ CORRECT - allows resource destruction
  // ...
});

// ❌ WRONG:
// skipFinalSnapshot: false  // Will require manual snapshot deletion
// deletionProtection: true  // Will block stack deletion
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
