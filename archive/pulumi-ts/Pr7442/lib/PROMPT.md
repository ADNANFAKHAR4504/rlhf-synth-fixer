# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a secure secrets management infrastructure with automated rotation. MANDATORY REQUIREMENTS (Must complete): 1. Create AWS Secrets Manager secrets for RDS credentials with automatic rotation every 30 days (CORE: Secrets Manager) 2. Deploy Lambda function in VPC private subnet to handle secret rotation logic (CORE: Lambda) 3. Configure customer-managed KMS key with key policy allowing only specific IAM roles 4. Create VPC with 3 private subnets across availability zones (no public subnets) 5. Set up VPC endpoint for Secrets Manager to ensure private connectivity 6. Implement IAM roles with explicit deny for any action outside the VPC 7. Configure CloudWatch log group with 365-day retention for audit logs 8. Apply mandatory tags: Environment, CostCenter, Compliance, Owner to all resources OPTIONAL ENHANCEMENTS (If time permits): • Add EventBridge rule to notify on rotation failures (OPTIONAL: EventBridge) - improves incident response • Implement for complex multi-step rotations (OPTIONAL: ) - handles dependencies • Add AWS Config rules for compliance validation (OPTIONAL: Config) - automates compliance checks Expected output: Complete Pulumi TypeScript program that deploys a production-ready secrets management system with automated rotation, strict security controls, and full audit capabilities. The infrastructure should pass security compliance checks with no public exposure of secrets.

---

## Additional Context

### Background
A financial services company needs to implement a secure secrets management system for their microservices architecture. The system must enforce strict access controls, audit trails, and encryption standards to meet PCI-DSS compliance requirements. All secrets must be centrally managed with automated rotation capabilities.

### Constraints and Requirements
- All secrets must be stored in AWS Secrets Manager with automatic rotation enabled
- KMS keys must use customer-managed keys (CMK) with strict key policies
- Lambda functions for rotation must run in isolated VPC with no internet access
- IAM roles must follow least privilege with no inline policies allowed
- All API calls to Secrets Manager must be logged to CloudWatch
- Secret access must be restricted to specific only
- Rotation functions must complete within 60 seconds timeout
- All resources must have cost allocation tags for compliance tracking

### Environment Setup
Highly secure multi-AZ deployment in us-east-1 for secrets management infrastructure. Uses AWS Secrets Manager for storing database credentials, API keys, and certificates. KMS with customer-managed keys for encryption. Lambda functions in isolated VPC for secret rotation. for private connectivity. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. Private subnets across 3 availability zones with no internet gateway. CloudWatch Logs for audit trails with 365-day retention.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

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
  bucket: `data-bucket-${environmentSuffix}`,
  // Pulumi automatically destroys resources by default - no explicit setting needed
  // ✅ CORRECT: Default behavior is to destroy on pulumi destroy
});
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
All resources should be deployed to: **us-east-1**
