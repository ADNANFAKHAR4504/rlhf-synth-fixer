# IaC Program Optimization

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Go**
>
> Platform: **pulumi**
> Language: **go**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup has an existing ECS-based microservices architecture that was hastily deployed and now suffers from inefficient resource allocation, excessive NAT Gateway costs, and suboptimal task placement. The infrastructure needs to be refactored to reduce AWS costs by at least 40% while maintaining the same performance characteristics.

## Problem Statement

Create a Pulumi Go program to optimize an existing ECS infrastructure for cost reduction. The configuration must:

1. Define Fargate Spot capacity providers with 70% spot ratio for non-critical services.
2. Create VPC endpoints for ECR, S3, CloudWatch Logs, and Secrets Manager.
3. Refactor task definitions to use appropriate CPU/memory combinations based on actual usage metrics.
4. Implement ECS service auto-scaling based on CPU and memory utilization.
5. Configure ECR lifecycle policies to keep only the last 10 images per repository.
6. Set up cost allocation tags on all resources following the pattern 'Environment', 'Service', 'Team'.
7. Migrate environment variables to AWS Systems Manager Parameter Store.
8. Configure CloudWatch Container Insights for monitoring resource usage.
9. Implement blue-green deployment strategy for zero-downtime updates.
10. Create CloudWatch alarms for spot instance interruptions.

Expected output: A complete Pulumi Go program that reduces infrastructure costs by implementing spot instances, eliminating unnecessary NAT Gateway traffic through VPC endpoints, and optimizing resource allocation. The program should output the estimated monthly cost savings and provide a migration plan that can be executed without service interruption.

## Constraints and Requirements

- Must use Fargate Spot instances for at least 70% of non-critical workloads
- Implement VPC endpoints to eliminate NAT Gateway traffic for AWS service calls
- Use ECS capacity providers with proper scaling policies
- All container images must be stored in ECR with lifecycle policies
- Implement proper tagging strategy for cost allocation
- Use Parameter Store for configuration instead of environment variables
- Deploy changes incrementally without service disruption

## Environment Setup

Production environment in us-east-1 with existing ECS cluster running 12 microservices across 3 availability zones. Current setup uses standard Fargate tasks with oversized task definitions, NAT Gateways costing $500/month, and no proper auto-scaling. Infrastructure includes Application Load Balancer, RDS Aurora PostgreSQL cluster, and CloudWatch Logs. Requires Pulumi 3.x with Go 1.20+, AWS CLI configured with appropriate permissions. VPC has public and private subnets but no VPC endpoints configured.

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in go
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

### Correct Resource Naming (Pulumi Go)
```go
bucket, err := s3.NewBucket(ctx, "dataBucket", &s3.BucketArgs{
    Bucket: pulumi.Sprintf("data-bucket-%s", environmentSuffix),  // CORRECT
})

// WRONG:
// Bucket: pulumi.String("data-bucket-prod"),  // Hardcoded, will fail
```

### Correct Removal Policy (Pulumi Go)
```go
// Pulumi automatically handles resource deletion when resources are removed from code
// No explicit removal policy needed in most cases

// For stateful resources like S3:
bucket, err := s3.NewBucket(ctx, "dataBucket", &s3.BucketArgs{
    ForceDestroy: pulumi.Bool(true),  // CORRECT - allows deletion even with objects
})

// WRONG:
// ForceDestroy: pulumi.Bool(false)  // Will block cleanup if bucket has objects
```

### Correct AWS Config IAM Role (Pulumi Go)
```go
configRole, err := iam.NewRole(ctx, "configRole", &iam.RoleArgs{
    AssumeRolePolicy: pulumi.String(`{
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "config.amazonaws.com"},
            "Effect": "Allow"
        }]
    }`),
    ManagedPolicyArns: pulumi.StringArray{
        pulumi.String("arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"),  // CORRECT
    },
})

// WRONG:
// pulumi.String("arn:aws:iam::aws:policy/service-role/ConfigRole"),  // Policy doesn't exist
// pulumi.String("arn:aws:iam::aws:policy/AWS_ConfigRole"),  // Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Cost reduction of at least 40% is achieved through:
  - Fargate Spot instances (70%+ of non-critical workloads)
  - VPC endpoints eliminating NAT Gateway traffic
  - Optimized task definitions
  - Proper auto-scaling policies
