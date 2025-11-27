# Security Configuration as Code

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company is migrating their payment processing infrastructure from an on-premises data center to AWS. The legacy system runs on VMs with PostgreSQL databases and requires strict network isolation. The migration must happen in phases to minimize downtime and maintain PCI compliance throughout the process.

## Problem Statement
Create a Pulumi TypeScript program to orchestrate a phased migration of on-premises PostgreSQL databases to AWS RDS. The configuration must:

1. Define three migration phases (dev, staging, prod) as separate Pulumi stacks with shared networking
2. Create VPC endpoints for DMS, Secrets Manager to avoid internet routing
3. Deploy RDS PostgreSQL instances with encryption at rest using KMS customer-managed keys
4. Configure DMS replication instances with appropriate subnet groups and security rules
5. Implement automatic secret rotation for database passwords with Lambda functions
6. Set up CloudWatch alarms for replication lag exceeding 60 seconds
7. Create IAM roles with cross-account assume permissions for each migration phase
8. Export stack outputs for Direct Connect virtual interface IDs and attachment IDs
9. Implement resource provisioning callbacks to validate network connectivity before proceeding
10. Configure backup retention to 35 days with point-in-time recovery enabled
11. Tag all resources with CostCenter, MigrationPhase, and ComplianceScope tags

Expected output: A Pulumi program that manages the complete migration infrastructure with proper phase isolation, automated credential management, and monitoring. The solution should support rolling back individual phases without affecting others.

## Constraints and Requirements
- All database migrations must use AWS DMS with CDC enabled for zero-downtime cutover
- Network traffic between migrated and legacy components must traverse AWS Direct Connect only
- Each migration phase must maintain separate state files with explicit dependencies
- Database credentials must rotate automatically every 30 days using Secrets Manager
- All resources must be tagged with migration phase, cost center, and compliance scope

## Environment Setup
Multi-phase migration environment spanning on-premises datacenter and AWS us-east-2 region. Requires Pulumi 3.x with TypeScript, AWS CLI v2 configured, Node.js 18+. Infrastructure includes AWS Direct Connect for hybrid connectivity, for network routing, VPC with isolated subnets per migration phase. Uses RDS PostgreSQL 14 with Multi-AZ, DMS replication instances, Secrets Manager for credential rotation. Each phase deploys in separate AWS accounts with cross-account IAM roles. Monitoring via CloudWatch and for migration progress tracking.

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

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const bucket = new aws.s3.Bucket("dataBucket", {
  bucket: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Resource Lifecycle (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("dataBucket", {
  forceDestroy: true,  // CORRECT - allows cleanup
  // ...
});

// WRONG:
// No forceDestroy or set to false will block cleanup
```

### RDS with Proper Configuration (Pulumi TypeScript)
```typescript
const db = new aws.rds.Instance("database", {
  identifier: `postgres-${environmentSuffix}`,
  engine: "postgres",
  engineVersion: "14",
  instanceClass: "db.t3.medium",
  allocatedStorage: 20,
  skipFinalSnapshot: true,  // CORRECT - allows cleanup
  deletionProtection: false,  // CORRECT - allows cleanup
  backupRetentionPeriod: 35,  // As required
  // ...
});
```

## Target Region
Deploy all resources to: **us-east-2**

## Success Criteria
- Infrastructure deploys successfully across all three phases
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Database migration can be rolled back per phase
- Automatic credential rotation is functioning
- CloudWatch alarms are triggering appropriately
