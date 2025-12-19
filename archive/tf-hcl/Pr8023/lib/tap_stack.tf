# tap_stack.tf - Property Management Platform Infrastructure
# Terraform configuration for multi-environment maintenance request workflow

# ===========================
# Variables
# ===========================


# ===========================
# Locals
# ===========================

locals {
  # Naming convention
  name_prefix = "${var.project_name}-${var.env}"

  # Common tags
  tags = merge(
    var.common_tags,
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
    }
  )

  # Environment-specific capacity multipliers
  capacity_multiplier = {
    dev     = 1
    staging = 2
    prod    = 5
  }

  # Calculate environment-adjusted capacities
  env_multiplier = lookup(local.capacity_multiplier, var.env, 1)

  # Lambda function names
  lambda_functions = {
    validator           = "${local.name_prefix}-validator"
    router              = "${local.name_prefix}-router"
    vendor_notifier     = "${local.name_prefix}-vendor-notifier"
    tenant_notifier     = "${local.name_prefix}-tenant-notifier"
    status_processor    = "${local.name_prefix}-status-processor"
    workflow_controller = "${local.name_prefix}-workflow-controller"
    quality_check       = "${local.name_prefix}-quality-check"
    compliance_checker  = "${local.name_prefix}-compliance-checker"
    report_generator    = "${local.name_prefix}-report-generator"
    redis_updater       = "${local.name_prefix}-redis-updater"
    escalation_primary  = "${local.name_prefix}-escalation-primary"
    escalation_backup   = "${local.name_prefix}-escalation-backup"
  }
}

# ===========================
# Data Sources
# ===========================

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "api_gateway_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "step_functions_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "eventbridge_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

# ===========================
# KMS Keys
# ===========================

resource "aws_kms_key" "maintenance_data" {
  description             = "KMS key for encrypting maintenance data"
  deletion_window_in_days = 10

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
          Service = "logs.us-east-1.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_kms_alias" "maintenance_data" {
  name          = "alias/${local.name_prefix}-maintenance-data"
  target_key_id = aws_kms_key.maintenance_data.key_id
}

# ===========================
# VPC and Networking
# ===========================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

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

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.dynamodb"
  route_table_ids = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-dynamodb"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-s3"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-sns"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-sqs"
  })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-states"
  })
}

# Security Groups
resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpce-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpce-sg"
  })
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-aurora-sg"
  description = "Security group for Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

# ===========================
# DynamoDB Tables
# ===========================

resource "aws_dynamodb_table" "maintenance_requests" {
  name           = "${local.name_prefix}-maintenance-requests"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_maintenance_requests_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_maintenance_requests_write_capacity : null
  hash_key       = "request_id"
  range_key      = "property_id"

  attribute {
    name = "request_id"
    type = "S"
  }

  attribute {
    name = "property_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "N"
  }

  global_secondary_index {
    name            = "status-created-index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_maintenance_requests_read_capacity : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_maintenance_requests_write_capacity : null
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-maintenance-requests"
  })
}

resource "aws_dynamodb_table" "vendor_availability" {
  name           = "${local.name_prefix}-vendor-availability"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_availability_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_availability_write_capacity : null
  hash_key       = "vendor_id"
  range_key      = "skill_type"

  attribute {
    name = "vendor_id"
    type = "S"
  }

  attribute {
    name = "skill_type"
    type = "S"
  }

  attribute {
    name = "zone_id"
    type = "S"
  }

  global_secondary_index {
    name            = "zone-skill-index"
    hash_key        = "zone_id"
    range_key       = "skill_type"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_availability_read_capacity : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_availability_write_capacity : null
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vendor-availability"
  })
}

resource "aws_dynamodb_table" "priority_matrix" {
  name           = "${local.name_prefix}-priority-matrix"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_priority_matrix_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_priority_matrix_write_capacity : null
  hash_key       = "request_type"
  range_key      = "property_tier"

  attribute {
    name = "request_type"
    type = "S"
  }

  attribute {
    name = "property_tier"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-priority-matrix"
  })
}

resource "aws_dynamodb_table" "quality_rules" {
  name           = "${local.name_prefix}-quality-rules"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_quality_rules_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_quality_rules_write_capacity : null
  hash_key       = "rule_id"

  attribute {
    name = "rule_id"
    type = "S"
  }

  attribute {
    name = "rule_type"
    type = "S"
  }

  global_secondary_index {
    name            = "type-index"
    hash_key        = "rule_type"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_quality_rules_read_capacity : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_quality_rules_write_capacity : null
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-quality-rules"
  })
}

resource "aws_dynamodb_table" "penalty_rates" {
  name           = "${local.name_prefix}-penalty-rates"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_penalty_rates_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_penalty_rates_write_capacity : null
  hash_key       = "violation_type"

  attribute {
    name = "violation_type"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-penalty-rates"
  })
}

resource "aws_dynamodb_table" "vendor_scores" {
  name           = "${local.name_prefix}-vendor-scores"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_scores_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_vendor_scores_write_capacity : null
  hash_key       = "vendor_id"
  range_key      = "period"

  attribute {
    name = "vendor_id"
    type = "S"
  }

  attribute {
    name = "period"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.maintenance_data.arn
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vendor-scores"
  })
}

# ===========================
# ElastiCache Redis
# ===========================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group-v1"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for geospatial vendor matching"
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_multi_az_enabled ? 2 : var.redis_num_cache_nodes
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
  automatic_failover_enabled = var.redis_multi_az_enabled
  multi_az_enabled           = var.redis_multi_az_enabled

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis"
  })
}

resource "random_password" "redis_auth_token" {
  length           = 32
  special          = true
  override_special = "!&#$^<>-"
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name = "${local.name_prefix}-redis-auth-token"
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}

# ===========================
# Aurora PostgreSQL
# ===========================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "random_password" "aurora_master_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master_password" {
  name = "${local.name_prefix}-aurora-master-password"
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "aurora_master_password" {
  secret_id = aws_secretsmanager_secret.aurora_master_password.id
  secret_string = jsonencode({
    username = var.aurora_master_username
    password = random_password.aurora_master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.aurora_database_name
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-${var.aurora_cluster_identifier}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.8"
  database_name                   = var.aurora_database_name
  master_username                 = var.aurora_master_username
  master_password                 = random_password.aurora_master_password.result
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.maintenance_data.arn
  backup_retention_period         = var.aurora_backup_retention_period
  preferred_backup_window         = var.aurora_preferred_backup_window
  preferred_maintenance_window    = var.aurora_preferred_maintenance_window
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = false
  skip_final_snapshot             = true

  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count                        = var.env == "prod" ? 2 : 1
  identifier                   = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.aurora.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.aurora.engine
  engine_version               = aws_rds_cluster.aurora.engine_version
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.aurora_monitoring.arn

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  })
}

resource "aws_iam_role" "aurora_monitoring" {
  name               = "${local.name_prefix}-aurora-monitoring-role"
  assume_role_policy = data.aws_iam_policy_document.aurora_monitoring_assume_role.json

  tags = local.tags
}

data "aws_iam_policy_document" "aurora_monitoring_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "aurora_monitoring" {
  role       = aws_iam_role.aurora_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ===========================
# SNS Topics
# ===========================

resource "aws_sns_topic" "request_assigned" {
  name              = "${local.name_prefix}-${var.sns_topic_request_assigned}"
  kms_master_key_id = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-request-assigned"
  })
}

resource "aws_sns_topic" "status_updates" {
  name              = "${local.name_prefix}-${var.sns_topic_status_updates}"
  kms_master_key_id = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-status-updates"
  })
}

resource "aws_sns_topic" "compliance_alerts" {
  name              = "${local.name_prefix}-${var.sns_topic_compliance_alerts}"
  kms_master_key_id = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-compliance-alerts"
  })
}

resource "aws_sns_topic" "escalation_alerts" {
  name              = "${local.name_prefix}-${var.sns_topic_escalation_alerts}"
  kms_master_key_id = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-escalation-alerts"
  })
}

# ===========================
# SQS Queues
# ===========================

resource "aws_sqs_queue" "vendor_notifications" {
  name                       = "${local.name_prefix}-${var.sqs_vendor_notifications_queue}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention_seconds
  kms_master_key_id          = aws_kms_key.maintenance_data.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.vendor_notifications_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vendor-notifications"
  })
}

resource "aws_sqs_queue" "vendor_notifications_dlq" {
  name                      = "${local.name_prefix}-${var.sqs_vendor_notifications_queue}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vendor-notifications-dlq"
  })
}

resource "aws_sqs_queue" "tenant_acknowledgments" {
  name                       = "${local.name_prefix}-${var.sqs_tenant_acknowledgments_queue}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention_seconds
  kms_master_key_id          = aws_kms_key.maintenance_data.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.tenant_acknowledgments_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-tenant-acknowledgments"
  })
}

resource "aws_sqs_queue" "tenant_acknowledgments_dlq" {
  name                      = "${local.name_prefix}-${var.sqs_tenant_acknowledgments_queue}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.maintenance_data.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-tenant-acknowledgments-dlq"
  })
}

# SNS to SQS Subscriptions
resource "aws_sns_topic_subscription" "vendor_notifications" {
  topic_arn = aws_sns_topic.request_assigned.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.vendor_notifications.arn

  depends_on = [aws_sqs_queue_policy.vendor_notifications]
}

resource "aws_sns_topic_subscription" "tenant_acknowledgments" {
  topic_arn = aws_sns_topic.request_assigned.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.tenant_acknowledgments.arn

  depends_on = [aws_sqs_queue_policy.tenant_acknowledgments]
}

resource "aws_sqs_queue_policy" "vendor_notifications" {
  queue_url = aws_sqs_queue.vendor_notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.vendor_notifications.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.request_assigned.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "tenant_acknowledgments" {
  queue_url = aws_sqs_queue.tenant_acknowledgments.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.tenant_acknowledgments.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.request_assigned.arn
          }
        }
      }
    ]
  })
}

# ===========================
# S3 Buckets
# ===========================

resource "aws_s3_bucket" "archive" {
  bucket        = "${local.name_prefix}-${var.s3_archive_bucket}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-archive"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.maintenance_data.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "archive" {
  bucket = aws_s3_bucket.archive.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    id     = "expire-old-archives"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.s3_archive_lifecycle_days
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket" "compliance_reports" {
  bucket        = "${local.name_prefix}-${var.s3_compliance_bucket}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-compliance-reports"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.maintenance_data.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    id     = "archive-compliance-reports"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.s3_compliance_lifecycle_days
    }
  }
}

# ===========================
# API Gateway
# ===========================

resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-${var.api_gateway_name}"
  description = "API for maintenance request management"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-api"
  })
}

# Request validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# /request endpoint
resource "aws_api_gateway_resource" "request" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "request"
}

resource "aws_api_gateway_method" "request_post" {
  rest_api_id          = aws_api_gateway_rest_api.main.id
  resource_id          = aws_api_gateway_resource.request.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = var.api_key_required
  request_validator_id = aws_api_gateway_request_validator.main.id
}

resource "aws_api_gateway_integration" "request_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.request.id
  http_method = aws_api_gateway_method.request_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.validator.invoke_arn
}

# /vendor/status endpoint
resource "aws_api_gateway_resource" "vendor" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "vendor"
}

resource "aws_api_gateway_resource" "vendor_status" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.vendor.id
  path_part   = "status"
}

resource "aws_api_gateway_method" "vendor_status_post" {
  rest_api_id          = aws_api_gateway_rest_api.main.id
  resource_id          = aws_api_gateway_resource.vendor_status.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = var.api_key_required
  request_validator_id = aws_api_gateway_request_validator.main.id
}

resource "aws_api_gateway_integration" "vendor_status_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.vendor_status.id
  http_method = aws_api_gateway_method.vendor_status_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.status_processor.invoke_arn
}

# Mock external API endpoints
resource "aws_api_gateway_resource" "mock_sms" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "mock-sms"
}

resource "aws_api_gateway_method" "mock_sms_post" {
  rest_api_id      = aws_api_gateway_rest_api.main.id
  resource_id      = aws_api_gateway_resource.mock_sms.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "mock_sms_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.mock_sms.id
  http_method = aws_api_gateway_method.mock_sms_post.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "mock_sms_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.mock_sms.id
  http_method = aws_api_gateway_method.mock_sms_post.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "mock_sms_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.mock_sms.id
  http_method = aws_api_gateway_method.mock_sms_post.http_method
  status_code = aws_api_gateway_method_response.mock_sms_200.status_code

  response_templates = {
    "application/json" = jsonencode({
      message   = "SMS sent successfully"
      timestamp = "$context.requestTime"
    })
  }
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.request,
      aws_api_gateway_method.request_post,
      aws_api_gateway_integration.request_post,
      aws_api_gateway_resource.vendor_status,
      aws_api_gateway_method.vendor_status_post,
      aws_api_gateway_integration.vendor_status_post,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.api_gateway_stage

  xray_tracing_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-api-stage"
  })
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = var.api_gateway_throttle_rate_limit
    throttling_burst_limit = var.api_gateway_throttle_burst_limit
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = var.env != "prod" ? true : false
  }
}

resource "aws_api_gateway_api_key" "main" {
  name = "${local.name_prefix}-api-key"
  tags = local.tags
}

resource "aws_api_gateway_usage_plan" "main" {
  name = "${local.name_prefix}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  throttle_settings {
    rate_limit  = var.api_gateway_throttle_rate_limit
    burst_limit = var.api_gateway_throttle_burst_limit
  }

  tags = local.tags
}

resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}

# ===========================
# Lambda Functions
# ===========================

# Lambda IAM Roles and Policies
resource "aws_iam_role" "lambda_validator" {
  name               = "${local.name_prefix}-lambda-validator-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_validator" {
  name = "${local.name_prefix}-lambda-validator-policy"
  role = aws_iam_role.lambda_validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:ConditionCheckItem"
        ]
        Resource = aws_dynamodb_table.maintenance_requests.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# Lambda function code
data "archive_file" "lambda_validator" {
  type        = "zip"
  output_path = "/tmp/lambda_validator.zip"

  source {
    content  = <<-EOT
import json
import boto3
import uuid
import time
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${aws_dynamodb_table.maintenance_requests.name}')

def handler(event, context):
    """
    Validates incoming maintenance requests and stores in DynamoDB.
    Checks for required fields and data types.
    """
    try:
        body = json.loads(event['body'])
        
        # Validation logic
        required_fields = ['property_id', 'tenant_id', 'issue_type', 'description']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate request ID and timestamp
        request_id = str(uuid.uuid4())
        timestamp = Decimal(str(time.time()))
        
        # Determine priority based on issue type
        priority = 'emergency' if 'emergency' in body.get('issue_type', '').lower() else 'standard'
        
        # Store in DynamoDB with conditional put to prevent duplicates
        item = {
            'request_id': request_id,
            'property_id': body['property_id'],
            'tenant_id': body['tenant_id'],
            'issue_type': body['issue_type'],
            'description': body['description'],
            'status': 'new',
            'priority': priority,
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(request_id)'
        )
        
        return {
            'statusCode': 201,
            'body': json.dumps({
                'request_id': request_id,
                'status': 'new',
                'message': 'Maintenance request created successfully'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
EOT
    filename = "lambda_validator.py"
  }
}

resource "aws_lambda_function" "validator" {
  filename         = data.archive_file.lambda_validator.output_path
  function_name    = local.lambda_functions.validator
  role             = aws_iam_role.lambda_validator.arn
  handler          = "lambda_validator.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_validator_memory
  timeout          = var.lambda_validator_timeout
  source_code_hash = data.archive_file.lambda_validator.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.maintenance_requests.name
    }
  }

  tags = merge(local.tags, {
    Name = local.lambda_functions.validator
  })
}

# Request Router Lambda
resource "aws_iam_role" "lambda_router" {
  name               = "${local.name_prefix}-lambda-router-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_router" {
  name = "${local.name_prefix}-lambda-router-policy"
  role = aws_iam_role.lambda_router.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.maintenance_requests.arn,
          aws_dynamodb_table.vendor_availability.arn,
          aws_dynamodb_table.priority_matrix.arn,
          "${aws_dynamodb_table.vendor_availability.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.maintenance_requests.arn}/stream/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.request_assigned.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.redis_auth_token.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
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
      }
    ]
  })
}

data "archive_file" "lambda_router" {
  type        = "zip"
  output_path = "/tmp/lambda_router.zip"

  source {
    content  = <<-EOT
import json
import boto3
import redis
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
secrets = boto3.client('secretsmanager')

def get_redis_client():
    """Get Redis client with auth token from Secrets Manager"""
    secret = secrets.get_secret_value(SecretId='${aws_secretsmanager_secret.redis_auth_token.id}')
    auth_token = secret['SecretString']
    
    return redis.Redis(
        host='${aws_elasticache_replication_group.redis.primary_endpoint_address}',
        port=6379,
        password=auth_token,
        ssl=True,
        decode_responses=True
    )

def handler(event, context):
    """
    Routes maintenance requests to appropriate vendors.
    Uses Redis GEORADIUS for geographic matching and DynamoDB for vendor skills.
    Implements priority-based assignment algorithm.
    """
    for record in event['Records']:
        if record['eventName'] != 'INSERT':
            continue
            
        new_image = record['dynamodb']['NewImage']
        
        request_id = new_image['request_id']['S']
        property_id = new_image['property_id']['S']
        issue_type = new_image.get('issue_type', {}).get('S', 'general')
        priority = new_image.get('priority', {}).get('S', 'standard')
        
        # Query vendor availability table by skill type
        vendor_table = dynamodb.Table('${aws_dynamodb_table.vendor_availability.name}')
        response = vendor_table.query(
            IndexName='zone-skill-index',
            KeyConditionExpression='zone_id = :zone AND skill_type = :skill',
            ExpressionAttributeValues={
                ':zone': property_id[:3],  # Zone prefix from property_id
                ':skill': issue_type
            }
        )
        
        vendors = response.get('Items', [])
        
        if not vendors:
            print(f"No vendors available for request {request_id}")
            continue
        
        # Use Redis for geographic matching if coordinates available
        try:
            r = get_redis_client()
            # GEORADIUS query to find vendors within 10km
            # In production, coordinates would come from property data
            nearby_vendors = r.georadius(
                'vendor_locations',
                -73.935242,  # Mock longitude
                40.730610,   # Mock latitude
                10,          # Radius in km
                unit='km',
                withcoord=True,
                withdist=True,
                sort='ASC'   # Sort by distance
            )
            
            # Prioritize by distance if geographic data available
            if nearby_vendors:
                vendor_id = nearby_vendors[0][0]  # Closest vendor
            else:
                vendor_id = vendors[0]['vendor_id']
        except:
            # Fallback to first available vendor
            vendor_id = vendors[0]['vendor_id']
        
        # Update request with assigned vendor
        request_table = dynamodb.Table('${aws_dynamodb_table.maintenance_requests.name}')
        request_table.update_item(
            Key={
                'request_id': request_id,
                'property_id': property_id
            },
            UpdateExpression='SET #status = :status, vendor_id = :vendor_id',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'assigned',
                ':vendor_id': vendor_id
            }
        )
        
        # Publish to SNS for notifications
        message = {
            'request_id': request_id,
            'property_id': property_id,
            'vendor_id': vendor_id,
            'priority': priority,
            'issue_type': issue_type
        }
        
        sns.publish(
            TopicArn='${aws_sns_topic.request_assigned.arn}',
            Message=json.dumps(message),
            Subject=f'Maintenance Request {request_id} Assigned'
        )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_router.py"
  }
}

resource "aws_lambda_function" "router" {
  filename         = data.archive_file.lambda_router.output_path
  function_name    = local.lambda_functions.router
  role             = aws_iam_role.lambda_router.arn
  handler          = "lambda_router.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_router_memory
  timeout          = var.lambda_router_timeout
  source_code_hash = data.archive_file.lambda_router.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.primary_endpoint_address
    }
  }

  tags = merge(local.tags, {
    Name = local.lambda_functions.router
  })
}

# Lambda event source mapping for DynamoDB streams
resource "aws_lambda_event_source_mapping" "router_stream" {
  event_source_arn  = aws_dynamodb_table.maintenance_requests.stream_arn
  function_name     = aws_lambda_function.router.arn
  starting_position = "LATEST"

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT"]
        dynamodb = {
          NewImage = {
            status = {
              S = ["new"]
            }
          }
        }
      })
    }
  }
}

# Vendor Notifier Lambda
resource "aws_iam_role" "lambda_vendor_notifier" {
  name               = "${local.name_prefix}-lambda-vendor-notifier-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_vendor_notifier" {
  name = "${local.name_prefix}-lambda-vendor-notifier-policy"
  role = aws_iam_role.lambda_vendor_notifier.id

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
        Resource = aws_sqs_queue.vendor_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

data "archive_file" "lambda_vendor_notifier" {
  type        = "zip"
  output_path = "/tmp/lambda_vendor_notifier.zip"

  source {
    content  = <<-EOT
import json
import boto3
import urllib3

http = urllib3.PoolManager()

def handler(event, context):
    """
    Sends work order notifications to vendors via external API.
    Processes messages from SQS queue.
    """
    for record in event['Records']:
        message = json.loads(record['body'])
        
        # Parse SNS message
        if 'Message' in message:
            notification_data = json.loads(message['Message'])
        else:
            notification_data = message
        
        # Mock API call to send vendor notification
        api_endpoint = 'https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage}/mock-sms'
        
        payload = {
            'vendor_id': notification_data.get('vendor_id'),
            'request_id': notification_data.get('request_id'),
            'property_id': notification_data.get('property_id'),
            'priority': notification_data.get('priority'),
            'message': f"New work order assigned: {notification_data.get('issue_type')}"
        }
        
        try:
            response = http.request(
                'POST',
                api_endpoint,
                body=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status == 200:
                print(f"Successfully notified vendor {notification_data.get('vendor_id')}")
            else:
                print(f"Failed to notify vendor: {response.status}")
                raise Exception("Notification failed")
                
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            raise
    
    return {'statusCode': 200}
EOT
    filename = "lambda_vendor_notifier.py"
  }
}

resource "aws_lambda_function" "vendor_notifier" {
  filename         = data.archive_file.lambda_vendor_notifier.output_path
  function_name    = local.lambda_functions.vendor_notifier
  role             = aws_iam_role.lambda_vendor_notifier.arn
  handler          = "lambda_vendor_notifier.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_notification_memory
  timeout          = var.lambda_notification_timeout
  source_code_hash = data.archive_file.lambda_vendor_notifier.output_base64sha256

  environment {
    variables = {
      API_ENDPOINT = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage}"
    }
  }

  tags = merge(local.tags, {
    Name = local.lambda_functions.vendor_notifier
  })
}

# SQS to Lambda event source mapping
resource "aws_lambda_event_source_mapping" "vendor_notifier_sqs" {
  event_source_arn = aws_sqs_queue.vendor_notifications.arn
  function_name    = aws_lambda_function.vendor_notifier.arn
  batch_size       = 10
}

# Status Processor Lambda
resource "aws_iam_role" "lambda_status_processor" {
  name               = "${local.name_prefix}-lambda-status-processor-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_status_processor" {
  name = "${local.name_prefix}-lambda-status-processor-policy"
  role = aws_iam_role.lambda_status_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.maintenance_requests.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_master_password.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.status_updates.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_status_processor" {
  type        = "zip"
  output_path = "/tmp/lambda_status_processor.zip"

  source {
    content  = <<-EOT
import json
import boto3
import psycopg2
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
secrets = boto3.client('secretsmanager')

def get_db_connection():
    """Get Aurora PostgreSQL connection using Secrets Manager"""
    secret = secrets.get_secret_value(SecretId='${aws_secretsmanager_secret.aurora_master_password.id}')
    credentials = json.loads(secret['SecretString'])
    
    return psycopg2.connect(
        host=credentials['host'],
        port=credentials['port'],
        database=credentials['dbname'],
        user=credentials['username'],
        password=credentials['password']
    )

def handler(event, context):
    """
    Processes vendor status updates via webhook.
    Updates DynamoDB, logs to Aurora audit table, and publishes to SNS.
    """
    try:
        body = json.loads(event['body'])
        
        request_id = body['request_id']
        property_id = body['property_id']
        vendor_id = body['vendor_id']
        new_status = body['status']
        notes = body.get('notes', '')
        
        # Update DynamoDB
        table = dynamodb.Table('${aws_dynamodb_table.maintenance_requests.name}')
        response = table.update_item(
            Key={
                'request_id': request_id,
                'property_id': property_id
            },
            UpdateExpression='SET #status = :status, updated_at = :timestamp, vendor_notes = :notes',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': new_status,
                ':timestamp': int(datetime.now().timestamp()),
                ':notes': notes
            },
            ReturnValues='ALL_NEW'
        )
        
        # Log to Aurora audit table
        conn = get_db_connection()
        cursor = conn.cursor()
        
        audit_query = """
            INSERT INTO maintenance_audit 
            (request_id, property_id, vendor_id, old_status, new_status, notes, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(audit_query, (
            request_id,
            property_id,
            vendor_id,
            response['Attributes'].get('status', 'unknown'),
            new_status,
            notes,
            datetime.now()
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Publish to SNS
        message = {
            'request_id': request_id,
            'property_id': property_id,
            'vendor_id': vendor_id,
            'status': new_status,
            'timestamp': datetime.now().isoformat()
        }
        
        sns.publish(
            TopicArn='${aws_sns_topic.status_updates.arn}',
            Message=json.dumps(message),
            Subject=f'Status Update: Request {request_id}'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Status updated successfully',
                'request_id': request_id,
                'new_status': new_status
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
EOT
    filename = "lambda_status_processor.py"
  }
}

resource "aws_lambda_function" "status_processor" {
  filename         = data.archive_file.lambda_status_processor.output_path
  function_name    = local.lambda_functions.status_processor
  role             = aws_iam_role.lambda_status_processor.arn
  handler          = "lambda_status_processor.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_status_processor_memory
  timeout          = var.lambda_status_processor_timeout
  source_code_hash = data.archive_file.lambda_status_processor.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  layers = [aws_lambda_layer_version.psycopg2.arn]

  environment {
    variables = {
      AURORA_SECRET_ARN = aws_secretsmanager_secret.aurora_master_password.arn
    }
  }

  tags = merge(local.tags, {
    Name = local.lambda_functions.status_processor
  })
}

# Lambda Layer for psycopg2
data "archive_file" "psycopg2_layer" {
  type        = "zip"
  output_path = "/tmp/psycopg2_layer.zip"

  source {
    content  = "# Placeholder for psycopg2 layer"
    filename = "python/psycopg2_placeholder.txt"
  }
}

resource "aws_lambda_layer_version" "psycopg2" {
  filename            = data.archive_file.psycopg2_layer.output_path
  layer_name          = "${local.name_prefix}-psycopg2-layer"
  compatible_runtimes = [var.lambda_runtime]
  description         = "psycopg2 library for PostgreSQL connections"
  source_code_hash    = data.archive_file.psycopg2_layer.output_base64sha256
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_validator" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_status_processor" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.status_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# ===========================
# Step Functions
# ===========================

resource "aws_iam_role" "step_functions" {
  name               = "${local.name_prefix}-stepfunctions-role"
  assume_role_policy = data.aws_iam_policy_document.step_functions_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.name_prefix}-stepfunctions-policy"
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
          aws_lambda_function.escalation_primary.arn,
          aws_lambda_function.escalation_backup.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.escalation_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.maintenance_requests.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      }
    ]
  })
}

# Escalation Lambda Functions
resource "aws_iam_role" "lambda_escalation" {
  name               = "${local.name_prefix}-lambda-escalation-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_escalation" {
  name = "${local.name_prefix}-lambda-escalation-policy"
  role = aws_iam_role.lambda_escalation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.maintenance_requests.arn,
          aws_dynamodb_table.vendor_availability.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.escalation_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

data "archive_file" "lambda_escalation_primary" {
  type        = "zip"
  output_path = "/tmp/lambda_escalation_primary.zip"

  source {
    content  = <<-EOT
import json
import boto3
import time

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Attempts to assign emergency request to primary vendor.
    Returns success/failure for Step Functions to handle.
    """
    request_id = event['request_id']
    property_id = event['property_id']
    
    # Simulate vendor assignment with timeout possibility
    time.sleep(2)
    
    # In production, this would query vendor availability and assign
    success = True  # Mock success
    
    if success:
        table = dynamodb.Table('${aws_dynamodb_table.maintenance_requests.name}')
        table.update_item(
            Key={'request_id': request_id, 'property_id': property_id},
            UpdateExpression='SET #status = :status, escalation_level = :level',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'escalated_assigned',
                ':level': 1
            }
        )
        
        return {
            'statusCode': 200,
            'vendor_id': 'primary_vendor_001',
            'assignment_time': int(time.time())
        }
    else:
        raise Exception("Primary vendor assignment failed")
EOT
    filename = "lambda_escalation_primary.py"
  }
}

resource "aws_lambda_function" "escalation_primary" {
  filename         = data.archive_file.lambda_escalation_primary.output_path
  function_name    = local.lambda_functions.escalation_primary
  role             = aws_iam_role.lambda_escalation.arn
  handler          = "lambda_escalation_primary.handler"
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 10
  source_code_hash = data.archive_file.lambda_escalation_primary.output_base64sha256

  tags = merge(local.tags, {
    Name = local.lambda_functions.escalation_primary
  })
}

data "archive_file" "lambda_escalation_backup" {
  type        = "zip"
  output_path = "/tmp/lambda_escalation_backup.zip"

  source {
    content  = <<-EOT
import json
import boto3

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Fallback vendor assignment for emergency escalations.
    """
    request_id = event['request_id']
    property_id = event['property_id']
    
    # Query backup vendors
    table = dynamodb.Table('${aws_dynamodb_table.maintenance_requests.name}')
    table.update_item(
        Key={'request_id': request_id, 'property_id': property_id},
        UpdateExpression='SET #status = :status, escalation_level = :level',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'escalated_backup',
            ':level': 2
        }
    )
    
    return {
        'statusCode': 200,
        'vendor_id': 'backup_vendor_002',
        'escalation_level': 2
    }
EOT
    filename = "lambda_escalation_backup.py"
  }
}

resource "aws_lambda_function" "escalation_backup" {
  filename         = data.archive_file.lambda_escalation_backup.output_path
  function_name    = local.lambda_functions.escalation_backup
  role             = aws_iam_role.lambda_escalation.arn
  handler          = "lambda_escalation_backup.handler"
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 10
  source_code_hash = data.archive_file.lambda_escalation_backup.output_base64sha256

  tags = merge(local.tags, {
    Name = local.lambda_functions.escalation_backup
  })
}

# Step Functions State Machine
locals {
  step_functions_definition = templatefile("${path.module}/step_functions_definition.json.tpl", {
    escalation_primary_arn = aws_lambda_function.escalation_primary.arn
    escalation_backup_arn  = aws_lambda_function.escalation_backup.arn
    sns_escalation_arn     = aws_sns_topic.escalation_alerts.arn
    dynamodb_table_name    = aws_dynamodb_table.maintenance_requests.name
  })
}

resource "aws_sfn_state_machine" "emergency_escalation" {
  name     = "${local.name_prefix}-${var.step_function_name}"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Emergency request escalation workflow"
    StartAt = "CheckEmergency"
    States = {
      CheckEmergency = {
        Type = "Choice"
        Choices = [
          {
            Variable     = "$.priority"
            StringEquals = "emergency"
            Next         = "ParallelEscalation"
          }
        ]
        Default = "StandardAssignment"
      }
      ParallelEscalation = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "TryPrimaryVendor"
            States = {
              TryPrimaryVendor = {
                Type           = "Task"
                Resource       = aws_lambda_function.escalation_primary.arn
                TimeoutSeconds = 10
                Retry = [
                  {
                    ErrorEquals     = ["States.TaskFailed", "States.Timeout"]
                    IntervalSeconds = 2
                    MaxAttempts     = var.step_function_retry_attempts
                    BackoffRate     = 2.0
                  }
                ]
                Catch = [
                  {
                    ErrorEquals = ["States.ALL"]
                    Next        = "TryBackupVendor"
                  }
                ]
                End = true
              }
              TryBackupVendor = {
                Type     = "Task"
                Resource = aws_lambda_function.escalation_backup.arn
                End      = true
              }
            }
          },
          {
            StartAt = "NotifyPropertyManager"
            States = {
              NotifyPropertyManager = {
                Type     = "Task"
                Resource = "arn:aws:states:::sns:publish"
                Parameters = {
                  TopicArn = aws_sns_topic.escalation_alerts.arn
                  Message  = "Emergency maintenance request requires immediate attention"
                }
                End = true
              }
            }
          }
        ]
        Next = "UpdatePriority"
      }
      UpdatePriority = {
        Type     = "Task"
        Resource = "arn:aws:states:::dynamodb:updateItem"
        Parameters = {
          TableName = aws_dynamodb_table.maintenance_requests.name
          Key = {
            request_id = {
              "S.$" = "$.request_id"
            }
            property_id = {
              "S.$" = "$.property_id"
            }
          }
          UpdateExpression = "SET priority = :priority"
          ExpressionAttributeValues = {
            ":priority" = {
              S = "critical"
            }
          }
        }
        End = true
      }
      StandardAssignment = {
        Type   = "Pass"
        Result = "Standard request - no escalation needed"
        End    = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-emergency-escalation"
  })
}

# ===========================
# EventBridge Rules
# ===========================

# Emergency request detection
resource "aws_cloudwatch_event_rule" "emergency_requests" {
  name        = "${local.name_prefix}-emergency-requests"
  description = "Trigger Step Functions for emergency maintenance requests"

  event_pattern = jsonencode({
    source = ["aws.dynamodb"]
    detail = {
      eventSource = ["dynamodb.amazonaws.com"]
      eventName   = ["INSERT", "MODIFY"]
      dynamodb = {
        NewImage = {
          priority = {
            S = [var.eventbridge_emergency_pattern]
          }
        }
      }
    }
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "emergency_stepfunctions" {
  rule      = aws_cloudwatch_event_rule.emergency_requests.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.emergency_escalation.arn
  role_arn  = aws_iam_role.eventbridge_stepfunctions.arn
}

resource "aws_iam_role" "eventbridge_stepfunctions" {
  name               = "${local.name_prefix}-eventbridge-stepfunctions-role"
  assume_role_policy = data.aws_iam_policy_document.eventbridge_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "eventbridge_stepfunctions" {
  name = "${local.name_prefix}-eventbridge-stepfunctions-policy"
  role = aws_iam_role.eventbridge_stepfunctions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.emergency_escalation.arn
      }
    ]
  })
}

# Daily compliance check
resource "aws_cloudwatch_event_rule" "compliance_check" {
  name                = "${local.name_prefix}-compliance-check"
  description         = "Daily compliance check for overdue requests"
  schedule_expression = var.eventbridge_compliance_schedule

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "compliance_lambda" {
  rule      = aws_cloudwatch_event_rule.compliance_check.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_checker.arn
}

# Compliance Checker Lambda
resource "aws_iam_role" "lambda_compliance_checker" {
  name               = "${local.name_prefix}-lambda-compliance-checker-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda_compliance_checker" {
  name = "${local.name_prefix}-lambda-compliance-checker-policy"
  role = aws_iam_role.lambda_compliance_checker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_master_password.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.penalty_rates.arn,
          aws_dynamodb_table.vendor_scores.arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.compliance_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.maintenance_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_compliance_checker" {
  type        = "zip"
  output_path = "/tmp/lambda_compliance_checker.zip"

  source {
    content  = <<-EOT
import json
import boto3
import psycopg2
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
secrets = boto3.client('secretsmanager')

def get_db_connection():
    secret = secrets.get_secret_value(SecretId='${aws_secretsmanager_secret.aurora_master_password.id}')
    credentials = json.loads(secret['SecretString'])
    
    return psycopg2.connect(
        host=credentials['host'],
        port=credentials['port'],
        database=credentials['dbname'],
        user=credentials['username'],
        password=credentials['password']
    )

def handler(event, context):
    """
    Daily compliance check for SLA violations.
    Queries Aurora for overdue requests, calculates penalties, updates vendor scores.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query for overdue requests
    overdue_query = """
        SELECT request_id, vendor_id, property_id, created_at, priority
        FROM maintenance_audit
        WHERE status != 'completed' 
        AND created_at < %s
    """
    
    # Check requests older than SLA threshold (24 hours for standard, 4 hours for emergency)
    threshold_time = datetime.now() - timedelta(hours=24)
    cursor.execute(overdue_query, (threshold_time,))
    overdue_requests = cursor.fetchall()
    
    violations = []
    
    for request in overdue_requests:
        request_id, vendor_id, property_id, created_at, priority = request
        
        # Calculate SLA violation duration
        if priority == 'emergency':
            sla_hours = 4
        else:
            sla_hours = 24
            
        violation_hours = (datetime.now() - created_at).total_seconds() / 3600 - sla_hours
        
        if violation_hours > 0:
            # Get penalty rate from DynamoDB
            penalty_table = dynamodb.Table('${aws_dynamodb_table.penalty_rates.name}')
            penalty_response = penalty_table.get_item(
                Key={'violation_type': 'sla_breach'}
            )
            
            penalty_rate = penalty_response.get('Item', {}).get('rate', 50)
            penalty_amount = penalty_rate * violation_hours
            
            # Update vendor score
            scores_table = dynamodb.Table('${aws_dynamodb_table.vendor_scores.name}')
            period = datetime.now().strftime('%Y-%m')
            
            scores_table.update_item(
                Key={
                    'vendor_id': vendor_id,
                    'period': period
                },
                UpdateExpression='ADD violations :val, penalties :penalty',
                ExpressionAttributeValues={
                    ':val': 1,
                    ':penalty': int(penalty_amount)
                }
            )
            
            violations.append({
                'request_id': request_id,
                'vendor_id': vendor_id,
                'violation_hours': violation_hours,
                'penalty_amount': penalty_amount
            })
    
    cursor.close()
    conn.close()
    
    if violations:
        # Publish violations to SNS
        message = {
            'timestamp': datetime.now().isoformat(),
            'violations_count': len(violations),
            'violations': violations
        }
        
        sns.publish(
            TopicArn='${aws_sns_topic.compliance_alerts.arn}',
            Message=json.dumps(message),
            Subject='Daily Compliance Report - SLA Violations Detected'
        )
    
    return {
        'statusCode': 200,
        'violations_found': len(violations)
    }
EOT
    filename = "lambda_compliance_checker.py"
  }
}

resource "aws_lambda_function" "compliance_checker" {
  filename         = data.archive_file.lambda_compliance_checker.output_path
  function_name    = local.lambda_functions.compliance_checker
  role             = aws_iam_role.lambda_compliance_checker.arn
  handler          = "lambda_compliance_checker.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_compliance_checker_memory
  timeout          = var.lambda_compliance_checker_timeout
  source_code_hash = data.archive_file.lambda_compliance_checker.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  layers = [aws_lambda_layer_version.psycopg2.arn]

  environment {
    variables = {
      AURORA_SECRET_ARN = aws_secretsmanager_secret.aurora_master_password.arn
    }
  }

  tags = merge(local.tags, {
    Name = local.lambda_functions.compliance_checker
  })
}

resource "aws_lambda_permission" "eventbridge_compliance" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_check.arn
}

# ===========================
# CloudWatch Monitoring
# ===========================

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.maintenance_data.arn

  depends_on = [aws_kms_key.maintenance_data]

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_validator" {
  name              = "/aws/lambda/${local.lambda_functions.validator}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.maintenance_data.arn

  depends_on = [aws_kms_key.maintenance_data]

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_router" {
  name              = "/aws/lambda/${local.lambda_functions.router}-v1"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.maintenance_data.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${local.name_prefix}-redis-v1"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.name_prefix}-emergency-escalation"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.maintenance_data.arn

  depends_on = [aws_kms_key.maintenance_data]

  tags = local.tags
}

# Alarms
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cloudwatch_alarm_api_error_threshold
  alarm_description   = "API Gateway error rate too high"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.name_prefix}-lambda-router-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Average"
  threshold           = var.cloudwatch_alarm_lambda_duration_threshold
  alarm_description   = "Lambda router function duration too high"

  dimensions = {
    FunctionName = aws_lambda_function.router.function_name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConditionalCheckFailedRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.cloudwatch_alarm_dynamodb_throttle_threshold
  alarm_description   = "DynamoDB conditional check failures indicating concurrent assignment conflicts"

  dimensions = {
    TableName = aws_dynamodb_table.maintenance_requests.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_message_age" {
  alarm_name          = "${local.name_prefix}-sqs-vendor-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = var.cloudwatch_alarm_sqs_age_threshold
  alarm_description   = "SQS messages are not being processed quickly enough"

  dimensions = {
    QueueName = aws_sqs_queue.vendor_notifications.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "step_functions_failures" {
  alarm_name          = "${local.name_prefix}-stepfunctions-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.cloudwatch_alarm_stepfunctions_failure_threshold
  alarm_description   = "Step Functions execution failures"

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.emergency_escalation.arn
  }

  tags = local.tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-operations"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "Avg Duration" }, { FunctionName = aws_lambda_function.router.function_name }],
            [".", ".", { stat = "Maximum", label = "Max Duration" }, { FunctionName = aws_lambda_function.router.function_name }],
            [".", "Errors", { stat = "Sum", label = "Errors" }, { FunctionName = aws_lambda_function.router.function_name }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Lambda Router Performance"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.maintenance_requests.name }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.maintenance_requests.name }],
            [".", "ConditionalCheckFailedRequests", { stat = "Sum" }, { TableName = aws_dynamodb_table.maintenance_requests.name }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "DynamoDB Performance"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", { stat = "Sum" }, { QueueName = aws_sqs_queue.vendor_notifications.name }],
            [".", "NumberOfMessagesReceived", { stat = "Sum" }, { QueueName = aws_sqs_queue.vendor_notifications.name }],
            [".", "ApproximateAgeOfOldestMessage", { stat = "Maximum" }, { QueueName = aws_sqs_queue.vendor_notifications.name }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "SQS Queue Metrics"
          period = 300
        }
      }
    ]
  })
}

# ===========================
# Outputs
# ===========================

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_api_key_id" {
  description = "API Gateway API key ID"
  value       = aws_api_gateway_api_key.main.id
  sensitive   = true
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    maintenance_requests = aws_dynamodb_table.maintenance_requests.name
    vendor_availability  = aws_dynamodb_table.vendor_availability.name
    priority_matrix      = aws_dynamodb_table.priority_matrix.name
    quality_rules        = aws_dynamodb_table.quality_rules.name
    penalty_rates        = aws_dynamodb_table.penalty_rates.name
    vendor_scores        = aws_dynamodb_table.vendor_scores.name
  }
}

output "sns_topics" {
  description = "SNS topic ARNs"
  value = {
    request_assigned  = aws_sns_topic.request_assigned.arn
    status_updates    = aws_sns_topic.status_updates.arn
    compliance_alerts = aws_sns_topic.compliance_alerts.arn
    escalation_alerts = aws_sns_topic.escalation_alerts.arn
  }
}

output "sqs_queues" {
  description = "SQS queue URLs"
  value = {
    vendor_notifications   = aws_sqs_queue.vendor_notifications.url
    tenant_acknowledgments = aws_sqs_queue.tenant_acknowledgments.url
  }
}

output "aurora_endpoints" {
  description = "Aurora database endpoints"
  value = {
    cluster_endpoint = aws_rds_cluster.aurora.endpoint
    reader_endpoint  = aws_rds_cluster.aurora.reader_endpoint
  }
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.emergency_escalation.arn
}

output "lambda_functions" {
  description = "Lambda function ARNs"
  value = {
    validator          = aws_lambda_function.validator.arn
    router             = aws_lambda_function.router.arn
    vendor_notifier    = aws_lambda_function.vendor_notifier.arn
    status_processor   = aws_lambda_function.status_processor.arn
    compliance_checker = aws_lambda_function.compliance_checker.arn
    escalation_primary = aws_lambda_function.escalation_primary.arn
    escalation_backup  = aws_lambda_function.escalation_backup.arn
  }
}

output "s3_buckets" {
  description = "S3 bucket names"
  value = {
    archive            = aws_s3_bucket.archive.id
    compliance_reports = aws_s3_bucket.compliance_reports.id
  }
}

output "eventbridge_rules" {
  description = "EventBridge rule names"
  value = {
    emergency_requests = aws_cloudwatch_event_rule.emergency_requests.name
    compliance_check   = aws_cloudwatch_event_rule.compliance_check.name
  }
}

output "vpc_configuration" {
  description = "VPC configuration details"
  value = {
    vpc_id             = aws_vpc.main.id
    public_subnet_ids  = aws_subnet.public[*].id
    private_subnet_ids = aws_subnet.private[*].id
    lambda_sg_id       = aws_security_group.lambda.id
    redis_sg_id        = aws_security_group.redis.id
    aurora_sg_id       = aws_security_group.aurora.id
  }
}