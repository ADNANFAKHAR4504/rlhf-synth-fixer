# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
>
> Platform: **cdk**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to implement strict security compliance for their AWS infrastructure following SOC2 and PCI-DSS requirements. The security team has mandated specific encryption, access control, and audit logging configurations that must be enforced across all environments through infrastructure as code.

## Problem Statement
Create a CDK TypeScript program to deploy a secure infrastructure baseline that enforces organizational security policies. The configuration must: 1. Create a KMS key with automatic rotation enabled for encrypting all data at rest. 2. Deploy an RDS Aurora MySQL cluster with encryption, automated backups, and deletion protection. 3. Configure VPC with private subnets, no internet gateway on database subnets, and VPC flow logs. 4. Set up S3 buckets for application data and audit logs with versioning, encryption, and access logging. 5. Create IAM roles with session duration limits and MFA requirements for sensitive operations. 6. Deploy AWS Config rules to monitor compliance with encryption and access policies. 7. Configure CloudWatch Log groups with KMS encryption and metric filters for security events. 8. Set up SNS topics with encrypted message delivery for security alerts. 9. Create Systems Manager parameters for database endpoints and secure configuration values. 10. Implement stack-level termination protection and drift detection. 11. Generate compliance reports showing all security configurations applied. Expected output: A fully functional CDK application that creates a security-hardened infrastructure with all components properly encrypted, access-controlled, and monitored. The stack should output a compliance summary showing KMS key ARN, encrypted resource counts, enabled security features, and Config rule compliance status.

## Constraints and Requirements
- CloudWatch alarms must trigger on any unauthorized API calls or privilege escalations
- IAM roles must follow least-privilege principles with explicit deny statements for sensitive operations
- All resources must be tagged with DataClassification, Environment, and Owner tags
- Security groups must have explicit egress rules with no 0.0.0.0/0 destinations except for HTTPS
- All database connections must use TLS 1.2 or higher with certificate validation
- VPC flow logs must be enabled and sent to a centralized S3 bucket with 90-day retention
- All S3 buckets must use SSE-KMS encryption with customer-managed keys and block all public access

## Environment Setup
Production security-hardened infrastructure deployed in us-east-1 with strict compliance requirements. Uses RDS Aurora MySQL with encryption at rest, VPC with private subnets across 3 availability zones, S3 buckets with versioning and lifecycle policies, CloudWatch Logs for centralized logging, and SNS for security alerts. Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. Infrastructure includes AWS Config rules for continuous compliance monitoring and Systems Manager Parameter Store for secure configuration management.

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in ts
- Follow cdk best practices for resource organization
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

### Correct Resource Naming (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
```

### Correct AWS Config IAM Role (CDK TypeScript)
```typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // ✅ CORRECT
    )
  ]
});

// ❌ WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
