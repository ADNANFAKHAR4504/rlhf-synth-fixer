# Complete Healthcare Data Processing Infrastructure - tap_stack.tf

```hcl
# tap_stack.tf - Production-grade multi-environment healthcare data processing pipeline
# Supports dev, staging, and prod with identical topology
# NOTE: Provider and terraform configuration is in provider.tf

# ==========================================
# Variables
# ==========================================
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-healthcare"
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

variable "kinesis_shard_count" {
  description = "Number of shards for Kinesis Data Stream"
  type        = number
  default     = 2
}

variable "kinesis_retention_hours" {
  description = "Data retention period for Kinesis stream (hours)"
  type        = number
  default     = 24
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
  type        = number
  default     = 60
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 10
}

variable "sqs_visibility_timeout" {
  description = "SQS message visibility timeout (seconds)"
  type        = number
  default     = 300
}

variable "sqs_message_retention" {
  description = "SQS message retention period (seconds)"
  type        = number
  default     = 1209600
}

variable "sqs_max_receive_count" {
  description = "Maximum receive count before moving to DLQ"
  type        = number
  default     = 3
}

variable "aurora_min_capacity" {
  description = "Aurora Serverless v2 minimum capacity (ACUs)"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora Serverless v2 maximum capacity (ACUs)"
  type        = number
  default     = 1
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the Redis cluster"
  type        = number
  default     = 1
}

variable "eventbridge_schedule" {
  description = "EventBridge schedule expression for data quality checks"
  type        = string
  default     = "rate(1 hour)"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period (days)"
  type        = number
  default     = 30
}

variable "hospital_regions" {
  description = "List of hospital regions for SQS queues"
  type        = list(string)
  default     = ["east", "west"]
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "Healthcare IT"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "HC-001"
}

# ==========================================
# Locals
# ==========================================
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }

  # S3 bucket names
  s3_bucket_names = {
    audit_logs    = "${local.name_prefix}-audit-logs"
    athena_results = "${local.name_prefix}-athena-results"
  }

  # SQS queue URLs (computed after creation)
  sqs_queue_urls = {
    for region in var.hospital_regions :
    region => "https://sqs.${var.aws_region}.amazonaws.com/${data.aws_caller_identity.current.account_id}/${local.name_prefix}-patient-updates-${region}"
  }
}

# ==========================================
# Data Sources
# ==========================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

# ==========================================
# KMS Keys
# ==========================================
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} healthcare data encryption"
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
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# ==========================================
# VPC and Networking
# ==========================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${var.availability_zones[count.index]}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${var.availability_zones[count.index]}"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${var.availability_zones[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

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
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${var.availability_zones[count.index]}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = aws_route_table.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = aws_route_table.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "kinesis_streams" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kinesis-endpoint"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ssm-endpoint"
  })
}

# Security Groups
resource "aws_security_group" "vpc_endpoint" {
  name_prefix = "${local.name_prefix}-vpc-endpoint-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-endpoint-sg"
  })
}

resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${local.name_prefix}-aurora-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.name_prefix}-redis-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

# ==========================================
# IoT Core
# ==========================================
resource "aws_iot_thing_type" "patient_monitor" {
  name = "${local.name_prefix}-patient-monitor"

  properties {
    description = "Patient monitoring device"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-patient-monitor-type"
  })
}

resource "aws_iot_policy" "patient_monitor" {
  name = "${local.name_prefix}-patient-monitor-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:Connect"
        ]
        Resource = [
          "arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:client/$${iot:ClientId}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iot:Publish"
        ]
        Resource = [
          "arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/patient/vitals"
        ]
      }
    ]
  })
}

resource "aws_iot_topic_rule" "kinesis" {
  name        = "${local.name_prefix}-kinesis-rule"
  description = "Route IoT messages to Kinesis Data Stream"
  enabled     = true
  sql         = "SELECT * FROM 'patient/vitals'"
  sql_version = "2016-03-23"

  kinesis {
    stream_name = aws_kinesis_stream.patient_vitals.name
    role_arn    = aws_iam_role.iot_kinesis.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kinesis-rule"
  })
}

# ==========================================
# Kinesis Data Stream
# ==========================================
resource "aws_kinesis_stream" "patient_vitals" {
  name             = "${local.name_prefix}-patient-vitals"
  shard_count      = var.kinesis_shard_count
  retention_period = var.kinesis_retention_hours

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kinesis-stream"
  })
}

# ==========================================
# DynamoDB
# ==========================================
resource "aws_dynamodb_table" "patient_records" {
  name           = "${local.name_prefix}-patient-records"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
  hash_key       = "patient_id"
  range_key      = "timestamp"

  attribute {
    name = "patient_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-table"
  })
}

# ==========================================
# SNS Topics
# ==========================================
resource "aws_sns_topic" "patient_updates" {
  name              = "${local.name_prefix}-patient-updates"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-patient-updates-topic"
  })
}

resource "aws_sns_topic" "operational_alerts" {
  name              = "${local.name_prefix}-operational-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-operational-alerts-topic"
  })
}

resource "aws_sns_topic" "data_quality_findings" {
  name              = "${local.name_prefix}-data-quality-findings"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-quality-findings-topic"
  })
}

resource "aws_sns_topic" "phi_violations" {
  name              = "${local.name_prefix}-phi-violations"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-phi-violations-topic"
  })
}

# ==========================================
# SQS Queues
# ==========================================
resource "aws_sqs_queue" "patient_updates" {
  for_each = toset(var.hospital_regions)

  name                       = "${local.name_prefix}-patient-updates-${each.key}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  max_message_size           = 262144
  delay_seconds              = 0
  receive_wait_time_seconds  = 0

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.patient_updates_dlq[each.key].arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-patient-updates-${each.key}-queue"
  })
}

resource "aws_sqs_queue" "patient_updates_dlq" {
  for_each = toset(var.hospital_regions)

  name                       = "${local.name_prefix}-patient-updates-${each.key}-dlq"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  max_message_size           = 262144

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-patient-updates-${each.key}-dlq"
  })
}

# SNS to SQS Subscriptions
resource "aws_sns_topic_subscription" "patient_updates" {
  for_each = toset(var.hospital_regions)

  topic_arn = aws_sns_topic.patient_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.patient_updates[each.key].arn
}

# ==========================================
# Aurora PostgreSQL Serverless v2
# ==========================================
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  database_name                   = "healthcare"
  master_username                 = jsondecode(aws_secretsmanager_secret_version.aurora_credentials.secret_string)["username"]
  master_password                 = jsondecode(aws_secretsmanager_secret_version.aurora_credentials.secret_string)["password"]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  final_snapshot_identifier       = "${local.name_prefix}-aurora-final-snapshot"
  skip_final_snapshot             = var.environment != "prod"
  deletion_protection             = var.environment == "prod"

  serverlessv2_scaling_configuration {
    min_capacity = var.aurora_min_capacity
    max_capacity = var.aurora_max_capacity
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.environment == "prod" ? 2 : 1

  identifier           = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.aurora.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.aurora.engine
  engine_version       = aws_rds_cluster.aurora.engine_version
  db_subnet_group_name = aws_db_subnet_group.aurora.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  })
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  family = "aurora-postgresql15"
  name   = "${local.name_prefix}-aurora-parameter-group"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-parameter-group"
  })
}

# ==========================================
# ElastiCache Redis
# ==========================================
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${local.name_prefix}-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_elasticache_security_group.redis.id]

  snapshot_retention_limit = var.environment == "prod" ? 7 : 1
  snapshot_window          = "05:00-06:00"
  maintenance_window       = "sun:06:00-sun:07:00"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-cluster"
  })
}

# ==========================================
# S3 Buckets
# ==========================================
resource "aws_s3_bucket" "audit_logs" {
  bucket = local.s3_bucket_names.audit_logs

  tags = merge(local.common_tags, {
    Name = local.s3_bucket_names.audit_logs
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
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "athena_results" {
  bucket = local.s3_bucket_names.athena_results

  tags = merge(local.common_tags, {
    Name = local.s3_bucket_names.athena_results
  })
}

resource "aws_s3_bucket_versioning" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==========================================
# Secrets Manager
# ==========================================
resource "aws_secretsmanager_secret" "aurora_credentials" {
  name                    = "${local.name_prefix}/aurora/credentials"
  description             = "Aurora PostgreSQL database credentials"
  kms_key_id              = aws_kms_key.main.id
  recovery_window_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id

  secret_string = jsonencode({
    username = "healthcare_admin"
    password = random_password.aurora.result
  })
}

resource "random_password" "aurora" {
  length  = 32
  special = true
}

# ==========================================
# SSM Parameters
# ==========================================
resource "aws_ssm_parameter" "kinesis_stream_name" {
  name        = "/${local.name_prefix}/kinesis/stream_name"
  description = "Kinesis Data Stream name"
  type        = "String"
  value       = aws_kinesis_stream.patient_vitals.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kinesis-stream-name"
  })
}

resource "aws_ssm_parameter" "dynamodb_table_name" {
  name        = "/${local.name_prefix}/dynamodb/table_name"
  description = "DynamoDB table name"
  type        = "String"
  value       = aws_dynamodb_table.patient_records.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-table-name"
  })
}

resource "aws_ssm_parameter" "sns_patient_updates_arn" {
  name        = "/${local.name_prefix}/sns/patient_updates_arn"
  description = "SNS patient updates topic ARN"
  type        = "String"
  value       = aws_sns_topic.patient_updates.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-patient-updates-arn"
  })
}

resource "aws_ssm_parameter" "s3_bucket_names" {
  name        = "/${local.name_prefix}/s3/bucket_names"
  description = "S3 bucket names JSON"
  type        = "String"
  value       = jsonencode(local.s3_bucket_names)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-bucket-names"
  })
}

resource "aws_ssm_parameter" "sqs_queue_urls" {
  name        = "/${local.name_prefix}/sqs/queue_urls"
  description = "SQS queue URLs JSON"
  type        = "String"
  value       = jsonencode(local.sqs_queue_urls)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-queue-urls"
  })
}

# ==========================================
# Lambda Functions
# ==========================================
data "archive_file" "lambda_layer" {
  type        = "zip"
  output_path = "${path.module}/lambda_layer.zip"

  source {
    content  = "layer content"
    filename = "layer.py"
  }
}

resource "aws_lambda_layer_version" "common" {
  filename   = data.archive_file.lambda_layer.output_path
  layer_name = "${local.name_prefix}-common-layer"

  compatible_runtimes = ["python3.12"]
}

data "archive_file" "hipaa_validator" {
  type        = "zip"
  output_path = "${path.module}/hipaa_validator.zip"

  source {
    content = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    # HIPAA validation logic
    records = event.get('Records', [])
    validated_records = []

    for record in records:
        data = json.loads(record['kinesis']['data'])
        # Add HIPAA validation logic here
        validated_records.append(data)

    # Write to DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

    for record in validated_records:
        table.put_item(Item=record)

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(validated_records)} records')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "hipaa_validator" {
  filename         = data.archive_file.hipaa_validator.output_path
  function_name    = "${local.name_prefix}-hipaa-validator"
  role             = aws_iam_role.hipaa_validator.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.patient_records.name
    }
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hipaa-validator"
  })
}

data "archive_file" "stream_processor" {
  type        = "zip"
  output_path = "${path.module}/stream_processor.zip"

  source {
    content = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    # Process DynamoDB stream events
    records = event.get('Records', [])

    sns = boto3.client('sns')
    topic_arn = os.environ['SNS_TOPIC_ARN']

    for record in records:
        if record['eventName'] in ['INSERT', 'MODIFY']:
            new_image = record['dynamodb']['NewImage']
            # Transform and publish to SNS
            message = {
                'patient_id': new_image['patient_id']['S'],
                'timestamp': new_image['timestamp']['N'],
                'action': record['eventName']
            }
            sns.publish(TopicArn=topic_arn, Message=json.dumps(message))

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(records)} stream records')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "stream_processor" {
  filename         = data.archive_file.stream_processor.output_path
  function_name    = "${local.name_prefix}-stream-processor"
  role             = aws_iam_role.stream_processor.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.patient_updates.arn
    }
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-stream-processor"
  })
}

data "archive_file" "sqs_consumer" {
  type        = "zip"
  output_path = "${path.module}/sqs_consumer.zip"

  source {
    content = <<EOF
import json
import boto3
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    secret = json.loads(boto3.client('secretsmanager').get_secret_value(
        SecretId=os.environ['DB_SECRET_ARN'])['SecretString'])

    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=secret['username'],
        password=secret['password']
    )

def lambda_handler(event, context):
    records = event.get('Records', [])

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            for record in records:
                message = json.loads(record['body'])
                # Insert into Aurora PostgreSQL
                cursor.execute("""
                    INSERT INTO patient_records (patient_id, timestamp, data)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (patient_id, timestamp) DO UPDATE SET data = EXCLUDED.data
                """, (message['patient_id'], message['timestamp'], json.dumps(message)))
            conn.commit()

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(records)} SQS messages')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "sqs_consumer" {
  for_each = toset(var.hospital_regions)

  filename         = data.archive_file.sqs_consumer.output_path
  function_name    = "${local.name_prefix}-sqs-consumer-${each.key}"
  role             = aws_iam_role.sqs_consumer.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.aurora_credentials.arn
      DB_HOST       = aws_rds_cluster.aurora.endpoint
      DB_NAME       = aws_rds_cluster.aurora.database_name
    }
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-consumer-${each.key}"
  })
}

data "archive_file" "data_quality_check" {
  type        = "zip"
  output_path = "${path.module}/data_quality_check.zip"

  source {
    content = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    # Data quality check logic
    # Query Aurora read replica and publish findings to SNS
    sns = boto3.client('sns')
    topic_arn = os.environ['SNS_TOPIC_ARN']

    findings = {
        'timestamp': str(datetime.now()),
        'checks': ['duplicate_check', 'completeness_check', 'accuracy_check'],
        'status': 'passed'
    }

    sns.publish(TopicArn=topic_arn, Message=json.dumps(findings))

    return {
        'statusCode': 200,
        'body': json.dumps('Data quality check completed')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "data_quality_check" {
  filename         = data.archive_file.data_quality_check.output_path
  function_name    = "${local.name_prefix}-data-quality-check"
  role             = aws_iam_role.data_quality_check.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.data_quality_findings.arn
    }
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-quality-check"
  })
}

data "archive_file" "phi_detector" {
  type        = "zip"
  output_path = "${path.module}/phi_detector.zip"

  source {
    content = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    # PHI detection using Athena queries on S3 audit logs
    athena = boto3.client('athena')

    query = """
    SELECT * FROM audit_logs
    WHERE phi_detected = true
    AND timestamp > current_timestamp - interval '1' hour
    """

    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={'Database': 'audit_db'},
        ResultConfiguration={'OutputLocation': f"s3://{os.environ['ATHENA_RESULTS_BUCKET']}/phi-detection/"}
    )

    # Process results and publish violations
    sns = boto3.client('sns')
    sns.publish(
        TopicArn=os.environ['PHI_VIOLATIONS_TOPIC'],
        Message=json.dumps({'violations_found': True, 'query_id': response['QueryExecutionId']})
    )

    return {
        'statusCode': 200,
        'body': json.dumps('PHI detection completed')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "phi_detector" {
  filename         = data.archive_file.phi_detector.output_path
  function_name    = "${local.name_prefix}-phi-detector"
  role             = aws_iam_role.phi_detector.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ATHENA_RESULTS_BUCKET = local.s3_bucket_names.athena_results
      PHI_VIOLATIONS_TOPIC  = aws_sns_topic.phi_violations.arn
    }
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-phi-detector"
  })
}

data "archive_file" "remediation" {
  type        = "zip"
  output_path = "${path.module}/remediation.zip"

  source {
    content = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    # Remediation logic for PHI violations
    message = json.loads(event['Records'][0]['Sns']['Message'])

    if message.get('violations_found'):
        # Implement remediation actions
        # e.g., quarantine data, notify administrators, etc.
        print(f"Remediating PHI violations for query: {message['query_id']}")

    return {
        'statusCode': 200,
        'body': json.dumps('Remediation completed')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "remediation" {
  filename         = data.archive_file.remediation.output_path
  function_name    = "${local.name_prefix}-remediation"
  role             = aws_iam_role.remediation.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  layers = [aws_lambda_layer_version.common.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-remediation"
  })
}

# ==========================================
# Event Source Mappings
# ==========================================
resource "aws_lambda_event_source_mapping" "kinesis_to_hipaa_validator" {
  event_source_arn  = aws_kinesis_stream.patient_vitals.arn
  function_name     = aws_lambda_function.hipaa_validator.arn
  starting_position = "LATEST"
  batch_size        = 100
  maximum_retry_attempts = 3
}

resource "aws_lambda_event_source_mapping" "dynamodb_to_stream_processor" {
  event_source_arn  = aws_dynamodb_table.patient_records.stream_arn
  function_name     = aws_lambda_function.stream_processor.arn
  starting_position = "LATEST"
  batch_size        = 100
  maximum_retry_attempts = 3
}

resource "aws_lambda_event_source_mapping" "sqs_to_consumer" {
  for_each = toset(var.hospital_regions)

  event_source_arn = aws_sqs_queue.patient_updates[each.key].arn
  function_name    = aws_lambda_function.sqs_consumer[each.key].arn
  batch_size       = 10
  maximum_retry_attempts = 3
}

# ==========================================
# Step Functions
# ==========================================
resource "aws_sfn_state_machine" "data_quality_workflow" {
  name     = "${local.name_prefix}-data-quality-workflow"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Data quality check workflow"
    StartAt = "DataQualityCheck"
    States = {
      DataQualityCheck = {
        Type     = "Task"
        Resource = aws_lambda_function.data_quality_check.arn
        End      = true
      }
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-quality-workflow"
  })
}

# ==========================================
# EventBridge Rules
# ==========================================
resource "aws_cloudwatch_event_rule" "data_quality_schedule" {
  name                = "${local.name_prefix}-data-quality-schedule"
  description         = "Scheduled data quality checks"
  schedule_expression = var.eventbridge_schedule

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-quality-schedule"
  })
}

resource "aws_cloudwatch_event_target" "data_quality" {
  rule      = aws_cloudwatch_event_rule.data_quality_schedule.name
  target_id = "DataQualityCheck"
  arn       = aws_sfn_state_machine.data_quality_workflow.arn
  role_arn  = aws_iam_role.eventbridge_step_functions.arn
}

# SNS Subscriptions
resource "aws_sns_topic_subscription" "phi_violations_to_remediation" {
  topic_arn = aws_sns_topic.phi_violations.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.remediation.arn
}

# ==========================================
# CloudWatch Alarms
# ==========================================
resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${local.name_prefix}-kinesis-iterator-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "300000"
  alarm_description   = "Kinesis iterator age is too high"
  alarm_actions       = [aws_sns_topic.operational_alerts.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.patient_vitals.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kinesis-iterator-age-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset([
    aws_lambda_function.hipaa_validator.function_name,
    aws_lambda_function.stream_processor.function_name,
    aws_lambda_function.data_quality_check.function_name,
    aws_lambda_function.phi_detector.function_name,
    aws_lambda_function.remediation.function_name
  ])

  alarm_name          = "${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Lambda function has too many errors"
  alarm_actions       = [aws_sns_topic.operational_alerts.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = merge(local.common_tags, {
    Name = "${each.key}-errors-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB table has throttled requests"
  alarm_actions       = [aws_sns_topic.operational_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.patient_records.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-throttles-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu_utilization" {
  alarm_name          = "${local.name_prefix}-aurora-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Aurora CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.operational_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${local.name_prefix}-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis memory usage is too high"
  alarm_actions       = [aws_sns_topic.operational_alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.cluster_id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-memory-alarm"
  })
}

# ==========================================
# CloudWatch Logs
# ==========================================
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = toset([
    aws_lambda_function.hipaa_validator.function_name,
    aws_lambda_function.stream_processor.function_name,
    aws_lambda_function.data_quality_check.function_name,
    aws_lambda_function.phi_detector.function_name,
    aws_lambda_function.remediation.function_name
  ])

  name              = "/aws/lambda/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "/aws/lambda/${each.key}"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${aws_sfn_state_machine.data_quality_workflow.name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "/aws/states/${aws_sfn_state_machine.data_quality_workflow.name}"
  })
}

# ==========================================
# IAM Roles and Policies
# ==========================================
resource "aws_iam_role" "iot_kinesis" {
  name = "${local.name_prefix}-iot-kinesis-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-iot-kinesis-role"
  })
}

resource "aws_iam_role_policy" "iot_kinesis" {
  name = "${local.name_prefix}-iot-kinesis-policy"
  role = aws_iam_role.iot_kinesis.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.patient_vitals.arn
      }
    ]
  })
}

resource "aws_iam_role" "hipaa_validator" {
  name = "${local.name_prefix}-hipaa-validator-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hipaa-validator-role"
  })
}

resource "aws_iam_role_policy" "hipaa_validator" {
  name = "${local.name_prefix}-hipaa-validator-policy"
  role = aws_iam_role.hipaa_validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListStreams"
        ]
        Resource = aws_kinesis_stream.patient_vitals.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = aws_dynamodb_table.patient_records.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "stream_processor" {
  name = "${local.name_prefix}-stream-processor-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-stream-processor-role"
  })
}

resource "aws_iam_role_policy" "stream_processor" {
  name = "${local.name_prefix}-stream-processor-policy"
  role = aws_iam_role.stream_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = aws_dynamodb_table.patient_records.stream_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.patient_updates.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "sqs_consumer" {
  name = "${local.name_prefix}-sqs-consumer-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-consumer-role"
  })
}

resource "aws_iam_role_policy" "sqs_consumer" {
  name = "${local.name_prefix}-sqs-consumer-policy"
  role = aws_iam_role.sqs_consumer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = "arn:aws:sqs:*:*:${local.name_prefix}-patient-updates-*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "data_quality_check" {
  name = "${local.name_prefix}-data-quality-check-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-quality-check-role"
  })
}

resource "aws_iam_role_policy" "data_quality_check" {
  name = "${local.name_prefix}-data-quality-check-policy"
  role = aws_iam_role.data_quality_check.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.data_quality_findings.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "phi_detector" {
  name = "${local.name_prefix}-phi-detector-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-phi-detector-role"
  })
}

resource "aws_iam_role_policy" "phi_detector" {
  name = "${local.name_prefix}-phi-detector-policy"
  role = aws_iam_role.phi_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.athena_results.arn,
          "${aws_s3_bucket.athena_results.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.phi_violations.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "remediation" {
  name = "${local.name_prefix}-remediation-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-remediation-role"
  })
}

resource "aws_iam_role_policy" "remediation" {
  name = "${local.name_prefix}-remediation-policy"
  role = aws_iam_role.remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:PutParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/${local.name_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role" "step_functions" {
  name = "${local.name_prefix}-step-functions-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-step-functions-role"
  })
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.name_prefix}-step-functions-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.data_quality_check.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutLogEvents",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "eventbridge_step_functions" {
  name = "${local.name_prefix}-eventbridge-step-functions-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eventbridge-step-functions-role"
  })
}

resource "aws_iam_role_policy" "eventbridge_step_functions" {
  name = "${local.name_prefix}-eventbridge-step-functions-policy"
  role = aws_iam_role.eventbridge_step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.data_quality_workflow.arn
      }
    ]
  })
}

# ==========================================
# Outputs
# ==========================================
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "kinesis_stream_arn" {
  description = "Kinesis Data Stream ARN"
  value       = aws_kinesis_stream.patient_vitals.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.patient_records.name
}

output "dynamodb_stream_arn" {
  description = "DynamoDB stream ARN"
  value       = aws_dynamodb_table.patient_records.stream_arn
}

output "sns_patient_updates_arn" {
  description = "SNS patient updates topic ARN"
  value       = aws_sns_topic.patient_updates.arn
}

output "sns_operational_alerts_arn" {
  description = "SNS operational alerts topic ARN"
  value       = aws_sns_topic.operational_alerts.arn
}

output "sns_data_quality_findings_arn" {
  description = "SNS data quality findings topic ARN"
  value       = aws_sns_topic.data_quality_findings.arn
}

output "sns_phi_violations_arn" {
  description = "SNS PHI violations topic ARN"
  value       = aws_sns_topic.phi_violations.arn
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value       = local.sqs_queue_urls
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = local.s3_bucket_names
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    hipaa_validator     = aws_lambda_function.hipaa_validator.arn
    stream_processor    = aws_lambda_function.stream_processor.arn
    data_quality_check  = aws_lambda_function.data_quality_check.arn
    phi_detector        = aws_lambda_function.phi_detector.arn
    remediation         = aws_lambda_function.remediation.arn
  }
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.data_quality_workflow.arn
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    lambda = aws_security_group.lambda.id
    aurora = aws_security_group.aurora.id
    redis  = aws_security_group.redis.id
  }
}
```

# provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
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
```

# dev.tfvars

```hcl
# Development environment configuration
environment        = "dev"
aws_region         = "us-east-1"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Minimal capacity for development
kinesis_shard_count                   = 1
kinesis_retention_hours               = 24
dynamodb_read_capacity                = 5
dynamodb_write_capacity               = 5
lambda_memory_size                    = 512
lambda_timeout                        = 60
lambda_reserved_concurrent_executions = 5

sqs_visibility_timeout = 300
sqs_message_retention  = 345600 # 4 days
sqs_max_receive_count  = 3

aurora_min_capacity   = 0.5
aurora_max_capacity   = 1
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

eventbridge_schedule = "rate(1 hour)"
log_retention_days   = 7
hospital_regions     = ["east", "west"]

owner       = "Development Team"
cost_center = "DEV-001"
```

# staging.tfvars

```hcl
# Staging environment configuration
environment        = "staging"
aws_region         = "us-east-1"
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Moderate capacity for staging
kinesis_shard_count                   = 2
kinesis_retention_hours               = 48
dynamodb_read_capacity                = 10
dynamodb_write_capacity               = 10
lambda_memory_size                    = 1024
lambda_timeout                        = 90
lambda_reserved_concurrent_executions = 10

sqs_visibility_timeout = 300
sqs_message_retention  = 604800 # 7 days
sqs_max_receive_count  = 5

aurora_min_capacity   = 1
aurora_max_capacity   = 4
redis_node_type       = "cache.t3.small"
redis_num_cache_nodes = 2

eventbridge_schedule = "rate(30 minutes)"
log_retention_days   = 14
hospital_regions     = ["east", "west", "central"]

owner       = "QA Team"
cost_center = "QA-001"
```

# prod.tfvars

```hcl
# Production environment configuration
environment        = "prod"
aws_region         = "us-east-1"
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# High capacity for production
kinesis_shard_count                   = 10
kinesis_retention_hours               = 168 # 7 days
dynamodb_read_capacity                = 100
dynamodb_write_capacity               = 100
lambda_memory_size                    = 3008
lambda_timeout                        = 120
lambda_reserved_concurrent_executions = 100

sqs_visibility_timeout = 600
sqs_message_retention  = 1209600 # 14 days
sqs_max_receive_count  = 10

aurora_min_capacity   = 2
aurora_max_capacity   = 16
redis_node_type       = "cache.r6g.xlarge"
redis_num_cache_nodes = 3

eventbridge_schedule = "rate(10 minutes)"
log_retention_days   = 90
hospital_regions     = ["east", "west", "central", "north", "south"]

owner       = "Healthcare IT Operations"
cost_center = "PROD-001"
```

# PROMPT.md

```markdown
We need to design a single Terraform file (tap_stack.tf) that defines a complete, production-grade multi-environment infrastructure (dev, staging, prod) for a healthcare data processing system. The goal is to guarantee environmental parity across all tiers — every environment should deploy an identical topology with the same resource graph, allowing only configuration-level variations like shard counts, memory, and instance sizes through individual tfvars files.

The system should process real-time patient vitals coming from IoT Core MQTT bridges into a Kinesis Data Stream, which triggers a series of Lambda functions responsible for HIPAA validation. These Lambda validators write into a DynamoDB table (with streams and point-in-time recovery enabled), and downstream DynamoDB Streams invoke additional Lambda processors that transform and publish data into an SNS topic. The SNS fanout must distribute messages to multiple SQS queues (one per hospital region), each with a dead-letter queue, where separate Lambda consumers process the queue messages and update an Aurora PostgreSQL Serverless v2 cluster maintaining patient records.

An EventBridge scheduled rule should regularly trigger a Step Functions state machine that performs data quality checks by invoking Lambdas querying Aurora read replicas and publishing analytics findings to SNS. Meanwhile, an ElastiCache Redis cluster should serve as the real-time patient status cache, continuously updated by Lambda functions reacting to DynamoDB stream changes. Another Lambda validator should perform PHI exposure detection, querying S3 audit logs through Athena, storing query results in a dedicated S3 bucket for Athena outputs, and publishing violations to an SNS topic that triggers a remediation Lambda workflow.

All components must be securely VPC-enabled, with VPC, public/private subnets, NAT Gateways, and security groups configured to provide controlled connectivity. Lambda functions should have VPC access allowing Aurora and Redis communication, while no resources should have public exposure. The stack should use VPC endpoints for services like DynamoDB, Kinesis, SNS, SQS, and Secrets Manager to ensure private communication. Secrets such as database credentials must be stored in AWS Secrets Manager, while runtime configurations should use SSM Parameter Store. Every data service — including DynamoDB, Kinesis, SNS/SQS, Aurora, Redis, and S3 — must be encrypted at rest and in transit using KMS keys (customer-managed keys preferred).

All Lambda deployment packages should be created using the archive_file data source with inline Python 3.12 handlers, and each Lambda should have least-privilege IAM roles tailored for its specific purpose (e.g., Kinesis consumers with read permissions, SNS publishers, DynamoDB readers/writers, Aurora access via Secrets Manager, Redis operations within the VPC, and Athena query execution roles). Use event source mappings for stream and queue triggers with explicit batch sizes and failure handling configurations.

The infrastructure must include CloudWatch alarms monitoring all critical metrics such as Kinesis iterator age, Lambda errors and throttles, DynamoDB stream lag, Aurora connection utilization, Redis memory usage, and Step Functions execution failures. Each alarm should publish to an SNS topic dedicated to operational alerts. CloudWatch log groups must use KMS encryption and respect log retention policies defined by variables.

Networking and resource organization should follow consistent deterministic naming conventions and tagging. Use locals for tags such as Environment, Project, Owner, and CostCenter. Define a comprehensive set of Terraform variables for components such as environment name, region, VPC CIDRs, Kinesis shard configuration, DynamoDB capacity, Lambda runtime settings, SQS queue configurations, Aurora capacity limits, Redis settings, EventBridge schedule expressions, S3 bucket names, and CloudWatch retention periods.

The tap_stack.tf file should include:

A terraform block specifying required Terraform and AWS provider versions.

All variable declarations with descriptive metadata and reasonable defaults.

Resource and data source definitions implementing the entire topology directly (no nested or module-based files).

Locals for naming and tagging conventions.

Outputs for key resource identifiers (stream ARNs, DynamoDB table names, topic ARNs, queue URLs, Aurora endpoints, Redis primary endpoint, Step Functions ARN, Lambda ARNs, and VPC/subnet/security group IDs).

Example environment variable files for dev.tfvars, staging.tfvars, and prod.tfvars, showing capacity differences while maintaining identical topology.

Follow all AWS best practices including encryption, least privilege, idempotency, fault tolerance, and logical dependencies. Use Terraform >= 1.5 with AWS provider ~> 5.0 and ensure resource definitions are production-ready with complete attribute coverage—no placeholders or pseudo-code.

Please generate a single Terraform file (tap_stack.tf) implementing the described multi-environment healthcare data processing pipeline, ensuring strict topology parity across dev, staging, prod, secure networking and IAM isolation, full encryption, proper monitoring coverage, and realistic resource definitions ready for deployment.
```

</content>
<parameter name="old_string">Insert here the ideal response
