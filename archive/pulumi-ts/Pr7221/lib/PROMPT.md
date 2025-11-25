# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to deploy their real-time payment processing web application with strict compliance requirements for PCI-DSS. The application consists of a React frontend and Node.js API backend that processes sensitive financial transactions. They require automated blue-green deployments with zero downtime during updates.

## Problem Statement
Create a Pulumi TypeScript program to deploy a production-ready web application with blue-green deployment capability. The configuration must:

1. Set up ALB with target groups for blue and green environments, using weighted routing (CORE: ALB).
3. Configure Aurora PostgreSQL Serverless v2 with automated backups every 6 hours.
4. Implement auto-scaling policies that maintain 3-10 instances based on CPU/memory metrics.
5. Create S3 buckets for static assets with distribution and versioning enabled.
6. Configure CloudWatch dashboards showing response times, error rates, and active connections.
7. Set up health checks that monitor both /health endpoints every 30 seconds.
8. Implement automated rollback mechanism using CloudWatch alarms on 5XX error rates.
9. Ensure all resources are tagged with Environment, Application, and CostCenter tags.
10. Create IAM roles with least-privilege policies for EC2 tasks and Lambda functions.
11. Configure for S3 and ECR to reduce costs.
12. Output the ALB DNS name, distribution URL, and database connection string.

Expected output: A complete Pulumi TypeScript program that creates a fault-tolerant web application infrastructure with automated blue-green deployments, meeting all compliance and operational requirements.

## Constraints and Requirements
- All data must be encrypted at rest using customer-managed keys
- Application logs must be retained for exactly 90 days for compliance auditing
- Database connections must use SSL/TLS with certificate verification enabled
- Auto-scaling must maintain minimum 3 instances during business hours (8 AM - 6 PM EST)
- Health checks must validate both frontend and backend endpoints before marking instances healthy
- Deployment must support immediate rollback within 30 seconds if health checks fail
- All S3 buckets must have versioning enabled and block public access
- Load balancer must terminate SSL with AWS Certificate Manager certificates only
- Database backups must occur every 6 hours with point-in-time recovery enabled

## Environment Setup
Production deployment in us-east-1 with multi-AZ configuration across 3 availability zones. Uses Application Load Balancer for traffic distribution, EC2 Lambda for containerized workloads running Node.js API and React frontend, Aurora PostgreSQL Serverless v2 for database with read replicas. VPC with public subnets for ALB and private subnets for EC2 tasks and Aurora. NAT Gateways in each AZ for outbound connectivity. Requires Pulumi CLI 3.x, TypeScript 4.x, Node.js 18+, AWS CLI configured with appropriate IAM permissions. CloudWatch for monitoring and alerting.

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
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const bucket = new aws.s3.Bucket("dataBucket", {
    bucket: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
    // ...
});

// ❌ WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Resource Lifecycle (Pulumi TypeScript)
```typescript
const database = new aws.rds.Instance("database", {
    skipFinalSnapshot: true,  // ✅ CORRECT for CI/CD
    deletionProtection: false,  // ✅ CORRECT for CI/CD
    // ...
});

// ❌ WRONG:
// skipFinalSnapshot: false  // Will block cleanup
// deletionProtection: true  // Will block cleanup
```

### Correct AWS Config IAM Role (Pulumi TypeScript)
```typescript
const configRole = new aws.iam.Role("configRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "config.amazonaws.com",
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",  // ✅ CORRECT
    ],
});

// ❌ WRONG:
// "arn:aws:iam::aws:policy/service-role/ConfigRole"  // Policy doesn't exist
// "arn:aws:iam::aws:policy/AWS_ConfigRole"  // Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
