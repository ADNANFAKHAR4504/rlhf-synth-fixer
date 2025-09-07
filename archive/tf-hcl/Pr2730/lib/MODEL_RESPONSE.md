### Reasoning Trace

---

This is a comprehensive request for HIPAA-compliant healthcare infrastructure using Terraform. The user is asking for production-ready code that meets strict healthcare compliance requirements. I need to create a complete Terraform configuration that includes:

1. Secure VPC with proper network segmentation
2. IAM roles with AWS managed policies
3. Encrypted storage (S3, RDS, EBS)
4. Security groups with proper restrictions
5. CloudFront for secure CDN
6. AWS Config for compliance monitoring
7. CloudTrail for auditing
8. KMS for encryption management
9. Proper backup strategies

I'll structure this as a modular Terraform configuration with:

- Main configuration file
- Variables file
- Outputs file
- Security module
- Network module
- Storage module

Key HIPAA compliance considerations:

- Encryption at rest and in transit
- Access controls and IAM
- Audit logging
- Network isolation
- Data retention policies
- MFA requirements
- Least privilege access

I need to make sure this is production-ready and follows best practices for healthcare infrastructure.

### Answer

---

# HIPAA-Compliant Healthcare Infrastructure with Terraform

I understand the critical importance of this project and the trust healthcare organizations place in protecting patient data. Let me provide you with a comprehensive, production-ready Terraform configuration that meets HIPAA compliance requirements.

## Project Structure

```
healthcare-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── network/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── security/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── storage/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

## Main Configuration

**main.tf**

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure remote state storage
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment   = var.environment
      Project       = "Healthcare-Infrastructure"
      Compliance    = "HIPAA"
      DataClass     = "PHI"
      Owner         = var.owner
      CostCenter    = var.cost_center
      BackupPolicy  = "Healthcare"
    }
  }
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Network Module - Secure VPC with proper segmentation
module "network" {
  source = "./modules/network"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  allowed_cidr_blocks = var.allowed_cidr_blocks

  tags = local.common_tags
}

# Security Module - IAM, KMS, Security Groups
module "security" {
  source = "./modules/security"

  environment    = var.environment
  vpc_id         = module.network.vpc_id
  application_sg = module.network.application_sg_id
  database_sg    = module.network.database_sg_id

  tags = local.common_tags
}

# Storage Module - S3, RDS with encryption
module "storage" {
  source = "./modules/storage"

  environment           = var.environment
  vpc_id               = module.network.vpc_id
  database_subnet_ids  = module.network.database_subnet_ids
  kms_key_id          = module.security.kms_key_id
  db_security_group_id = module.network.database_sg_id

  # Database configuration
  db_instance_class     = var.db_instance_class
  db_engine_version     = var.db_engine_version
  db_allocated_storage  = var.db_allocated_storage
  db_backup_retention   = var.db_backup_retention

  tags = local.common_tags
}

# CloudFront Distribution for secure content delivery
resource "aws_cloudfront_distribution" "healthcare_cdn" {
  origin {
    domain_name = module.storage.s3_bucket_domain_name
    origin_id   = "S3-${module.storage.s3_bucket_id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Logging configuration for compliance
  logging_config {
    include_cookies = false
    bucket          = module.storage.logging_bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  default_cache_behavior {
    allowed_methods         = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods          = ["GET", "HEAD"]
    target_origin_id        = "S3-${module.storage.s3_bucket_id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Security headers for healthcare compliance
  response_headers_policy_id = aws_cloudfront_response_headers_policy.healthcare_security.id

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-cdn"
  })
}

# Security headers for HIPAA compliance
resource "aws_cloudfront_response_headers_policy" "healthcare_security" {
  name = "${var.environment}-healthcare-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.environment} healthcare S3 bucket"
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "healthcare" {
  name     = "${var.environment}-healthcare-recorder"
  role_arn = module.security.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [module.security]
}

resource "aws_config_delivery_channel" "healthcare" {
  name           = "${var.environment}-healthcare-delivery-channel"
  s3_bucket_name = module.storage.config_bucket_id
  s3_key_prefix  = "config/"

  depends_on = [module.storage]
}

# AWS Config Rules for HIPAA compliance
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.healthcare]
}

resource "aws_config_config_rule" "s3_bucket_public_write_prohibited" {
  name = "s3-bucket-public-write-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.healthcare]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.healthcare]
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.healthcare]
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "healthcare_audit" {
  name           = "${var.environment}-healthcare-audit-trail"
  s3_bucket_name = module.storage.audit_bucket_id
  s3_key_prefix  = "audit-logs/"

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${module.storage.s3_bucket_arn}/*"]
    }
  }

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  kms_key_id                   = module.security.kms_key_arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-audit-trail"
  })
}

# Local values for consistent tagging
locals {
  common_tags = {
    Environment   = var.environment
    Project       = "Healthcare-Infrastructure"
    Compliance    = "HIPAA"
    DataClass     = "PHI"
    Owner         = var.owner
    CostCenter    = var.cost_center
    BackupPolicy  = "Healthcare"
    CreatedBy     = "Terraform"
    CreatedDate   = timestamp()
  }
}
```

## Variables Configuration

**variables.tf**

```hcl
# Environment Configuration
variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the infrastructure"
  type        = list(string)
  default     = []
  validation {
    condition = length(var.allowed_cidr_blocks) > 0
    error_message = "At least one allowed CIDR block must be specified for security."
  }
}

variable "allowed_countries" {
  description = "Countries allowed for CloudFront access"
  type        = list(string)
  default     = ["US"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.3"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
  validation {
    condition     = var.db_allocated_storage >= 20
    error_message = "Database allocated storage must be at least 20 GB."
  }
}

variable "db_backup_retention" {
  description = "Days to retain database backups"
  type        = number
  default     = 35
  validation {
    condition     = var.db_backup_retention >= 35
    error_message = "HIPAA compliance requires minimum 35 days backup retention."
  }
}

# Security Configuration
variable "enable_mfa_delete" {
  description = "Enable MFA delete for S3 buckets"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Days to retain CloudWatch logs"
  type        = number
  default     = 2557  # 7 years for HIPAA compliance
}
```

## Network Module

**modules/network/main.tf**

```hcl
# VPC
resource "aws_vpc" "healthcare" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "healthcare" {
  vpc_id = aws_vpc.healthcare.id

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.healthcare.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets (Application Tier)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.healthcare.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
    Tier = "Application"
  })
}

# Database Subnets (Database Tier)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.healthcare.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-database-subnet-${count.index + 1}"
    Type = "Private"
    Tier = "Database"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "healthcare" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.healthcare]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.healthcare.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.healthcare.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.healthcare.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.healthcare[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.healthcare.id

  tags = merge(var.tags, {
    Name = "${var.environment}-database-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-web-"
  vpc_id      = aws_vpc.healthcare.id
  description = "Security group for web tier - HIPAA compliant"

  # HTTPS inbound only from allowed IPs
  dynamic "ingress" {
    for_each = var.allowed_cidr_blocks
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
      description = "HTTPS from allowed networks"
    }
  }

  # HTTP redirect (will be redirected to HTTPS)
  dynamic "ingress" {
    for_each = var.allowed_cidr_blocks
    content {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
      description = "HTTP redirect from allowed networks"
    }
  }

  # Outbound HTTPS only
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  # Database access to private subnets
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.database : subnet.cidr_block]
    description = "Database access"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-web-sg"
    Tier = "Web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "application" {
  name_prefix = "${var.environment}-app-"
  vpc_id      = aws_vpc.healthcare.id
  description = "Security group for application tier - HIPAA compliant"

  # Access from web tier
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "Application access from web tier"
  }

  # HTTPS outbound
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  # Database access
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.database : subnet.cidr_block]
    description = "Database access"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-application-sg"
    Tier = "Application"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-db-"
  vpc_id      = aws_vpc.healthcare.id
  description = "Security group for database tier - HIPAA compliant"

  # PostgreSQL access from application tier only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "PostgreSQL from application tier"
  }

  # No outbound rules - database should not initiate external connections

  tags = merge(var.tags, {
    Name = "${var.environment}-database-sg"
    Tier = "Database"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Flow Logs for security monitoring
resource "aws_flow_log" "healthcare" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.healthcare.id

  tags = merge(var.tags, {
    Name = "${var.environment}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.environment}-flow-logs"
  retention_in_days = 2557  # 7 years for HIPAA
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-flow-log-role"

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
  name = "${var.environment}-flow-log-policy"
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
```

**modules/network/variables.tf**

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the infrastructure"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = ""
}
```

**modules/network/outputs.tf**

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.healthcare.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.healthcare.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "web_sg_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "application_sg_id" {
  description = "ID of the application security group"
  value       = aws_security_group.application.id
}

output "database_sg_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.healthcare.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.healthcare[*].id
}
```

## Security Module

**modules/security/main.tf**

```hcl
# KMS Key for Healthcare Data Encryption
resource "aws_kms_key" "healthcare" {
  description             = "KMS key for healthcare data encryption - HIPAA compliant"
  deletion_window_in_days = 30
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
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Config to use the key"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
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

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-kms-key"
  })
}

resource "aws_kms_alias" "healthcare" {
  name          = "alias/${var.environment}-healthcare"
  target_key_id = aws_kms_key.healthcare.key_id
}

# Data source for current account
data "aws_caller_identity" "current" {}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.environment}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "${var.environment}-config-role"

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

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigServiceRole"
}

# Additional policy for Config to access S3 bucket
resource "aws_iam_role_policy" "config_s3" {
  name = "${var.environment}-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${var.environment}-healthcare-config-*"
      },
      {
        Effect = "Allow"
        Action = "s3:PutObject"
        Resource = "arn:aws:s3:::${var.environment}-healthcare-config-*/config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = "arn:aws:s3:::${var.environment}-healthcare-config-*/config/*"
      }
    ]
  })
}

# IAM Role for EC2 instances (if needed)
resource "aws_iam_role" "ec2_healthcare" {
  name = "${var.environment}-ec2-healthcare-role"

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

# Attach AWS managed policies for EC2
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_healthcare.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_healthcare.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_healthcare" {
  name = "${var.environment}-ec2-healthcare-profile"
  role = aws_iam_role.ec2_healthcare.name

  tags = var.tags
}

# IAM Role for Lambda functions (if needed for automation)
resource "aws_iam_role" "lambda_healthcare" {
  name = "${var.environment}-lambda-healthcare-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_healthcare.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_healthcare.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# CloudWatch Log Groups with appropriate retention
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.environment}-healthcare"
  retention_in_days = 2557  # 7 years for HIPAA compliance
  kms_key_id        = aws_kms_key.healthcare.arn

  tags = var.tags
}

# SNS Topic for Compliance Alerts
resource "aws_sns_topic" "compliance_alerts" {
  name            = "${var.environment}-healthcare-compliance-alerts"
  kms_master_key_id = aws_kms_key.healthcare.id

  tags = var.tags
}

resource "aws_sns_topic_policy" "compliance_alerts" {
  arn = aws_sns_topic.compliance_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.compliance_alerts.arn
      }
    ]
  })
}

# CloudWatch Alarms for Security Monitoring
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.environment}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Monitors for unauthorized API calls - HIPAA security requirement"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${var.environment}-root-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootUsage"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Monitors for root account usage - HIPAA security requirement"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  tags = var.tags
}

# Security Hub for centralized security findings
resource "aws_securityhub_account" "main" {
  enable_default_standards = true
}

# Enable GuardDuty for threat detection
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false  # Not using EKS in this setup
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = var.tags
}
```

**modules/security/variables.tf**

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "application_sg" {
  description = "Application security group ID"
  type        = string
}

variable "database_sg" {
  description = "Database security group ID"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/security/outputs.tf**

```hcl
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.healthcare.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.healthcare.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.healthcare.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

output "config_role_arn" {
  description = "ARN of the Config service role"
  value       = aws_iam_role.config.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_healthcare.name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_healthcare.arn
}

output "sns_topic_arn" {
  description = "ARN of the compliance alerts SNS topic"
  value       = aws_sns_topic.compliance_alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}
```

## Storage Module

**modules/storage/main.tf**

```hcl
# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.environment}-healthcare-db-password"
  description             = "Database password for healthcare application"
  recovery_window_in_days = 30
  kms_key_id              = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "healthcare_admin"
    password = random_password.db_password.result
  })
}

# DB Subnet Group
resource "aws_db_subnet_group" "healthcare" {
  name       = "${var.environment}-healthcare-db-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-db-subnet-group"
  })
}

# DB Parameter Group for PostgreSQL optimization
resource "aws_db_parameter_group" "healthcare" {
  family = "postgres15"
  name   = "${var.environment}-healthcare-postgres-params"

  # Healthcare-specific optimizations
  parameter {
    name  = "log_statement"
    value = "all"  # Log all statements for audit compliance
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log slow queries (>1s)
  }

  parameter {
    name  = "log_connections"
    value = "1"  # Log connections for audit
  }

  parameter {
    name  = "log_disconnections"
    value = "1"  # Log disconnections for audit
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.tags
}

# RDS Instance
resource "aws_db_instance" "healthcare" {
  identifier = "${var.environment}-healthcare-db"

  # Engine configuration
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_id

  # Database configuration
  db_name  = "healthcare"
  username = "healthcare_admin"
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.healthcare.name
  vpc_security_group_ids = [var.db_security_group_id]
  publicly_accessible    = false

  # Backup configuration - HIPAA compliant
  backup_retention_period = var.db_backup_retention
  backup_window          = "03:00-04:00"  # During low usage
  maintenance_window     = "sun:04:00-sun:05:00"
  delete_automated_backups = false

  # Performance and monitoring
  parameter_group_name        = aws_db_parameter_group.healthcare.name
  monitoring_interval         = 60
  monitoring_role_arn        = var.monitoring_role_arn
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_id
  performance_insights_retention_period = 731  # 2 years

  # Security configuration
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.environment}-healthcare-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}"

  # Enable CloudWatch logs exports
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-database"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
      final_snapshot_identifier
    ]
  }
}

# RDS Automated Backups Replication (Cross-region for DR)
resource "aws_db_instance_automated_backups_replication" "healthcare" {
  source_db_instance_arn = aws_db_instance.healthcare.arn
  kms_key_id            = var.kms_key_id

  tags = var.tags
}

# Primary S3 Bucket for Healthcare Data
resource "aws_s3_bucket" "healthcare_data" {
  bucket = "${var.environment}-healthcare-data-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name        = "${var.environment}-healthcare-data"
    DataClass   = "PHI"
    Compliance  = "HIPAA"
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "healthcare_data" {
  bucket = aws_s3_bucket.healthcare_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "healthcare_data" {
  bucket = aws_s3_bucket.healthcare_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "healthcare_data" {
  bucket = aws_s3_bucket.healthcare_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "healthcare_data" {
  bucket = aws_s3_bucket.healthcare_data.id

  rule {
    id     = "healthcare_data_lifecycle"
    status = "Enabled"

    # Move to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Move to Deep Archive after 365 days
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete non-current versions after 7 years (HIPAA requirement)
    noncurrent_version_expiration {
      noncurrent_days = 2557
    }
  }
}

# S3 Bucket Logging
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.environment}-healthcare-access-logs-${random_string.logs_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-access-logs"
  })
}

resource "random_string" "logs_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "healthcare_data" {
  bucket = aws_s3_bucket.healthcare_data.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

# Config Bucket
resource "aws_s3_bucket" "config" {
  bucket = "${var.environment}-healthcare-config-${random_string.config_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-config"
  })
}

resource "random_string" "config_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
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
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
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
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/config/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Audit Trail Bucket
resource "aws_s3_bucket" "audit_trail" {
  bucket = "${var.environment}-healthcare-audit-${random_string.audit_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.environment}-healthcare-audit-trail"
  })
}

resource "random_string" "audit_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_trail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-healthcare-audit-trail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_trail.arn}/audit-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-healthcare-audit-trail"
          }
        }
      }
    ]
  })
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# EBS Default Encryption
resource "aws_ebs_default_kms_key" "healthcare" {
  key_arn = var.kms_key_arn
}

resource "aws_ebs_encryption_by_default" "healthcare" {
  enabled = true
}
```

**modules/storage/variables.tf**

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "database_subnet_ids" {
  description = "Database subnet IDs"
  type        = list(string)
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "db_security_group_id" {
  description = "Database security group ID"
  type        = string
}

variable "monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.3"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_backup_retention" {
  description = "Days to retain database backups"
  type        = number
  default     = 35
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/storage/outputs.tf**

```hcl
output "s3_bucket_id" {
  description = "ID of the healthcare data S3 bucket"
  value       = aws_s3_bucket.healthcare_data.id
}

output "s3_bucket_arn" {
  description = "ARN of the healthcare data S3 bucket"
  value       = aws_s3_bucket.healthcare_data.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the healthcare data S3 bucket"
  value       = aws_s3_bucket.healthcare_data.bucket_domain_name
}

output "logging_bucket_id" {
  description = "ID of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs.id
}

output "logging_bucket_domain_name" {
  description = "Domain name of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs.bucket_domain_name
}

output "config_bucket_id" {
  description = "ID of the Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

output "audit_bucket_id" {
  description = "ID of the audit trail S3 bucket"
  value       = aws_s3_bucket.audit_trail.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.healthcare.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.healthcare.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.healthcare.db_name
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}
```

## Main Outputs

**outputs.tf**

```hcl
# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.network.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.network.database_subnet_ids
}

# Security Outputs
output "kms_key_id" {
  description = "ID of the KMS key for healthcare data"
  value       = module.security.kms_key_id
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = module.security.kms_key_alias
}

# Storage Outputs
output "healthcare_s3_bucket" {
  description = "Name of the healthcare data S3 bucket"
  value       = module.storage.s3_bucket_id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.storage.rds_endpoint
  sensitive   = true
}

output "database_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = module.storage.db_secret_arn
  sensitive   = true
}

# CloudFront Distribution
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.healthcare_cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.healthcare_cdn.domain_name
}

# Compliance and Monitoring
output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.healthcare.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail for audit logging"
  value       = aws_cloudtrail.healthcare_audit.arn
}

output "compliance_sns_topic" {
  description = "ARN of the compliance alerts SNS topic"
  value       = module.security.sns_topic_arn
}

# Security Groups
output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = module.network.web_sg_id
}

output "application_security_group_id" {
  description = "ID of the application tier security group"
  value       = module.network.application_sg_id
}

output "database_security_group_id" {
  description = "ID of the database tier security group"
  value       = module.network.database_sg_id
}
```

## Example Variables File

**terraform.tfvars.example**

```hcl
# Environment Configuration
environment = "prod"
aws_region  = "us-east-1"
owner       = "Healthcare-IT-Team"
cost_center = "HEALTHCARE-001"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-
```
