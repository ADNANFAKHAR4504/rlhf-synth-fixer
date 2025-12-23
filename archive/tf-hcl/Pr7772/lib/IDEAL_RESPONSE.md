## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  project_name = var.project_name
  environment  = var.environment
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
    ManagedBy   = "Terraform"
    Region      = local.region
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
  }
}

# Data sources that depend on the provider
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

## variables.tf

```hcl
# variables.tf

# variable "aws_region" {
#   description = "AWS region for resources"
#   type        = string
#   default     = "us-east-1"
# }

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "enable_vpc_peering" {
  description = "Enable VPC peering connections"
  type        = bool
  default     = true
}

variable "ecs_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
}

variable "ecs_memory" {
  description = "Memory for ECS tasks in MB"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "sns_email_endpoint" {
  description = "Email endpoint for SNS notifications"
  type        = string
}

variable "company_name" {
  description = "Company name for S3 bucket naming"
  type        = string
  default     = "company"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener (required for production HTTPS)"
  type        = string
  default     = null
}
```

## tap_stack.tf

```hcl
module "vpc" {
  source = "./modules/vpc"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  vpc_cidr     = var.vpc_cidr
  az_count     = var.az_count
  common_tags  = local.common_tags
}

# KMS Module
module "kms" {
  source = "./modules/kms"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  common_tags  = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  company_name = var.company_name
  kms_key_arn  = module.kms.kms_key_arn
  common_tags  = local.common_tags

  enable_replication = var.environment == "staging"
  source_bucket_arn  = var.environment == "staging" ? data.aws_s3_bucket.prod_bucket[0].arn : null
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name      = local.project_name
  environment       = local.environment
  region            = local.region
  kms_key_arn       = module.kms.kms_key_arn
  s3_bucket_arn     = module.s3.s3_bucket_arn
  rds_resource_name = module.rds.db_instance_resource_id
  common_tags       = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name            = local.project_name
  environment             = local.environment
  region                  = local.region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  kms_key_id              = module.kms.kms_key_arn
  common_tags             = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name        = local.project_name
  environment         = local.environment
  region              = local.region
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  common_tags         = local.common_tags
  ssl_certificate_arn = var.ssl_certificate_arn
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name           = local.project_name
  environment            = local.environment
  region                 = local.region
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  alb_target_group_arn   = module.alb.target_group_arn
  alb_security_group_id  = module.alb.alb_security_group_id
  ecs_task_role_arn      = module.iam.ecs_task_role_arn
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  cpu                    = var.ecs_cpu
  memory                 = var.ecs_memory
  desired_count          = var.ecs_desired_count
  min_capacity           = var.ecs_min_capacity
  max_capacity           = var.ecs_max_capacity
  db_secret_arn          = module.rds.db_secret_arn
  common_tags            = local.common_tags
}

# SNS Module
module "sns" {
  source = "./modules/sns"

  project_name   = local.project_name
  environment    = local.environment
  region         = local.region
  email_endpoint = var.sns_email_endpoint
  kms_key_id     = module.kms.kms_key_arn
  common_tags    = local.common_tags
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name            = local.project_name
  environment             = local.environment
  region                  = local.region
  ecs_cluster_name        = module.ecs.cluster_name
  ecs_service_name        = module.ecs.service_name
  rds_instance_id         = module.rds.db_instance_id
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  sns_topic_arn           = module.sns.sns_topic_arn
  common_tags             = local.common_tags
}

# Data source for prod bucket (used for replication in staging)
data "aws_s3_bucket" "prod_bucket" {
  count  = var.environment == "staging" ? 1 : 0
  bucket = "${var.company_name}-payment-processor-prod-${local.region}"
}

# Outputs
# =============================================================================
# VPC Outputs
# =============================================================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = module.vpc.nat_gateway_ids
}

# =============================================================================
# ALB Outputs
# =============================================================================
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.alb.alb_zone_id
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = module.alb.target_group_arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = module.alb.alb_security_group_id
}

output "alb_url" {
  description = "URL of the Application Load Balancer (HTTPS if certificate available, HTTP otherwise)"
  value       = module.alb.alb_url
}

output "ssl_enabled" {
  description = "Whether SSL/HTTPS is enabled for the ALB"
  value       = module.alb.ssl_enabled
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener (null if no SSL certificate)"
  value       = module.alb.https_listener_arn
}

# =============================================================================
# ECS Outputs
# =============================================================================
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = module.ecs.task_definition_arn
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = module.ecs.ecs_security_group_id
}

# =============================================================================
# RDS Outputs
# =============================================================================
output "rds_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_id
}

output "rds_instance_resource_id" {
  description = "RDS instance resource ID"
  value       = module.rds.db_instance_resource_id
}

output "rds_secret_arn" {
  description = "ARN of the database password secret"
  value       = module.rds.db_secret_arn
  sensitive   = true
}

output "rds_security_group_id" {
  description = "Security group ID for the RDS instance"
  value       = module.rds.db_security_group_id
}

# =============================================================================
# S3 Outputs
# =============================================================================
output "s3_bucket_id" {
  description = "ID of the main S3 bucket"
  value       = module.s3.s3_bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = module.s3.s3_bucket_arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = module.s3.s3_bucket_domain_name
}

# =============================================================================
# IAM Outputs
# =============================================================================
output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = module.iam.ecs_task_role_arn
}

output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = module.iam.ecs_execution_role_arn
}

output "monitoring_role_arn" {
  description = "ARN of monitoring role"
  value       = module.iam.monitoring_role_arn
}

# =============================================================================
# KMS Outputs
# =============================================================================
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = module.kms.kms_key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = module.kms.kms_key_arn
}

output "kms_alias_arn" {
  description = "ARN of the KMS alias"
  value       = module.kms.kms_alias_arn
}

# =============================================================================
# SNS Outputs
# =============================================================================
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.sns.sns_topic_arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = module.sns.sns_topic_name
}

# =============================================================================
# Environment and Common Outputs
# =============================================================================
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "project_name" {
  description = "Project name"
  value       = local.project_name
}

output "region" {
  description = "AWS region"
  value       = local.region
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# =============================================================================
# Testing and Integration Outputs
# =============================================================================
output "application_endpoint" {
  description = "Full endpoint URL for the application"
  value       = module.alb.alb_url
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "${module.alb.alb_url}/health"
}

output "security_group_summary" {
  description = "Summary of all security groups created"
  value = {
    alb_security_group_id = module.alb.alb_security_group_id
    ecs_security_group_id = module.ecs.ecs_security_group_id
    rds_security_group_id = module.rds.db_security_group_id
  }
}

output "resource_summary" {
  description = "Summary of all major resources for testing"
  value = {
    vpc_id           = module.vpc.vpc_id
    alb_dns_name     = module.alb.alb_dns_name
    ecs_cluster_name = module.ecs.cluster_name
    ecs_service_name = module.ecs.service_name
    rds_instance_id  = module.rds.db_instance_id
    s3_bucket_name   = module.s3.s3_bucket_id
    sns_topic_name   = module.sns.sns_topic_name
    environment      = local.environment
    region           = local.region
  }
}
```

## dev.tfvars

```hcl
aws_region                  = "us-east-2"
environment                 = "dev"
vpc_cidr                    = "10.0.0.0/16"
ecs_cpu                     = 256
ecs_memory                  = 512
ecs_desired_count           = 1
ecs_min_capacity            = 1
ecs_max_capacity            = 3
rds_instance_class          = "db.t3.micro"
rds_allocated_storage       = 20
rds_backup_retention_period = 7
sns_email_endpoint          = "dev-alerts@company.com"
enable_vpc_peering          = true
```

## staging.tfvars

```hcl
aws_region                  = "us-east-1"
environment                 = "staging"
vpc_cidr                    = "10.1.0.0/16"
ecs_cpu                     = 512
ecs_memory                  = 1024
ecs_desired_count           = 2
ecs_min_capacity            = 2
ecs_max_capacity            = 5
rds_instance_class          = "db.t3.small"
rds_allocated_storage       = 50
rds_backup_retention_period = 7
sns_email_endpoint          = "staging-alerts@company.com"
enable_vpc_peering          = true
```

## prod.tfvars

```hcl
aws_region                  = "us-east-1"
environment                 = "prod"
vpc_cidr                    = "10.2.0.0/16"
ecs_cpu                     = 1024
ecs_memory                  = 2048
ecs_desired_count           = 3
ecs_min_capacity            = 3
ecs_max_capacity            = 10
rds_instance_class          = "db.m5.large"
rds_allocated_storage       = 100
rds_backup_retention_period = 30
sns_email_endpoint          = "prod-alerts@company.com"
enable_vpc_peering          = true
```

## modules/vpc/main.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-VPC-${var.region}-${var.environment}"
  })
}

resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-PublicSubnet-${var.region}-${var.environment}-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-PrivateSubnet-${var.region}-${var.environment}-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-IGW-${var.region}-${var.environment}"
  })
}

resource "aws_eip" "nat" {
  count = var.az_count

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-NAT-EIP-${var.region}-${var.environment}-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.az_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-NAT-${var.region}-${var.environment}-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-PublicRT-${var.region}-${var.environment}"
  })
}

resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-PrivateRT-${var.region}-${var.environment}-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.s3"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-S3-Endpoint-${var.region}-${var.environment}"
  })
}

resource "aws_vpc_endpoint_route_table_association" "private_s3" {
  count = var.az_count

  route_table_id  = aws_route_table.private[count.index].id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}
```

## modules/vpc/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 2
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

## modules/kms/main.tf

```hcl
data "aws_caller_identity" "current" {}

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} ${var.environment} environment"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  multi_region            = false

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-KMS-${var.region}-${var.environment}"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "${var.project_name}-key-policy-${var.environment}"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for encryption"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "rds.amazonaws.com",
            "logs.${var.region}.amazonaws.com"
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## modules/kms/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/kms/outputs.tf

```hcl
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_alias_arn" {
  description = "ARN of the KMS alias"
  value       = aws_kms_alias.main.arn
}
```

## modules/s3/main.tf

```hcl
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "main" {
  bucket = "${var.company_name}-payment-processor-${var.environment}-${var.region}"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-S3-${var.region}-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket" "logs" {
  bucket = "${var.company_name}-logs-${var.environment}-${var.region}"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-S3-Logs-${var.region}-${var.environment}"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  count = var.enable_replication ? 1 : 0

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "replicate-to-staging"
    status = "Enabled"

    destination {
      bucket = aws_s3_bucket.main.arn

      encryption_configuration {
        replica_kms_key_id = var.kms_key_arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

resource "aws_iam_role" "replication" {
  count = var.enable_replication ? 1 : 0

  name = "${var.project_name}-s3-replication-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "replication" {
  count = var.enable_replication ? 1 : 0

  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = var.source_bucket_arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect   = "Allow"
        Resource = "${var.source_bucket_arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })
}
```

## modules/s3/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "company_name" {
  description = "Company name for bucket naming"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of KMS key for encryption"
  type        = string
}

variable "enable_replication" {
  description = "Enable S3 bucket replication"
  type        = bool
  default     = false
}

variable "source_bucket_arn" {
  description = "ARN of source bucket for replication"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/s3/outputs.tf

```hcl
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}
```

## modules/iam/main.tf

```hcl
data "aws_caller_identity" "current" {}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECSExecutionRole-${var.region}-${var.environment}"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-ecs-execution-secrets-${var.environment}"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt"
      ]
      Resource = [
        "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:/${var.project_name}/db-password/${var.environment}*",
        var.kms_key_arn
      ]
    }]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECSTaskRole-${var.region}-${var.environment}"
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-ecs-task-policy-${var.environment}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [var.kms_key_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}/*"
        ]
      }
    ]
  })
}

# Cross-environment monitoring role
resource "aws_iam_role" "monitoring" {
  name = "${var.project_name}-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Condition = {
        StringEquals = {
          "sts:ExternalId" = "${var.project_name}-monitoring"
        }
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-MonitoringRole-${var.region}-${var.environment}"
  })
}

resource "aws_iam_role_policy" "monitoring" {
  name = "${var.project_name}-monitoring-policy-${var.environment}"
  role = aws_iam_role.monitoring.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "ec2:DescribeInstances",
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "rds:DescribeDBInstances",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetHealth"
      ]
      Resource = "*"
    }]
  })
}
```

## modules/iam/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of KMS key"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of S3 bucket"
  type        = string
}

variable "rds_resource_name" {
  description = "RDS resource name"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/iam/outputs.tf

```hcl
output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "monitoring_role_arn" {
  description = "ARN of monitoring role"
  value       = aws_iam_role.monitoring.arn
}
```

## modules/rds/main.tf

```hcl
data "aws_caller_identity" "current" {}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name_prefix = "/${var.project_name}/db-password/${var.environment}"
  description = "Database password for ${var.project_name} ${var.environment}"
  kms_key_id  = var.kms_key_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBPassword-${var.region}-${var.environment}"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBSubnetGroup-${var.region}-${var.environment}"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS database"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "PostgreSQL access from VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-SG-${var.region}-${var.environment}"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-postgres15-${var.environment}"
  family = "postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBParameterGroup-${var.region}-${var.environment}"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${var.environment}"

  engine            = "postgres"
  engine_version    = "15.12"
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_encrypted = true
  kms_key_id        = var.kms_key_id
  storage_type      = "gp3"

  db_name  = "${var.project_name}db"
  username = "${var.project_name}admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az                  = var.environment == "prod" ? true : false
  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-final-snapshot-${var.environment}-${replace(timestamp(), ":", "-")}" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-${var.region}-${var.environment}"
  })
}

resource "aws_db_instance_automated_backups_replication" "main" {
  count = var.environment == "prod" ? 1 : 0

  source_db_instance_arn = aws_db_instance.main.arn
  kms_key_id             = var.kms_key_id
}
```

## modules/rds/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
}

variable "kms_key_id" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/rds/outputs.tf

```hcl
output "db_instance_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.main.resource_id
}

output "db_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_security_group_id" {
  description = "Security group ID for the RDS instance"
  value       = aws_security_group.rds.id
}
```

## modules/alb/main.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = var.vpc_id
  description = "Security group for Application Load Balancer"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  # HTTPS ingress (only when certificate is available)
  dynamic "ingress" {
    for_each = var.ssl_certificate_arn != null ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS from anywhere"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-SG-${var.region}-${var.environment}"
  })
}

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2               = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-${var.region}-${var.environment}"
  })
}

resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-TargetGroup-${var.region}-${var.environment}"
  })
}

# HTTP Listener (redirects to HTTPS only when certificate is available and in prod)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.ssl_certificate_arn != null && var.environment == "prod" ? "redirect" : "forward"

    # Redirect to HTTPS for prod with certificate
    dynamic "redirect" {
      for_each = var.ssl_certificate_arn != null && var.environment == "prod" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    # Forward to target group for dev/staging or when no certificate
    dynamic "forward" {
      for_each = var.ssl_certificate_arn != null && var.environment == "prod" ? [] : [1]
      content {
        target_group {
          arn = aws_lb_target_group.main.arn
        }
      }
    }
  }
}

# HTTPS Listener (only when certificate is provided)
resource "aws_lb_listener" "https" {
  count = var.ssl_certificate_arn != null ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

## modules/alb/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener (required for production)"
  type        = string
  default     = null
}
```

## modules/alb/outputs.tf

```hcl
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB for CloudWatch"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn_suffix" {
  description = "ARN suffix of the target group for CloudWatch"
  value       = aws_lb_target_group.main.arn_suffix
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener (null if no certificate provided)"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}

output "ssl_enabled" {
  description = "Whether SSL/HTTPS is enabled"
  value       = var.ssl_certificate_arn != null
}

output "alb_url" {
  description = "Primary URL for the ALB (HTTPS if available, HTTP otherwise)"
  value       = var.ssl_certificate_arn != null ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}
```

## modules/ecs/main.tf

```hcl
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECSCluster-${var.region}-${var.environment}"
  })
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}/${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECSLogs-${var.region}-${var.environment}"
  })
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{
    name  = "${var.project_name}-app"
    image = "nginx:latest"

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "PROJECT"
        value = var.project_name
      }
    ]

    secrets = [
      {
        name      = "DB_PASSWORD"
        valueFrom = var.db_secret_arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "app"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-TaskDefinition-${var.region}-${var.environment}"
  })
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-"
  vpc_id      = var.vpc_id
  description = "Security group for ECS tasks"

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
    description     = "HTTP from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECS-SG-${var.region}-${var.environment}"
  })
}

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "${var.project_name}-app"
    container_port   = 80
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECSService-${var.region}-${var.environment}"
  })
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project_name}-cpu-scaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_policy" "memory" {
  name               = "${var.project_name}-memory-scaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
  }
}
```

## modules/ecs/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ARN of ALB target group"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  type        = string
}

variable "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  type        = string
}

variable "cpu" {
  description = "CPU units for the task"
  type        = number
}

variable "memory" {
  description = "Memory for the task in MB"
  type        = number
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
}

variable "db_secret_arn" {
  description = "ARN of database password secret"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
}
```

## modules/ecs/outputs.tf

```hcl
output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}
```

## modules/sns/main.tf

```hcl
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts-${var.environment}"
  display_name      = "${var.project_name} ${var.environment} Alerts"
  kms_master_key_id = var.kms_key_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-SNS-${var.region}-${var.environment}"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_endpoint
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "${var.project_name}-alerts-policy-${var.environment}"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}
```

## modules/sns/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "email_endpoint" {
  description = "Email endpoint for notifications"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/sns/outputs.tf

```hcl
output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.alerts.name
}
```

## modules/cloudwatch/main.tf

```hcl
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "ECS CPU and Memory Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix],
            [".", "RequestCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "ALB Performance"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_id],
            [".", "CPUUtilization", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Performance"
          period  = 300
        }
      }
    ]
  })
}

# ECS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECS-CPU-Alarm-${var.region}-${var.environment}"
  })
}

# ECS Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECS-Memory-Alarm-${var.region}-${var.environment}"
  })
}

# RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-CPU-Alarm-${var.region}-${var.environment}"
  })
}

# RDS Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-rds-storage-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-Storage-Alarm-${var.region}-${var.environment}"
  })
}

# ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${var.project_name}-alb-unhealthy-hosts-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    TargetGroup  = var.target_group_arn_suffix
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-Health-Alarm-${var.region}-${var.environment}"
  })
}

# ALB Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-alb-response-time-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-ResponseTime-Alarm-${var.region}-${var.environment}"
  })
}
```

## modules/cloudwatch/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "rds_instance_id" {
  description = "ID of the RDS instance"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "ARN suffix of the target group"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic for alarms"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## modules/cloudwatch/outputs.tf

```hcl
output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alarms" {
  description = "List of CloudWatch alarms"
  value = {
    ecs_cpu           = aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name
    ecs_memory        = aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name
    rds_cpu           = aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name
    rds_storage       = aws_cloudwatch_metric_alarm.rds_storage_low.alarm_name
    alb_health        = aws_cloudwatch_metric_alarm.alb_healthy_hosts.alarm_name
    alb_response_time = aws_cloudwatch_metric_alarm.alb_response_time.alarm_name
  }
}
```