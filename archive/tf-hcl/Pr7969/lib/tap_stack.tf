################################################################################
# Locals - Naming Conventions and Environment-Specific Configurations
################################################################################

locals {
  # Standardized naming
  name_prefix = "${var.project_name}-${var.env}"

  # Common tags for all resources
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

  # Per-environment capacity configurations
  capacity_map = {
    dev = {
      kinesis_shards = {
        diagnostics = 2
        hos         = 1
        gps         = 2
      }
      lambda_memory = {
        processor  = 512
        anomaly    = 1024
        predictive = 2048
      }
      redis_nodes = 1
      aurora_min  = 0.5
      aurora_max  = 1
    }
    staging = {
      kinesis_shards = {
        diagnostics = 5
        hos         = 3
        gps         = 4
      }
      lambda_memory = {
        processor  = 1024
        anomaly    = 1536
        predictive = 2560
      }
      redis_nodes = 2
      aurora_min  = 0.5
      aurora_max  = 2
    }
    prod = {
      kinesis_shards = {
        diagnostics = var.diagnostics_shard_count
        hos         = var.hos_shard_count
        gps         = var.gps_shard_count
      }
      lambda_memory = {
        processor  = var.processor_memory
        anomaly    = var.anomaly_memory
        predictive = var.predictive_memory
      }
      redis_nodes = var.num_cache_clusters
      aurora_min  = var.min_capacity
      aurora_max  = var.max_capacity
    }
  }

  # Stream configurations
  kinesis_streams = {
    diagnostics = {
      name        = var.diagnostics_stream_name
      shard_count = local.capacity_map[var.env].kinesis_shards.diagnostics
    }
    hos = {
      name        = var.hos_stream_name
      shard_count = local.capacity_map[var.env].kinesis_shards.hos
    }
    gps = {
      name        = var.gps_stream_name
      shard_count = local.capacity_map[var.env].kinesis_shards.gps
    }
  }

  # Availability zones
  azs = data.aws_availability_zones.available.names
}

################################################################################
# Data Sources
################################################################################

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

################################################################################
# KMS Keys for Encryption
################################################################################

resource "aws_kms_key" "telematics" {
  description             = "KMS key for fleet telematics data encryption"
  deletion_window_in_days = 7
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

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-kms"
    }
  )
}

resource "aws_kms_alias" "telematics" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.telematics.key_id

  lifecycle {
    create_before_destroy = true
  }
}

################################################################################
# VPC and Networking
################################################################################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-igw"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  domain = "vpc"

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-eip-${count.index + 1}"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-nat-${count.index + 1}"
    }
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
    local.tags,
    {
      Name = "${local.name_prefix}-public-rt"
    }
  )
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-lambda-sg"
    }
  )
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.name_prefix}-redis-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for ElastiCache Redis"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-redis-sg"
    }
  )
}

resource "aws_security_group" "aurora" {
  name_prefix = "${local.name_prefix}-aurora-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora PostgreSQL"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-sg"
    }
  )
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-dynamodb-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-s3-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "kinesis" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-kinesis-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-sns-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-sqs-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "sagemaker_runtime" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sagemaker.runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-sagemaker-runtime-endpoint"
    }
  )
}

################################################################################
# Kinesis Data Streams - Core Data Ingestion
################################################################################

resource "aws_kinesis_stream" "telematics" {
  for_each = local.kinesis_streams

  name = "${local.name_prefix}-${each.value.name}"

  # Stream mode configuration
  stream_mode_details {
    stream_mode = var.stream_mode
  }

  # Shard configuration only for PROVISIONED mode
  shard_count = var.stream_mode == "PROVISIONED" ? each.value.shard_count : null

  retention_period = var.retention_hours

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.telematics.arn

  tags = merge(
    local.tags,
    {
      Name   = "${local.name_prefix}-${each.value.name}"
      Stream = each.key
    }
  )
}

################################################################################
# DynamoDB Tables - Data Storage Layer
################################################################################

# Vehicle Diagnostics Table - Stores OBD-II data
resource "aws_dynamodb_table" "vehicle_diagnostics" {
  name         = "${local.name_prefix}-${var.diagnostics_table}"
  billing_mode = var.billing_mode

  # Only set if PROVISIONED
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key  = "vehicle_id"
  range_key = "timestamp"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  # Enable DynamoDB Streams for triggering downstream processing
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # TTL for automatic data cleanup after 30 days
  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.diagnostics_table}"
    }
  )
}

# Alert Thresholds Table - Vehicle-specific calibrations
resource "aws_dynamodb_table" "alert_thresholds" {
  name         = "${local.name_prefix}-${var.thresholds_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key = "vehicle_type"

  attribute {
    name = "vehicle_type"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.thresholds_table}"
    }
  )
}

# Predicted Failures Table - ML predictions with confidence scores
resource "aws_dynamodb_table" "predicted_failures" {
  name         = "${local.name_prefix}-${var.predictions_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key  = "vehicle_id"
  range_key = "prediction_timestamp"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "prediction_timestamp"
    type = "N"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.predictions_table}"
    }
  )
}

# Driver Logs Table - HOS tracking
resource "aws_dynamodb_table" "driver_logs" {
  name         = "${local.name_prefix}-${var.driver_logs_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key  = "driver_id"
  range_key = "log_timestamp"

  attribute {
    name = "driver_id"
    type = "S"
  }

  attribute {
    name = "log_timestamp"
    type = "N"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.driver_logs_table}"
    }
  )
}

# DOT Compliance Rules Table
resource "aws_dynamodb_table" "compliance_rules" {
  name         = "${local.name_prefix}-${var.compliance_rules_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key = "rule_id"

  attribute {
    name = "rule_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.compliance_rules_table}"
    }
  )
}

# Vehicle Locations Table with Geohash GSI
resource "aws_dynamodb_table" "vehicle_locations" {
  name         = "${local.name_prefix}-${var.locations_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key  = "vehicle_id"
  range_key = "timestamp"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "geohash"
    type = "S"
  }

  # Global Secondary Index for spatial queries
  global_secondary_index {
    name            = "geohash-index"
    hash_key        = "geohash"
    projection_type = "ALL"

    read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
    write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.locations_table}"
    }
  )
}

# Geofences Table
resource "aws_dynamodb_table" "geofences" {
  name         = "${local.name_prefix}-${var.geofences_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key = "geofence_id"

  attribute {
    name = "geofence_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.geofences_table}"
    }
  )
}

# Compliance Status Table
resource "aws_dynamodb_table" "compliance_status" {
  name         = "${local.name_prefix}-${var.compliance_status_table}"
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.wcu : null

  hash_key  = "fleet_id"
  range_key = "report_date"

  attribute {
    name = "fleet_id"
    type = "S"
  }

  attribute {
    name = "report_date"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.telematics.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.compliance_status_table}"
    }
  )
}

################################################################################
# ElastiCache Redis - Real-time Analytics Cache
################################################################################

resource "random_password" "redis_auth_token" {
  length           = 32
  special          = true
  override_special = "!&#$^<>-"
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name_prefix             = "${local.name_prefix}-redis-auth-"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-redis-auth-token"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-redis-subnet-group"
    }
  )
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.name_prefix}-redis"
  description          = "Redis cluster for real-time telematics analytics"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_clusters   = local.capacity_map[var.env].redis_nodes
  parameter_group_name = "default.redis7"

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.telematics.id
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  automatic_failover_enabled = local.capacity_map[var.env].redis_nodes > 1
  multi_az_enabled           = local.capacity_map[var.env].redis_nodes > 1

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-redis"
    }
  )
}

################################################################################
# Aurora PostgreSQL - Historical Data Storage
################################################################################

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-subnet-group"
    }
  )
}

resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name_prefix             = "${local.name_prefix}-aurora-master-"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-master-secret"
    }
  )
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora_master.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "${local.name_prefix}-${var.cluster_identifier}"

  engine         = "aurora-postgresql"
  engine_mode    = "provisioned"
  engine_version = "15.8"

  database_name   = var.database_name
  master_username = var.master_username
  master_password = random_password.aurora_master.result

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  serverlessv2_scaling_configuration {
    min_capacity = local.capacity_map[var.env].aurora_min
    max_capacity = local.capacity_map[var.env].aurora_max
  }

  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.telematics.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-cluster"
    }
  )
}

resource "aws_rds_cluster_instance" "aurora" {
  count = 2

  identifier         = "${local.name_prefix}-aurora-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id

  instance_class = "db.serverless"
  engine         = aws_rds_cluster.aurora.engine
  engine_version = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.telematics.arn

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
    }
  )
}

################################################################################
# SNS Topics - Event Distribution
################################################################################

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-${var.alerts_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.alerts_topic}"
    }
  )
}

resource "aws_sns_topic" "maintenance" {
  name              = "${local.name_prefix}-${var.maintenance_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.maintenance_topic}"
    }
  )
}

resource "aws_sns_topic" "violations" {
  name              = "${local.name_prefix}-${var.violations_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.violations_topic}"
    }
  )
}

resource "aws_sns_topic" "summary" {
  name              = "${local.name_prefix}-${var.summary_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.summary_topic}"
    }
  )
}

resource "aws_sns_topic" "geofence" {
  name              = "${local.name_prefix}-${var.geofence_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.geofence_topic}"
    }
  )
}

resource "aws_sns_topic" "coaching" {
  name              = "${local.name_prefix}-${var.coaching_topic}"
  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.coaching_topic}"
    }
  )
}

################################################################################
# SQS Queues - Message Processing
################################################################################

# Maintenance Queue with DLQ
resource "aws_sqs_queue" "maintenance" {
  name                       = "${local.name_prefix}-${var.maintenance_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_seconds

  kms_master_key_id = aws_kms_key.telematics.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.maintenance_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.maintenance_queue}"
    }
  )
}

resource "aws_sqs_queue" "maintenance_dlq" {
  name = "${local.name_prefix}-${var.maintenance_queue}-dlq"

  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.maintenance_queue}-dlq"
    }
  )
}

# Driver Notifications Queue with DLQ
resource "aws_sqs_queue" "driver" {
  name                       = "${local.name_prefix}-${var.driver_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_seconds

  kms_master_key_id = aws_kms_key.telematics.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.driver_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.driver_queue}"
    }
  )
}

resource "aws_sqs_queue" "driver_dlq" {
  name = "${local.name_prefix}-${var.driver_queue}-dlq"

  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.driver_queue}-dlq"
    }
  )
}

# Fleet Manager Queue with DLQ
resource "aws_sqs_queue" "fleet" {
  name                       = "${local.name_prefix}-${var.fleet_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_seconds

  kms_master_key_id = aws_kms_key.telematics.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fleet_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.fleet_queue}"
    }
  )
}

resource "aws_sqs_queue" "fleet_dlq" {
  name = "${local.name_prefix}-${var.fleet_queue}-dlq"

  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.fleet_queue}-dlq"
    }
  )
}

# Driver Training Queue with DLQ
resource "aws_sqs_queue" "training" {
  name                       = "${local.name_prefix}-${var.training_queue}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_seconds

  kms_master_key_id = aws_kms_key.telematics.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.training_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.training_queue}"
    }
  )
}

resource "aws_sqs_queue" "training_dlq" {
  name = "${local.name_prefix}-${var.training_queue}-dlq"

  kms_master_key_id = aws_kms_key.telematics.id

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.training_queue}-dlq"
    }
  )
}

# SNS to SQS Subscriptions
resource "aws_sns_topic_subscription" "alerts_to_maintenance" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.maintenance.arn

  filter_policy = jsonencode({
    alert_type = ["maintenance"]
  })
}

resource "aws_sns_topic_subscription" "alerts_to_driver" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.driver.arn

  filter_policy = jsonencode({
    severity = ["high", "critical"]
  })
}

resource "aws_sns_topic_subscription" "alerts_to_fleet" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.fleet.arn
}

resource "aws_sns_topic_subscription" "coaching_to_training" {
  topic_arn = aws_sns_topic.coaching.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.training.arn
}

# SQS Queue Policies
resource "aws_sqs_queue_policy" "maintenance" {
  queue_url = aws_sqs_queue.maintenance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.maintenance.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.alerts.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "driver" {
  queue_url = aws_sqs_queue.driver.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.driver.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.alerts.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "fleet" {
  queue_url = aws_sqs_queue.fleet.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.fleet.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.alerts.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "training" {
  queue_url = aws_sqs_queue.training.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.training.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.coaching.arn
          }
        }
      }
    ]
  })
}

################################################################################
# S3 Buckets - Data Lake and Reports Storage
################################################################################

resource "aws_s3_bucket" "reports" {
  bucket        = "${local.name_prefix}-${var.reports_bucket}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.reports_bucket}"
    }
  )
}

resource "aws_s3_bucket_versioning" "reports" {
  bucket = aws_s3_bucket.reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.telematics.arn
    }
  }
}

# Object Lock for regulatory compliance
resource "aws_s3_bucket_object_lock_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 2555 # 7 years for DOT compliance
    }
  }
}

resource "aws_s3_bucket" "data_lake" {
  bucket        = "${local.name_prefix}-${var.data_lake_bucket}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.data_lake_bucket}"
    }
  )
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.telematics.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.lifecycle_archive_days
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket" "athena_results" {
  bucket        = "${local.name_prefix}-${var.output_bucket}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.output_bucket}"
    }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.telematics.arn
    }
  }
}

################################################################################
# IAM Roles and Policies
################################################################################

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution"

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

# Lambda VPC Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Kinesis Processing Policy
resource "aws_iam_policy" "lambda_kinesis" {
  name = "${local.name_prefix}-lambda-kinesis"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:DescribeStreamSummary",
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:ListShards",
          "kinesis:ListStreams",
          "kinesis:SubscribeToShard"
        ]
        Resource = [
          for stream in aws_kinesis_stream.telematics : stream.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_kinesis" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kinesis.arn
}

# Lambda DynamoDB Policy
resource "aws_iam_policy" "lambda_dynamodb" {
  name = "${local.name_prefix}-lambda-dynamodb"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.vehicle_diagnostics.arn,
          "${aws_dynamodb_table.vehicle_diagnostics.arn}/*",
          aws_dynamodb_table.alert_thresholds.arn,
          aws_dynamodb_table.predicted_failures.arn,
          aws_dynamodb_table.driver_logs.arn,
          aws_dynamodb_table.compliance_rules.arn,
          aws_dynamodb_table.vehicle_locations.arn,
          "${aws_dynamodb_table.vehicle_locations.arn}/*",
          aws_dynamodb_table.geofences.arn,
          aws_dynamodb_table.compliance_status.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

# Lambda SNS/SQS Policy
resource "aws_iam_policy" "lambda_messaging" {
  name = "${local.name_prefix}-lambda-messaging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts.arn,
          aws_sns_topic.maintenance.arn,
          aws_sns_topic.violations.arn,
          aws_sns_topic.summary.arn,
          aws_sns_topic.geofence.arn,
          aws_sns_topic.coaching.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ReceiveMessage",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.maintenance.arn,
          aws_sqs_queue.driver.arn,
          aws_sqs_queue.fleet.arn,
          aws_sqs_queue.training.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_messaging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_messaging.arn
}

# Lambda Redis/Aurora Policy
resource "aws_iam_policy" "lambda_datastore" {
  name = "${local.name_prefix}-lambda-datastore"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticache:Describe*",
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_datastore" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_datastore.arn
}

# Lambda S3 Policy
resource "aws_iam_policy" "lambda_s3" {
  name = "${local.name_prefix}-lambda-s3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.reports.arn}/*",
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

# Lambda SageMaker Policy
resource "aws_iam_policy" "lambda_sagemaker" {
  name = "${local.name_prefix}-lambda-sagemaker"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = "arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:endpoint/${var.predictive_endpoint_name}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sagemaker" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_sagemaker.arn
}

# Lambda KMS Policy
resource "aws_iam_policy" "lambda_kms" {
  name = "${local.name_prefix}-lambda-kms"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.telematics.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}

# Step Functions Role
resource "aws_iam_role" "step_functions" {
  name = "${local.name_prefix}-step-functions"

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

resource "aws_iam_policy" "step_functions" {
  name = "${local.name_prefix}-step-functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "step_functions" {
  role       = aws_iam_role.step_functions.name
  policy_arn = aws_iam_policy.step_functions.arn
}

# Firehose Role
resource "aws_iam_role" "firehose" {
  name = "${local.name_prefix}-firehose"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_policy" "firehose" {
  name = "${local.name_prefix}-firehose"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards"
        ]
        Resource = aws_kinesis_stream.telematics["diagnostics"].arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.telematics.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.firehose_processor.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "firehose" {
  role       = aws_iam_role.firehose.name
  policy_arn = aws_iam_policy.firehose.arn
}

# Glue Crawler Role
resource "aws_iam_role" "glue_crawler" {
  name = "${local.name_prefix}-glue-crawler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "glue_crawler" {
  role       = aws_iam_role.glue_crawler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_policy" "glue_crawler_s3" {
  name = "${local.name_prefix}-glue-crawler-s3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_crawler_s3" {
  role       = aws_iam_role.glue_crawler.name
  policy_arn = aws_iam_policy.glue_crawler_s3.arn
}

################################################################################
# Lambda Functions - Processing Pipeline
################################################################################

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = {
    diagnostics_processor  = "diagnostics-processor"
    anomaly_detector       = "anomaly-detector"
    maintenance_handler    = "maintenance-handler"
    driver_notifier        = "driver-notifier"
    fleet_manager          = "fleet-manager"
    predictive_maintenance = "predictive-maintenance"
    hos_processor          = "hos-processor"
    location_processor     = "location-processor"
    fuel_analytics         = "fuel-analytics"
    coaching_handler       = "coaching-handler"
    compliance_reporter    = "compliance-reporter"
    firehose_processor     = "firehose-processor"
  }

  name              = "/aws/lambda/${local.name_prefix}-${each.value}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.telematics.arn

  depends_on = [aws_kms_key.telematics]

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${each.value}-logs"
    }
  )
}

# Diagnostics Stream Processor Lambda
resource "aws_lambda_function" "diagnostics_processor" {
  function_name = "${local.name_prefix}-diagnostics-processor"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = local.capacity_map[var.env].lambda_memory.processor

  environment {
    variables = {
      DIAGNOSTICS_TABLE = aws_dynamodb_table.vehicle_diagnostics.name
      THRESHOLDS_TABLE  = aws_dynamodb_table.alert_thresholds.name
      ENVIRONMENT       = var.env
    }
  }

  # VPC configuration for secure access
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  # Inline code for OBD-II data parsing and validation
  filename         = "${path.module}/lambda/diagnostics_processor.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/diagnostics_processor.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-diagnostics-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["diagnostics_processor"]]
}

# Anomaly Detection Lambda
resource "aws_lambda_function" "anomaly_detector" {
  function_name = "${local.name_prefix}-anomaly-detector"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = local.capacity_map[var.env].lambda_memory.anomaly


  environment {
    variables = {
      THRESHOLDS_TABLE = aws_dynamodb_table.alert_thresholds.name
      REDIS_ENDPOINT   = aws_elasticache_replication_group.redis.primary_endpoint_address
      SNS_TOPIC_ARN    = aws_sns_topic.alerts.arn
      ENVIRONMENT      = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/anomaly_detector.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/anomaly_detector.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-anomaly-detector"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["anomaly_detector"]]
}

# Maintenance Handler Lambda
resource "aws_lambda_function" "maintenance_handler" {
  function_name = "${local.name_prefix}-maintenance-handler"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.maintenance_memory


  environment {
    variables = {
      AURORA_SECRET_ARN = aws_secretsmanager_secret.aurora_master.arn
      AURORA_ENDPOINT   = aws_rds_cluster.aurora.endpoint
      ENVIRONMENT       = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/maintenance_handler.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/maintenance_handler.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-maintenance-handler"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["maintenance_handler"]]
}

# Driver Notifier Lambda
resource "aws_lambda_function" "driver_notifier" {
  function_name = "${local.name_prefix}-driver-notifier"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.driver_notifier_memory


  environment {
    variables = {
      API_ENDPOINT = "https://api.example.com/telematics" # Mocked external API
      ENVIRONMENT  = var.env
    }
  }

  filename         = "${path.module}/lambda/driver_notifier.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/driver_notifier.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-driver-notifier"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["driver_notifier"]]
}

# Fleet Manager Lambda
resource "aws_lambda_function" "fleet_manager" {
  function_name = "${local.name_prefix}-fleet-manager"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.fleet_memory


  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.primary_endpoint_address
      ENVIRONMENT    = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/fleet_manager.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/fleet_manager.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-fleet-manager"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["fleet_manager"]]
}

# Predictive Maintenance Lambda
resource "aws_lambda_function" "predictive_maintenance" {
  function_name = "${local.name_prefix}-predictive-maintenance"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = local.capacity_map[var.env].lambda_memory.predictive


  environment {
    variables = {
      SAGEMAKER_ENDPOINT = var.predictive_endpoint_name
      PREDICTIONS_TABLE  = aws_dynamodb_table.predicted_failures.name
      SNS_TOPIC_ARN      = aws_sns_topic.maintenance.arn
      AURORA_SECRET_ARN  = aws_secretsmanager_secret.aurora_master.arn
      ENVIRONMENT        = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/predictive_maintenance.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/predictive_maintenance.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-predictive-maintenance"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["predictive_maintenance"]]
}

# HOS Processor Lambda - DOT compliance
resource "aws_lambda_function" "hos_processor" {
  function_name = "${local.name_prefix}-hos-processor"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.hos_memory


  environment {
    variables = {
      COMPLIANCE_RULES_TABLE = aws_dynamodb_table.compliance_rules.name
      DRIVER_LOGS_TABLE      = aws_dynamodb_table.driver_logs.name
      SNS_TOPIC_ARN          = aws_sns_topic.violations.arn
      ENVIRONMENT            = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/hos_processor.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/hos_processor.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-hos-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["hos_processor"]]
}

# Location Processor Lambda
resource "aws_lambda_function" "location_processor" {
  function_name = "${local.name_prefix}-location-processor"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.location_memory


  environment {
    variables = {
      LOCATIONS_TABLE = aws_dynamodb_table.vehicle_locations.name
      GEOFENCES_TABLE = aws_dynamodb_table.geofences.name
      REDIS_ENDPOINT  = aws_elasticache_replication_group.redis.primary_endpoint_address
      SNS_TOPIC_ARN   = aws_sns_topic.geofence.arn
      ENVIRONMENT     = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/location_processor.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/location_processor.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-location-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["location_processor"]]
}

# Fuel Analytics Lambda
resource "aws_lambda_function" "fuel_analytics" {
  function_name = "${local.name_prefix}-fuel-analytics"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.fuel_memory


  environment {
    variables = {
      AURORA_SECRET_ARN = aws_secretsmanager_secret.aurora_master.arn
      REDIS_ENDPOINT    = aws_elasticache_replication_group.redis.primary_endpoint_address
      SNS_TOPIC_ARN     = aws_sns_topic.coaching.arn
      ENVIRONMENT       = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/fuel_analytics.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/fuel_analytics.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-fuel-analytics"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["fuel_analytics"]]
}

# Coaching Handler Lambda
resource "aws_lambda_function" "coaching_handler" {
  function_name = "${local.name_prefix}-coaching-handler"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = var.timeout_s
  memory_size = var.coaching_memory


  environment {
    variables = {
      TRAINING_QUEUE_URL = aws_sqs_queue.training.url
      ENVIRONMENT        = var.env
    }
  }

  filename         = "${path.module}/lambda/coaching_handler.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/coaching_handler.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-coaching-handler"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["coaching_handler"]]
}

# Compliance Reporter Lambda
resource "aws_lambda_function" "compliance_reporter" {
  function_name = "${local.name_prefix}-compliance-reporter"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = 300 # Extended timeout for report generation
  memory_size = 2048

  environment {
    variables = {
      REPORTS_BUCKET = aws_s3_bucket.reports.id
      SNS_TOPIC_ARN  = aws_sns_topic.summary.arn
      ENVIRONMENT    = var.env
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = "${path.module}/lambda/compliance_reporter.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/compliance_reporter.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-compliance-reporter"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["compliance_reporter"]]
}

# Firehose Processor Lambda for Parquet transformation
resource "aws_lambda_function" "firehose_processor" {
  function_name = "${local.name_prefix}-firehose-processor"
  role          = aws_iam_role.lambda_execution.arn

  runtime     = var.runtime
  handler     = "index.handler"
  timeout     = 60
  memory_size = 1024

  environment {
    variables = {
      ENVIRONMENT = var.env
    }
  }

  filename         = "${path.module}/lambda/firehose_processor.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/firehose_processor.zip")

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-firehose-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_logs["firehose_processor"]]
}

################################################################################
# Event Source Mappings - Stream to Lambda Connections
################################################################################

# Diagnostics Stream to Processor
resource "aws_lambda_event_source_mapping" "diagnostics_processor" {
  event_source_arn  = aws_kinesis_stream.telematics["diagnostics"].arn
  function_name     = aws_lambda_function.diagnostics_processor.arn
  starting_position = "LATEST"

  parallelization_factor             = 10
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.maintenance_dlq.arn
    }
  }
}

# Diagnostics Stream to Predictive Maintenance
resource "aws_lambda_event_source_mapping" "predictive_maintenance" {
  event_source_arn  = aws_kinesis_stream.telematics["diagnostics"].arn
  function_name     = aws_lambda_function.predictive_maintenance.arn
  starting_position = "LATEST"

  parallelization_factor = 5
  batch_size             = 50
}

# Diagnostics Stream to Fuel Analytics
resource "aws_lambda_event_source_mapping" "fuel_analytics" {
  event_source_arn  = aws_kinesis_stream.telematics["diagnostics"].arn
  function_name     = aws_lambda_function.fuel_analytics.arn
  starting_position = "LATEST"

  batch_size = 100
}

# DynamoDB Stream to Anomaly Detector
resource "aws_lambda_event_source_mapping" "anomaly_detector" {
  event_source_arn  = aws_dynamodb_table.vehicle_diagnostics.stream_arn
  function_name     = aws_lambda_function.anomaly_detector.arn
  starting_position = "LATEST"

  maximum_retry_attempts = 3
  parallelization_factor = 5
}

# HOS Stream to Processor
resource "aws_lambda_event_source_mapping" "hos_processor" {
  event_source_arn  = aws_kinesis_stream.telematics["hos"].arn
  function_name     = aws_lambda_function.hos_processor.arn
  starting_position = "LATEST"

  batch_size             = 100
  parallelization_factor = 5
}

# GPS Stream to Location Processor
resource "aws_lambda_event_source_mapping" "location_processor" {
  event_source_arn  = aws_kinesis_stream.telematics["gps"].arn
  function_name     = aws_lambda_function.location_processor.arn
  starting_position = "LATEST"

  batch_size             = 200
  parallelization_factor = 10
}

# SQS Queue Mappings
resource "aws_lambda_event_source_mapping" "maintenance_queue" {
  event_source_arn = aws_sqs_queue.maintenance.arn
  function_name    = aws_lambda_function.maintenance_handler.arn

  batch_size = 10
}

resource "aws_lambda_event_source_mapping" "driver_queue" {
  event_source_arn = aws_sqs_queue.driver.arn
  function_name    = aws_lambda_function.driver_notifier.arn

  batch_size = 10
}

resource "aws_lambda_event_source_mapping" "fleet_queue" {
  event_source_arn = aws_sqs_queue.fleet.arn
  function_name    = aws_lambda_function.fleet_manager.arn

  batch_size = 10
}

resource "aws_lambda_event_source_mapping" "training_queue" {
  event_source_arn = aws_sqs_queue.training.arn
  function_name    = aws_lambda_function.coaching_handler.arn

  batch_size = 5
}

################################################################################
# Step Functions - Compliance Reporting Workflow
################################################################################

resource "aws_sfn_state_machine" "compliance_reporting" {
  name     = "${local.name_prefix}-compliance-reporting"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Daily DOT compliance reporting workflow"
    StartAt = "QueryDriverLogs"
    States = {
      QueryDriverLogs = {
        Type     = "Task"
        Resource = "arn:aws:states:::dynamodb:getItem"
        Parameters = {
          TableName = aws_dynamodb_table.driver_logs.name
          Key = {
            driver_id = {
              "S.$" = "$.driver_id"
            }
          }
        }
        Next = "QueryVehicleHistory"
      }
      QueryVehicleHistory = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.compliance_reporter.function_name
          Payload = {
            "action"      = "query_history"
            "driver_id.$" = "$.driver_id"
          }
        }
        Next = "GenerateReport"
      }
      GenerateReport = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.compliance_reporter.function_name
          Payload = {
            "action" = "generate_report"
            "data.$" = "$"
          }
        }
        Next = "UpdateComplianceStatus"
      }
      UpdateComplianceStatus = {
        Type     = "Task"
        Resource = "arn:aws:states:::dynamodb:putItem"
        Parameters = {
          TableName = aws_dynamodb_table.compliance_status.name
          Item = {
            fleet_id = {
              "S.$" = "$.fleet_id"
            }
            report_date = {
              "S.$" = "$.report_date"
            }
            status = {
              S = "COMPLETED"
            }
          }
        }
        End = true
      }
    }
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-compliance-reporting"
    }
  )
}

################################################################################
# EventBridge Rules - Scheduled Tasks
################################################################################

resource "aws_cloudwatch_event_rule" "compliance_schedule" {
  name                = "${local.name_prefix}-compliance-schedule"
  description         = "Trigger daily compliance reporting"
  schedule_expression = var.compliance_schedule_expression

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-compliance-schedule"
    }
  )
}

resource "aws_cloudwatch_event_target" "compliance_step_function" {
  rule      = aws_cloudwatch_event_rule.compliance_schedule.name
  target_id = "StepFunctionTarget"
  arn       = aws_sfn_state_machine.compliance_reporting.arn
  role_arn  = aws_iam_role.step_functions.arn

  input = jsonencode({
    fleet_id    = "FLEET001"
    report_date = "$${timestamp}"
  })
}

################################################################################
# Kinesis Data Firehose - Data Lake Archival
################################################################################

resource "aws_kinesis_firehose_delivery_stream" "diagnostics_archive" {
  name        = "${local.name_prefix}-${var.diagnostics_firehose_name}"
  destination = "extended_s3"

  kinesis_source_configuration {
    kinesis_stream_arn = aws_kinesis_stream.telematics["diagnostics"].arn
    role_arn           = aws_iam_role.firehose.arn
  }

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.data_lake.arn

    prefix              = "diagnostics/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/"

    buffering_size     = var.buffer_size_mb
    buffering_interval = var.buffer_interval_s

    compression_format = "GZIP"

    kms_key_arn = aws_kms_key.telematics.arn

    # Parquet conversion
    dynamic "data_format_conversion_configuration" {
      for_each = var.data_format_conversion_enabled ? [1] : []
      content {
        input_format_configuration {
          deserializer {
            open_x_json_ser_de {}
          }
        }

        output_format_configuration {
          serializer {
            parquet_ser_de {}
          }
        }

        schema_configuration {
          database_name = aws_glue_catalog_database.telematics.name
          table_name    = aws_glue_catalog_table.diagnostics.name
          role_arn      = aws_iam_role.firehose.arn
        }
      }
    }

    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.firehose_processor.arn
        }
      }
    }
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.diagnostics_firehose_name}"
    }
  )
}

################################################################################
# Glue Data Catalog
################################################################################

resource "aws_glue_catalog_database" "telematics" {
  name = "${local.name_prefix}-${var.glue_database_name}"

  description = "Telematics data catalog for fleet analytics"
}

resource "aws_glue_catalog_table" "diagnostics" {
  name          = "vehicle_diagnostics"
  database_name = aws_glue_catalog_database.telematics.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification"  = "parquet"
    "compressionType" = "gzip"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.data_lake.bucket}/diagnostics/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "vehicle_id"
      type = "string"
    }
    columns {
      name = "timestamp"
      type = "bigint"
    }
    columns {
      name = "engine_rpm"
      type = "double"
    }
    columns {
      name = "coolant_temp"
      type = "double"
    }
    columns {
      name = "fuel_level"
      type = "double"
    }
    columns {
      name = "dtc_codes"
      type = "array<string>"
    }
  }

  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
  partition_keys {
    name = "day"
    type = "string"
  }
}

resource "aws_glue_crawler" "telematics" {
  name          = "${local.name_prefix}-${var.crawler_name}"
  role          = aws_iam_role.glue_crawler.arn
  database_name = aws_glue_catalog_database.telematics.name

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake.bucket}/diagnostics/"
  }

  schedule = var.crawler_schedule

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.crawler_name}"
    }
  )
}

################################################################################
# Athena Workgroup
################################################################################

resource "aws_athena_workgroup" "analytics" {
  name = "${local.name_prefix}-${var.workgroup_name}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.telematics.arn
      }
    }
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${var.workgroup_name}"
    }
  )
}

################################################################################
# CloudWatch Alarms
################################################################################

# Kinesis Stream Capacity Alarm
resource "aws_cloudwatch_metric_alarm" "kinesis_incoming_bytes" {
  for_each = local.kinesis_streams

  alarm_name          = "${local.name_prefix}-${each.key}-incoming-bytes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "IncomingBytes"
  namespace           = "AWS/Kinesis"
  period              = "60"
  statistic           = "Sum"
  threshold           = 1000000000 # 1GB per minute
  alarm_description   = "Alert when Kinesis stream ${each.key} incoming bytes exceed threshold"

  dimensions = {
    StreamName = aws_kinesis_stream.telematics[each.key].name
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-${each.key}-incoming-bytes-alarm"
    }
  )
}

# Lambda Duration Alarm (P95)
resource "aws_cloudwatch_metric_alarm" "lambda_duration_p95" {
  alarm_name          = "${local.name_prefix}-anomaly-detector-duration-p95"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  threshold           = 30000 # 30 seconds
  alarm_description   = "Alert when Lambda duration P95 exceeds 30 seconds"

  metric_query {
    id          = "p95"
    return_data = true

    metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "p95"
      dimensions = {
        FunctionName = aws_lambda_function.anomaly_detector.function_name
      }
    }
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-anomaly-duration-alarm"
    }
  )
}

# DynamoDB Throttle Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on DynamoDB throttling"

  dimensions = {
    TableName = aws_dynamodb_table.vehicle_diagnostics.name
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-dynamodb-throttle-alarm"
    }
  )
}

# Redis Memory Alarm
resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${local.name_prefix}-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Alert when Redis memory usage exceeds 85%"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-redis-memory-alarm"
    }
  )
}

# Aurora Connections Alarm
resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "${local.name_prefix}-aurora-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when Aurora connections exceed 80"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-aurora-connections-alarm"
    }
  )
}

# SQS Age of Oldest Message Alarm
resource "aws_cloudwatch_metric_alarm" "sqs_message_age" {
  alarm_name          = "${local.name_prefix}-sqs-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "3600" # 1 hour
  alarm_description   = "Alert when SQS messages are older than 1 hour"

  dimensions = {
    QueueName = aws_sqs_queue.maintenance.name
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-sqs-age-alarm"
    }
  )
}

# Step Functions Failed Executions Alarm
resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "${local.name_prefix}-step-functions-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on Step Functions failures"

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.compliance_reporting.arn
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-step-functions-alarm"
    }
  )
}

# Firehose Processing Errors Alarm
resource "aws_cloudwatch_metric_alarm" "firehose_errors" {
  alarm_name          = "${local.name_prefix}-firehose-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ProcessingFailed"
  namespace           = "AWS/KinesisFirehose"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert on Firehose processing errors"

  dimensions = {
    DeliveryStreamName = aws_kinesis_firehose_delivery_stream.diagnostics_archive.name
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-firehose-errors-alarm"
    }
  )
}

################################################################################
# CloudWatch Log Metric Filters
################################################################################

# HOS Violations Metric Filter
resource "aws_cloudwatch_log_metric_filter" "hos_violations" {
  name           = "${local.name_prefix}-hos-violations"
  log_group_name = aws_cloudwatch_log_group.lambda_logs["hos_processor"].name
  pattern        = "[time, request_id, level=ERROR, msg=*VIOLATION*]"

  metric_transformation {
    name      = "HOSViolations"
    namespace = "${local.name_prefix}/Compliance"
    value     = "1"
  }
}

# Prediction Confidence Metric Filter
resource "aws_cloudwatch_log_metric_filter" "high_confidence_predictions" {
  name           = "${local.name_prefix}-high-confidence-predictions"
  log_group_name = aws_cloudwatch_log_group.lambda_logs["predictive_maintenance"].name
  pattern        = "[time, request_id, level, msg, confidence > 0.8]"

  metric_transformation {
    name      = "HighConfidencePredictions"
    namespace = "${local.name_prefix}/Predictive"
    value     = "1"
  }
}

################################################################################
# Outputs
################################################################################

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

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "kinesis_stream_arns" {
  description = "Kinesis stream ARNs"
  value       = { for k, v in aws_kinesis_stream.telematics : k => v.arn }
}

output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value = {
    diagnostics       = aws_dynamodb_table.vehicle_diagnostics.name
    thresholds        = aws_dynamodb_table.alert_thresholds.name
    predictions       = aws_dynamodb_table.predicted_failures.name
    driver_logs       = aws_dynamodb_table.driver_logs.name
    compliance_rules  = aws_dynamodb_table.compliance_rules.name
    locations         = aws_dynamodb_table.vehicle_locations.name
    geofences         = aws_dynamodb_table.geofences.name
    compliance_status = aws_dynamodb_table.compliance_status.name
  }
}

output "dynamodb_table_arns" {
  description = "DynamoDB table ARNs"
  value = {
    diagnostics       = aws_dynamodb_table.vehicle_diagnostics.arn
    thresholds        = aws_dynamodb_table.alert_thresholds.arn
    predictions       = aws_dynamodb_table.predicted_failures.arn
    driver_logs       = aws_dynamodb_table.driver_logs.arn
    compliance_rules  = aws_dynamodb_table.compliance_rules.arn
    locations         = aws_dynamodb_table.vehicle_locations.arn
    geofences         = aws_dynamodb_table.geofences.arn
    compliance_status = aws_dynamodb_table.compliance_status.arn
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs"
  value = {
    alerts      = aws_sns_topic.alerts.arn
    maintenance = aws_sns_topic.maintenance.arn
    violations  = aws_sns_topic.violations.arn
    summary     = aws_sns_topic.summary.arn
    geofence    = aws_sns_topic.geofence.arn
    coaching    = aws_sns_topic.coaching.arn
  }
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value = {
    maintenance = aws_sqs_queue.maintenance.url
    driver      = aws_sqs_queue.driver.url
    fleet       = aws_sqs_queue.fleet.url
    training    = aws_sqs_queue.training.url
  }
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
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.compliance_reporting.arn
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    diagnostics_processor  = aws_lambda_function.diagnostics_processor.arn
    anomaly_detector       = aws_lambda_function.anomaly_detector.arn
    maintenance_handler    = aws_lambda_function.maintenance_handler.arn
    driver_notifier        = aws_lambda_function.driver_notifier.arn
    fleet_manager          = aws_lambda_function.fleet_manager.arn
    predictive_maintenance = aws_lambda_function.predictive_maintenance.arn
    hos_processor          = aws_lambda_function.hos_processor.arn
    location_processor     = aws_lambda_function.location_processor.arn
    fuel_analytics         = aws_lambda_function.fuel_analytics.arn
    coaching_handler       = aws_lambda_function.coaching_handler.arn
    compliance_reporter    = aws_lambda_function.compliance_reporter.arn
    firehose_processor     = aws_lambda_function.firehose_processor.arn
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value = {
    reports        = aws_s3_bucket.reports.id
    data_lake      = aws_s3_bucket.data_lake.id
    athena_results = aws_s3_bucket.athena_results.id
  }
}

output "firehose_delivery_stream_arn" {
  description = "Kinesis Firehose delivery stream ARN"
  value       = aws_kinesis_firehose_delivery_stream.diagnostics_archive.arn
}

output "glue_database_name" {
  description = "Glue catalog database name"
  value       = aws_glue_catalog_database.telematics.name
}

output "glue_crawler_name" {
  description = "Glue crawler name"
  value       = aws_glue_crawler.telematics.name
}

output "athena_workgroup_name" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.analytics.name
}
