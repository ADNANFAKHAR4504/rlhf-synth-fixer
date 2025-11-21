# Infrastructure as Code

> **CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A rapidly growing SaaS company needs to deploy their machine learning API service with automatic scaling capabilities. The application processes image classification requests and requires GPU-enabled compute instances during peak hours. The deployment must handle variable traffic patterns while maintaining cost efficiency.

## Problem Statement
Create a Pulumi Python program to deploy a production-ready machine learning API service. The configuration must: 1. Deploy an ECS cluster with Fargate Spot capacity provider configured at 70% target capacity. 2. Create an ECS service running a containerized ML API with minimum 2 tasks and maximum 10 tasks. 3. Configure Application Load Balancer with health checks on /health endpoint every 30 seconds. 4. Set up RDS Aurora Serverless v2 PostgreSQL cluster with encrypted storage and automated backups. 5. Implement DynamoDB table for session storage with TTL attribute enabled. 6. Configure CloudFront distribution with custom error pages for 403 and 404 responses. 7. Create VPC with 3 public and 3 private subnets across different AZs. 8. Set up auto-scaling for ECS service based on ALB request count metric (target: 1000 requests per task). 9. Configure CloudWatch Log Groups with 30-day retention for all services. 10. Implement least-privilege IAM roles for each service component. Expected output: A complete Pulumi Python program that deploys the entire infrastructure stack with proper resource dependencies, outputs the ALB DNS name, CloudFront distribution URL, and RDS cluster endpoint.

## Constraints and Requirements
- ECS tasks must use Fargate Spot instances for cost optimization
- Application Load Balancer must implement path-based routing for /api/v1/* and /api/v2/*
- RDS Aurora Serverless v2 must scale between 0.5 and 2 ACUs
- All secrets must be stored in AWS Secrets Manager with automatic rotation enabled
- CloudFront distribution must use custom SSL certificate from ACM
- ECS service must implement circuit breaker deployment configuration
- DynamoDB tables must use on-demand billing with point-in-time recovery enabled

## Environment Setup
Production deployment in us-east-1 using ECS Fargate for containerized ML API, RDS Aurora Serverless v2 PostgreSQL for metadata storage, DynamoDB for session management, and CloudFront for global content delivery. VPC spans 3 availability zones with public subnets for ALB and private subnets for ECS tasks and RDS. Requires Pulumi 3.x with Python 3.9+, Docker for container builds, and AWS CLI configured with appropriate permissions. Infrastructure includes Application Load Balancer with WAF integration, Secrets Manager for database credentials, and CloudWatch for comprehensive monitoring.

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in py
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

### Correct Resource Naming (Pulumi Python)
```python
bucket = s3.Bucket(
    "data_bucket",
    bucket_name=f"data-bucket-{environment_suffix}",  # CORRECT
    # ...
)

# WRONG:
# bucket_name="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (Pulumi Python)
```python
bucket = s3.Bucket(
    "data_bucket",
    bucket_name=f"data-bucket-{environment_suffix}",
    opts=pulumi.ResourceOptions(
        delete_before_replace=True  # CORRECT
    )
)
```

### Correct RDS Configuration (Pulumi Python)
```python
cluster = rds.Cluster(
    "aurora_cluster",
    cluster_identifier=f"aurora-cluster-{environment_suffix}",
    engine="aurora-postgresql",
    engine_mode="provisioned",
    serverlessv2_scaling_configuration=rds.ClusterServerlessv2ScalingConfigurationArgs(
        max_capacity=2.0,
        min_capacity=0.5,
    ),
    skip_final_snapshot=True,  # CORRECT for destroyability
    deletion_protection=False,  # CORRECT for destroyability
    # ...
)

# WRONG:
# skip_final_snapshot=False  # Will block cleanup
# deletion_protection=True  # Will block cleanup
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
