# tap_stack.tf - Complete Terraform configuration for secure AWS infrastructure

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Naming conventions
  name_prefix = "${var.project_name}-${lower(var.environment)}"
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  db_subnet_cidrs      = ["10.0.30.0/24", "10.0.40.0/24"]
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get latest Amazon Linux 2 AMI
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

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

# Random DB username (8 characters, no special characters)
resource "random_string" "db_username" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# Random DB password (16 characters with special characters)
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# ============================================================================
# KMS KEYS
# ============================================================================

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms-key"
  })
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.name_prefix}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# KMS key for CloudTrail encryption
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail encryption"
  deletion_window_in_days = 7

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
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-kms-key"
  })
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${local.name_prefix}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = 14

  tags = local.common_tags
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  # Outbound rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  # Allow MySQL/Aurora access from EC2 security group
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "MySQL access from EC2"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ElastiCache
resource "aws_security_group" "elasticache" {
  name_prefix = "${local.name_prefix}-elasticache-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for ElastiCache"

  # Allow Redis access from EC2 security group
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "Redis access from EC2"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-elasticache-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${local.name_prefix}-flow-log-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${local.name_prefix}-flow-log-policy"
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

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = local.common_tags
}

# IAM Policy for EC2 (least privilege)
resource "aws_iam_role_policy" "ec2" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "${local.name_prefix}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Group with MFA enforcement
resource "aws_iam_group" "mfa_users" {
  name = "${local.name_prefix}-mfa-users"
}

resource "aws_iam_group_policy" "mfa_enforcement" {
  name  = "${local.name_prefix}-mfa-enforcement"
  group = aws_iam_group.mfa_users.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# ============================================================================
# RDS DATABASE
# ============================================================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "appdb"
  username = random_string.db_username.result
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  publicly_accessible = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })
}

# ============================================================================
# ELASTICACHE
# ============================================================================

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

# ElastiCache Cluster
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${local.name_prefix}-cache"
  engine               = "redis"
  node_type            = var.elasticache_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.elasticache.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache"
  })
}

# ============================================================================
# EC2 INSTANCE
# ============================================================================

resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.ebs.arn
    delete_on_termination = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y mysql
    EOF
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-instance"
  })
}

# ============================================================================
# S3 BUCKET
# ============================================================================

resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-bucket-${random_id.suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================================
# CLOUDFRONT AND WAF
# ============================================================================

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name_prefix}-oac"
  description                       = "Origin Access Control for S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  provider = aws.us_east_1
  name  = "${local.name_prefix}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = false
    }
  }

  tags = local.common_tags

  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                 = "${local.name_prefix}-waf"
    sampled_requests_enabled    = false
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name              = aws_s3_bucket.main.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.main.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.main.arn

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.main.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront"
  })
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-cloudtrail-${random_id.suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

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
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
  s3_key_prefix  = "cloudtrail-logs"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  kms_key_id = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
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

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}
output "elasticache_endpoint" {
  description = "ElastiCache cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "elasticache_port" {
  description = "ElastiCache cluster port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "ec2_instance_ami_id" {
  description = "AMI ID used for the EC2 instance"
  value       = aws_instance.main.ami
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ID of the ElastiCache security group"
  value       = aws_security_group.elasticache.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "kms_key_rds_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_ebs_id" {
  description = "ID of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs.id
}

output "kms_key_ebs_arn" {
  description = "ARN of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs.arn
}

output "kms_key_cloudtrail_id" {
  description = "ID of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail.id
}

output "kms_key_cloudtrail_arn" {
  description = "ARN of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail.arn
}

output "iam_role_ec2_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2.name
}

output "iam_role_ec2_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "iam_role_flow_log_name" {
  description = "Name of the VPC Flow Log IAM role"
  value       = aws_iam_role.flow_log.name
}

output "iam_role_flow_log_arn" {
  description = "ARN of the VPC Flow Log IAM role"
  value       = aws_iam_role.flow_log.arn
}

output "iam_role_cloudtrail_name" {
  description = "Name of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.name
}

output "iam_role_cloudtrail_arn" {
  description = "ARN of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.arn
}

output "iam_group_mfa_users_name" {
  description = "Name of the MFA users IAM group"
  value       = aws_iam_group.mfa_users.name
}

output "iam_group_mfa_users_arn" {
  description = "ARN of the MFA users IAM group"
  value       = aws_iam_group.mfa_users.arn
}

output "iam_instance_profile_ec2_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "iam_instance_profile_ec2_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

output "cloudwatch_log_group_vpc_flow_log_name" {
  description = "Name of the VPC Flow Log CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "cloudwatch_log_group_vpc_flow_log_arn" {
  description = "ARN of the VPC Flow Log CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.arn
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "elasticache_subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "elastic_ips" {
  description = "Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = var.availability_zones
}

output "region" {
  description = "AWS region used for deployment"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "random_suffix" {
  description = "Random suffix used for unique resource naming"
  value       = random_id.suffix.hex
}

output "db_username" {
  description = "Database master username"
  value       = random_string.db_username.result
}

output "cloudfront_origin_access_control_id" {
  description = "ID of the CloudFront Origin Access Control"
  value       = aws_cloudfront_origin_access_control.main.id
}

output "ami_id" {
  description = "AMI ID of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.id
}

output "ami_name" {
  description = "AMI name of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.name
}

output "ami_description" {
  description = "AMI description of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.description
}

output "current_account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "current_region" {
  description = "Current AWS region"
  value       = data.aws_region.current.name
}
