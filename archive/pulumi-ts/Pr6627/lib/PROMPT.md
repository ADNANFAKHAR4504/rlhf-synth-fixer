# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Go program to deploy consistent infrastructure across three environments (dev, staging, prod) with proper configuration management. The configuration must: 1. Define a reusable component resource that creates a VPC with public/private subnets across 2 AZs. 2. Implement environment-specific RDS PostgreSQL instances with automated backups and encryption. 3. Create S3 buckets with environment-specific naming and retention policies (7 days for dev, 30 days for staging, 90 days for prod). 4. Deploy Lambda functions with environment-specific configurations for memory (128MB dev, 256MB staging, 512MB prod) and timeout values. 5. Set up API Gateway REST APIs that invoke the Lambda functions with proper IAM roles. 6. Configure CloudWatch log groups with environment-specific retention periods. 7. Export critical resource IDs and endpoints as stack outputs for cross-stack references. 8. Implement a configuration validation function that ensures all required environment-specific values are present. 9. Create IAM roles and policies following least-privilege principles for each service. 10. Set up CloudWatch alarms with environment-specific thresholds for RDS CPU utilization. 11. Ensure all resources use consistent naming conventions with environment prefixes. 12. Implement proper error handling and rollback capabilities for failed deployments. Expected output: Three separate Pulumi stacks (dev, staging, prod) with identical infrastructure topology but environment-specific configurations, demonstrating how to maintain consistency while allowing controlled variations between environments.

---

## Additional Context

### Background
A fintech startup needs to maintain identical infrastructure across development, staging, and production environments while ensuring configuration differences are properly managed. The company uses GitOps practices and requires automated environment promotion with drift detection capabilities.

### Constraints and Requirements
- [RDS instances must use different instance types per environment (t3.micro for dev, t3.small for staging, t3.medium for prod), All resources must be tagged with Environment, ManagedBy, and CostCenter tags, Lambda functions must have environment-specific memory allocations and timeout values, All S3 buckets must have versioning enabled and lifecycle policies, Each environment must have its own VPC with identical CIDR block structure but different ranges, Must use Pulumi stack references to share outputs between environments, Environment-specific configurations must be stored in Pulumi config files, Must implement a custom Pulumi component resource for reusable infrastructure patterns]

### Environment Setup
Multi-environment AWS deployment across us-east-1 region with separate VPCs per environment (dev: 10.0.0.0/16, staging: 10.1.0.0/16, prod: 10.2.0.0/16). Each environment includes RDS PostgreSQL instances, S3 buckets for application data, Lambda functions for data processing, and API Gateway endpoints. Requires Pulumi 3.x with Go SDK, AWS CLI configured with appropriate IAM permissions. VPCs include public and private subnets across 2 AZs with NAT gateways for Lambda outbound traffic. Infrastructure state stored in Pulumi Cloud with stack-based organization.

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
All resources should be deployed to: **us-east-1**
