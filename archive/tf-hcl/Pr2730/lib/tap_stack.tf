# tap_stack.tf - HIPAA-Compliant Healthcare Infrastructure
# Complete infrastructure stack for healthcare data processing and storage

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Random suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "healthcare-infrastructure"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "hipaa-healthcare-platform"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "healthcare-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the infrastructure"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Restrict to private networks for HIPAA compliance
}

variable "allowed_countries" {
  description = "List of allowed countries for geographic restrictions"
  type        = list(string)
  default     = ["US"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
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

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get latest PostgreSQL version
data "aws_rds_engine_version" "postgresql" {
  engine = "postgres"
}

# Generate random suffix if not provided
resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Environment suffix
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project
    Owner       = var.owner
    CostCenter  = var.cost_center
    Compliance  = "HIPAA"
    DataClass   = "PHI"
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Database password without special characters for HIPAA compliance
  db_password_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
}

# ============================================================================
# KMS ENCRYPTION
# ============================================================================

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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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
        Sid    = "Allow CloudTrail"
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
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-kms-${local.env_suffix}"
  })
}

resource "aws_kms_alias" "healthcare" {
  name          = "alias/${var.environment}-healthcare-${local.env_suffix}"
  target_key_id = aws_kms_key.healthcare.key_id
}

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "healthcare" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-vpc-${local.env_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "healthcare" {
  vpc_id = aws_vpc.healthcare.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-igw-${local.env_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.healthcare.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}-${local.env_suffix}"
    Type = "Public"
  })
}

# Private Subnets (Application Tier)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.healthcare.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}-${local.env_suffix}"
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

  tags = merge(local.common_tags, {
    Name = "${var.environment}-database-subnet-${count.index + 1}-${local.env_suffix}"
    Type = "Private"
    Tier = "Database"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}-${local.env_suffix}"
  })
}

resource "aws_nat_gateway" "healthcare" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}-${local.env_suffix}"
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

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-rt-${local.env_suffix}"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.healthcare.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.healthcare[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}-${local.env_suffix}"
  })
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.healthcare.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-database-rt-${local.env_suffix}"
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

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for Web Tier
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-web-${local.env_suffix}-"
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

  tags = merge(local.common_tags, {
    Name = "${var.environment}-web-sg-${local.env_suffix}"
    Tier = "Web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Tier
resource "aws_security_group" "application" {
  name_prefix = "${var.environment}-app-${local.env_suffix}-"
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

  tags = merge(local.common_tags, {
    Name = "${var.environment}-application-sg-${local.env_suffix}"
    Tier = "Application"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Database Tier
resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-db-${local.env_suffix}-"
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

  tags = merge(local.common_tags, {
    Name = "${var.environment}-database-sg-${local.env_suffix}"
    Tier = "Database"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.environment}-rds-enhanced-monitoring-${local.env_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_healthcare" {
  name = "${var.environment}-ec2-healthcare-${local.env_suffix}"

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
  name = "${var.environment}-ec2-healthcare-${local.env_suffix}"
  role = aws_iam_role.ec2_healthcare.name

  tags = local.common_tags
}

# ============================================================================
# DATABASE
# ============================================================================

# Random password for database (no special characters for HIPAA compliance)
resource "random_password" "db_password" {
  length           = 32
  special          = false
  override_special = local.db_password_chars
}

# Store database password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.environment}-healthcare-db-password-${local.env_suffix}"
  description             = "Database password for healthcare application"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.healthcare.key_id

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "healthcare_admin"
    password = random_password.db_password.result
  })
}

# DB Subnet Group
resource "aws_db_subnet_group" "healthcare" {
  name       = "${var.environment}-healthcare-db-subnet-${local.env_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-db-subnet-${local.env_suffix}"
  })
}

# DB Parameter Group for PostgreSQL optimization
resource "aws_db_parameter_group" "healthcare" {
  family = "postgres${split(".", data.aws_rds_engine_version.postgresql.version)[0]}"
  name   = "${var.environment}-healthcare-postgres-${local.env_suffix}"

  # Healthcare-specific optimizations
  parameter {
    name  = "log_statement"
    value = "all" # Log all statements for audit compliance
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log slow queries (>1s)
  }

  parameter {
    name  = "log_connections"
    value = "1" # Log connections for audit
  }

  parameter {
    name  = "log_disconnections"
    value = "1" # Log disconnections for audit
  }

  tags = local.common_tags
}

# RDS Instance
resource "aws_db_instance" "healthcare" {
  identifier = "${var.environment}-healthcare-db-${local.env_suffix}"

  # Engine configuration - using latest version
  engine         = "postgres"
  engine_version = data.aws_rds_engine_version.postgresql.version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.healthcare.arn

  # Database configuration
  db_name  = "healthcare"
  username = "healthcare_admin"
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.healthcare.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false

  # Backup configuration - HIPAA compliant
  backup_retention_period  = var.db_backup_retention
  backup_window            = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"
  delete_automated_backups = false

  # Performance and monitoring
  parameter_group_name                  = aws_db_parameter_group.healthcare.name
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.healthcare.arn
  performance_insights_retention_period = 7

  # Security configuration
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.environment}-healthcare-db-final-${local.env_suffix}"

  # Enable CloudWatch logs exports
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-database-${local.env_suffix}"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
      final_snapshot_identifier
    ]
  }
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# Random suffixes for S3 buckets
resource "random_string" "bucket_suffix" {
  length  = 16
  special = false
  upper   = false
}

# Primary S3 Bucket for Healthcare Data
resource "aws_s3_bucket" "healthcare_data" {
  bucket = "${var.environment}-healthcare-data-${random_string.bucket_suffix.result}-${local.env_suffix}"

  tags = merge(local.common_tags, {
    Name       = "${var.environment}-healthcare-data-${local.env_suffix}"
    DataClass  = "PHI"
    Compliance = "HIPAA"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "healthcare_data_versioning" {
  bucket = aws_s3_bucket.healthcare_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "healthcare_data_encryption" {
  bucket = aws_s3_bucket.healthcare_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.healthcare.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "healthcare_data_pab" {
  bucket = aws_s3_bucket.healthcare_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "healthcare_data_lifecycle" {
  bucket = aws_s3_bucket.healthcare_data.id

  rule {
    id     = "healthcare_data_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 2555 # 7 years for HIPAA retention
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 2555 # 7 years retention
    }
  }
}

# Audit Trail S3 Bucket
resource "aws_s3_bucket" "audit_trail" {
  bucket = "${var.environment}-healthcare-audit-${random_string.bucket_suffix.result}-${local.env_suffix}"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-audit-trail-${local.env_suffix}"
  })
}

# Audit Trail S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_trail_encryption" {
  bucket = aws_s3_bucket.audit_trail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.healthcare.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Audit Trail S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "audit_trail_versioning" {
  bucket = aws_s3_bucket.audit_trail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Audit Trail S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "audit_trail_pab" {
  bucket = aws_s3_bucket.audit_trail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "audit_trail_policy" {
  bucket     = aws_s3_bucket.audit_trail.id
  depends_on = [aws_s3_bucket_public_access_block.audit_trail_pab]

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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-healthcare-audit-${local.env_suffix}"
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
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-healthcare-audit-${local.env_suffix}"
          }
        }
      }
    ]
  })
}

# ============================================================================
# CLOUDFRONT DISTRIBUTION
# ============================================================================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.environment} healthcare S3 bucket"
}

# Update S3 bucket policy to allow OAI access
resource "aws_s3_bucket_policy" "healthcare_data_oai" {
  bucket = aws_s3_bucket.healthcare_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.healthcare_data.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.healthcare_data_pab]
}

# CloudFront Distribution for secure content delivery
resource "aws_cloudfront_distribution" "healthcare_cdn" {
  origin {
    domain_name = aws_s3_bucket.healthcare_data.bucket_domain_name
    origin_id   = "S3-${aws_s3_bucket.healthcare_data.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.healthcare_data.id}"
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
    Name = "${var.environment}-healthcare-cdn-${local.env_suffix}"
  })

  depends_on = [
    aws_s3_bucket_policy.healthcare_data_oai
  ]
}

# ============================================================================
# CLOUDWATCH AND MONITORING
# ============================================================================

# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.environment}-healthcare-${local.env_suffix}"
  retention_in_days = 2557 # 7 years for HIPAA compliance
  kms_key_id        = aws_kms_key.healthcare.arn

  tags = local.common_tags
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.environment}-flow-logs-${local.env_suffix}"
  retention_in_days = 2557 # 7 years for HIPAA
  kms_key_id        = aws_kms_key.healthcare.arn

  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-flow-log-${local.env_suffix}"

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
  name = "${var.environment}-flow-log-policy-${local.env_suffix}"
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
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.healthcare.arn
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "healthcare" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.healthcare.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc-flow-logs-${local.env_suffix}"
  })

  depends_on = [aws_iam_role_policy.flow_log]
}

# SNS Topic for Compliance Alerts
resource "aws_sns_topic" "compliance_alerts" {
  name              = "${var.environment}-healthcare-compliance-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.healthcare.id

  tags = local.common_tags
}

# ============================================================================
# CLOUDTRAIL AUDIT LOGGING
# ============================================================================

# CloudTrail for audit logging
resource "aws_cloudtrail" "healthcare_audit" {
  name           = "${var.environment}-healthcare-audit-${local.env_suffix}"
  s3_bucket_name = aws_s3_bucket.audit_trail.id
  s3_key_prefix  = "audit-logs"

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.healthcare_data.arn}/*"]
    }
  }

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.healthcare.arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcare-audit-trail-${local.env_suffix}"
  })

  depends_on = [
    aws_s3_bucket.audit_trail,
    aws_s3_bucket_policy.audit_trail_policy
  ]
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.healthcare.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.healthcare.cidr_block
}

# Subnet Outputs
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

# Security Group Outputs
output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "application_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.application.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

# Database Outputs
output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.healthcare.identifier
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.healthcare.endpoint
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.healthcare.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.healthcare.db_name
}

# S3 Outputs
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.healthcare_data.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.healthcare_data.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.healthcare_data.bucket_domain_name
}

# KMS Outputs
output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.healthcare.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.healthcare.arn
}

# CloudFront Output
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.healthcare_cdn.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.healthcare_cdn.domain_name
}

# CloudTrail Outputs
output "cloudtrail_trail_name" {
  description = "CloudTrail trail name"
  value       = aws_cloudtrail.healthcare_audit.name
}

output "audit_trail_bucket_id" {
  description = "S3 bucket for CloudTrail audit logs"
  value       = aws_s3_bucket.audit_trail.id
}

output "cloudtrail_trail_arn" {
  description = "CloudTrail trail ARN"
  value       = aws_cloudtrail.healthcare_audit.arn
}

# Environment Output
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}

output "deployment_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = var.availability_zones
}