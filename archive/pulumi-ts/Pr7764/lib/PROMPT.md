# Infrastructure QA and Management

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts (TypeScript)**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to implement an automated compliance checking system using AWS Config. The configuration must:

1. Set up an S3 bucket with versioning and encryption to store Config snapshots and history files.
2. Deploy AWS Config with a configuration recorder that tracks EC2 instances, S3 buckets, and IAM roles.
3. Create custom Config rules to check that all S3 buckets have encryption enabled and versioning turned on.
4. Implement a Config rule to verify EC2 instances use approved AMI IDs from a provided list.
5. Configure an SNS topic for compliance notifications with email subscription endpoints.
6. Create a Lambda function that processes Config compliance events and formats detailed reports.
7. Set up Config remediation actions to automatically enable S3 bucket encryption when non-compliance is detected.
8. Implement proper IAM roles with least privilege for Config, Lambda, and remediation actions.
9. Add resource tagging standards checking to ensure all resources have required tags (Environment, Owner, CostCenter).
10. Configure Config aggregator to collect compliance data from multiple regions.

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
- Verify dependencies are explicit (use `dependsOn` in Pulumi)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket(`data-bucket-${environmentSuffix}`, {
  bucket: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct AWS Config IAM Role (Pulumi TypeScript)
```typescript
const configRole = new aws.iam.Role("ConfigRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "config.amazonaws.com"
  }),
  managedPolicyArns: [
    "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  // ✅ CORRECT
  ]
});

// ❌ WRONG:
// 'arn:aws:iam::aws:policy/service-role/ConfigRole'  // Policy doesn't exist
// 'arn:aws:iam::aws:policy/AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
