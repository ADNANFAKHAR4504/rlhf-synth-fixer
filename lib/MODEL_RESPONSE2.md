### Reasoning Trace
---

The user has identified several critical issues in the Terraform infrastructure code I provided. They're absolutely right - there are several problems that would prevent successful deployment:

1. Missing outputs from modules that are referenced in main.tf
2. Duplicate resource definitions (AWS Config)
3. Missing user data template files
4. Incorrect variable references between modules
5. Missing variable declarations
6. S3 lifecycle configuration issues
7. Security group dependency problems
8. Missing KMS key policy
9. Route 53 not properly configured
10. CloudWatch log encryption missing

I need to provide a corrected version that addresses all these issues. Let me go through each problem systematically and provide fixes.

The user is asking for a corrected version, so I should:
1. Acknowledge the issues they found
2. Provide corrected module files with proper outputs, variables, and dependencies
3. Include the missing template files
4. Fix the circular dependencies
5. Add proper KMS key policies
6. Ensure all variables are properly declared and passed between modules
7. Fix the security group dependencies
8. Add proper CloudWatch log encryption
9. Make Route 53 actually functional

This is a great catch by the user - they clearly understand Terraform well and have done a thorough review.
### Answer 
---

# 🔧 Corrected Enterprise Multi-Tier Infrastructure

You're absolutely right! Thank you for that thorough analysis - those are critical deployment blockers that need immediate attention. I'll provide the corrected version that addresses all these issues. This is exactly the kind of rigorous review that separates working infrastructure from theoretical code.

## 🚨 Fixed Architecture with Resolved Dependencies

Let me provide the corrected modules with all dependencies properly resolved:

## 📂 Corrected Main Configuration (main.tf)

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "Terraform"
      CostCenter  = var.cost_center
      Compliance  = "SOC2-Type2"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random suffix for global uniqueness
resource "random_id" "suffix" {
  byte_length = 4
}

# KMS key with proper policy
resource "aws_kms_key" "main" {
  description             = "${var.project_name}-${var.environment}-main-key"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-main-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-main"
  target_key_id = aws_kms_key.main.key_id
}

# Local values for consistent configuration
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
  }
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name    = var.project_name
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
  
  # Security configurations
  allowed_ssh_cidrs = var.allowed_ssh_cidrs
  
  # DNS configuration
  domain_name = var.domain_name
  
  # KMS key for encryption
  kms_key_id = aws_kms_key.main.id
  
  tags = local.common_tags
}

# Storage Module (Create first, as other modules depend on bucket names)
module "storage" {
  source = "./modules/storage"

  project_name   = var.project_name
  environment    = var.environment
  random_suffix  = random_id.suffix.hex
  
  # KMS key for encryption
  kms_key_id = aws_kms_key.main.id
  
  # VPC information for bucket policies (pass after networking module)
  vpc_id = module.networking.vpc_id
  
  tags = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  
  # KMS key for encryption
  kms_key_id = aws_kms_key.main.id
  
  # VPC information for policies
  vpc_id = module.networking.vpc_id
  
  # S3 bucket information for IAM policies
  app_bucket_name    = module.storage.app_bucket_name
  logs_bucket_name   = module.storage.logs_bucket_name
  config_bucket_name = module.storage.config_bucket_name
  
  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  project_name = var.project_name
  environment  = var.environment
  
  # Networking
  vpc_id              = module.networking.vpc_id
  public_subnet_ids   = module.networking.public_subnet_ids
  private_subnet_ids  = module.networking.private_subnet_ids
  
  # Security Groups
  bastion_sg_id       = module.networking.bastion_sg_id
  app_sg_id          = module.networking.app_sg_id
  alb_sg_id          = module.networking.alb_sg_id
  
  # IAM
  ec2_instance_profile = module.security.ec2_instance_profile
  
  # Storage
  app_bucket_name   = module.storage.app_bucket_name
  logs_bucket_name  = module.storage.logs_bucket_name
  
  # Instance configuration
  instance_type = var.instance_type
  key_name     = var.key_name
  
  tags = local.common_tags
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-${var.environment}-config-recorder"
  role_arn = module.security.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [module.storage]
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-${var.environment}-config-delivery"
  s3_bucket_name = module.storage.config_bucket_name
  
  depends_on = [aws_config_configuration_recorder.main]
}

# CloudWatch Log Groups with encryption
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ec2/${var.project_name}-${var.environment}-application"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-application-logs"
  })
}

resource "aws_cloudwatch_log_group" "security" {
  name              = "/aws/security/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-security-logs"
  })
}

# Route 53 record for ALB (if domain provided)
resource "aws_route53_record" "alb" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = module.networking.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.compute.alb_dns_name
    zone_id                = module.compute.alb_zone_id
    evaluate_target_health = true
  }
}
```

## 🌐 Corrected Networking Module (modules/networking/main.tf)

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Type = "Public"
    Tier = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Type = "Private"
    Tier = "Application"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnets)

  domain = "vpc"
  
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnets)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-nat-gw-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-public-rt"
    Type = "Public"
  })
}

resource "aws_route_table" "private" {
  count = length(var.private_subnets)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
    Type = "Private"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnets)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups (Created in correct order to avoid circular dependencies)
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-${var.environment}-bastion-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for bastion host"

  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-bastion-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application servers"

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Flow Logs with proper encryption
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc-flowlogs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/${var.project_name}-${var.environment}-flowlogs"
  retention_in_days = 30
  kms_key_id       = var.kms_key_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc-flowlogs"
  })
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${var.project_name}-${var.environment}-flowlogs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.project_name}-${var.environment}-flowlogs-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-s3-endpoint"
  })
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-zone"
  })
}

# Data sources
data "aws_region" "current" {}
```

## 🌐 Networking Module Variables (modules/networking/variables.tf)

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH to bastion host"
  type        = list(string)
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = ""
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## 🌐 Networking Module Outputs (modules/networking/outputs.tf)

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "bastion_sg_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "app_sg_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].zone_id : ""
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

## 🔒 Corrected Security Module (modules/security/main.tf)

```hcl
# Permission boundary policy
resource "aws_iam_policy" "permission_boundary" {
  name        = "${var.project_name}-${var.environment}-permission-boundary"
  description = "Permission boundary for ${var.project_name} ${var.environment} resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = data.aws_region.current.name
          }
        }
      }
    ]
  })

  tags = var.tags
}

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name                 = "${var.project_name}-${var.environment}-ec2-role"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# EC2 Instance Policy
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.project_name}-${var.environment}-ec2-policy"
  description = "Policy for EC2 instances with limited S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.app_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.app_bucket_name}"
        ]
        Condition = {
          StringEquals = {
            "aws:SourceVpc" = var.vpc_id
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_id
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.tags
}

# AWS Config Role
resource "aws_iam_role" "config_role" {
  name                 = "${var.project_name}-${var.environment}-config-role"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Additional policy for Config to access S3
resource "aws_iam_policy" "config_s3_policy" {
  name        = "${var.project_name}-${var.environment}-config-s3-policy"
  description = "Policy for AWS Config to access S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.config_bucket_name}",
          "arn:aws:s3:::${var.config_bucket_name}/*"
        ]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "config_s3_policy_attachment" {
  role       = aws_iam_role.config_role.name
  policy_arn = aws_iam_policy.config_s3_policy.arn
}

# AWS Config Rules for compliance
resource "aws_config_config_rule" "s3_bucket_ssl_requests_only" {
  name = "${var.project_name}-${var.environment}-s3-bucket-ssl-requests-only"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SSL_REQUESTS_ONLY"
  }

  tags = var.tags
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.project_name}-${var.environment}-encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  tags = var.tags
}

resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-${var.environment}-s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  tags = var.tags
}

resource "aws_config_config_rule" "root_access_key_check" {
  name = "${var.project_name}-${var.environment}-root-access-key-check"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCESS_KEY_CHECK"
  }

  tags = var.tags
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

## 🔒 Security Module Variables (modules/security/variables.tf)

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for policy conditions"
  type        = string
}

variable "app_bucket_name" {
  description = "Name of the application S3 bucket"
  type        = string
}

variable "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  type        = string
}

variable "config_bucket_name" {
  description = "Name of the config S3 bucket"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## 🔒 Security Module Outputs (modules/security/outputs.tf)

```hcl
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "config_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config_role.arn
}

output "permission_boundary_arn" {
  description = "ARN of the permission boundary policy"
  value       = aws_iam_policy.permission_boundary.arn
}
```

## 💾 Corrected Storage Module (modules/storage/main.tf)

```hcl
# Application S3 Bucket
resource "aws_s3_bucket" "app_bucket" {
  bucket        = "${var.project_name}-${var.environment}-app-${var.random_suffix}"
  force_destroy = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-app-bucket"
    Type = "Application"
  })
}

# Logs S3 Bucket
resource "aws_s3_bucket" "logs_bucket" {
  bucket        = "${var.project_name}-${var.environment}-logs-${var.random_suffix}"
  force_destroy = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-logs-bucket"
    Type = "Logs"
  })
}

# Config S3 Bucket
resource "aws_s3_bucket" "config_bucket" {
  bucket        = "${var.project_name}-${var.environment}-config-${var.random_suffix}"
  force_destroy = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-config-bucket"
    Type = "Config"
  })
}

# S3 Bucket Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "logs_bucket" {
  bucket = aws_s3_bucket.logs_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "logs_bucket" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policies - Configured after IAM role is available
resource "aws_s3_bucket_policy" "app_bucket_policy" {
  bucket = aws_s3_bucket.app_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.app_bucket.arn,
          "${aws_s3_bucket.app_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowVPCAccess"
        Effect = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_bucket.arn,
          "${aws_s3_bucket.app_bucket.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:SourceVpc" = var.vpc_id
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_bucket]
}

resource "aws_s3_bucket_policy" "logs_bucket_policy" {
  bucket = aws_s3_bucket.logs_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.logs_bucket.arn,
          "${aws_s3_bucket.logs_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowALBLogs"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/alb-access-logs/*"
      },
      {
        Sid    = "AllowALBLogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/alb-access-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AllowALBLogDeliveryGetBucketAcl"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs_bucket.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.logs_bucket]
}

resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.config_bucket]
}

# Improved S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    id     = "app_lifecycle_rule"
    status = "Enabled"

    # Transition to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete objects after 2 years
    expiration {
      days = 730
    }

    # Clean up old versions after 90 days
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Abort incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_bucket" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "logs_lifecycle_rule"
    status = "Enabled"

    # Transition ALB logs to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Delete logs after 90 days (adjust based on compliance requirements)
    expiration {
      days = 90
    }

    # Clean up old versions after 30 days
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    id     = "config_lifecycle_rule"
    status = "Enabled"

    # Transition to IA after 90 days
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Keep config data for 7 years for compliance
    expiration {
      days = 2555
    }

    # Clean up old versions after 365 days
    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  target_bucket = aws_s3_bucket.logs_bucket.id
  target_prefix = "s3-access-logs/app-bucket/"
}

# S3 Bucket Notification for security monitoring
resource "aws_s3_bucket_notification" "app_bucket_notification" {
  bucket = aws_s3_bucket.app_bucket.id

  cloudwatch_configuration {
    cloudwatch_configuration_id = "security-events"
    events                      = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_elb_service_account" "main" {}
```

## 💾 Storage Module Variables (modules/storage/variables.tf)

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "random_suffix" {
  description = "Random suffix for bucket names"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for bucket policies"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## 💾 Storage Module Outputs (modules/storage/outputs.tf)

```hcl
output "app_bucket_name" {
  description = "Name of the application S3 bucket"
  value       = aws_s3_bucket.app_bucket.id
}

output "app_bucket_arn" {
  description = "ARN of the application S3 bucket"
  value       = aws_s3_bucket.app_bucket.arn
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs_bucket.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs_bucket.arn
}

output "config_bucket_name" {
  description = "Name of the config S3 bucket"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the config S3 bucket"
  value       = aws_s3_bucket.config_bucket.arn
}
```

## 💻 Corrected Compute Module (modules/compute/main.tf)

```hcl
# Data source for the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template for Application Servers
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-${var.environment}-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [var.app_sg_id]

  iam_instance_profile {
    name = var.ec2_instance_profile
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type          = "gp3"
      encrypted            = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    app_bucket_name = var.app_bucket_name
    project_name    = var.project_name
    environment     = var.environment
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.project_name}-${var.environment}-app-instance"
      Type = "Application"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.tags, {
      Name = "${var.project_name}-${var.environment}-app-volume"
      Type = "Application"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-${var.environment}-app-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 10
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-app-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-${var.environment}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false # Set to true for production

  access_logs {
    bucket  = var.logs_bucket_name
    prefix  = "alb-access-logs"
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-target-group"
  })
}

# Load Balancer Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = var.tags
}

# Bastion Host
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type         = "t3.micro"
  key_name              = var.key_name
  subnet_id             = var.public_subnet_ids[0]
  vpc_security_group_ids = [var.bastion_sg_id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/templates/bastion_user_data.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-bastion"
    Type = "Bastion"
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project_name}-${var.environment}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors ALB response time"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  tags = var.tags
}
```

## 💻 Compute Module Variables (modules/compute/variables.tf)

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
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

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "bastion_sg_id" {
  description = "Security group ID for bastion host"
  type        = string
}

variable "app_sg_id" {
  description = "Security group ID for application servers"
  type        = string
}

variable "alb_sg_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "ec2_instance_profile" {
  description = "EC2 instance profile name"
  type        = string
}

variable "app_bucket_name" {
  description = "Name of the application S3 bucket"
  type        = string
}

variable "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "EC2 Key Pair name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## 💻 Compute Module Outputs (modules/compute/outputs.tf)

```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.app.zone_id
}

output "bastion_public_ip" {
  description = "Public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
  sensitive   = true
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app.arn
}
```

## 📜 Template Files

### modules/compute/templates/user_data.sh

```bash
#!/bin/bash

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install SSM agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon