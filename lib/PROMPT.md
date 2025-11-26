# Application Deployment

> **️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **eu-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to establish a foundational cloud environment for a financial services platform.

### MANDATORY REQUIREMENTS (Must complete):

1. Create a VPC with CIDR 10.0.0.0/16 across 3 availability zones (CORE: VPC)
2. Deploy public and private subnets in each AZ with proper route tables
3. Configure NAT gateways in public subnets for outbound internet access
4. Create an RDS Aurora PostgreSQL cluster with encryption enabled (CORE: RDS)
5. Establish ECR repositories with image scanning on push
6. Configure VPC endpoints for S3 and ECR to reduce data transfer costs
7. Implement CloudWatch log groups with 30-day retention for all services
8. Create KMS keys for RDS encryption with automatic rotation
9. Apply mandatory tags (Environment, Project, CostCenter) to all resources

### OPTIONAL ENHANCEMENTS (If time permits):

- Add automated RDS snapshot backup policies - ensures compliance with policies
- Implement VPC Flow Logs with S3 storage - enhances security monitoring
- Create Transit Gateway for future multi-account connectivity - enables enterprise scaling

**Expected output**: A Pulumi TypeScript program that provisions a complete, production-ready AWS environment with proper network isolation, encryption, and foundational services ready for application deployment.

---

## Background

A financial services startup needs to establish their initial cloud infrastructure for a new digital banking platform. They require a secure, compliant environment with proper network isolation and data encryption to meet regulatory requirements. The infrastructure must support both containerized microservices and managed database workloads.

## Environment Setup

```
New AWS account in eu-central-1 region requiring foundational cloud setup. Infrastructure includes VPC with 3 availability zones, private and public subnets, NAT gateways for outbound traffic. Core services: EC2 Lambda for containerized workloads, RDS Aurora PostgreSQL for transactional data, ECR for container registry. Requires Pulumi CLI 3.x, TypeScript, Node.js 18+, AWS CLI configured with appropriate credentials. Network architecture includes transit gateway for future multi-account connectivity.
```

## Constraints and Requirements

- All data at rest must be encrypted using AWS KMS customer-managed keys
- Network traffic between services must traverse private subnets only
- Database backups must have a retention period of exactly 30 days
- Container images must be scanned for vulnerabilities before deployment
- All resources must be tagged with Environment, Project, and CostCenter tags

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
  -  CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  -  Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  -  Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  -  CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  -  WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
  bucket: `data-bucket-${environmentSuffix}`,  //  CORRECT
  // ...
});

//  WRONG:
// bucket: "data-bucket-prod"  // Hardcoded, will fail
```

### Correct Deletion Protection (Pulumi TypeScript)
```typescript
const db = new aws.rds.Cluster("dbCluster", {
  deletionProtection: false,  //  CORRECT for synthetic tasks
  skipFinalSnapshot: true,    //  CORRECT for synthetic tasks
  // ...
});

//  WRONG:
// deletionProtection: true  // Will block cleanup
```

## Target Region
All resources should be deployed to: **eu-central-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
