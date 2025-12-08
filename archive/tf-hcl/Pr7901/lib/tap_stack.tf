# tap_stack.tf - Telemedicine Appointment & Prescription Stack
# Multi-environment consistent topology for HIPAA-compliant telemedicine platform

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {}
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "telemedicine-platform"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "healthcare-tech"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "num_availability_zones" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
}

# Cognito Variables
variable "user_pool_id" {
  description = "Cognito User Pool ID for authentication"
  type        = string
}

# API Gateway Variables
variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "telemedicine-api"
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}

variable "throttle_settings" {
  description = "API Gateway throttle settings"
  type = object({
    burst_limit = number
    rate_limit  = number
  })
  default = {
    burst_limit = 500
    rate_limit  = 100
  }
}

variable "cors_configuration" {
  description = "CORS configuration for API Gateway"
  type = object({
    allow_origins     = list(string)
    allow_methods     = list(string)
    allow_headers     = list(string)
    expose_headers    = list(string)
    max_age           = number
    allow_credentials = bool
  })
  default = {
    allow_origins     = ["https://*.telemedicine.example.com"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    expose_headers    = ["x-request-id"]
    max_age           = 300
    allow_credentials = true
  }
}

# DynamoDB Variables
variable "appointments_table" {
  description = "Name of appointments DynamoDB table"
  type        = string
  default     = "appointments"
}

variable "sessions_table" {
  description = "Name of active sessions DynamoDB table"
  type        = string
  default     = "active_sessions"
}

variable "prescriptions_table" {
  description = "Name of prescriptions DynamoDB table"
  type        = string
  default     = "prescriptions"
}

variable "policies_table" {
  description = "Name of insurance policies DynamoDB table"
  type        = string
  default     = "insurance_policies"
}

variable "profiles_table" {
  description = "Name of patient profiles DynamoDB table"
  type        = string
  default     = "patient_profiles"
}

variable "compliance_table" {
  description = "Name of compliance rules DynamoDB table"
  type        = string
  default     = "compliance_rules"
}

variable "documents_table" {
  description = "Name of documents catalog DynamoDB table"
  type        = string
  default     = "documents_catalog"
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "rcu" {
  description = "Read capacity units for DynamoDB (provisioned mode)"
  type        = number
  default     = 5
}

variable "wcu" {
  description = "Write capacity units for DynamoDB (provisioned mode)"
  type        = number
  default     = 5
}

variable "ttl_enabled" {
  description = "Enable TTL for DynamoDB tables"
  type        = bool
  default     = true
}

variable "ttl_attribute" {
  description = "TTL attribute name for DynamoDB"
  type        = string
  default     = "ttl"
}

# Lambda Variables
variable "request_handler_memory" {
  description = "Memory for request handler Lambda"
  type        = number
  default     = 256
}

variable "scheduler_memory" {
  description = "Memory for scheduler Lambda"
  type        = number
  default     = 512
}

variable "notifier_memory" {
  description = "Memory for notifier Lambda"
  type        = number
  default     = 256
}

variable "billing_memory" {
  description = "Memory for billing Lambda"
  type        = number
  default     = 256
}

variable "session_memory" {
  description = "Memory for session Lambda"
  type        = number
  default     = 256
}

variable "prescription_memory" {
  description = "Memory for prescription Lambda"
  type        = number
  default     = 512
}

variable "approval_memory" {
  description = "Memory for approval Lambda"
  type        = number
  default     = 512
}

variable "pharmacy_memory" {
  description = "Memory for pharmacy Lambda"
  type        = number
  default     = 256
}

variable "compliance_memory" {
  description = "Memory for compliance Lambda"
  type        = number
  default     = 512
}

variable "reminder_memory" {
  description = "Memory for reminder Lambda"
  type        = number
  default     = 256
}

variable "analytics_memory" {
  description = "Memory for analytics Lambda"
  type        = number
  default     = 512
}

variable "document_memory" {
  description = "Memory for document Lambda"
  type        = number
  default     = 512
}

variable "timeout_s" {
  description = "Default Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

# Redis Variables
variable "node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "auth_token_enabled" {
  description = "Enable auth token for Redis"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable transit encryption for Redis"
  type        = bool
  default     = true
}

# Aurora Variables
variable "cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
  default     = "tap-aurora-cluster"
}

variable "database_name" {
  description = "Aurora database name"
  type        = string
  default     = "telemedicine"
}

variable "master_username" {
  description = "Aurora master username"
  type        = string
  default     = "dbadmin"
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "min_capacity" {
  description = "Aurora serverless minimum capacity"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Aurora serverless maximum capacity"
  type        = number
  default     = 1
}

variable "backup_retention_days" {
  description = "Aurora backup retention days"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection for Aurora"
  type        = bool
  default     = true
}

# SNS Variables
variable "scheduled_topic" {
  description = "SNS topic for appointment scheduled events"
  type        = string
  default     = "appointment-scheduled"
}

variable "session_topic" {
  description = "SNS topic for session events"
  type        = string
  default     = "session-events"
}

variable "prescription_approved_topic" {
  description = "SNS topic for approved prescriptions"
  type        = string
  default     = "prescription-approved"
}

variable "prescription_review_topic" {
  description = "SNS topic for prescription review"
  type        = string
  default     = "prescription-review"
}

variable "compliance_topic" {
  description = "SNS topic for compliance alerts"
  type        = string
  default     = "compliance-alerts"
}

variable "reminders_topic" {
  description = "SNS topic for appointment reminders"
  type        = string
  default     = "appointment-reminders"
}

# SQS Variables
variable "patient_notifications_queue" {
  description = "SQS queue for patient notifications"
  type        = string
  default     = "patient-notifications"
}

variable "provider_notifications_queue" {
  description = "SQS queue for provider notifications"
  type        = string
  default     = "provider-notifications"
}

variable "billing_queue" {
  description = "SQS queue for billing"
  type        = string
  default     = "billing"
}

variable "pharmacist_queue" {
  description = "SQS queue for pharmacist review"
  type        = string
  default     = "pharmacist-review"
}

variable "pharmacy_queue" {
  description = "SQS queue for pharmacy fulfillment"
  type        = string
  default     = "pharmacy-fulfillment"
}

variable "patient_prescriptions_queue" {
  description = "SQS queue for patient prescription notifications"
  type        = string
  default     = "patient-prescriptions"
}

variable "visibility_timeout" {
  description = "SQS message visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "retention_period" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 1209600
}

# EventBridge Variables
variable "compliance_schedule_expression" {
  description = "EventBridge schedule for compliance checks"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

variable "reminders_schedule_expression" {
  description = "EventBridge schedule for appointment reminders"
  type        = string
  default     = "rate(1 hour)"
}

# S3 Variables
variable "audit_logs_bucket" {
  description = "S3 bucket for HIPAA audit logs"
  type        = string
  default     = "hipaa-audit-logs"
}

variable "documents_bucket" {
  description = "S3 bucket for medical documents"
  type        = string
  default     = "medical-documents"
}

variable "lifecycle_archive_days" {
  description = "Days before archiving to Glacier"
  type        = number
  default     = 90
}

# Step Functions Variables
variable "prescription_workflow_name" {
  description = "Name of prescription approval workflow"
  type        = string
  default     = "prescription-approval"
}

variable "timeout_seconds" {
  description = "Step Functions workflow timeout"
  type        = number
  default     = 3600
}

# KMS Variables
variable "phi_encryption_key_alias" {
  description = "KMS key alias for PHI encryption"
  type        = string
  default     = "phi-encryption"
}

# CloudWatch Variables
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common naming prefix
  prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  # Environment-specific capacity mappings
  env_config = {
    dev = {
      api_throttle_burst         = 100
      api_throttle_rate          = 50
      lambda_reserved_concurrent = -1
      redis_nodes                = 1
      aurora_min_capacity        = 0.5
      aurora_max_capacity        = 1
      sqs_retention_days         = 4
      alarm_evaluation_periods   = 1
    }
    staging = {
      api_throttle_burst         = 500
      api_throttle_rate          = 100
      lambda_reserved_concurrent = 50
      redis_nodes                = 2
      aurora_min_capacity        = 1
      aurora_max_capacity        = 2
      sqs_retention_days         = 7
      alarm_evaluation_periods   = 2
    }
    prod = {
      api_throttle_burst         = 2000
      api_throttle_rate          = 1000
      lambda_reserved_concurrent = 100
      redis_nodes                = 3
      aurora_min_capacity        = 2
      aurora_max_capacity        = 8
      sqs_retention_days         = 14
      alarm_evaluation_periods   = 3
    }
  }

  # Common tags
  tags = merge(
    var.common_tags,
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Compliance  = "HIPAA"
    }
  )

  # Lambda environment variables (common across functions)
  lambda_env_vars = {
    ENVIRONMENT = var.env
    KMS_KEY_ID  = aws_kms_key.phi_encryption.id
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_cognito_user_pools" "existing" {
  name = var.user_pool_id
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ============================================================================
# NETWORKING RESOURCES
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.num_availability_zones

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.num_availability_zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.tags, {
    Name = "${local.prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.num_availability_zones

  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.num_availability_zones

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-nat-${count.index + 1}"
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

  tags = merge(local.tags, {
    Name = "${local.prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = var.num_availability_zones

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.num_availability_zones

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.num_availability_zones

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "lambda_vpc" {
  name_prefix = "${local.prefix}-lambda-vpc-"
  description = "Security group for Lambda functions in VPC"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-lambda-vpc-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.prefix}-redis-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_vpc.id]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-sg"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${local.prefix}-aurora-"
  description = "Security group for Aurora PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_vpc.id]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-sg"
  })
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"

  tags = merge(local.tags, {
    Name = "${local.prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(local.tags, {
    Name = "${local.prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda_vpc.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda_vpc.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda_vpc.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda_vpc.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-stepfunctions-endpoint"
  })
}

# VPC Endpoint Route Table Associations
resource "aws_vpc_endpoint_route_table_association" "dynamodb" {
  count = var.num_availability_zones

  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
  route_table_id  = aws_route_table.private[count.index].id
}

resource "aws_vpc_endpoint_route_table_association" "s3" {
  count = var.num_availability_zones

  vpc_endpoint_id = aws_vpc_endpoint.s3.id
  route_table_id  = aws_route_table.private[count.index].id
}

# ============================================================================
# KMS ENCRYPTION
# ============================================================================

# PHI Encryption Key
resource "aws_kms_key" "phi_encryption" {
  description             = "KMS key for PHI data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.phi_encryption_key_alias}"
  })
}

resource "aws_kms_alias" "phi_encryption" {
  name          = "alias/${local.prefix}-${var.phi_encryption_key_alias}"
  target_key_id = aws_kms_key.phi_encryption.key_id
}

# CloudWatch Logs Encryption Key
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption"
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
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" : "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-cloudwatch-logs"
  })
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/${local.prefix}-cloudwatch-logs"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# ============================================================================
# SECRETS MANAGER
# ============================================================================

# Aurora Database Password
resource "random_password" "aurora_master" {
  length           = 32
  special          = true
  override_special = "!#$%^&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name_prefix             = "${local.prefix}-aurora-master-"
  recovery_window_in_days = 30

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-master-password"
  })
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora_master.result
  })
}

# Redis Auth Token
resource "random_password" "redis_auth" {
  length           = 32
  special          = false
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix             = "${local.prefix}-redis-auth-"
  recovery_window_in_days = 30

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-auth-token"
  })
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# HIPAA Audit Logs Bucket
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${local.prefix}-${var.audit_logs_bucket}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.tags, {
    Name       = "${local.prefix}-${var.audit_logs_bucket}"
    Compliance = "HIPAA-Audit"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.phi_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"
    filter {}

    transition {
      days          = var.lifecycle_archive_days
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years for HIPAA compliance
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Medical Documents Bucket
resource "aws_s3_bucket" "documents" {
  bucket = "${local.prefix}-${var.documents_bucket}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.tags, {
    Name       = "${local.prefix}-${var.documents_bucket}"
    Compliance = "PHI-Storage"
  })
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.phi_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# DYNAMODB TABLES
# ============================================================================

# Appointments Table
resource "aws_dynamodb_table" "appointments" {
  name           = "${local.prefix}-${var.appointments_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "appointment_id"
  range_key      = "patient_id"

  attribute {
    name = "appointment_id"
    type = "S"
  }

  attribute {
    name = "patient_id"
    type = "S"
  }

  attribute {
    name = "provider_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "provider-index"
    hash_key        = "provider_id"
    range_key       = "status"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "patient-status-index"
    hash_key        = "patient_id"
    range_key       = "status"
    projection_type = "ALL"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.appointments_table}"
  })
}

# Active Sessions Table
resource "aws_dynamodb_table" "sessions" {
  name           = "${local.prefix}-${var.sessions_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.sessions_table}"
  })
}

# Prescriptions Table
resource "aws_dynamodb_table" "prescriptions" {
  name           = "${local.prefix}-${var.prescriptions_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "prescription_id"

  attribute {
    name = "prescription_id"
    type = "S"
  }

  attribute {
    name = "patient_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "patient-prescriptions-index"
    hash_key        = "patient_id"
    range_key       = "status"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.prescriptions_table}"
  })
}

# Insurance Policies Table
resource "aws_dynamodb_table" "policies" {
  name           = "${local.prefix}-${var.policies_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "patient_id"

  attribute {
    name = "patient_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.policies_table}"
  })
}

# Patient Profiles Table
resource "aws_dynamodb_table" "profiles" {
  name           = "${local.prefix}-${var.profiles_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "patient_id"

  attribute {
    name = "patient_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.profiles_table}"
  })
}

# Compliance Rules Table
resource "aws_dynamodb_table" "compliance" {
  name           = "${local.prefix}-${var.compliance_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "rule_id"

  attribute {
    name = "rule_id"
    type = "S"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.compliance_table}"
  })
}

# Documents Catalog Table
resource "aws_dynamodb_table" "documents" {
  name           = "${local.prefix}-${var.documents_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  hash_key       = "document_id"

  attribute {
    name = "document_id"
    type = "S"
  }

  attribute {
    name = "patient_id"
    type = "S"
  }

  global_secondary_index {
    name            = "patient-documents-index"
    hash_key        = "patient_id"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.phi_encryption.arn
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.documents_table}"
  })
}

# ============================================================================
# ELASTICACHE REDIS
# ============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.prefix}-redis"
  description                = "Redis cluster for provider availability calendars"
  engine                     = "redis"
  node_type                  = var.node_type
  num_cache_clusters         = local.env_config[var.env].redis_nodes
  port                       = 6379
  parameter_group_name       = "default.redis7"
  engine_version             = var.engine_version
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.auth_token_enabled ? random_password.redis_auth.result : null
  automatic_failover_enabled = local.env_config[var.env].redis_nodes > 1
  snapshot_retention_limit   = var.env == "prod" ? 5 : 1
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "sun:05:00-sun:07:00"
  notification_topic_arn     = aws_sns_topic.compliance_alerts.arn

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis"
  })
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${local.prefix}-redis/slow-log"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-slow-log"
  })
}

# ============================================================================
# AURORA POSTGRESQL
# ============================================================================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier                  = "${local.prefix}-${var.cluster_identifier}"
  engine                              = "aurora-postgresql"
  engine_mode                         = "provisioned"
  engine_version                      = "15.14"
  database_name                       = var.database_name
  master_username                     = var.master_username
  master_password                     = random_password.aurora_master.result
  db_subnet_group_name                = aws_db_subnet_group.aurora.name
  vpc_security_group_ids              = [aws_security_group.aurora.id]
  backup_retention_period             = var.backup_retention_days
  preferred_backup_window             = "03:00-04:00"
  preferred_maintenance_window        = "sun:04:00-sun:05:00"
  storage_encrypted                   = true
  kms_key_id                          = aws_kms_key.phi_encryption.arn
  enabled_cloudwatch_logs_exports     = ["postgresql"]
  deletion_protection                 = var.deletion_protection
  skip_final_snapshot                 = var.env == "dev"
  final_snapshot_identifier           = var.env != "dev" ? "${local.prefix}-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  iam_database_authentication_enabled = true

  serverlessv2_scaling_configuration {
    min_capacity = local.env_config[var.env].aurora_min_capacity
    max_capacity = local.env_config[var.env].aurora_max_capacity
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.env == "prod" ? 2 : 1

  identifier                   = "${local.prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.aurora.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.aurora.engine
  engine_version               = aws_rds_cluster.aurora.engine_version
  performance_insights_enabled = var.env == "prod"
  monitoring_interval          = var.env == "prod" ? 60 : 0
  monitoring_role_arn          = var.env == "prod" ? aws_iam_role.rds_monitoring.arn : null

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-instance-${count.index + 1}"
  })
}

# RDS Enhanced Monitoring Role (prod only)
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.prefix}-rds-monitoring"

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

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# SNS TOPICS
# ============================================================================

# Appointment Scheduled Topic
resource "aws_sns_topic" "appointment_scheduled" {
  name              = "${local.prefix}-${var.scheduled_topic}"
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.scheduled_topic}"
  })
}

# Session Events Topic  
resource "aws_sns_topic" "session_events" {
  name              = "${local.prefix}-${var.session_topic}"
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.session_topic}"
  })
}

# Prescription Approved Topic
resource "aws_sns_topic" "prescription_approved" {
  name              = "${local.prefix}-${var.prescription_approved_topic}.fifo"
  fifo_topic        = true
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.prescription_approved_topic}"
  })
}

# Prescription Review Topic
resource "aws_sns_topic" "prescription_review" {
  name              = "${local.prefix}-${var.prescription_review_topic}"
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.prescription_review_topic}"
  })
}

# Compliance Alerts Topic
resource "aws_sns_topic" "compliance_alerts" {
  name              = "${local.prefix}-${var.compliance_topic}"
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.compliance_topic}"
  })
}

# Appointment Reminders Topic
resource "aws_sns_topic" "appointment_reminders" {
  name              = "${local.prefix}-${var.reminders_topic}"
  kms_master_key_id = aws_kms_key.phi_encryption.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.reminders_topic}"
  })
}

# ============================================================================
# SQS QUEUES
# ============================================================================

# Patient Notifications Queue
resource "aws_sqs_queue" "patient_notifications" {
  name                       = "${local.prefix}-${var.patient_notifications_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id          = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.patient_notifications_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.patient_notifications_queue}"
  })
}

resource "aws_sqs_queue" "patient_notifications_dlq" {
  name                      = "${local.prefix}-${var.patient_notifications_queue}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.patient_notifications_queue}-dlq"
  })
}

# Provider Notifications Queue
resource "aws_sqs_queue" "provider_notifications" {
  name                       = "${local.prefix}-${var.provider_notifications_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id          = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.provider_notifications_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.provider_notifications_queue}"
  })
}

resource "aws_sqs_queue" "provider_notifications_dlq" {
  name                      = "${local.prefix}-${var.provider_notifications_queue}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.provider_notifications_queue}-dlq"
  })
}

# Billing Queue
resource "aws_sqs_queue" "billing" {
  name                       = "${local.prefix}-${var.billing_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id          = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.billing_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.billing_queue}"
  })
}

resource "aws_sqs_queue" "billing_dlq" {
  name                      = "${local.prefix}-${var.billing_queue}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.billing_queue}-dlq"
  })
}

# Pharmacist Review Queue
resource "aws_sqs_queue" "pharmacist_review" {
  name                       = "${local.prefix}-${var.pharmacist_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id          = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.pharmacist_review_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.pharmacist_queue}"
  })
}

resource "aws_sqs_queue" "pharmacist_review_dlq" {
  name                      = "${local.prefix}-${var.pharmacist_queue}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.pharmacist_queue}-dlq"
  })
}

# Pharmacy Fulfillment Queue (FIFO)
resource "aws_sqs_queue" "pharmacy_fulfillment" {
  name                        = "${local.prefix}-${var.pharmacy_queue}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = var.visibility_timeout
  message_retention_seconds   = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id           = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.pharmacy_fulfillment_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.pharmacy_queue}"
  })
}

resource "aws_sqs_queue" "pharmacy_fulfillment_dlq" {
  name                        = "${local.prefix}-${var.pharmacy_queue}-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600
  kms_master_key_id           = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.pharmacy_queue}-dlq"
  })
}

# Patient Prescriptions Queue
resource "aws_sqs_queue" "patient_prescriptions" {
  name                        = "${local.prefix}-${var.patient_prescriptions_queue}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = var.visibility_timeout
  message_retention_seconds   = local.env_config[var.env].sqs_retention_days * 86400
  kms_master_key_id           = aws_kms_key.phi_encryption.id


  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.patient_prescriptions_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.patient_prescriptions_queue}"
  })
}

resource "aws_sqs_queue" "patient_prescriptions_dlq" {
  name                        = "${local.prefix}-${var.patient_prescriptions_queue}-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600
  kms_master_key_id           = aws_kms_key.phi_encryption.id


  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.patient_prescriptions_queue}-dlq"
  })
}

# ============================================================================
# SNS SUBSCRIPTIONS
# ============================================================================

# Appointment Scheduled subscriptions
resource "aws_sns_topic_subscription" "patient_notifications" {
  topic_arn = aws_sns_topic.appointment_scheduled.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.patient_notifications.arn

  filter_policy = jsonencode({
    notification_type = ["patient"]
  })
}

resource "aws_sns_topic_subscription" "provider_notifications" {
  topic_arn = aws_sns_topic.appointment_scheduled.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.provider_notifications.arn

  filter_policy = jsonencode({
    notification_type = ["provider"]
  })
}

resource "aws_sns_topic_subscription" "billing" {
  topic_arn = aws_sns_topic.appointment_scheduled.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.billing.arn
}

# Prescription Review subscription
resource "aws_sns_topic_subscription" "pharmacist_review" {
  topic_arn = aws_sns_topic.prescription_review.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.pharmacist_review.arn
}

# Prescription Approved subscriptions
resource "aws_sns_topic_subscription" "pharmacy_fulfillment" {
  topic_arn = aws_sns_topic.prescription_approved.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.pharmacy_fulfillment.arn
}

resource "aws_sns_topic_subscription" "patient_prescriptions" {
  topic_arn = aws_sns_topic.prescription_approved.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.patient_prescriptions.arn
}

# SQS Queue Policies for SNS
resource "aws_sqs_queue_policy" "sns_access" {
  for_each = {
    patient_notifications  = aws_sqs_queue.patient_notifications.url
    provider_notifications = aws_sqs_queue.provider_notifications.url
    billing                = aws_sqs_queue.billing.url
    pharmacist_review      = aws_sqs_queue.pharmacist_review.url
    pharmacy_fulfillment   = aws_sqs_queue.pharmacy_fulfillment.url
    patient_prescriptions  = aws_sqs_queue.patient_prescriptions.url
  }

  queue_url = each.value

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = each.value
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.prefix}-lambda-execution"

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

  tags = local.tags
}

# Lambda VPC Execution Role
resource "aws_iam_role" "lambda_vpc_execution" {
  name = "${local.prefix}-lambda-vpc-execution"

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

  tags = local.tags
}

# Lambda Policies
resource "aws_iam_policy" "lambda_base" {
  name = "${local.prefix}-lambda-base-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.appointments.arn,
          "${aws_dynamodb_table.appointments.arn}/*",
          aws_dynamodb_table.sessions.arn,
          aws_dynamodb_table.prescriptions.arn,
          "${aws_dynamodb_table.prescriptions.arn}/*",
          aws_dynamodb_table.policies.arn,
          aws_dynamodb_table.profiles.arn,
          aws_dynamodb_table.compliance.arn,
          aws_dynamodb_table.documents.arn,
          "${aws_dynamodb_table.documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.appointment_scheduled.arn,
          aws_sns_topic.session_events.arn,
          aws_sns_topic.prescription_approved.arn,
          aws_sns_topic.prescription_review.arn,
          aws_sns_topic.compliance_alerts.arn,
          aws_sns_topic.appointment_reminders.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.patient_notifications.arn,
          aws_sqs_queue.provider_notifications.arn,
          aws_sqs_queue.billing.arn,
          aws_sqs_queue.pharmacist_review.arn,
          aws_sqs_queue.pharmacy_fulfillment.arn,
          aws_sqs_queue.patient_prescriptions.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*",
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.phi_encryption.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers"
        ]
        Resource = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.user_pool_id}"
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_vpc" {
  name = "${local.prefix}-lambda-vpc-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.aurora_master.arn,
          aws_secretsmanager_secret.redis_auth.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora.cluster_resource_id}/*"
      }
    ]
  })
}

resource "aws_iam_policy" "step_functions_execution" {
  name = "${local.prefix}-step-functions-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.prescription_approval.arn
      }
    ]
  })
}

# Attach policies to roles
resource "aws_iam_role_policy_attachment" "lambda_base" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_base.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_base" {
  role       = aws_iam_role.lambda_vpc_execution.name
  policy_arn = aws_iam_policy.lambda_base.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_network" {
  role       = aws_iam_role.lambda_vpc_execution.name
  policy_arn = aws_iam_policy.lambda_vpc.arn
}

resource "aws_iam_role_policy_attachment" "lambda_step_functions" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.step_functions_execution.arn
}

# Lambda Function Code Archives
data "archive_file" "lambda_code" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"

  source {
    content  = <<-EOT
import json
import boto3
import os
from datetime import datetime, timedelta

def handler(event, context):
    """Generic Lambda handler with PHI encryption support"""
    
    # Initialize AWS clients
    dynamodb = boto3.resource('dynamodb')
    sns = boto3.client('sns')
    kms = boto3.client('kms')
    
    # Get environment variables
    env = os.environ.get('ENVIRONMENT', 'dev')
    kms_key_id = os.environ.get('KMS_KEY_ID')
    
    # Process based on event source
    if 'Records' in event:
        # Handle DynamoDB Stream, S3, or SQS events
        for record in event['Records']:
            if 'dynamodb' in record:
                process_dynamodb_stream(record, dynamodb, sns)
            elif 's3' in record:
                process_s3_event(record, dynamodb)
            elif 'body' in record:
                process_sqs_message(record, dynamodb, sns)
    
    elif 'httpMethod' in event:
        # Handle API Gateway requests
        return process_api_request(event, dynamodb, kms, kms_key_id)
    
    elif 'detail-type' in event:
        # Handle EventBridge scheduled events
        return process_scheduled_event(event, dynamodb, sns)
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processing complete'})
    }

def process_dynamodb_stream(record, dynamodb, sns):
    """Process DynamoDB stream events"""
    if record['eventName'] in ['INSERT', 'MODIFY']:
        # Handle appointment status changes
        if 'status' in record['dynamodb'].get('NewImage', {}):
            status = record['dynamodb']['NewImage']['status']['S']
            if status == 'scheduled':
                # Publish to SNS for notifications
                message = {
                    'appointment_id': record['dynamodb']['Keys']['appointment_id']['S'],
                    'status': status,
                    'timestamp': datetime.utcnow().isoformat()
                }
                sns.publish(
                    TopicArn=os.environ.get('SNS_TOPIC_ARN'),
                    Message=json.dumps(message),
                    MessageAttributes={
                        'notification_type': {'DataType': 'String', 'StringValue': 'patient'}
                    }
                )

def process_s3_event(record, dynamodb):
    """Process S3 document upload events"""
    bucket = record['s3']['bucket']['name']
    key = record['s3']['object']['key']
    
    # Mock PHI detection
    has_phi = 'medical' in key.lower() or 'patient' in key.lower()
    
    # Update document catalog
    table = dynamodb.Table(os.environ.get('DOCUMENTS_TABLE'))
    table.put_item(
        Item={
            'document_id': key,
            'patient_id': key.split('/')[0] if '/' in key else 'unknown',
            's3_bucket': bucket,
            's3_key': key,
            'has_phi': has_phi,
            'uploaded_at': datetime.utcnow().isoformat(),
            'ttl': int((datetime.utcnow() + timedelta(days=365*7)).timestamp())
        }
    )

def process_sqs_message(record, dynamodb, sns):
    """Process SQS messages"""
    message = json.loads(record['body'])
    # Process notification or billing message
    print(f"Processing message: {message}")

def process_api_request(event, dynamodb, kms, kms_key_id):
    """Process API Gateway requests"""
    path = event['path']
    method = event['httpMethod']
    
    if path == '/appointments' and method == 'POST':
        # Create appointment
        body = json.loads(event['body'])
        
        # Encrypt PHI data
        if 'patient_data' in body:
            encrypted_data = kms.encrypt(
                KeyId=kms_key_id,
                Plaintext=json.dumps(body['patient_data'])
            )
            body['patient_data_encrypted'] = encrypted_data['CiphertextBlob']
        
        table = dynamodb.Table(os.environ.get('APPOINTMENTS_TABLE'))
        table.put_item(Item=body)
        
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Appointment created'})
        }
    
    return {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'})
    }

def process_scheduled_event(event, dynamodb, sns):
    """Process EventBridge scheduled events"""
    if event['detail-type'] == 'Appointment Reminder':
        # Query appointments for next 24 hours
        table = dynamodb.Table(os.environ.get('APPOINTMENTS_TABLE'))
        tomorrow = datetime.utcnow() + timedelta(days=1)
        
        # Mock query - in production would use proper index
        response = table.scan()
        
        for item in response.get('Items', []):
            # Send reminder via SNS
            sns.publish(
                TopicArn=os.environ.get('REMINDER_TOPIC_ARN'),
                Message=json.dumps(item)
            )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

# Lambda Functions
resource "aws_lambda_function" "request_handler" {
  filename                       = data.archive_file.lambda_code.output_path
  function_name                  = "${local.prefix}-request-handler"
  role                           = aws_iam_role.lambda_execution.arn
  handler                        = "lambda_function.handler"
  runtime                        = var.runtime
  memory_size                    = var.request_handler_memory
  timeout                        = var.timeout_s
  reserved_concurrent_executions = local.env_config[var.env].lambda_reserved_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      APPOINTMENTS_TABLE = aws_dynamodb_table.appointments.name
      SNS_TOPIC_ARN      = aws_sns_topic.appointment_scheduled.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-request-handler"
  })
}

resource "aws_lambda_function" "scheduler" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-scheduler"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.scheduler_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      APPOINTMENTS_TABLE = aws_dynamodb_table.appointments.name
      POLICIES_TABLE     = aws_dynamodb_table.policies.name
      REDIS_ENDPOINT     = aws_elasticache_replication_group.redis.primary_endpoint_address
      REDIS_AUTH_SECRET  = aws_secretsmanager_secret.redis_auth.id
      SNS_TOPIC_ARN      = aws_sns_topic.appointment_scheduled.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-scheduler"
  })
}

resource "aws_lambda_function" "notifier" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-notifier"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.notifier_memory
  timeout       = var.timeout_s

  environment {
    variables = merge(local.lambda_env_vars, {
      SQS_QUEUE_URL = aws_sqs_queue.patient_notifications.url
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-notifier"
  })
}

resource "aws_lambda_function" "billing" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-billing"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.billing_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      AURORA_ENDPOINT = aws_rds_cluster.aurora.endpoint
      AURORA_SECRET   = aws_secretsmanager_secret.aurora_master.id
      SQS_QUEUE_URL   = aws_sqs_queue.billing.url
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-billing"
  })
}

resource "aws_lambda_function" "session_manager" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-session-manager"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.session_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      SESSIONS_TABLE  = aws_dynamodb_table.sessions.name
      AURORA_ENDPOINT = aws_rds_cluster.aurora.endpoint
      AURORA_SECRET   = aws_secretsmanager_secret.aurora_master.id
      SNS_TOPIC_ARN   = aws_sns_topic.session_events.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-session-manager"
  })
}

resource "aws_lambda_function" "prescription_handler" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-prescription-handler"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.prescription_memory
  timeout       = var.timeout_s

  environment {
    variables = merge(local.lambda_env_vars, {
      PRESCRIPTIONS_TABLE = aws_dynamodb_table.prescriptions.name
      STEP_FUNCTION_ARN   = aws_sfn_state_machine.prescription_approval.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-prescription-handler"
  })
}

resource "aws_lambda_function" "approval_checker" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-approval-checker"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.approval_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      PROFILES_TABLE     = aws_dynamodb_table.profiles.name
      AURORA_ENDPOINT    = aws_rds_cluster.aurora.endpoint
      AURORA_SECRET      = aws_secretsmanager_secret.aurora_master.id
      APPROVED_TOPIC_ARN = aws_sns_topic.prescription_approved.arn
      REVIEW_TOPIC_ARN   = aws_sns_topic.prescription_review.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-approval-checker"
  })
}

resource "aws_lambda_function" "pharmacy_integration" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-pharmacy-integration"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.pharmacy_memory
  timeout       = var.timeout_s

  environment {
    variables = merge(local.lambda_env_vars, {
      SQS_QUEUE_URL = aws_sqs_queue.pharmacy_fulfillment.url
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-pharmacy-integration"
  })
}

resource "aws_lambda_function" "compliance_analyzer" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-compliance-analyzer"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.compliance_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      AURORA_ENDPOINT  = aws_rds_cluster.aurora.endpoint
      AURORA_SECRET    = aws_secretsmanager_secret.aurora_master.id
      COMPLIANCE_TABLE = aws_dynamodb_table.compliance.name
      ALERTS_TOPIC_ARN = aws_sns_topic.compliance_alerts.arn
      AUDIT_BUCKET     = aws_s3_bucket.audit_logs.id
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-compliance-analyzer"
  })
}

resource "aws_lambda_function" "reminder_processor" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-reminder-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.reminder_memory
  timeout       = var.timeout_s

  environment {
    variables = merge(local.lambda_env_vars, {
      APPOINTMENTS_TABLE = aws_dynamodb_table.appointments.name
      REMINDER_TOPIC_ARN = aws_sns_topic.appointment_reminders.arn
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-reminder-processor"
  })
}

resource "aws_lambda_function" "analytics_aggregator" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-analytics-aggregator"
  role          = aws_iam_role.lambda_vpc_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.analytics_memory
  timeout       = var.timeout_s

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_vpc.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      APPOINTMENTS_TABLE = aws_dynamodb_table.appointments.name
      AURORA_ENDPOINT    = aws_rds_cluster.aurora.endpoint
      AURORA_SECRET      = aws_secretsmanager_secret.aurora_master.id
      REDIS_ENDPOINT     = aws_elasticache_replication_group.redis.primary_endpoint_address
      REDIS_AUTH_SECRET  = aws_secretsmanager_secret.redis_auth.id
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-analytics-aggregator"
  })
}

resource "aws_lambda_function" "document_processor" {
  filename      = data.archive_file.lambda_code.output_path
  function_name = "${local.prefix}-document-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = var.runtime
  memory_size   = var.document_memory
  timeout       = var.timeout_s

  environment {
    variables = merge(local.lambda_env_vars, {
      DOCUMENTS_TABLE  = aws_dynamodb_table.documents.name
      DOCUMENTS_BUCKET = aws_s3_bucket.documents.id
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-document-processor"
  })
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "appointments_stream" {
  event_source_arn  = aws_dynamodb_table.appointments.stream_arn
  function_name     = aws_lambda_function.scheduler.arn
  starting_position = "LATEST"
  batch_size        = 10

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY"]
        dynamodb = {
          NewImage = {
            status = {
              S = ["requested"]
            }
          }
        }
      })
    }
  }
}

resource "aws_lambda_event_source_mapping" "analytics_stream" {
  event_source_arn  = aws_dynamodb_table.appointments.stream_arn
  function_name     = aws_lambda_function.analytics_aggregator.arn
  starting_position = "LATEST"
  batch_size        = 10

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["MODIFY"]
        dynamodb = {
          NewImage = {
            status = {
              S = ["completed"]
            }
          }
        }
      })
    }
  }
}

resource "aws_lambda_event_source_mapping" "patient_notifications_processor" {
  event_source_arn = aws_sqs_queue.patient_notifications.arn
  function_name    = aws_lambda_function.notifier.arn
  batch_size       = 10

  depends_on = [aws_iam_role_policy_attachment.lambda_base]
}

resource "aws_lambda_event_source_mapping" "billing_processor" {
  event_source_arn = aws_sqs_queue.billing.arn
  function_name    = aws_lambda_function.billing.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "pharmacy_processor" {
  event_source_arn = aws_sqs_queue.pharmacy_fulfillment.arn
  function_name    = aws_lambda_function.pharmacy_integration.arn
  batch_size       = 10

  depends_on = [aws_iam_role_policy_attachment.lambda_base]
}

# S3 Bucket Notification
resource "aws_s3_bucket_notification" "document_upload" {
  bucket = aws_s3_bucket.documents.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.document_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "documents/"
  }
}

resource "aws_lambda_permission" "s3_invoke_document_processor" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.document_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.documents.arn
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = {
    request_handler      = aws_lambda_function.request_handler.function_name
    scheduler            = aws_lambda_function.scheduler.function_name
    notifier             = aws_lambda_function.notifier.function_name
    billing              = aws_lambda_function.billing.function_name
    session_manager      = aws_lambda_function.session_manager.function_name
    prescription_handler = aws_lambda_function.prescription_handler.function_name
    approval_checker     = aws_lambda_function.approval_checker.function_name
    pharmacy_integration = aws_lambda_function.pharmacy_integration.function_name
    compliance_analyzer  = aws_lambda_function.compliance_analyzer.function_name
    reminder_processor   = aws_lambda_function.reminder_processor.function_name
    analytics_aggregator = aws_lambda_function.analytics_aggregator.function_name
    document_processor   = aws_lambda_function.document_processor.function_name
  }

  name              = "/aws/lambda/${each.value}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(local.tags, {
    Name = "${each.value}-logs"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/api-gateway/${local.prefix}-${var.api_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(local.tags, {
    Name = "${local.prefix}-api-gateway-logs"
  })
}

resource "aws_cloudwatch_log_group" "step_functions_logs" {
  name              = "/aws/vendedlogs/states/${local.prefix}-${var.prescription_workflow_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(local.tags, {
    Name = "${local.prefix}-step-functions-logs"
  })
}

# ============================================================================
# WAF CONFIGURATION
# ============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "api_gateway" {
  name        = "${local.prefix}-api-gateway-waf"
  description = "WAF for API Gateway protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # SQL Injection Protection Rule
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 1

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
      metric_name                = "SQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting Rule
  rule {
    name     = "RateLimitRule"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 3

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
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4

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
      metric_name                = "KnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.prefix}-waf-metrics"
    sampled_requests_enabled   = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-api-gateway-waf"
  })
}

# Associate WAF with API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn
}

# ============================================================================
# API GATEWAY
# ============================================================================

resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.prefix}-${var.api_name}"
  description = "Telemedicine API for ${var.env} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-${var.api_name}"
  })
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name                             = "${local.prefix}-cognito-authorizer"
  type                             = "COGNITO_USER_POOLS"
  rest_api_id                      = aws_api_gateway_rest_api.main.id
  provider_arns                    = ["arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.user_pool_id}"]
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300
}

# API Resources
resource "aws_api_gateway_resource" "appointments" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "appointments"
}

resource "aws_api_gateway_resource" "prescriptions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "prescriptions"
}

resource "aws_api_gateway_resource" "session" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "session"
}

resource "aws_api_gateway_resource" "session_start" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.session.id
  path_part   = "start"
}

# API Methods
resource "aws_api_gateway_method" "appointments_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.appointments.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_method" "prescriptions_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.prescriptions.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_method" "session_start_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.session_start.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

# Lambda Integrations
resource "aws_api_gateway_integration" "appointments_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.appointments.id
  http_method = aws_api_gateway_method.appointments_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.request_handler.invoke_arn
}

resource "aws_api_gateway_integration" "prescriptions_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.prescriptions.id
  http_method = aws_api_gateway_method.prescriptions_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.prescription_handler.invoke_arn
}

resource "aws_api_gateway_integration" "session_start_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.session_start.id
  http_method = aws_api_gateway_method.session_start_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.session_manager.invoke_arn
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_appointments" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.request_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_prescriptions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.prescription_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_session" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.session_manager.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  depends_on = [
    aws_api_gateway_integration.appointments_lambda,
    aws_api_gateway_integration.prescriptions_lambda,
    aws_api_gateway_integration.session_start_lambda
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# API Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.stage_name

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
    })
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-api-stage-${var.stage_name}"
  })
}

# API Usage Plan
resource "aws_api_gateway_usage_plan" "main" {
  name = "${local.prefix}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  throttle_settings {
    rate_limit  = local.env_config[var.env].api_throttle_rate
    burst_limit = local.env_config[var.env].api_throttle_burst
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-usage-plan"
  })
}

# ============================================================================
# STEP FUNCTIONS
# ============================================================================

resource "aws_iam_role" "step_functions" {
  name = "${local.prefix}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.prefix}-step-functions-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.approval_checker.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_sfn_state_machine" "prescription_approval" {
  name     = "${local.prefix}-${var.prescription_workflow_name}"
  role_arn = aws_iam_role.step_functions.arn

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions_logs.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  definition = jsonencode({
    Comment = "Prescription approval workflow with allergy and interaction checks"
    StartAt = "ValidatePrescription"
    States = {
      ValidatePrescription = {
        Type     = "Task"
        Resource = aws_lambda_function.approval_checker.arn
        Parameters = {
          "prescription_id.$" = "$.prescription_id"
          "patient_id.$"      = "$.patient_id"
          "check_type"        = "validate"
        }
        Next = "ParallelChecks"
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
      }
      ParallelChecks = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "CheckAllergies"
            States = {
              CheckAllergies = {
                Type     = "Task"
                Resource = aws_lambda_function.approval_checker.arn
                Parameters = {
                  "prescription_id.$" = "$.prescription_id"
                  "patient_id.$"      = "$.patient_id"
                  "check_type"        = "allergies"
                }
                End = true
              }
            }
          },
          {
            StartAt = "CheckInteractions"
            States = {
              CheckInteractions = {
                Type     = "Task"
                Resource = aws_lambda_function.approval_checker.arn
                Parameters = {
                  "prescription_id.$" = "$.prescription_id"
                  "patient_id.$"      = "$.patient_id"
                  "check_type"        = "interactions"
                }
                End = true
              }
            }
          }
        ]
        Next = "EvaluateResults"
      }
      EvaluateResults = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$[0].has_issues"
            BooleanEquals = true
            Next          = "RequireReview"
          },
          {
            Variable      = "$[1].has_issues"
            BooleanEquals = true
            Next          = "RequireReview"
          }
        ]
        Default = "ApprovePrescription"
      }
      ApprovePrescription = {
        Type     = "Task"
        Resource = aws_lambda_function.approval_checker.arn
        Parameters = {
          "prescription_id.$" = "$.prescription_id"
          "action"            = "approve"
        }
        End = true
      }
      RequireReview = {
        Type     = "Task"
        Resource = aws_lambda_function.approval_checker.arn
        Parameters = {
          "prescription_id.$" = "$.prescription_id"
          "action"            = "review"
        }
        End = true
      }
    }
  })

  tags = merge(local.tags, {
    Name = "${local.prefix}-prescription-approval"
  })
}

# ============================================================================
# EVENTBRIDGE RULES
# ============================================================================

resource "aws_iam_role" "eventbridge" {
  name = "${local.prefix}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "eventbridge_lambda" {
  name = "${local.prefix}-eventbridge-lambda-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.compliance_analyzer.arn,
          aws_lambda_function.reminder_processor.arn
        ]
      }
    ]
  })
}

# Compliance Check Rule
resource "aws_cloudwatch_event_rule" "compliance_check" {
  name                = "${local.prefix}-compliance-check"
  description         = "Trigger nightly compliance analysis"
  schedule_expression = var.compliance_schedule_expression

  tags = merge(local.tags, {
    Name = "${local.prefix}-compliance-check-rule"
  })
}

resource "aws_cloudwatch_event_target" "compliance_lambda" {
  rule      = aws_cloudwatch_event_rule.compliance_check.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge_compliance" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_check.arn
}

# Appointment Reminders Rule
resource "aws_cloudwatch_event_rule" "appointment_reminders" {
  name                = "${local.prefix}-appointment-reminders"
  description         = "Trigger hourly appointment reminder checks"
  schedule_expression = var.reminders_schedule_expression

  tags = merge(local.tags, {
    Name = "${local.prefix}-appointment-reminders-rule"
  })
}

resource "aws_cloudwatch_event_target" "reminder_lambda" {
  rule      = aws_cloudwatch_event_rule.appointment_reminders.name
  target_id = "ReminderLambdaTarget"
  arn       = aws_lambda_function.reminder_processor.arn
}

resource "aws_lambda_permission" "allow_eventbridge_reminders" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reminder_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.appointment_reminders.arn
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# API Gateway Authentication Failures
resource "aws_cloudwatch_metric_alarm" "api_auth_failures" {
  alarm_name          = "${local.prefix}-api-auth-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway authentication failures"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = var.stage_name
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-api-auth-failures-alarm"
  })
}

# Lambda Scheduler Errors
resource "aws_cloudwatch_metric_alarm" "lambda_scheduler_errors" {
  alarm_name          = "${local.prefix}-lambda-scheduler-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda scheduler function errors"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.scheduler.function_name
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-lambda-scheduler-errors-alarm"
  })
}

# DynamoDB Throttled Writes
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_writes" {
  alarm_name          = "${local.prefix}-dynamodb-throttled-writes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB appointments table throttled writes"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.appointments.name
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-dynamodb-throttled-writes-alarm"
  })
}

# Redis Evictions
resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${local.prefix}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Redis cache evictions"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-evictions-alarm"
  })
}

# Aurora Deadlocks
resource "aws_cloudwatch_metric_alarm" "aurora_deadlocks" {
  alarm_name          = "${local.prefix}-aurora-deadlocks"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "Deadlocks"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Aurora PostgreSQL deadlocks"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-deadlocks-alarm"
  })
}

# SQS Message Age
resource "aws_cloudwatch_metric_alarm" "sqs_message_age_patient" {
  alarm_name          = "${local.prefix}-sqs-message-age-patient"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 600
  alarm_description   = "SQS patient notifications queue message age"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.patient_notifications.name
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-sqs-message-age-patient-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "sqs_message_age_pharmacy" {
  alarm_name          = "${local.prefix}-sqs-message-age-pharmacy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 600
  alarm_description   = "SQS pharmacy queue message age"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.pharmacy_fulfillment.name
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-sqs-message-age-pharmacy-alarm"
  })
}

# Step Functions Failed Workflows
resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "${local.prefix}-step-functions-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Step Functions prescription workflow failures"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.prescription_approval.arn
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-step-functions-failed-alarm"
  })
}

# S3 Document Upload Errors
resource "aws_cloudwatch_metric_alarm" "s3_upload_errors" {
  alarm_name          = "${local.prefix}-s3-upload-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = local.env_config[var.env].alarm_evaluation_periods
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "S3 document upload errors"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.documents.id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-s3-upload-errors-alarm"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "dynamodb_tables" {
  description = "DynamoDB table names and ARNs"
  value = {
    appointments = {
      name = aws_dynamodb_table.appointments.name
      arn  = aws_dynamodb_table.appointments.arn
    }
    sessions = {
      name = aws_dynamodb_table.sessions.name
      arn  = aws_dynamodb_table.sessions.arn
    }
    prescriptions = {
      name = aws_dynamodb_table.prescriptions.name
      arn  = aws_dynamodb_table.prescriptions.arn
    }
    policies = {
      name = aws_dynamodb_table.policies.name
      arn  = aws_dynamodb_table.policies.arn
    }
    profiles = {
      name = aws_dynamodb_table.profiles.name
      arn  = aws_dynamodb_table.profiles.arn
    }
    compliance = {
      name = aws_dynamodb_table.compliance.name
      arn  = aws_dynamodb_table.compliance.arn
    }
    documents = {
      name = aws_dynamodb_table.documents.name
      arn  = aws_dynamodb_table.documents.arn
    }
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs"
  value = {
    appointment_scheduled = aws_sns_topic.appointment_scheduled.arn
    session_events        = aws_sns_topic.session_events.arn
    prescription_approved = aws_sns_topic.prescription_approved.arn
    prescription_review   = aws_sns_topic.prescription_review.arn
    compliance_alerts     = aws_sns_topic.compliance_alerts.arn
    appointment_reminders = aws_sns_topic.appointment_reminders.arn
  }
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value = {
    patient_notifications  = aws_sqs_queue.patient_notifications.url
    provider_notifications = aws_sqs_queue.provider_notifications.url
    billing                = aws_sqs_queue.billing.url
    pharmacist_review      = aws_sqs_queue.pharmacist_review.url
    pharmacy_fulfillment   = aws_sqs_queue.pharmacy_fulfillment.url
    patient_prescriptions  = aws_sqs_queue.patient_prescriptions.url
  }
}

output "aurora_endpoints" {
  description = "Aurora cluster endpoints"
  value = {
    writer = aws_rds_cluster.aurora.endpoint
    reader = aws_rds_cluster.aurora.reader_endpoint
  }
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.prescription_approval.arn
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    request_handler      = aws_lambda_function.request_handler.arn
    scheduler            = aws_lambda_function.scheduler.arn
    notifier             = aws_lambda_function.notifier.arn
    billing              = aws_lambda_function.billing.arn
    session_manager      = aws_lambda_function.session_manager.arn
    prescription_handler = aws_lambda_function.prescription_handler.arn
    approval_checker     = aws_lambda_function.approval_checker.arn
    pharmacy_integration = aws_lambda_function.pharmacy_integration.arn
    compliance_analyzer  = aws_lambda_function.compliance_analyzer.arn
    reminder_processor   = aws_lambda_function.reminder_processor.arn
    analytics_aggregator = aws_lambda_function.analytics_aggregator.arn
    document_processor   = aws_lambda_function.document_processor.arn
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value = {
    audit_logs = aws_s3_bucket.audit_logs.id
    documents  = aws_s3_bucket.documents.id
  }
}

output "kms_key_arn" {
  description = "PHI encryption KMS key ARN"
  value       = aws_kms_key.phi_encryption.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    lambda_vpc = aws_security_group.lambda_vpc.id
    redis      = aws_security_group.redis.id
    aurora     = aws_security_group.aurora.id
  }
}

output "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

output "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_port" {
  description = "Aurora PostgreSQL port"
  value       = aws_rds_cluster.aurora.port
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_replication_group_id" {
  description = "Redis replication group ID"
  value       = aws_elasticache_replication_group.redis.id
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.api_gateway.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.api_gateway.arn
}

output "secrets_manager_secrets" {
  description = "Secrets Manager secret ARNs"
  value = {
    aurora_credentials = aws_secretsmanager_secret.aurora_master.arn
    redis_auth_token   = aws_secretsmanager_secret.redis_auth.arn
  }
}

output "lambda_function_names" {
  description = "Lambda function names"
  value = {
    request_handler      = aws_lambda_function.request_handler.function_name
    scheduler            = aws_lambda_function.scheduler.function_name
    notifier             = aws_lambda_function.notifier.function_name
    billing              = aws_lambda_function.billing.function_name
    session_manager      = aws_lambda_function.session_manager.function_name
    prescription_handler = aws_lambda_function.prescription_handler.function_name
    approval_checker     = aws_lambda_function.approval_checker.function_name
    pharmacy_integration = aws_lambda_function.pharmacy_integration.function_name
    compliance_analyzer  = aws_lambda_function.compliance_analyzer.function_name
    reminder_processor   = aws_lambda_function.reminder_processor.function_name
    analytics_aggregator = aws_lambda_function.analytics_aggregator.function_name
    document_processor   = aws_lambda_function.document_processor.function_name
  }
}

output "eventbridge_rule_name" {
  description = "EventBridge compliance check rule name"
  value       = aws_cloudwatch_event_rule.compliance_check.name
}

output "vpc_info" {
  description = "VPC information"
  value = {
    vpc_id             = aws_vpc.main.id
    cidr_block         = aws_vpc.main.cidr_block
    private_subnet_ids = aws_subnet.private[*].id
    public_subnet_ids  = aws_subnet.public[*].id
  }
}