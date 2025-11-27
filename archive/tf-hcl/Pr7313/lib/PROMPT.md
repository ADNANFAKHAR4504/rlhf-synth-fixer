# Application Deployment

> ** CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **tf**
> Language: **hcl**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to deploy their loan application processing system with strict compliance requirements for PCI DSS. The system must handle variable traffic spikes during business hours while maintaining sub-second response times for credit decisions.

## Problem Statement
Create a Terraform configuration to deploy a loan processing web application infrastructure. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across 3 availability zones. 3. Configure Aurora PostgreSQL Serverless v2 with 0.5-1 ACU scaling and point-in-time recovery (CORE: Aurora). 4. Set up an Application Load Balancer with path-based routing to different EC2 instances. 5. Implement Auto Scaling for EC2 instances based on CPU and memory metrics. 6. Configure CloudWatch Container Insights for EC2 Auto Scaling groups monitoring. 7. Create S3 buckets for application logs and loan documents with lifecycle policies. 8. Set up distribution for static assets with S3 origin. 9. Implement AWS rules on ALB for SQL injection and XSS protection. 10. Configure scheduled rules for nightly batch processing tasks. MANDATORY REQUIREMENTS (Must complete): Aurora PostgreSQL Serverless v2 cluster with encryption (CORE: Aurora) 3. Application Load Balancer with target groups and listeners 4. Auto Scaling policies for EC2 instances 5. Complete VPC setup with proper subnet configuration OPTIONAL ENHANCEMENTS (If time permits): • Add API Gateway for REST API management (OPTIONAL: API Gateway) - provides better API versioning and throttling • Implement queues for async loan processing (OPTIONAL: ) - improves system resilience under load • Add for loan approval workflow (OPTIONAL: ) - enables visual workflow management Expected output: Complete Terraform configuration with modular structure that deploys a production-ready loan processing infrastructure. The configuration should include proper resource tagging, output values for key resources, and support for multiple environments through variables.

## Constraints and Requirements
- All data must be encrypted at rest using customer-managed keys with automatic rotation enabled
- RDS instances must use IAM database authentication instead of password-based authentication
- ALB must terminate TLS with AWS Certificate Manager certificates and enforce TLS 1.2 minimum
- Auto Scaling Groups must use mixed instance types with at least 20% spot instances for cost optimization
- All compute resources must be deployed in private subnets with no direct internet access

## Environment Setup
Production environment in us-east-1 region spanning 3 availability zones for high availability. Infrastructure includes EC2 Lambda for applications services, Aurora PostgreSQL Serverless v2 for the database layer, and Application Load Balancer for traffic distribution. VPC configured with public subnets for ALB and NAT Gateways, private subnets for compute and database resources. Requires Terraform 1.5+ with AWS provider 5.x, AWS CLI configured with appropriate IAM permissions. Environment uses for configuration management and for sensitive data.

---

## Implementation Guidelines

### Platform Requirements
- Use tf as the IaC framework
- All code must be written in hcl
- Follow tf best practices for resource organization
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

### Correct Resource Naming (Terraform)
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"  #  CORRECT
}

#  WRONG:
# bucket = "data-bucket-prod"  # Hardcoded, will fail
```

### Correct RDS Configuration (Terraform)
```hcl
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"

  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  skip_final_snapshot    = true  #  CORRECT for test environments
  deletion_protection    = false #  CORRECT for test environments
}

#  WRONG:
# skip_final_snapshot = false  # Will block destruction
# deletion_protection = true   # Will prevent cleanup
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
