########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}
variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}
# =============================================================================
# ASSUMPTIONS AND DEFAULTS
# =============================================================================
# - VPC CIDR: 10.0.0.0/16 with /24 subnets across 2 AZs (us-west-2a, us-west-2b)
# - Instance types: t4g.micro for bastion, t4g.small for app (Graviton-based)
# - Database: PostgreSQL 15.4, db.t4g.micro, Multi-AZ enabled
# - SSL/TLS: ACM certificate with DNS validation (configure via domain_name and hosted_zone_id variables)
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
  default     = "15.13"
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

variable "domain_name" {
  description = "Domain name for the application (e.g., myapp.com)"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain (e.g., Z1234567890ABC)"
  type        = string
  default     = ""
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging"
  type        = bool
  default     = false
}

variable "enable_config" {
  description = "Enable AWS Config"
  type        = bool
  default     = false
}

variable "enable_alb_logs" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = false
}

variable "health_check_path" {
  description = "Path for ALB health checks"
  type        = string
  default     = "/health"
}

variable "asg_health_check_type" {
  description = "Health check type for Auto Scaling Group (EC2 or ELB)"
  type        = string
  default     = "EC2"
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
          Service = "logs.us-west-2.amazonaws.com"
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
  service_name = "com.amazonaws.us-west-2.s3"

  route_table_ids = [aws_route_table.private.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# Interface Endpoints for SSM
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-west-2.ssm"
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
  service_name        = "com.amazonaws.us-west-2.ssmmessages"
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
  service_name        = "com.amazonaws.us-west-2.ec2messages"
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
  service_name        = "com.amazonaws.us-west-2.kms"
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

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
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

    filter {}

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
  count = var.domain_name != "" ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cert"
  })
}

# Route53 Hosted Zone data source for DNS validation
data "aws_route53_zone" "main" {
  count   = var.hosted_zone_id != "" ? 1 : 0
  zone_id = var.hosted_zone_id
}

# Route53 DNS validation records
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" && var.hosted_zone_id != "" ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main[0].zone_id
}

# ACM Certificate validation
resource "aws_acm_certificate_validation" "main" {
  count = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "5m"
  }
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

  dynamic "access_logs" {
    for_each = var.enable_alb_logs ? [1] : []
    content {
      bucket  = aws_s3_bucket.logs.bucket
      prefix  = "alb-logs"
      enabled = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })


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
    interval            = 90
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 15
    unhealthy_threshold = 5
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-tg"
  })
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  count = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

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
  count = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0

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

# HTTP Listener (fallback when no domain is configured)
resource "aws_lb_listener" "http_fallback" {
  count = var.domain_name == "" || var.hosted_zone_id == "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-http-fallback-listener"
  })
}

# Data source for ELB service account
data "aws_elb_service_account" "main" {}

# S3 bucket policy for ALB access logs
resource "aws_s3_bucket_policy" "logs_alb" {
  count = var.enable_alb_logs ? 1 : 0

  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
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
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
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
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
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
      metric_name                = "SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}WAFMetric"
    sampled_requests_enabled   = true
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
          "arn:${data.aws_partition.current.partition}:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*"
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
        Resource = "arn:${data.aws_partition.current.partition}:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${local.name_prefix}*"
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
  role = aws_iam_role.ec2_app.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-app-profile"
  })
}

# Bastion IAM Role
resource "aws_iam_role" "bastion" {
  name = "${local.name_prefix}-bastion-role"

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
    Name = "${local.name_prefix}-bastion-role"
  })
}

# Bastion policy - minimal SSM access
resource "aws_iam_role_policy" "bastion" {
  name = "${local.name_prefix}-bastion-policy"
  role = aws_iam_role.bastion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach SSM managed policy to bastion
resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Bastion instance profile
resource "aws_iam_instance_profile" "bastion" {
  name = "${local.name_prefix}-bastion-profile"
  role = aws_iam_role.bastion.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-profile"
  })
}

# CloudTrail IAM Role
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-role"
  })
}

# CloudTrail policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs" {
  name = "${local.name_prefix}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${local.name_prefix}*"
      }
    ]
  })
}

# AWS Config Service Role - Use existing service-linked role
# Import if needed: terraform import aws_iam_service_linked_role.config arn:aws:iam::ACCOUNT_ID:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig
# resource "aws_iam_service_linked_role" "config" {
#   aws_service_name = "config.amazonaws.com"
# }

# Data source for existing AWS Config service-linked role
data "aws_iam_role" "config_service_role" {
  name = "AWSServiceRoleForConfig"
}

# =============================================================================
# RDS SUBNET GROUP AND DATABASE
# =============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Parameter Group with secure defaults
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${local.name_prefix}-db-params"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-params"
  })
}

# Data source for available RDS engine versions
data "aws_rds_engine_version" "postgres" {
  engine             = var.db_engine
  preferred_versions = ["15.13", "15.12", "15.10", "15.8", "15.7"]
}



# RDS Instance
resource "aws_db_instance" "main" {
  identifier            = "${local.name_prefix}-postgres"
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.general.arn

  db_name        = "appdb"
  engine         = var.db_engine
  engine_version = data.aws_rds_engine_version.postgres.version
  instance_class = "db.t4g.micro"

  username                      = "postgres"
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.general.arn

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az            = var.enable_multi_az_db
  publicly_accessible = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"
  copy_tags_to_snapshot   = true

  deletion_protection = false
  skip_final_snapshot = true

  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.general.arn
  performance_insights_retention_period = 7

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres-db"
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# EC2 LAUNCH TEMPLATE AND AUTO SCALING GROUP
# =============================================================================





# =============================================================================
# BASTION HOST
# =============================================================================

# Bastion Host
resource "aws_instance" "bastion" {
  ami           = data.aws_ssm_parameter.amazon_linux_arm_ami.value
  instance_type = "t4g.micro"
  key_name      = null # No SSH key - use SSM only

  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.bastion.name

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = aws_kms_key.general.arn
    delete_on_termination = true
  }

  user_data_base64 = base64encode(templatefile("${path.module}/bastion-user-data.sh", {}))

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion"
  })
}

# =============================================================================
# CLOUDWATCH LOG GROUPS
# =============================================================================

# CloudTrail Log Group
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

# If CloudTrail limit exceeded, import existing trail:
# terraform import aws_cloudtrail.main <existing-trail-name>
# Or comment out this resource if using existing CloudTrail
resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  name           = "${local.name_prefix}-trail"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "cloudtrail-logs"

  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  enable_log_file_validation    = true
  enable_logging                = true
  is_multi_region_trail         = true
  include_global_service_events = true

  kms_key_id = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

# CloudTrail S3 bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.logs.id

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
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# =============================================================================
# AWS CONFIG
# =============================================================================

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  count = var.enable_config ? 1 : 0

  name     = "${local.name_prefix}-config-recorder"
  role_arn = data.aws_iam_role.config_service_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# Config Delivery Channel
# If AWS Config delivery channel limit exceeded, import existing channel:
# terraform import aws_config_delivery_channel.main <existing-delivery-channel-name>
# Or comment out this resource if using existing delivery channel
resource "aws_config_delivery_channel" "main" {
  count = var.enable_config ? 1 : 0

  name           = "${local.name_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "config-logs"

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config_logs" {
  bucket = aws_s3_bucket.logs.id

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
        Resource = aws_s3_bucket.logs.arn
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
        Resource = aws_s3_bucket.logs.arn
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
        Resource = "${aws_s3_bucket.logs.arn}/config-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

# ALB 5xx errors alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${local.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-5xx-alarm"
  })
}



# RDS CPU utilization alarm
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-cpu-alarm"
  })
}

# RDS free storage space alarm
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${local.name_prefix}-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-storage-alarm"
  })
}

# RDS freeable memory alarm
resource "aws_cloudwatch_metric_alarm" "rds_low_memory" {
  alarm_name          = "${local.name_prefix}-rds-low-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000" # 100MB in bytes
  alarm_description   = "This metric monitors RDS freeable memory"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-memory-alarm"
  })
}

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC and Networking outputs
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

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

# Load Balancer outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = var.domain_name != "" && var.hosted_zone_id != "" ? aws_lb_listener.https[0].arn : "No HTTPS listener configured"
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = var.domain_name != "" && var.hosted_zone_id != "" ? aws_lb_listener.http[0].arn : aws_lb_listener.http_fallback[0].arn
}

# WAF output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# ACM Certificate output
output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].arn : "No certificate configured"
}

# Security Group outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of the app security group"
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.db.id
}

output "bastion_security_group_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

# RDS outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "rds_backup_window" {
  description = "RDS backup window"
  value       = aws_db_instance.main.backup_window
}

output "rds_backup_retention" {
  description = "RDS backup retention period"
  value       = aws_db_instance.main.backup_retention_period
}

# CloudTrail outputs
output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : "CloudTrail disabled"
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : "CloudTrail disabled"
}

# S3 bucket outputs
output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "s3_logs_bucket_arn" {
  description = "ARN of the S3 logs bucket"
  value       = aws_s3_bucket.logs.arn
}

# CloudWatch outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

# AWS Config outputs
output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = var.enable_config ? aws_config_configuration_recorder.main[0].name : "AWS Config disabled"
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = var.enable_config ? aws_config_delivery_channel.main[0].name : "AWS Config disabled"
}

# KMS outputs
output "general_kms_key_arn" {
  description = "ARN of the general KMS key"
  value       = aws_kms_key.general.arn
}

output "general_kms_key_alias" {
  description = "Alias of the general KMS key"
  value       = aws_kms_alias.general.name
}

output "logs_kms_key_arn" {
  description = "ARN of the logs KMS key"
  value       = aws_kms_key.logs.arn
}

output "logs_kms_key_alias" {
  description = "Alias of the logs KMS key"
  value       = aws_kms_alias.logs.name
}

# Bastion outputs
output "bastion_instance_id" {
  description = "ID of the bastion instance"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Public IP of the bastion instance"
  value       = aws_instance.bastion.public_ip
}

# Domain configuration outputs
output "domain_name" {
  description = "Domain name configured for the application"
  value       = var.domain_name
}

output "hosted_zone_id" {
  description = "Route53 hosted zone ID used for DNS"
  value       = var.hosted_zone_id
}

output "certificate_arn" {
  description = "ARN of the ACM certificate (if domain is configured)"
  value       = var.domain_name != "" && var.hosted_zone_id != "" ? aws_acm_certificate_validation.main[0].certificate_arn : "No certificate configured"
}



output "health_check_path" {
  description = "Health check path being used"
  value       = var.health_check_path
}



# =============================================================================
# RESOURCE INVENTORY & CONSOLE LINKS
# =============================================================================

/*
## Resource Inventory & Console Links

### VPC & Networking
- **VPC**: ${aws_vpc.main.id} 
  - Console: https://console.aws.amazon.com/vpc/home?region=us-west-2#vpcs:search=${aws_vpc.main.id}
- **ALB**: ${aws_lb.main.name}
  - Console: https://console.aws.amazon.com/ec2/v2/home?region=us-west-2#LoadBalancers:search=${aws_lb.main.name}

### Security
- **WAF Web ACL**: ${aws_wafv2_web_acl.main.name}
  - Console: https://console.aws.amazon.com/wafv2/homev2/web-acls?region=us-west-2
- **KMS Keys**: 
  - General: ${aws_kms_alias.general.name} (${aws_kms_key.general.arn})
  - Logs: ${aws_kms_alias.logs.name} (${aws_kms_key.logs.arn})
  - Console: https://console.aws.amazon.com/kms/home?region=us-west-2#/kms/keys

### Database
- **RDS**: ${aws_db_instance.main.identifier}
  - Console: https://console.aws.amazon.com/rds/home?region=us-west-2#database:id=${aws_db_instance.main.identifier}

### Logging & Monitoring
- **CloudTrail**: ${aws_cloudtrail.main.name}
  - Console: https://console.aws.amazon.com/cloudtrail/home?region=us-west-2#/trails/${aws_cloudtrail.main.name}
- **AWS Config**: ${aws_config_configuration_recorder.main.name}
  - Console: https://console.aws.amazon.com/config/home?region=us-west-2
- **S3 Logs Bucket**: ${aws_s3_bucket.logs.bucket}
  - Console: https://console.aws.amazon.com/s3/buckets/${aws_s3_bucket.logs.bucket}?region=us-west-2

### Testing & Verification

To test this infrastructure:

```bash
# Initialize and validate
terraform init
terraform validate
terraform fmt -check

# Plan and apply (without domain)
terraform plan -var='bastion_allowed_cidrs=["YOUR_IP/32"]'
terraform apply -var='bastion_allowed_cidrs=["YOUR_IP/32"]' -auto-approve

# Plan and apply (with domain and optional services)
terraform plan -var='bastion_allowed_cidrs=["YOUR_IP/32"]' -var='domain_name=myapp.com' -var='hosted_zone_id=Z1234567890ABC' -var='enable_cloudtrail=false' -var='enable_config=false' -var='enable_alb_logs=false'
terraform apply -var='bastion_allowed_cidrs=["YOUR_IP/32"]' -var='domain_name=myapp.com' -var='hosted_zone_id=Z1234567890ABC' -var='enable_cloudtrail=false' -var='enable_config=false' -var='enable_alb_logs=false' -auto-approve

# Access via Session Manager (preferred)
aws ssm start-session --target BASTION_INSTANCE_ID

# Cleanup
terraform destroy -auto-approve
```

### Cost Optimization Notes
- Single NAT Gateway used (can be increased to 2 for HA)
- t4g.micro/small instances (Graviton-based for cost efficiency)
- GP3 storage volumes
- 7-day RDS backup retention (adjust as needed)
- S3 lifecycle transitions to IA after 90 days
*/