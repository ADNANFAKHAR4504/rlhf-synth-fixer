# tap_stack.tf - Telematics and Pharmacy Multi-Environment Stack
# Compatible with Terraform >=1.5 and AWS Provider ~>5.0

# ===================================================================
# LOCALS FOR NAMING AND TAGGING
# ===================================================================

locals {
  name_prefix = "${var.project_prefix}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_prefix
    ManagedBy   = "terraform"
    Stack       = "telematics-pharmacy"
    Compliance  = "HIPAA-DOT"
  }

  azs = data.aws_availability_zones.available.names

  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 0),
    cidrsubnet(var.vpc_cidr, 4, 1),
    cidrsubnet(var.vpc_cidr, 4, 2)
  ]

  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 8),
    cidrsubnet(var.vpc_cidr, 4, 9),
    cidrsubnet(var.vpc_cidr, 4, 10)
  ]

  db_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 12),
    cidrsubnet(var.vpc_cidr, 4, 13)
  ]
}

# ===================================================================
# DATA SOURCES
# ===================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "kms_policy" {
  statement {
    sid    = "Enable IAM policies"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow services to use the key"
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = [
        "logs.amazonaws.com",
        "s3.amazonaws.com",
        "dynamodb.amazonaws.com",
        "kinesis.amazonaws.com",
        "firehose.amazonaws.com",
        "lambda.amazonaws.com",
        "states.amazonaws.com"
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:CreateGrant"
    ]

    resources = ["*"]
  }
}

# ===================================================================
# KMS KEYS
# ===================================================================

resource "aws_kms_key" "main" {
  description             = "${local.name_prefix}-encryption-key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms_policy.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# ===================================================================
# VPC AND NETWORKING
# ===================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = length(local.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${local.azs[count.index]}"
    Type = "Private"
  })
}

resource "aws_subnet" "public" {
  count                   = length(local.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${local.azs[count.index]}"
    Type = "Public"
  })
}

resource "aws_subnet" "database" {
  count             = length(local.db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${local.azs[count.index]}"
    Type = "Database"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  count  = length(local.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(local.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index}"
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
  count  = length(local.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index}"
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

resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[0].id
}

# ===================================================================
# VPC ENDPOINTS
# ===================================================================

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "kinesis" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
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
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
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
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "sagemaker" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sagemaker.runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sagemaker-endpoint"
  })
}

# ===================================================================
# SECURITY GROUPS
# ===================================================================

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.name_prefix}-vpc-endpoints-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-endpoints-sg"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

# ===================================================================
# KINESIS STREAMS
# ===================================================================

resource "aws_kinesis_stream" "telemetry" {
  name             = "${local.name_prefix}-telemetry-stream"
  shard_count      = var.kinesis_telemetry_shard_count
  retention_period = var.kinesis_retention_hours

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords"
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-telemetry-stream"
  })
}

resource "aws_kinesis_stream" "hos_updates" {
  name             = "${local.name_prefix}-hos-updates-stream"
  shard_count      = var.kinesis_telemetry_shard_count
  retention_period = var.kinesis_retention_hours

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hos-updates-stream"
  })
}

resource "aws_kinesis_stream" "gps_location" {
  name             = "${local.name_prefix}-gps-location-stream"
  shard_count      = var.kinesis_telemetry_shard_count
  retention_period = var.kinesis_retention_hours

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-gps-location-stream"
  })
}

# ===================================================================
# DYNAMODB TABLES
# ===================================================================

resource "aws_dynamodb_table" "vehicle_diagnostics" {
  name           = "${local.name_prefix}-vehicle-diagnostics"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_diagnostics_rcu
  write_capacity = var.dynamodb_diagnostics_wcu

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
    name = "diagnostic_type"
    type = "S"
  }

  attribute {
    name = "severity"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  global_secondary_index {
    name            = "diagnostic-type-index"
    hash_key        = "diagnostic_type"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_diagnostics_rcu
    write_capacity  = var.dynamodb_diagnostics_wcu
  }

  global_secondary_index {
    name            = "severity-index"
    hash_key        = "severity"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_diagnostics_rcu
    write_capacity  = var.dynamodb_diagnostics_wcu
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vehicle-diagnostics"
  })
}

resource "aws_dynamodb_table" "vehicle_metadata" {
  name           = "${local.name_prefix}-vehicle-metadata"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_vehicle_rcu
  write_capacity = var.dynamodb_vehicle_wcu

  hash_key = "vehicle_id"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "fleet_id"
    type = "S"
  }

  attribute {
    name = "driver_id"
    type = "S"
  }

  global_secondary_index {
    name            = "fleet-index"
    hash_key        = "fleet_id"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_vehicle_rcu
    write_capacity  = var.dynamodb_vehicle_wcu
  }

  global_secondary_index {
    name            = "driver-index"
    hash_key        = "driver_id"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_vehicle_rcu
    write_capacity  = var.dynamodb_vehicle_wcu
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vehicle-metadata"
  })
}

resource "aws_dynamodb_table" "pharmacy_inventory" {
  name           = "${local.name_prefix}-pharmacy-inventory"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_inventory_rcu
  write_capacity = var.dynamodb_inventory_wcu

  hash_key  = "pharmacy_id"
  range_key = "medication_id"

  attribute {
    name = "pharmacy_id"
    type = "S"
  }

  attribute {
    name = "medication_id"
    type = "S"
  }

  attribute {
    name = "ndc_code"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  global_secondary_index {
    name            = "ndc-index"
    hash_key        = "ndc_code"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_inventory_rcu
    write_capacity  = var.dynamodb_inventory_wcu
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pharmacy-inventory"
  })
}

resource "aws_dynamodb_table" "compliance_records" {
  name           = "${local.name_prefix}-compliance-records"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_vehicle_rcu
  write_capacity = var.dynamodb_vehicle_wcu

  hash_key  = "record_id"
  range_key = "timestamp"

  attribute {
    name = "record_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "compliance_type"
    type = "S"
  }

  attribute {
    name = "entity_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "type-index"
    hash_key        = "compliance_type"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_vehicle_rcu
    write_capacity  = var.dynamodb_vehicle_wcu
  }

  global_secondary_index {
    name            = "entity-index"
    hash_key        = "entity_id"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_vehicle_rcu
    write_capacity  = var.dynamodb_vehicle_wcu
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-records"
  })
}

# ===================================================================
# REDIS CLUSTERS
# ===================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.name_prefix}-redis-params"

  parameter {
    name  = "notify-keyspace-events"
    value = "AKE"
  }

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-params"
  })
}

resource "aws_elasticache_replication_group" "metrics" {
  replication_group_id = "${local.name_prefix}-metrics"
  description          = "Redis cluster for time-series metrics"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_nodes
  engine_version       = "7.0"
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
  kms_key_id                 = aws_kms_key.main.arn

  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled           = var.redis_num_cache_nodes > 1

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  notification_topic_arn = aws_sns_topic.alerts.arn

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-metrics-redis"
  })
}

resource "aws_elasticache_replication_group" "geospatial" {
  replication_group_id = "${local.name_prefix}-geospatial"
  description          = "Redis cluster for geospatial data"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_nodes
  engine_version       = "7.0"
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token_geo.result
  kms_key_id                 = aws_kms_key.main.arn

  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled           = var.redis_num_cache_nodes > 1

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  notification_topic_arn = aws_sns_topic.alerts.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-geospatial-redis"
  })
}

resource "random_password" "redis_auth_token" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "redis_auth_token_geo" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix             = "${local.name_prefix}-redis-auth-"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-auth"
  })
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    metrics_token    = random_password.redis_auth_token.result
    geospatial_token = random_password.redis_auth_token_geo.result
  })
}

# ===================================================================
# AURORA POSTGRESQL
# ===================================================================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  family = "aurora-postgresql15"
  name   = "${local.name_prefix}-aurora-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pglogical,pg_stat_statements,pg_hint_plan,auto_explain"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "pgaudit.log"
    value = "ALL"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-params"
  })
}

resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name_prefix             = "${local.name_prefix}-aurora-master-"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-master"
  })
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.aurora_master.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = "tapdb"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  database_name                   = "tapdb"
  master_username                 = "postgres"
  master_password                 = random_password.aurora_master.result
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]

  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn
  copy_tags_to_snapshot = true
  deletion_protection   = var.environment == "prod"

  backup_retention_period      = var.aurora_backup_retention
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    max_capacity = 16.0
    min_capacity = 0.5
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.aurora_instance_count
  identifier         = "${local.name_prefix}-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-instance-${count.index}"
  })
}

# ===================================================================
# S3 BUCKETS
# ===================================================================

resource "aws_s3_bucket" "data_lake" {
  bucket = "${local.name_prefix}-data-lake-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-lake"
  })
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
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }

  rule {
    id     = "delete-incomplete-multipart"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket" "compliance_reports" {
  bucket = "${local.name_prefix}-compliance-reports-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-reports"
  })
}

resource "aws_s3_bucket_versioning" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ===================================================================
# SNS TOPICS
# ===================================================================

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic" "anomaly_detection" {
  name              = "${local.name_prefix}-anomaly-detection"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-anomaly-detection"
  })
}

resource "aws_sns_topic" "compliance_notifications" {
  name              = "${local.name_prefix}-compliance-notifications"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-notifications"
  })
}

resource "aws_sns_topic" "maintenance_updates" {
  name              = "${local.name_prefix}-maintenance-updates"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-maintenance-updates"
  })
}

# ===================================================================
# SQS QUEUES
# ===================================================================

resource "aws_sqs_queue" "telemetry_processing" {
  name                       = "${local.name_prefix}-telemetry-processing"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 60

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.telemetry_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-telemetry-processing"
  })
}

resource "aws_sqs_queue" "telemetry_dlq" {
  name                      = "${local.name_prefix}-telemetry-processing-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-telemetry-processing-dlq"
  })
}

resource "aws_sqs_queue" "anomaly_processing" {
  name                       = "${local.name_prefix}-anomaly-processing"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 60

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.anomaly_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-anomaly-processing"
  })
}

resource "aws_sqs_queue" "anomaly_dlq" {
  name                      = "${local.name_prefix}-anomaly-processing-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-anomaly-processing-dlq"
  })
}

resource "aws_sqs_queue" "maintenance_scheduling" {
  name                       = "${local.name_prefix}-maintenance-scheduling"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 300

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-maintenance-scheduling"
  })
}

resource "aws_sqs_queue" "compliance_processing" {
  name                       = "${local.name_prefix}-compliance-processing"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 300

  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-processing"
  })
}

# SNS to SQS Subscriptions
resource "aws_sns_topic_subscription" "anomaly_to_queue" {
  topic_arn = aws_sns_topic.anomaly_detection.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.anomaly_processing.arn
}

resource "aws_sns_topic_subscription" "maintenance_to_queue" {
  topic_arn = aws_sns_topic.maintenance_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.maintenance_scheduling.arn
}

resource "aws_sns_topic_subscription" "compliance_to_queue" {
  topic_arn = aws_sns_topic.compliance_notifications.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.compliance_processing.arn
}

# ===================================================================
# IAM ROLES AND POLICIES
# ===================================================================

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution"
  role = aws_iam_role.lambda_execution.id

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
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:ConditionCheckItem"
        ]
        Resource = [
          aws_dynamodb_table.vehicle_diagnostics.arn,
          "${aws_dynamodb_table.vehicle_diagnostics.arn}/*",
          aws_dynamodb_table.vehicle_metadata.arn,
          "${aws_dynamodb_table.vehicle_metadata.arn}/*",
          aws_dynamodb_table.pharmacy_inventory.arn,
          "${aws_dynamodb_table.pharmacy_inventory.arn}/*",
          aws_dynamodb_table.compliance_records.arn,
          "${aws_dynamodb_table.compliance_records.arn}/*"
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
        Resource = [
          aws_kinesis_stream.telemetry.arn,
          aws_kinesis_stream.hos_updates.arn,
          aws_kinesis_stream.gps_location.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts.arn,
          aws_sns_topic.anomaly_detection.arn,
          aws_sns_topic.compliance_notifications.arn,
          aws_sns_topic.maintenance_updates.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ]
        Resource = [
          aws_sqs_queue.telemetry_processing.arn,
          aws_sqs_queue.anomaly_processing.arn,
          aws_sqs_queue.maintenance_scheduling.arn,
          aws_sqs_queue.compliance_processing.arn
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
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*",
          aws_s3_bucket.compliance_reports.arn,
          "${aws_s3_bucket.compliance_reports.arn}/*"
        ]
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
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "${local.name_prefix}-firehose"
  role = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.firehose_transformation.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards"
        ]
        Resource = aws_kinesis_stream.telemetry.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetTableVersion",
          "glue:GetTableVersions"
        ]
        Resource = "*"
      }
    ]
  })
}

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.name_prefix}-step-functions"
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
          aws_lambda_function.compliance_report_generator.arn,
          aws_lambda_function.compliance_data_aggregator.arn,
          aws_lambda_function.report_uploader.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.compliance_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "glue" {
  name = "${local.name_prefix}-glue"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "glue" {
  name = "${local.name_prefix}-glue"
  role = aws_iam_role.glue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.glue.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-monitoring"

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

# ===================================================================
# LAMBDA FUNCTIONS
# ===================================================================

resource "aws_lambda_function" "telemetry_processor" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-telemetry-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = var.lambda_processor_timeout

  reserved_concurrent_executions = var.lambda_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT            = var.environment
      DIAGNOSTICS_TABLE      = aws_dynamodb_table.vehicle_diagnostics.name
      METADATA_TABLE         = aws_dynamodb_table.vehicle_metadata.name
      ANOMALY_SNS_TOPIC      = aws_sns_topic.anomaly_detection.arn
      REDIS_METRICS_ENDPOINT = aws_elasticache_replication_group.metrics.configuration_endpoint_address
      REDIS_GEO_ENDPOINT     = aws_elasticache_replication_group.geospatial.configuration_endpoint_address
      REDIS_AUTH_SECRET      = aws_secretsmanager_secret.redis_auth.arn
      KMS_KEY_ID             = aws_kms_key.main.id
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-telemetry-processor"
  })

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.lambda_telemetry
  ]
}

resource "aws_lambda_function" "anomaly_detector" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-anomaly-detector"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = var.lambda_processor_timeout

  reserved_concurrent_executions = var.lambda_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      DIAGNOSTICS_TABLE = aws_dynamodb_table.vehicle_diagnostics.name
      COMPLIANCE_TABLE  = aws_dynamodb_table.compliance_records.name
      ALERTS_SNS_TOPIC  = aws_sns_topic.alerts.arn
      AURORA_SECRET     = aws_secretsmanager_secret.aurora_master.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-anomaly-detector"
  })

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.lambda_anomaly
  ]
}

resource "aws_lambda_function" "geofence_monitor" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-geofence-monitor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = var.lambda_processor_timeout

  reserved_concurrent_executions = var.lambda_concurrent_executions

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT          = var.environment
      REDIS_GEO_ENDPOINT   = aws_elasticache_replication_group.geospatial.configuration_endpoint_address
      REDIS_AUTH_SECRET    = aws_secretsmanager_secret.redis_auth.arn
      COMPLIANCE_TABLE     = aws_dynamodb_table.compliance_records.name
      COMPLIANCE_SNS_TOPIC = aws_sns_topic.compliance_notifications.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-geofence-monitor"
  })

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.lambda_geofence
  ]
}

resource "aws_lambda_function" "maintenance_scheduler" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-maintenance-scheduler"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = var.lambda_processor_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      AURORA_SECRET         = aws_secretsmanager_secret.aurora_master.arn
      METADATA_TABLE        = aws_dynamodb_table.vehicle_metadata.name
      MAINTENANCE_SNS_TOPIC = aws_sns_topic.maintenance_updates.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-maintenance-scheduler"
  })

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.lambda_maintenance
  ]
}

resource "aws_lambda_function" "inventory_updater" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-inventory-updater"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = var.lambda_processor_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT            = var.environment
      INVENTORY_TABLE        = aws_dynamodb_table.pharmacy_inventory.name
      AURORA_SECRET          = aws_secretsmanager_secret.aurora_master.arn
      REDIS_METRICS_ENDPOINT = aws_elasticache_replication_group.metrics.configuration_endpoint_address
      REDIS_AUTH_SECRET      = aws_secretsmanager_secret.redis_auth.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-inventory-updater"
  })

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.lambda_inventory
  ]
}

resource "aws_lambda_function" "firehose_transformation" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-firehose-transformation"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_processor_memory
  timeout       = 60

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-firehose-transformation"
  })

  depends_on = [aws_cloudwatch_log_group.lambda_firehose]
}

resource "aws_lambda_function" "compliance_report_generator" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-compliance-report-generator"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 1024
  timeout       = 300

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      COMPLIANCE_TABLE = aws_dynamodb_table.compliance_records.name
      AURORA_SECRET    = aws_secretsmanager_secret.aurora_master.arn
      REPORTS_BUCKET   = aws_s3_bucket.compliance_reports.id
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-report-generator"
  })

  depends_on = [aws_cloudwatch_log_group.lambda_compliance_gen]
}

resource "aws_lambda_function" "compliance_data_aggregator" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-compliance-data-aggregator"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 120

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      COMPLIANCE_TABLE  = aws_dynamodb_table.compliance_records.name
      DIAGNOSTICS_TABLE = aws_dynamodb_table.vehicle_diagnostics.name
      AURORA_SECRET     = aws_secretsmanager_secret.aurora_master.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-data-aggregator"
  })

  depends_on = [aws_cloudwatch_log_group.lambda_compliance_agg]
}

resource "aws_lambda_function" "report_uploader" {
  filename      = "lambda_placeholder.zip"
  function_name = "${local.name_prefix}-report-uploader"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 256
  timeout       = 60

  environment {
    variables = {
      ENVIRONMENT          = var.environment
      REPORTS_BUCKET       = aws_s3_bucket.compliance_reports.id
      COMPLIANCE_SNS_TOPIC = aws_sns_topic.compliance_notifications.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-report-uploader"
  })

  depends_on = [aws_cloudwatch_log_group.lambda_uploader]
}

# ===================================================================
# LAMBDA EVENT SOURCE MAPPINGS
# ===================================================================

resource "aws_lambda_event_source_mapping" "telemetry_kinesis" {
  event_source_arn                   = aws_kinesis_stream.telemetry.arn
  function_name                      = aws_lambda_function.telemetry_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 5

  filter_criteria {
    filter {
      pattern = jsonencode({
        data = {
          type = ["DIAGNOSTIC", "TELEMETRY"]
        }
      })
    }
  }

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "hos_kinesis" {
  event_source_arn                   = aws_kinesis_stream.hos_updates.arn
  function_name                      = aws_lambda_function.telemetry_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 5
  maximum_batching_window_in_seconds = 10

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "gps_kinesis" {
  event_source_arn                   = aws_kinesis_stream.gps_location.arn
  function_name                      = aws_lambda_function.geofence_monitor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 2

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "diagnostics_stream" {
  event_source_arn                   = aws_dynamodb_table.vehicle_diagnostics.stream_arn
  function_name                      = aws_lambda_function.anomaly_detector.arn
  starting_position                  = "LATEST"
  maximum_batching_window_in_seconds = 10

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY"]
      })
    }
  }

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "inventory_stream" {
  event_source_arn                   = aws_dynamodb_table.pharmacy_inventory.stream_arn
  function_name                      = aws_lambda_function.inventory_updater.arn
  starting_position                  = "LATEST"
  maximum_batching_window_in_seconds = 5

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "anomaly_queue" {
  event_source_arn = aws_sqs_queue.anomaly_processing.arn
  function_name    = aws_lambda_function.anomaly_detector.arn
  batch_size       = 10

  depends_on = [aws_iam_role_policy.lambda_execution]
}

resource "aws_lambda_event_source_mapping" "maintenance_queue" {
  event_source_arn = aws_sqs_queue.maintenance_scheduling.arn
  function_name    = aws_lambda_function.maintenance_scheduler.arn
  batch_size       = 5

  depends_on = [aws_iam_role_policy.lambda_execution]
}

# ===================================================================
# KINESIS FIREHOSE
# ===================================================================

resource "aws_kinesis_firehose_delivery_stream" "telemetry_to_s3" {
  name        = "${local.name_prefix}-telemetry-to-s3"
  destination = "extended_s3"

  kinesis_source_configuration {
    kinesis_stream_arn = aws_kinesis_stream.telemetry.arn
    role_arn           = aws_iam_role.firehose.arn
  }

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose.arn
    bucket_arn          = aws_s3_bucket.data_lake.arn
    prefix              = "telemetry/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "telemetry-errors/"

    buffering_size     = var.firehose_buffer_size
    buffering_interval = var.firehose_buffer_interval
    compression_format = "GZIP"

    kms_key_arn = aws_kms_key.main.arn

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = "telemetry"
    }

    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = "${aws_lambda_function.firehose_transformation.arn}:$LATEST"
        }
      }
    }

    data_format_conversion_configuration {
      enabled = true

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
        database_name = aws_glue_catalog_database.data_lake.name
        table_name    = aws_glue_catalog_table.telemetry.name
        role_arn      = aws_iam_role.firehose.arn
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-telemetry-firehose"
  })
}

# ===================================================================
# GLUE DATA CATALOG
# ===================================================================

resource "aws_glue_catalog_database" "data_lake" {
  name = "${local.name_prefix}_data_lake"

  create_table_default_permission {
    permissions = ["SELECT"]

    principal {
      data_lake_principal_identifier = "IAM_ALLOWED_PRINCIPALS"
    }
  }
}

resource "aws_glue_catalog_table" "telemetry" {
  name          = "telemetry"
  database_name = aws_glue_catalog_database.data_lake.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification"         = "parquet"
    "compressionType"        = "gzip"
    "projection.enabled"     = "true"
    "projection.year.type"   = "integer"
    "projection.year.range"  = "2023,2030"
    "projection.month.type"  = "integer"
    "projection.month.range" = "1,12"
    "projection.day.type"    = "integer"
    "projection.day.range"   = "1,31"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.data_lake.bucket}/telemetry/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    compressed    = true

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
      name = "diagnostic_type"
      type = "string"
    }

    columns {
      name = "value"
      type = "double"
    }

    columns {
      name = "unit"
      type = "string"
    }

    columns {
      name = "metadata"
      type = "map<string,string>"
    }
  }

  partition_keys {
    name = "year"
    type = "int"
  }

  partition_keys {
    name = "month"
    type = "int"
  }

  partition_keys {
    name = "day"
    type = "int"
  }
}

resource "aws_glue_crawler" "data_lake" {
  database_name = aws_glue_catalog_database.data_lake.name
  name          = "${local.name_prefix}-data-lake-crawler"
  role          = aws_iam_role.glue.arn

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake.bucket}/telemetry/"
  }

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake.bucket}/hos/"
  }

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake.bucket}/gps/"
  }

  configuration = jsonencode({
    Grouping = {
      TableGroupingPolicy = "CombineCompatibleSchemas"
    }
    CrawlerOutput = {
      Partitions = {
        AddOrUpdateBehavior = "InheritFromTable"
      }
    }
    Version = 1
  })

  schema_change_policy {
    delete_behavior = "DEPRECATE_IN_DATABASE"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-crawler"
  })
}

# ===================================================================
# ATHENA
# ===================================================================

resource "aws_athena_workgroup" "analytics" {
  name = "${local.name_prefix}-analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.data_lake.bucket}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.main.arn
      }
    }

    engine_version {
      selected_engine_version = "AUTO"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-athena-workgroup"
  })
}

resource "aws_athena_named_query" "vehicle_diagnostics_daily" {
  name      = "${local.name_prefix}-vehicle-diagnostics-daily"
  workgroup = aws_athena_workgroup.analytics.name
  database  = aws_glue_catalog_database.data_lake.name

  query = <<-EOT
    SELECT 
      vehicle_id,
      DATE(from_unixtime(timestamp/1000)) as date,
      diagnostic_type,
      COUNT(*) as event_count,
      AVG(value) as avg_value,
      MIN(value) as min_value,
      MAX(value) as max_value,
      STDDEV(value) as stddev_value
    FROM telemetry
    WHERE year = YEAR(CURRENT_DATE)
      AND month = MONTH(CURRENT_DATE)
      AND day = DAY(CURRENT_DATE) - 1
    GROUP BY 
      vehicle_id, 
      DATE(from_unixtime(timestamp/1000)),
      diagnostic_type
  EOT
}

# ===================================================================
# STEP FUNCTIONS
# ===================================================================

resource "aws_sfn_state_machine" "compliance_reporting" {
  name     = "${local.name_prefix}-compliance-reporting"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Daily DOT Compliance Reporting Workflow"
    StartAt = "AggregateData"

    States = {
      AggregateData = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.compliance_data_aggregator.function_name
          Payload = {
            "report_date.$" = "$.report_date"
            "report_type.$" = "$.report_type"
          }
        }
        ResultPath = "$.aggregation_result"
        Next       = "GenerateReport"
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
      }

      GenerateReport = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.compliance_report_generator.function_name
          Payload = {
            "aggregation_result.$" = "$.aggregation_result.Payload"
            "report_date.$"        = "$.report_date"
          }
        }
        ResultPath = "$.report_result"
        Next       = "UploadReport"
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
      }

      UploadReport = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.report_uploader.function_name
          Payload = {
            "report_result.$" = "$.report_result.Payload"
            "report_date.$"   = "$.report_date"
          }
        }
        ResultPath = "$.upload_result"
        Next       = "NotifyCompletion"
      }

      NotifyCompletion = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.compliance_notifications.arn
          Message = {
            "report_date.$"   = "$.report_date"
            "upload_result.$" = "$.upload_result.Payload"
            "status"          = "COMPLETED"
          }
        }
        End = true
      }
    }

    TimeoutSeconds = var.step_functions_timeout_seconds
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compliance-reporting"
  })
}

# ===================================================================
# CLOUDWATCH LOG GROUPS
# ===================================================================

resource "aws_cloudwatch_log_group" "lambda_telemetry" {
  name              = "/aws/lambda/${local.name_prefix}-telemetry-processor"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_anomaly" {
  name              = "/aws/lambda/${local.name_prefix}-anomaly-detector"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_geofence" {
  name              = "/aws/lambda/${local.name_prefix}-geofence-monitor"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_maintenance" {
  name              = "/aws/lambda/${local.name_prefix}-maintenance-scheduler"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_inventory" {
  name              = "/aws/lambda/${local.name_prefix}-inventory-updater"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_firehose" {
  name              = "/aws/lambda/${local.name_prefix}-firehose-transformation"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_compliance_gen" {
  name              = "/aws/lambda/${local.name_prefix}-compliance-report-generator"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_compliance_agg" {
  name              = "/aws/lambda/${local.name_prefix}-compliance-data-aggregator"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_uploader" {
  name              = "/aws/lambda/${local.name_prefix}-report-uploader"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${local.name_prefix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.name_prefix}/slow-log"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.name_prefix}-compliance-reporting"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/${local.name_prefix}-aurora-cluster/postgresql"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

# ===================================================================
# CLOUDWATCH ALARMS
# ===================================================================

resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${local.name_prefix}-kinesis-iterator-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = 300
  statistic           = "Maximum"
  threshold           = 60000
  alarm_description   = "Kinesis stream iterator age too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.telemetry.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.telemetry_processor.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.dynamodb_diagnostics_rcu * 300 * 0.8
  alarm_description   = "DynamoDB table approaching read capacity"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.vehicle_diagnostics.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "${local.name_prefix}-aurora-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora CPU utilization high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.name_prefix}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Redis CPU utilization high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.metrics.id
  }

  tags = local.common_tags
}

# ===================================================================
# OUTPUTS
# ===================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "kinesis_telemetry_stream_arn" {
  description = "Kinesis telemetry stream ARN"
  value       = aws_kinesis_stream.telemetry.arn
}

output "kinesis_hos_stream_arn" {
  description = "Kinesis HOS updates stream ARN"
  value       = aws_kinesis_stream.hos_updates.arn
}

output "kinesis_gps_stream_arn" {
  description = "Kinesis GPS location stream ARN"
  value       = aws_kinesis_stream.gps_location.arn
}

output "dynamodb_vehicle_diagnostics_table_name" {
  description = "DynamoDB vehicle diagnostics table name"
  value       = aws_dynamodb_table.vehicle_diagnostics.name
}

output "dynamodb_vehicle_metadata_table_name" {
  description = "DynamoDB vehicle metadata table name"
  value       = aws_dynamodb_table.vehicle_metadata.name
}

output "dynamodb_pharmacy_inventory_table_name" {
  description = "DynamoDB pharmacy inventory table name"
  value       = aws_dynamodb_table.pharmacy_inventory.name
}

output "dynamodb_compliance_records_table_name" {
  description = "DynamoDB compliance records table name"
  value       = aws_dynamodb_table.compliance_records.name
}

output "redis_metrics_endpoint" {
  description = "Redis metrics cluster endpoint"
  value       = aws_elasticache_replication_group.metrics.configuration_endpoint_address
}

output "redis_geospatial_endpoint" {
  description = "Redis geospatial cluster endpoint"
  value       = aws_elasticache_replication_group.geospatial.configuration_endpoint_address
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "s3_data_lake_bucket" {
  description = "S3 data lake bucket name"
  value       = aws_s3_bucket.data_lake.id
}

output "s3_compliance_reports_bucket" {
  description = "S3 compliance reports bucket name"
  value       = aws_s3_bucket.compliance_reports.id
}

output "sns_alerts_topic_arn" {
  description = "SNS alerts topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "sns_anomaly_topic_arn" {
  description = "SNS anomaly detection topic ARN"
  value       = aws_sns_topic.anomaly_detection.arn
}

output "sns_compliance_topic_arn" {
  description = "SNS compliance notifications topic ARN"
  value       = aws_sns_topic.compliance_notifications.arn
}

output "sns_maintenance_topic_arn" {
  description = "SNS maintenance updates topic ARN"
  value       = aws_sns_topic.maintenance_updates.arn
}

output "sqs_telemetry_queue_url" {
  description = "SQS telemetry processing queue URL"
  value       = aws_sqs_queue.telemetry_processing.url
}

output "sqs_anomaly_queue_url" {
  description = "SQS anomaly processing queue URL"
  value       = aws_sqs_queue.anomaly_processing.url
}

output "sqs_maintenance_queue_url" {
  description = "SQS maintenance scheduling queue URL"
  value       = aws_sqs_queue.maintenance_scheduling.url
}

output "sqs_compliance_queue_url" {
  description = "SQS compliance processing queue URL"
  value       = aws_sqs_queue.compliance_processing.url
}

output "step_functions_arn" {
  description = "Step Functions compliance reporting state machine ARN"
  value       = aws_sfn_state_machine.compliance_reporting.arn
}

output "athena_workgroup_name" {
  description = "Athena analytics workgroup name"
  value       = aws_athena_workgroup.analytics.name
}

output "glue_database_name" {
  description = "Glue data catalog database name"
  value       = aws_glue_catalog_database.data_lake.name
}

output "kms_key_id" {
  description = "KMS encryption key ID"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS encryption key ARN"
  value       = aws_kms_key.main.arn
}
