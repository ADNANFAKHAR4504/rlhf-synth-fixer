# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to manage infrastructure consistency across three environments (dev, staging, prod) in different AWS regions. The configuration must: 1. Define a base infrastructure template that includes VPC, subnets, security groups, ECS cluster, and RDS Aurora database. 2. Create environment-specific stack configurations that inherit from the base template while allowing for size variations (t3.medium for dev, m5.large for staging, m5.xlarge for prod). 3. Implement cross-stack references to ensure network configurations are synchronized across environments. 4. Set up AWS Systems Manager Parameter Store hierarchies for each environment with shared and environment-specific parameters. 5. Create ECS task definitions that automatically pull the correct container images based on environment (dev uses :latest, staging uses :staging-*, prod uses :v*.*.*). 6. Configure RDS Aurora clusters with appropriate instance counts (1 for dev, 2 for staging, 3 for prod) and backup retention policies. 7. Implement CloudWatch dashboards that aggregate metrics across all environments for comparison. 8. Set up SNS topics for configuration drift alerts when environments diverge from expected state. Expected output: Three Pulumi stacks deployed across different regions with consistent network topology, security configurations, and service definitions, while maintaining environment-appropriate sizing and redundancy levels.

---

## Background
A financial services company operates identical trading platforms across development, staging, and production environments in different AWS regions. Recent incidents where staging configurations drifted from production led to failed deployments and trading disruptions.

## Environment Setup
Multi-region AWS deployment spanning us-east-1 (production), us-east-1 (staging), and us-east-2 (development). Infrastructure includes VPCs with 3 availability zones each, Application Load Balancers, ECS Fargate services running containerized trading applications, RDS Aurora PostgreSQL clusters with read replicas, S3 buckets for data storage, and CloudWatch for monitoring. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, AWS CLI configured with cross-region permissions. Each environment maintains isolated VPCs with peering connections for secure inter-environment communication.

## Constraints and Requirements
- Implement automated drift detection between environments
- Implement environment-specific parameter validation using TypeScript interfaces
- Deploy to at least 3 different AWS regions with region-specific configurations
- Create reusable components using Pulumi ComponentResource pattern
- Use Pulumi's stack references to share outputs between environments
- Use Pulumi's configuration system for environment-specific values
- Use AWS Systems Manager Parameter Store for shared configuration
- Implement rollback capabilities using Pulumi's state management

---

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
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Runtime**: Using `nodejs16.x` with AWS SDK v2 for drift detection Lambda
  - AWS SDK v2 is bundled by default in Node.js 16.x runtime
  - Use `require('aws-sdk')` for AWS service calls
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
const bucket = new aws.s3.Bucket("dataBucket", {
  bucket: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("dataBucket", {
  forceDestroy: true,  // CORRECT - allows cleanup
  // ...
});

// WRONG:
// No forceDestroy or forceDestroy: false  // Will block cleanup
```

### Correct AWS Config IAM Role (Pulumi TypeScript)
```typescript
const configRole = new aws.iam.Role("configRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "config.amazonaws.com",
  }),
  managedPolicyArns: [
    "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  // CORRECT
  ]
});

// WRONG:
// 'arn:aws:iam::aws:policy/service-role/ConfigRole'  // Policy doesn't exist
// 'arn:aws:iam::aws:policy/AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
All resources should be deployed to: **us-east-1**
