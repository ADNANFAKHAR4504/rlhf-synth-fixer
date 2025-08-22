I'll generate the complete Terraform infrastructure for the AWS Nova Model Breaking project. Here are the two required files and supporting materials:

provider.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }

  # Uncomment and configure for remote state management
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "nova-model-breaking/terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-locks"
  # }
}

# AWS Provider configuration - hardcoded to us-west-2
provider "aws" {
  region = "us-west-2"
  
  default_tags {
    tags = {
      Project     = "IaC - AWS Nova Model Breaking"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

provider "random" {}
main.tf
# =============================================================================
# ASSUMPTIONS AND DEFAULTS
# =============================================================================
# - VPC CIDR: 10.0.0.0/16 with /24 subnets across 2 AZs (us-west-2a, us-west-2b)
# - Instance types: t4g.micro for bastion, t4g.small for app (Graviton-based)
# - Database: PostgreSQL 15.4, db.t4g.micro, Multi-AZ enabled
# - SSL/TLS: Self-signed certificate for demo (replace with real domain)
# - Bastion access: SSH restricted to empty CIDR list by default (SSM preferred)
# - Log retention: 30 days CloudWatch, 90 days S3 lifecycle to IA
# - WAF: Standard AWS managed rule sets for common threats
# - KMS: Customer-managed keys with annual rotation
# - Cost optimization: Single NAT Gateway (can be increased for HA)
# =============================================================================

# =============================================================================
# VARIABLES
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "allowed_https_cidrs" {
  description = "CIDR blocks allowed to access HTTPS (443) on ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "bastion_allowed_cidrs" {
  description = "CIDR blocks allowed SSH access to bastion (empty = SSM only)"
  type        = list(string)
  default     = []
}

variable "db_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "db_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "enable_multi_az_db" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "s3_lifecycle_days" {
  description = "Days before S3 objects transition to IA"
  type        = number
  default     = 90
}

variable "allow_public_storage" {
  description = "Allow public access to S3 buckets"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "nova-model-breaking"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Availability zones for us-west-2
  availability_zones = ["us-west-2a", "us-west-2b"]
  
  # Common naming convention
  name_prefix = "nova-model"
  
  # Merge default and custom tags
  common_tags = merge(var.tags, {
    Terraform = "true"
    Region    = "us-west-2"
  })
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account and region info
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

# Get latest Amazon Linux 2023 AMI
data "aws_ssm_parameter" "amazon_linux_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# Get latest Amazon Linux 2023 ARM64 AMI for Graviton instances
data "aws_ssm_parameter" "amazon_linux_arm_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-arm64"
}

# =============================================================================
# RANDOM RESOURCES FOR UNIQUE NAMING
# =============================================================================

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# =============================================================================
# KMS KEYS FOR ENCRYPTION
# =============================================================================

# General purpose KMS key for data encryption
resource "aws_kms_key" "general" {
  description             = "General purpose KMS key for ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail and Config"
        Effect = "Allow"
        Principal = {
          Service = ["cloudtrail.amazonaws.com", "config.amazonaws.com"]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-general-kms"
  })
}

resource "aws_kms_alias" "general" {
  name          = "alias/${local.name_prefix}-general"
  target_key_id = aws_kms_key.general.key_id
}

# Separate KMS key for logs
resource "aws_kms_key" "logs" {
  description             = "KMS key for logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
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
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-kms"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${local.name_prefix}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

# Main VPC
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
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (single for cost optimization)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
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

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt"
  })
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate Private Subnets with Private Route Table
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# =============================================================================
# VPC ENDPOINTS
# =============================================================================

# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
  
  route_table_ids = [aws_route_table.private.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# Interface Endpoints for SSM
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ssm-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssm_messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ssmmessages-endpoint"
  })
}

resource "aws_vpc_endpoint" "ec2_messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2messages-endpoint"
  })
}

# KMS Endpoint
resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-endpoint"
  })
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# ALB Security Group - allows HTTPS from specified CIDRs
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTPS from allowed CIDRs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    description = "HTTP redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# App/Web Security Group - allows traffic from ALB only
resource "aws_security_group" "app" {
  name_prefix = "${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances"

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group - allows traffic from app tier only
resource "aws_security_group" "db" {
  name_prefix = "${local.name_prefix}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Bastion Security Group - SSH restricted to allowed CIDRs
resource "aws_security_group" "bastion" {
  name_prefix = "${local.name_prefix}-bastion-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for bastion host"

  # Only add SSH ingress if CIDRs are specified
  dynamic "ingress" {
    for_each = length(var.bastion_allowed_cidrs) > 0 ? [1] : []
    content {
      description = "SSH from allowed CIDRs"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.bastion_allowed_cidrs
    }
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints Security Group
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.name_prefix}-vpce-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# Central log bucket with encryption and lifecycle
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "logs" {
  bucket = aws_s3_bucket.logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.logs.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = !var.allow_public_storage
  block_public_policy     = !var.allow_public_storage
  ignore_public_acls      = !var.allow_public_storage
  restrict_public_buckets = !var.allow_public_storage
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "lifecycle"
    status = "Enabled"

    transition {
      days          = var.s3_lifecycle_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_lifecycle_days * 2
      storage_class = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# =============================================================================
# ACM CERTIFICATE (Self-signed for demo)
# =============================================================================

resource "aws_acm_certificate" "main" {
  domain_name       = "example.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.example.com"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cert"
  })
}

# =============================================================================
# APPLICATION LOAD BALANCER
# =============================================================================

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })

  depends_on = [aws_s3_bucket_policy.logs_alb]
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-tg"
  })
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-https-listener"
  })
}

# HTTP to HTTPS Redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-http-listener"
  })
}

# S3 bucket policy for ALB access logs
resource "aws_s3_bucket_policy" "logs_alb" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root" # ELB service account for us-west-2
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
      }
    ]
  })
}

# =============================================================================
# WAF v2
# =============================================================================

resource "aws_wafv2_web_acl" "main" {
  name  = "${local.name_prefix}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules - Common Rule Set
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
      cloudwatch_metrics_enabled = true
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  # AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "SQLiRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "${local.name_prefix}WAFMetric"
    sampled_requests_enabled    = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf"
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# EC2 Instance Role for App/Web instances
resource "aws_iam_role" "ec2_app" {
  name = "${local.name_prefix}-ec2-app-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-app-role"
  })
}

# Policy for app instances - SSM and basic CloudWatch
resource "aws_iam_role_policy" "ec2_app" {
  name = "${local.name_prefix}-ec2-app-policy"
  role = aws_iam_role.ec2_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:${data.aws_partition.current.partition}:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${local.name_prefix}*"
      }
    ]
  })
}

# Attach SSM managed policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_app_ssm" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for app instances
resource "aws_iam_instance_profile" "ec2_app" {
  name = "${local.name_prefix}-ec2-app-profile"