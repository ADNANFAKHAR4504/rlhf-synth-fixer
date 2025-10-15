# =============================================================================
# HIPAA-Compliant Healthcare Infrastructure with CloudTrail Auditing
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Section
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "application" {
  description = "Application name"
  type        = string
  default     = "healthcare-system"
}

variable "owner" {
  description = "Team or individual responsible for the infrastructure"
  type        = string
  default     = "healthcare-ops"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zone_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2

  validation {
    condition     = var.availability_zone_count >= 2 && var.availability_zone_count <= 4
    error_message = "Availability zone count must be between 2 and 4."
  }
}

variable "bastion_cidr" {
  description = "CIDR block for bastion host SSH access"
  type        = string
  default     = "10.0.0.0/16"
}

variable "log_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 365

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention period."
  }
}

variable "s3_log_transition_days" {
  description = "Days before transitioning logs to Glacier"
  type        = number
  default     = 90
}

variable "s3_log_expiration_days" {
  description = "Days before expiring logs"
  type        = number
  default     = 365
}

variable "notification_email" {
  description = "Email address for security and compliance notifications"
  type        = string
  default     = "healthcare-security@example.com"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Notification email must be a valid email address."
  }
}

variable "enable_cloudtrail_cloudwatch" {
  description = "Enable CloudWatch Logs streaming for CloudTrail"
  type        = bool
  default     = true
}

variable "compliance_check_schedule" {
  description = "Schedule expression for compliance checks (e.g., rate(1 hour))"
  type        = string
  default     = "rate(1 hour)"
}

variable "environment_suffix" {
  description = "Random suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "enable_multi_region_trail" {
  description = "Enable multi-region CloudTrail"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# -----------------------------------------------------------------------------
# Random Resources for Unique Naming
# -----------------------------------------------------------------------------

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  common_tags = {
    Environment = var.environment
    Application = var.application
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Compliance  = "HIPAA"
  }

  # Get first N availability zones
  azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zone_count)
}

# -----------------------------------------------------------------------------
# KMS Encryption Key
# -----------------------------------------------------------------------------

resource "aws_kms_key" "main" {
  description             = "KMS key for CloudTrail and S3 encryption"
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
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
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
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    { Name = "cloudtrail-encryption-key" }
  )
}

resource "aws_kms_alias" "main" {
  name          = "alias/cloudtrail-encryption-key-${local.env_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# -----------------------------------------------------------------------------
# VPC and Networking
# -----------------------------------------------------------------------------

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-vpc-${local.env_suffix}" }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.availability_zone_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-public-subnet-${count.index + 1}-${local.env_suffix}"
      Tier = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.availability_zone_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-private-subnet-${count.index + 1}-${local.env_suffix}"
      Tier = "Private"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-igw-${local.env_suffix}" }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.availability_zone_count
  domain = "vpc"

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-nat-eip-${count.index + 1}-${local.env_suffix}" }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.availability_zone_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-nat-${count.index + 1}-${local.env_suffix}" }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-public-rt-${local.env_suffix}" }
  )
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = var.availability_zone_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = var.availability_zone_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-private-rt-${count.index + 1}-${local.env_suffix}" }
  )
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = var.availability_zone_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# -----------------------------------------------------------------------------
# VPC Flow Logs
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.application}-${local.env_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.application}-vpc-flow-logs-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.application}-vpc-flow-logs-policy-${local.env_suffix}"
  role  = aws_iam_role.vpc_flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "main" {
  count                = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn         = aws_iam_role.vpc_flow_logs[0].arn
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  log_destination_type = "cloud-watch-logs"

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-vpc-flow-log-${local.env_suffix}" }
  )
}

# -----------------------------------------------------------------------------
# Security Groups - Three-Tier Architecture
# -----------------------------------------------------------------------------

# Web Tier Security Group
resource "aws_security_group" "web" {
  name        = "${var.application}-web-sg-${local.env_suffix}"
  description = "Security group for web tier - allows HTTPS and HTTP from internet"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-web-sg"
      Tier = "Web"
    }
  )
}

resource "aws_security_group_rule" "web_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS from internet"
  security_group_id = aws_security_group.web.id
}

resource "aws_security_group_rule" "web_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTP from internet for redirect to HTTPS"
  security_group_id = aws_security_group.web.id
}

resource "aws_security_group_rule" "web_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.web.id
}

# Application Tier Security Group
resource "aws_security_group" "app" {
  name        = "${var.application}-app-sg-${local.env_suffix}"
  description = "Security group for application tier - allows traffic only from web tier"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-app-sg"
      Tier = "Application"
    }
  )
}

resource "aws_security_group_rule" "app_ingress_from_web" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  description              = "Allow traffic from web tier"
  security_group_id        = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.app.id
}

# Database Tier Security Group
resource "aws_security_group" "database" {
  name        = "${var.application}-db-sg-${local.env_suffix}"
  description = "Security group for database tier - allows traffic only from app tier"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-db-sg"
      Tier = "Database"
    }
  )
}

resource "aws_security_group_rule" "db_ingress_mysql" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow MySQL from application tier"
  security_group_id        = aws_security_group.database.id
}

resource "aws_security_group_rule" "db_ingress_postgres" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow PostgreSQL from application tier"
  security_group_id        = aws_security_group.database.id
}

resource "aws_security_group_rule" "db_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.database.id
}

# Bastion Security Group
resource "aws_security_group" "bastion" {
  name        = "${var.application}-bastion-sg-${local.env_suffix}"
  description = "Security group for bastion host - restricted SSH access"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.application}-bastion-sg"
      Tier = "Management"
    }
  )
}

resource "aws_security_group_rule" "bastion_ingress_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [var.bastion_cidr]
  description       = "Allow SSH from designated CIDR"
  security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "bastion_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.bastion.id
}

# -----------------------------------------------------------------------------
# S3 Bucket for CloudTrail Logs
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.application}-cloudtrail-logs-${local.env_suffix}"

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-cloudtrail-logs" }
  )
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = var.s3_log_transition_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.s3_log_expiration_days
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail_logs.arn,
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.application}-access-logs-${local.env_suffix}"

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-access-logs" }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "cloudtrail-bucket-logs/"
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for CloudTrail
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "cloudtrail" {
  count             = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name              = "/aws/cloudtrail/${var.application}-${local.env_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  count = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name  = "${var.application}-cloudtrail-cloudwatch-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  count = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name  = "${var.application}-cloudtrail-cloudwatch-policy-${local.env_suffix}"
  role  = aws_iam_role.cloudtrail_cloudwatch[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudTrail
# -----------------------------------------------------------------------------

resource "aws_cloudtrail" "main" {
  name                          = "${var.application}-trail-${local.env_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = var.enable_multi_region_trail
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  cloud_watch_logs_group_arn = var.enable_cloudtrail_cloudwatch ? "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*" : null
  cloud_watch_logs_role_arn  = var.enable_cloudtrail_cloudwatch ? aws_iam_role.cloudtrail_cloudwatch[0].arn : null

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-cloudtrail" }
  )

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs
  ]
}

# -----------------------------------------------------------------------------
# SNS Topic for Notifications
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "security_alerts" {
  name              = "${var.application}-security-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(
    local.common_tags,
    { Name = "${var.application}-security-alerts" }
  )
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# -----------------------------------------------------------------------------
# CloudWatch Metric Filters and Alarms
# -----------------------------------------------------------------------------

# Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "unauthorized-api-calls-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-unauthorized-api-calls-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when unauthorized API calls are detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# Root Account Usage
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "root-account-usage-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-root-account-usage-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when root account is used"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# Security Group Changes
resource "aws_cloudwatch_log_metric_filter" "security_group_changes" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "security-group-changes-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }"

  metric_transformation {
    name      = "SecurityGroupChanges"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "security_group_changes" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-security-group-changes-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "SecurityGroupChanges"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when security group changes are detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# Network ACL Changes
resource "aws_cloudwatch_log_metric_filter" "network_acl_changes" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "network-acl-changes-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.eventName = CreateNetworkAcl) || ($.eventName = CreateNetworkAclEntry) || ($.eventName = DeleteNetworkAcl) || ($.eventName = DeleteNetworkAclEntry) || ($.eventName = ReplaceNetworkAclEntry) || ($.eventName = ReplaceNetworkAclAssociation) }"

  metric_transformation {
    name      = "NetworkAclChanges"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "network_acl_changes" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-network-acl-changes-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "NetworkAclChanges"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when network ACL changes are detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# IAM Policy Changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "iam-policy-changes-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-iam-policy-changes-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when IAM policy changes are detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# Failed Console Login Attempts
resource "aws_cloudwatch_log_metric_filter" "failed_console_logins" {
  count          = var.enable_cloudtrail_cloudwatch ? 1 : 0
  name           = "failed-console-logins-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }"

  metric_transformation {
    name      = "FailedConsoleLogins"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_console_logins" {
  count               = var.enable_cloudtrail_cloudwatch ? 1 : 0
  alarm_name          = "${var.application}-failed-console-logins-${local.env_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedConsoleLogins"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alarm when more than 5 failed console logins in 5 minutes"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Lambda Function for Compliance Checks
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "compliance_lambda" {
  name              = "/aws/lambda/${var.application}-compliance-check-${local.env_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "compliance_lambda" {
  name = "${var.application}-compliance-lambda-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "compliance_lambda" {
  name = "${var.application}-compliance-lambda-policy-${local.env_suffix}"
  role = aws_iam_role.compliance_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.compliance_lambda.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "ec2:DescribeFlowLogs"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketEncryption",
          "s3:GetBucketVersioning",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "compliance_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/compliance_check.py"
  output_path = "${path.module}/lambda/compliance_check.zip"
}

resource "aws_lambda_function" "compliance_check" {
  filename         = data.archive_file.compliance_lambda.output_path
  function_name    = "${var.application}-compliance-check-${local.env_suffix}"
  role             = aws_iam_role.compliance_lambda.arn
  handler          = "compliance_check.lambda_handler"
  source_code_hash = data.archive_file.compliance_lambda.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      SNS_TOPIC_ARN       = aws_sns_topic.security_alerts.arn
      CLOUDTRAIL_NAME     = aws_cloudtrail.main.name
      VPC_ID              = aws_vpc.main.id
      ENVIRONMENT         = var.environment
      APPLICATION         = var.application
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.compliance_lambda,
    aws_cloudwatch_log_group.compliance_lambda
  ]
}

# -----------------------------------------------------------------------------
# EventBridge Rules for Automation
# -----------------------------------------------------------------------------

# Scheduled Compliance Checks
resource "aws_cloudwatch_event_rule" "compliance_check_schedule" {
  name                = "${var.application}-compliance-check-schedule-${local.env_suffix}"
  description         = "Trigger compliance checks on a schedule"
  schedule_expression = var.compliance_check_schedule

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "compliance_check_schedule" {
  rule      = aws_cloudwatch_event_rule.compliance_check_schedule.name
  target_id = "ComplianceCheckLambda"
  arn       = aws_lambda_function.compliance_check.arn
}

resource "aws_lambda_permission" "compliance_check_schedule" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_check.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_check_schedule.arn
}

# Real-time Security Group Change Detection
resource "aws_cloudwatch_event_rule" "security_group_changes_realtime" {
  name        = "${var.application}-sg-changes-realtime-${local.env_suffix}"
  description = "Detect security group changes in real-time"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName = [
        "AuthorizeSecurityGroupIngress",
        "AuthorizeSecurityGroupEgress",
        "RevokeSecurityGroupIngress",
        "RevokeSecurityGroupEgress",
        "CreateSecurityGroup",
        "DeleteSecurityGroup"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "security_group_changes_realtime" {
  rule      = aws_cloudwatch_event_rule.security_group_changes_realtime.name
  target_id = "SecurityAlertsTopic"
  arn       = aws_sns_topic.security_alerts.arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      groupId   = "$.detail.requestParameters.groupId"
      time      = "$.time"
    }
    input_template = "\"Security Group Change Detected: <eventName> by <userName> on <groupId> at <time>\""
  }
}

# Root Account Login Detection
resource "aws_cloudwatch_event_rule" "root_login_realtime" {
  name        = "${var.application}-root-login-realtime-${local.env_suffix}"
  description = "Detect root account login in real-time"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      userIdentity = {
        type = ["Root"]
      }
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "root_login_realtime" {
  rule      = aws_cloudwatch_event_rule.root_login_realtime.name
  target_id = "SecurityAlertsTopic"
  arn       = aws_sns_topic.security_alerts.arn

  input_transformer {
    input_paths = {
      sourceIP = "$.detail.sourceIPAddress"
      time     = "$.time"
    }
    input_template = "\"CRITICAL: Root account login detected from IP <sourceIP> at <time>\""
  }
}

# IAM Policy Changes Detection
resource "aws_cloudwatch_event_rule" "iam_changes_realtime" {
  name        = "${var.application}-iam-changes-realtime-${local.env_suffix}"
  description = "Detect IAM policy changes in real-time"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "PutUserPolicy",
        "PutRolePolicy",
        "PutGroupPolicy",
        "CreatePolicy",
        "DeletePolicy",
        "AttachUserPolicy",
        "AttachRolePolicy",
        "AttachGroupPolicy",
        "DetachUserPolicy",
        "DetachRolePolicy",
        "DetachGroupPolicy"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "iam_changes_realtime" {
  rule      = aws_cloudwatch_event_rule.iam_changes_realtime.name
  target_id = "SecurityAlertsTopic"
  arn       = aws_sns_topic.security_alerts.arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      time      = "$.time"
    }
    input_template = "\"IAM Policy Change Detected: <eventName> by <userName> at <time>\""
  }
}

# SNS Topic Policy for EventBridge
resource "aws_sns_topic_policy" "security_alerts_eventbridge" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "web_security_group_id" {
  description = "Security group ID for web tier"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "Security group ID for application tier"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Security group ID for database tier"
  value       = aws_security_group.database.id
}

output "bastion_security_group_id" {
  description = "Security group ID for bastion host"
  value       = aws_security_group.bastion.id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.main.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "compliance_lambda_function_name" {
  description = "Name of the compliance check Lambda function"
  value       = aws_lambda_function.compliance_check.function_name
}

output "compliance_lambda_function_arn" {
  description = "ARN of the compliance check Lambda function"
  value       = aws_lambda_function.compliance_check.arn
}

output "vpc_flow_log_group_name" {
  description = "CloudWatch log group name for VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_logs[0].name : null
}

output "cloudtrail_log_group_name" {
  description = "CloudWatch log group name for CloudTrail"
  value       = var.enable_cloudtrail_cloudwatch ? aws_cloudwatch_log_group.cloudtrail[0].name : null
}

output "environment_suffix" {
  description = "The random suffix used for resource naming"
  value       = local.env_suffix
}
