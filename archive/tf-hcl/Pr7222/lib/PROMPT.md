# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **tf**
> Language: **hcl**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to ensure their critical payment processing API remains available during zone failures. After experiencing a recent outage that cost $50K in lost transactions, they've mandated zero-downtime deployments and automatic failover capabilities.

## Problem Statement
Create a Terraform configuration to deploy a highly available payment processing infrastructure with automatic failover capabilities. MANDATORY REQUIREMENTS (Must complete): 1. Create Aurora PostgreSQL cluster with Multi-AZ deployment and 2 reader instances (CORE: RDS Aurora) 2. Deploy EC2 Auto Scaling groups with EC2 launch type running payment API containers across 3 AZs (CORE: EC2) 3. Configure Application Load Balancer with health checks and connection draining 4. Implement Auto Scaling for EC2 instances with min 6, max 18 tasks 5. Set up Route 53 health checks with failover routing policy 6. Create automated snapshots for Aurora with 7-day retention 7. Configure CloudWatch alarms for database connections exceeding 80% 8. Implement blue-green deployment variables for zero-downtime updates OPTIONAL ENHANCEMENTS (If time permits): • Add ElastiCache Redis cluster for session management (OPTIONAL: ElastiCache) - improves API response times • Implement for centralized management (OPTIONAL: ) - adds compliance reporting • Configure Aurora Global Database for cross-region DR (OPTIONAL: Aurora Global) - enables region-level failover Expected output: Complete Terraform configuration with modules for VPC, EC2, Aurora, and ALB that automatically handles AZ failures and supports zero-downtime deployments through blue-green switching.

## Constraints and Requirements
- Use Aurora PostgreSQL with automated backups every 6 hours
- EC2 tasks must have health checks with 30-second intervals
- ALB must drain connections for 45 seconds before terminating tasks
- All data must be encrypted at rest using AWS-managed KMS keys
- Deploy exactly 3 NAT gateways for high availability
- Use only t3.medium instances for EC2 Auto Scaling groups nodes

## Environment Setup
```
Multi-AZ deployment in us-east-1 across 3 availability zones for payment processing infrastructure. Core services include EC2 with EC2 launch type for containerized API, Aurora PostgreSQL Multi-AZ cluster for transaction data, and Application Load Balancer for traffic distribution. VPC spans 10.0.0.0/16 with 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24). Requires Terraform 1.5+, AWS CLI configured with appropriate credentials. Architecture implements blue-green deployment pattern with automatic failover.
```

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit for Aurora connections (TLS required)
- ALB can use HTTP (port 80) for testing environments; HTTPS recommended for production
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
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${var.environment_suffix}`
- Examples:
  - S3 Bucket: `my-bucket-${var.environment_suffix}`
  - Lambda Function: `my-function-${var.environment_suffix}`
  - DynamoDB Table: `my-table-${var.environment_suffix}`
  - RDS Cluster: `my-cluster-${var.environment_suffix}`
  - ALB: `my-alb-${var.environment_suffix}`
- **Validation**: Every resource with a name property MUST include environment_suffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `prevent_destroy = true` → Use `prevent_destroy = false` or omit
  - `deletion_protection = true` (RDS, DynamoDB) → Use `deletion_protection = false`
  - `skip_final_snapshot = false` (RDS) → Use `skip_final_snapshot = true`
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
- **Reserved Concurrency**: Avoid setting reserved concurrency unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: Latest runtime version available
  - ❌ WRONG: Deprecated runtime versions

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
- Verify dependencies are explicit (use `depends_on` in Terraform)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Terraform)
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"  # ✅ CORRECT
  # ...
}

# ❌ WRONG:
# bucket = "data-bucket-prod"  # Hardcoded, will fail
```

### Correct RDS Configuration (Terraform)
```hcl
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "payments"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true  # ✅ CORRECT - allows clean deletion
  deletion_protection     = false # ✅ CORRECT - allows clean deletion

  # Multi-AZ configuration
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.aurora_key.arn

  tags = {
    Name        = "aurora-cluster-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ❌ WRONG:
# deletion_protection = true  # Will block cleanup
# skip_final_snapshot = false # Will block cleanup
```

### Correct ALB Configuration (Terraform)
```hcl
resource "aws_lb" "app_lb" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false  # ✅ CORRECT

  tags = {
    Name        = "payment-alb-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "payment-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30  # ✅ CORRECT - 30-second intervals as required
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 45  # ✅ CORRECT - 45 seconds as required

  tags = {
    Name        = "payment-tg-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully with Multi-AZ Aurora and EC2 Auto Scaling
- All security and compliance constraints are met
- ALB properly distributes traffic with health checks
- Route 53 failover routing is configured
- CloudWatch alarms are triggered appropriately
- Blue-green deployment variables are implemented
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
