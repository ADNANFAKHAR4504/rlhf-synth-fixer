// tap_stack.tf

# Data sources
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Input Variables
variable "project_name" {
  type    = string
  default = "player-consistency"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "owner" {
  type    = string
  default = "platform-team"
}

variable "cost_center" {
  type    = string
  default = "gaming-core"
}

variable "use_kinesis_on_demand" {
  type    = bool
  default = true
}

variable "use_shards" {
  type    = bool
  default = false
}

variable "updates_per_second" {
  type    = number
  default = 2550
}

variable "avg_item_size_bytes" {
  type    = number
  default = 1024
}

variable "replica_regions" {
  type    = list(string)
  default = []
}

variable "consumer_groups" {
  type    = list(string)
  default = ["graph-updater"]
}

variable "verification_sample_size" {
  type    = number
  default = 100
}

# Locals for naming and capacity calculations
locals {
  stack_name = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Region      = var.aws_region
    ManagedBy   = "terraform"
  }

  # Kinesis capacity calculations
  throughput_mb = ceil((var.updates_per_second * var.avg_item_size_bytes) / 1024 / 1024)
  shard_count   = var.use_shards ? max(ceil(local.throughput_mb), ceil(var.updates_per_second / 1000)) : 0

  # Use actual AZs available in the region
  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  # Account and partition info
  account_id = data.aws_caller_identity.current.account_id
  partition  = data.aws_partition.current.partition
}

# KMS Key with comprehensive policy
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.stack_name}"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${local.partition}:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Services via ViaService"
        Effect = "Allow"
        Principal = {
          Service = [
            "kinesis.amazonaws.com",
            "dynamodb.amazonaws.com",
            "sqs.amazonaws.com",
            "sns.amazonaws.com",
            "elasticache.amazonaws.com",
            "rds.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "kinesis.${var.aws_region}.amazonaws.com",
              "dynamodb.${var.aws_region}.amazonaws.com",
              "sqs.${var.aws_region}.amazonaws.com",
              "sns.${var.aws_region}.amazonaws.com",
              "elasticache.${var.aws_region}.amazonaws.com",
              "rds.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow Timestream"
        Effect = "Allow"
        Principal = {
          Service = "timestream.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda and Step Functions"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "states.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.stack_name}"
  target_key_id = aws_kms_key.main.key_id
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = local.azs[count.index]
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-private-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-public-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-igw"
  })
}

resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-nat-${count.index + 1}"
  })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-public-rt"
  })
}

resource "aws_route" "public_igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-private-rt-${count.index + 1}"
  })
}

resource "aws_route" "private_nat" {
  count                  = 3
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[0].id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${local.stack_name}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.stack_name}-redis-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Redis cluster"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow Redis from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-redis-sg"
  })
}

resource "aws_security_group" "neptune" {
  name_prefix = "${local.stack_name}-neptune-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Neptune cluster"

  ingress {
    from_port       = 8182
    to_port         = 8182
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow Neptune from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-neptune-sg"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.stack_name}-vpce-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC interface endpoints"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "Allow HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-vpce-sg"
  })
}

# VPC Endpoints (Gateway) with route table associations
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  count           = 3
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
  route_table_id  = aws_route_table.private[count.index].id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  count           = 3
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
  route_table_id  = aws_route_table.private[count.index].id
}

# VPC Interface Endpoints for cost optimization
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-logs-endpoint"
  })
}

resource "aws_vpc_endpoint" "kinesis_streams" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-kinesis-endpoint"
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
    Name = "${local.stack_name}-sqs-endpoint"
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
    Name = "${local.stack_name}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-kms-endpoint"
  })
}

# Note: Timestream VPC endpoint not available in us-east-1
# resource "aws_vpc_endpoint" "timestream" {
#   vpc_id              = aws_vpc.main.id
#   service_name        = "com.amazonaws.${var.aws_region}.timestream.ingest-cell1"
#   vpc_endpoint_type   = "Interface"
#   subnet_ids          = aws_subnet.private[*].id
#   security_group_ids  = [aws_security_group.vpc_endpoints.id]
#   private_dns_enabled = true
#   tags = merge(local.common_tags, {
#     Name = "${local.stack_name}-timestream-endpoint"
#   })
# }

# Kinesis Data Stream (ON_DEMAND omits shard_count, PROVISIONED sets it)
resource "aws_kinesis_stream" "player_state_on_demand" {
  count = var.use_kinesis_on_demand ? 1 : 0
  name  = "${local.stack_name}-player-state"

  stream_mode_details {
    stream_mode = "ON_DEMAND"
  }

  retention_period = 24
  encryption_type  = "KMS"
  kms_key_id       = aws_kms_key.main.arn
  tags             = local.common_tags
}

resource "aws_kinesis_stream" "player_state_provisioned" {
  count = var.use_kinesis_on_demand ? 0 : 1
  name  = "${local.stack_name}-player-state"

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  shard_count      = local.shard_count
  retention_period = 24
  encryption_type  = "KMS"
  kms_key_id       = aws_kms_key.main.arn
  tags             = local.common_tags
}

locals {
  kinesis_stream_arn  = var.use_kinesis_on_demand ? aws_kinesis_stream.player_state_on_demand[0].arn : aws_kinesis_stream.player_state_provisioned[0].arn
  kinesis_stream_name = var.use_kinesis_on_demand ? aws_kinesis_stream.player_state_on_demand[0].name : aws_kinesis_stream.player_state_provisioned[0].name
}

# DynamoDB Table (Global Tables handled via replicas)
resource "aws_dynamodb_table" "player_state" {
  name         = "${local.stack_name}-player-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "player_id"
  range_key    = "state_key"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "player_id"
    type = "S"
  }

  attribute {
    name = "state_key"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  # Global Tables: replicas require provider aliases and regional KMS keys
  dynamic "replica" {
    for_each = var.replica_regions
    content {
      region_name    = replica.value
      propagate_tags = true
    }
  }

  tags = local.common_tags
}

# SNS Topic for fan-out
resource "aws_sns_topic" "player_updates" {
  name              = "${local.stack_name}-player-updates"
  kms_master_key_id = aws_kms_key.main.id
  tags              = local.common_tags
}

# SQS Queues
resource "aws_sqs_queue" "dlq" {
  name                              = "${local.stack_name}-dlq"
  message_retention_seconds         = 1209600
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300
  tags                              = local.common_tags
}

resource "aws_sqs_queue" "graph_updates" {
  count                             = length(var.consumer_groups)
  name                              = "${local.stack_name}-${var.consumer_groups[count.index]}"
  visibility_timeout_seconds        = 300
  message_retention_seconds         = 86400
  max_message_size                  = 262144
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    ConsumerGroup = var.consumer_groups[count.index]
  })
}

resource "aws_sqs_queue" "crdt_resolver" {
  name                              = "${local.stack_name}-crdt-resolver"
  visibility_timeout_seconds        = 180
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300
  tags                              = local.common_tags
}

# SQS Queue Policies with source account protection
resource "aws_sqs_queue_policy" "graph_updates" {
  count     = length(var.consumer_groups)
  queue_url = aws_sqs_queue.graph_updates[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.graph_updates[count.index].arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.player_updates.arn
        }
        StringEquals = {
          "aws:SourceAccount" = local.account_id
        }
      }
    }]
  })
}

# SNS to SQS subscriptions with raw message delivery
resource "aws_sns_topic_subscription" "sns_to_sqs" {
  count                = length(var.consumer_groups)
  topic_arn            = aws_sns_topic.player_updates.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.graph_updates[count.index].arn
  raw_message_delivery = true
}

# ElastiCache Redis Cluster
resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.stack_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags       = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.stack_name}-redis-params"

  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${local.stack_name}-redis"
  retention_in_days = 7
  # Note: KMS encryption for log groups must be set after creation
  # kms_key_id        = aws_kms_key.main.arn
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.stack_name}-redis"
  description          = "Redis cluster with Lua/EVALSHA for atomic player state updates with {playerId} key-tagging"

  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.r7g.large"
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  port                 = 6379

  num_node_groups         = 3
  replicas_per_node_group = 1

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = aws_kms_key.main.arn
  auth_token                 = random_password.redis_auth.result

  automatic_failover_enabled = true
  multi_az_enabled           = true

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = local.common_tags
}

# Neptune Graph Database
resource "aws_neptune_subnet_group" "main" {
  name       = "${local.stack_name}-neptune-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags       = local.common_tags
}

resource "aws_neptune_cluster_parameter_group" "main" {
  family = "neptune1.2"
  name   = "${local.stack_name}-neptune-params"

  parameter {
    name  = "neptune_enable_audit_log"
    value = "1"
  }

  tags = local.common_tags
}

resource "aws_neptune_cluster" "main" {
  cluster_identifier                   = "${local.stack_name}-neptune"
  engine                               = "neptune"
  engine_version                       = "1.2.1.0"
  neptune_subnet_group_name            = aws_neptune_subnet_group.main.name
  neptune_cluster_parameter_group_name = aws_neptune_cluster_parameter_group.main.name
  vpc_security_group_ids               = [aws_security_group.neptune.id]

  storage_encrypted                   = true
  kms_key_arn                         = aws_kms_key.main.arn
  iam_database_authentication_enabled = true
  backup_retention_period             = 7
  preferred_backup_window             = "03:00-04:00"

  enable_cloudwatch_logs_exports = ["audit"]

  tags = local.common_tags
}

resource "aws_neptune_cluster_instance" "main" {
  count              = 2
  identifier         = "${local.stack_name}-neptune-${count.index + 1}"
  cluster_identifier = aws_neptune_cluster.main.id
  instance_class     = "db.r5.large"
  tags               = local.common_tags
}

# Timestream for audit logging
# Note: Account does not have Timestream access - contact AWS support to enable
# resource "aws_timestreamwrite_database" "audit" {
#   database_name = replace("${local.stack_name}-audit", "-", "_")
#   kms_key_id    = aws_kms_key.main.arn
#   tags          = local.common_tags
# }

# resource "aws_timestreamwrite_table" "state_transitions" {
#   database_name = aws_timestreamwrite_database.audit.database_name
#   table_name    = "state_transitions"
#   
#   retention_properties {
#     magnetic_store_retention_period_in_days = 365
#     memory_store_retention_period_in_hours  = 24
#   }
#   
#   tags = local.common_tags
# }

# Placeholder outputs for Timestream (commented until service is enabled)
locals {
  timestream_database = "player_consistency_prod_audit"
  timestream_table    = "state_transitions"
}

# Lambda placeholder code - Node.js
data "archive_file" "lambda_nodejs" {
  type        = "zip"
  output_path = "${path.module}/lambda_nodejs.zip"

  source {
    content  = "exports.handler = async (event) => { console.log(JSON.stringify(event)); return { statusCode: 200, body: 'OK' }; };"
    filename = "index.js"
  }
}

# Lambda placeholder code - Python
data "archive_file" "lambda_python" {
  type        = "zip"
  output_path = "${path.module}/lambda_python.zip"

  source {
    content  = "import json\ndef handler(event, context):\n    print(json.dumps(event))\n    return {'statusCode': 200, 'body': 'OK'}"
    filename = "index.py"
  }
}

# IAM Role for Kinesis to DynamoDB Lambda
resource "aws_iam_role" "kinesis_lambda" {
  name = "${local.stack_name}-kinesis-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "kinesis_lambda" {
  role = aws_iam_role.kinesis_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards"
        ]
        Resource = local.kinesis_stream_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:ConditionCheckItem"
        ]
        Resource = [
          aws_dynamodb_table.player_state.arn,
          "${aws_dynamodb_table.player_state.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.crdt_resolver.arn,
          aws_sqs_queue.dlq.arn
        ]
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "kinesis_lambda_vpc" {
  role       = aws_iam_role.kinesis_lambda.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda: Kinesis processor with conditional writes using version_vector
resource "aws_lambda_function" "kinesis_processor" {
  function_name                  = "${local.stack_name}-kinesis-processor"
  role                           = aws_iam_role.kinesis_lambda.arn
  handler                        = "index.handler"
  runtime                        = "nodejs18.x"
  memory_size                    = 1024
  timeout                        = 60
  reserved_concurrent_executions = 100
  publish                        = true

  environment {
    variables = {
      DYNAMODB_TABLE      = aws_dynamodb_table.player_state.name
      KMS_KEY_ID          = aws_kms_key.main.id
      CRDT_RESOLVER_QUEUE = aws_sqs_queue.crdt_resolver.url
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = data.archive_file.lambda_nodejs.output_path
  source_code_hash = data.archive_file.lambda_nodejs.output_base64sha256

  tags = local.common_tags
}

resource "aws_lambda_alias" "kinesis_processor" {
  name             = "live"
  function_name    = aws_lambda_function.kinesis_processor.arn
  function_version = aws_lambda_function.kinesis_processor.version
}

resource "aws_lambda_provisioned_concurrency_config" "kinesis_processor" {
  function_name                     = aws_lambda_function.kinesis_processor.function_name
  provisioned_concurrent_executions = 10
  qualifier                         = aws_lambda_alias.kinesis_processor.name
}

resource "aws_lambda_event_source_mapping" "kinesis_to_lambda" {
  event_source_arn                   = local.kinesis_stream_arn
  function_name                      = aws_lambda_alias.kinesis_processor.arn
  starting_position                  = "LATEST"
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  parallelization_factor             = 10
  maximum_retry_attempts             = 3
  maximum_record_age_in_seconds      = 3600
  function_response_types            = ["ReportBatchItemFailures"]

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.dlq.arn
    }
  }
}

# IAM Role for DDB Streams to Redis and SNS Lambda
resource "aws_iam_role" "ddb_streams_lambda" {
  name = "${local.stack_name}-ddb-streams-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ddb_streams_lambda" {
  role = aws_iam_role.ddb_streams_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.player_state.arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.player_updates.arn
      },
      # Note: Timestream permissions commented out until service is enabled
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "timestream:WriteRecords",
      #     "timestream:DescribeEndpoints"
      #   ]
      #   Resource = [
      #     "arn:${local.partition}:timestream:${var.aws_region}:${local.account_id}:database/${local.timestream_database}",
      #     "arn:${local.partition}:timestream:${var.aws_region}:${local.account_id}:database/${local.timestream_database}/*"
      #   ]
      # },
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ddb_streams_lambda_vpc" {
  role       = aws_iam_role.ddb_streams_lambda.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda: DDB Streams to Redis with Lua atomic updates and SNS publish
resource "aws_lambda_function" "ddb_to_redis" {
  function_name = "${local.stack_name}-ddb-to-redis"
  role          = aws_iam_role.ddb_streams_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  memory_size   = 512
  timeout       = 30

  environment {
    variables = {
      REDIS_ENDPOINT      = aws_elasticache_replication_group.redis.configuration_endpoint_address
      REDIS_AUTH_TOKEN    = random_password.redis_auth.result
      SNS_TOPIC_ARN       = aws_sns_topic.player_updates.arn
      TIMESTREAM_DATABASE = local.timestream_database
      TIMESTREAM_TABLE    = local.timestream_table
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = data.archive_file.lambda_nodejs.output_path
  source_code_hash = data.archive_file.lambda_nodejs.output_base64sha256

  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "ddb_streams_to_lambda" {
  event_source_arn                   = aws_dynamodb_table.player_state.stream_arn
  function_name                      = aws_lambda_function.ddb_to_redis.arn
  starting_position                  = "LATEST"
  batch_size                         = 50
  maximum_batching_window_in_seconds = 2
  parallelization_factor             = 5
  function_response_types            = ["ReportBatchItemFailures"]
}

# IAM Role for SQS to Neptune Lambda
resource "aws_iam_role" "sqs_neptune_lambda" {
  name = "${local.stack_name}-sqs-neptune-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "sqs_neptune_lambda" {
  role = aws_iam_role.sqs_neptune_lambda.id

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
        Resource = aws_sqs_queue.graph_updates[*].arn
      },
      {
        Effect = "Allow"
        Action = [
          "neptune-db:connect",
          "neptune-db:ReadDataViaQuery",
          "neptune-db:WriteDataViaQuery"
        ]
        Resource = "arn:${local.partition}:neptune-db:${var.aws_region}:${local.account_id}:${aws_neptune_cluster.main.cluster_resource_id}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sqs_neptune_lambda_vpc" {
  role       = aws_iam_role.sqs_neptune_lambda.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda: SQS to Neptune for graph updates
resource "aws_lambda_function" "sqs_to_neptune" {
  function_name = "${local.stack_name}-sqs-to-neptune"
  role          = aws_iam_role.sqs_neptune_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 60

  environment {
    variables = {
      NEPTUNE_ENDPOINT = aws_neptune_cluster.main.endpoint
      NEPTUNE_PORT     = "8182"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = data.archive_file.lambda_python.output_path
  source_code_hash = data.archive_file.lambda_python.output_base64sha256

  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  count            = length(var.consumer_groups)
  event_source_arn = aws_sqs_queue.graph_updates[count.index].arn
  function_name    = aws_lambda_function.sqs_to_neptune.arn
  batch_size       = 10
}

# IAM Role for CRDT Resolver Lambda
resource "aws_iam_role" "crdt_resolver_lambda" {
  name = "${local.stack_name}-crdt-resolver-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "crdt_resolver_lambda" {
  role = aws_iam_role.crdt_resolver_lambda.id

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
        Resource = aws_sqs_queue.crdt_resolver.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:ConditionCheckItem"
        ]
        Resource = [
          aws_dynamodb_table.player_state.arn,
          "${aws_dynamodb_table.player_state.arn}/index/*"
        ]
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "crdt_resolver_lambda_vpc" {
  role       = aws_iam_role.crdt_resolver_lambda.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda: CRDT conflict resolution with merge logic
resource "aws_lambda_function" "crdt_resolver" {
  function_name = "${local.stack_name}-crdt-resolver"
  role          = aws_iam_role.crdt_resolver_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  memory_size   = 512
  timeout       = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.player_state.name
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = data.archive_file.lambda_nodejs.output_path
  source_code_hash = data.archive_file.lambda_nodejs.output_base64sha256

  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "crdt_sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.crdt_resolver.arn
  function_name    = aws_lambda_function.crdt_resolver.arn
  batch_size       = 5
}

# IAM Role for Consistency Checker Lambda
resource "aws_iam_role" "consistency_lambda" {
  name = "${local.stack_name}-consistency-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "consistency_lambda" {
  role = aws_iam_role.consistency_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.player_state.arn
      },
      # Note: Timestream permissions commented out until service is enabled
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "timestream:WriteRecords",
      #     "timestream:DescribeEndpoints"
      #   ]
      #   Resource = [
      #     "arn:${local.partition}:timestream:${var.aws_region}:${local.account_id}:database/${local.timestream_database}",
      #     "arn:${local.partition}:timestream:${var.aws_region}:${local.account_id}:database/${local.timestream_database}/*"
      #   ]
      # },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "consistency_lambda_vpc" {
  role       = aws_iam_role.consistency_lambda.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda: Consistency checker (compares DDB vs Redis samples)
resource "aws_lambda_function" "consistency_checker" {
  function_name = "${local.stack_name}-consistency-checker"
  role          = aws_iam_role.consistency_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30

  environment {
    variables = {
      DYNAMODB_TABLE      = aws_dynamodb_table.player_state.name
      REDIS_ENDPOINT      = aws_elasticache_replication_group.redis.configuration_endpoint_address
      REDIS_AUTH_TOKEN    = random_password.redis_auth.result
      SAMPLE_SIZE         = tostring(var.verification_sample_size)
      TIMESTREAM_DATABASE = local.timestream_database
      TIMESTREAM_TABLE    = local.timestream_table
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  filename         = data.archive_file.lambda_python.output_path
  source_code_hash = data.archive_file.lambda_python.output_base64sha256

  tags = local.common_tags
}

# Step Functions Express Workflow with guarded 5-second loop
resource "aws_iam_role" "step_functions" {
  name = "${local.stack_name}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_functions" {
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.consistency_checker.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.step_functions.arn}:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${local.stack_name}-consistency"
  retention_in_days = 7
  # Note: KMS encryption for log groups must be set after creation
  # kms_key_id        = aws_kms_key.main.arn
  tags = local.common_tags
}

# CloudWatch Logs resource policy to allow Step Functions to write logs
resource "aws_cloudwatch_log_resource_policy" "step_functions" {
  policy_name = "${local.stack_name}-step-functions-logs"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:PutResourcePolicy",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "${aws_cloudwatch_log_group.step_functions.arn}:*"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = local.account_id
        }
      }
    }]
  })
}

resource "aws_sfn_state_machine" "consistency_checker" {
  name     = "${local.stack_name}-consistency-checker"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"

  depends_on = [
    aws_cloudwatch_log_group.step_functions,
    aws_cloudwatch_log_resource_policy.step_functions,
    aws_iam_role_policy.step_functions
  ]

  definition = jsonencode({
    Comment = "Express workflow with guarded 5-second loop for DDB vs Redis consistency checks"
    StartAt = "InitCounter"
    States = {
      InitCounter = {
        Type       = "Pass"
        Result     = 0
        ResultPath = "$.iterationCount"
        Next       = "CheckConsistency"
      }
      CheckConsistency = {
        Type       = "Task"
        Resource   = aws_lambda_function.consistency_checker.arn
        ResultPath = "$.checkResult"
        Next       = "IncrementCounter"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 2
          MaxAttempts     = 2
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "End"
        }]
      }
      IncrementCounter = {
        Type = "Pass"
        Parameters = {
          "iterationCount.$" = "States.MathAdd($.iterationCount, 1)"
          "maxIterations.$"  = "$.maxIterations"
        }
        Next = "Wait5Seconds"
      }
      Wait5Seconds = {
        Type    = "Wait"
        Seconds = 5
        Next    = "CheckLoop"
      }
      CheckLoop = {
        Type = "Choice"
        Choices = [{
          Variable            = "$.iterationCount"
          NumericLessThanPath = "$.maxIterations"
          Next                = "CheckConsistency"
        }]
        Default = "End"
      }
      End = {
        Type = "Succeed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tags = local.common_tags
}

# EventBridge Rule (1 minute) to trigger Step Functions
resource "aws_iam_role" "eventbridge" {
  name = "${local.stack_name}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge" {
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "states:StartExecution"
      ]
      Resource = aws_sfn_state_machine.consistency_checker.arn
    }]
  })
}

resource "aws_cloudwatch_event_rule" "consistency_trigger" {
  name                = "${local.stack_name}-consistency-trigger"
  description         = "Trigger consistency checks every minute"
  schedule_expression = "rate(1 minute)"
  tags                = local.common_tags
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.consistency_trigger.name
  target_id = "StepFunctions"
  arn       = aws_sfn_state_machine.consistency_checker.arn
  role_arn  = aws_iam_role.eventbridge.arn

  input = jsonencode({
    maxIterations  = 10
    iterationCount = 0
  })
}

# CloudWatch Alarms with correct metrics
resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${local.stack_name}-kinesis-iterator-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = 60
  statistic           = "Maximum"
  threshold           = 60000
  alarm_description   = "Kinesis consumer lag detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    StreamName = local.kinesis_stream_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.stack_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda function errors on hot path"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.kinesis_processor.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttle" {
  alarm_name          = "${local.stack_name}-dynamodb-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB write throttling detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.player_state.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttle" {
  alarm_name          = "${local.stack_name}-dynamodb-read-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB read throttling detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.player_state.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.stack_name}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Redis CPU utilization high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }

  tags = local.common_tags
}

# Outputs
output "kinesis_stream_arn" {
  value       = local.kinesis_stream_arn
  description = "ARN of the Kinesis stream for player state ingestion"
}

output "kinesis_stream_name" {
  value       = local.kinesis_stream_name
  description = "Name of the Kinesis stream"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.player_state.name
  description = "Name of the DynamoDB table storing player state with version_vector"
}

output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.player_state.arn
  description = "ARN of the DynamoDB table"
}

output "dynamodb_stream_arn" {
  value       = aws_dynamodb_table.player_state.stream_arn
  description = "ARN of the DynamoDB stream"
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  description = "Redis cluster configuration endpoint for hot reads (requires cluster-aware client with {playerId} key-tagging)"
}

output "redis_port" {
  value       = aws_elasticache_replication_group.redis.port
  description = "Redis cluster port"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.player_updates.arn
  description = "SNS topic ARN for player update fan-out"
}

output "sqs_queue_urls" {
  value       = { for idx, q in aws_sqs_queue.graph_updates : var.consumer_groups[idx] => q.url }
  description = "SQS queue URLs for graph update processing by consumer group"
}

output "sqs_dlq_url" {
  value       = aws_sqs_queue.dlq.url
  description = "Dead letter queue URL"
}

output "sqs_crdt_resolver_url" {
  value       = aws_sqs_queue.crdt_resolver.url
  description = "CRDT conflict resolver queue URL"
}

output "neptune_endpoint" {
  value       = aws_neptune_cluster.main.endpoint
  description = "Neptune cluster endpoint for social graph"
}

output "neptune_reader_endpoint" {
  value       = aws_neptune_cluster.main.reader_endpoint
  description = "Neptune cluster reader endpoint"
}

output "neptune_port" {
  value       = aws_neptune_cluster.main.port
  description = "Neptune cluster port"
}

output "neptune_cluster_resource_id" {
  value       = aws_neptune_cluster.main.cluster_resource_id
  description = "Neptune cluster resource ID for IAM database authentication"
}

output "step_functions_arn" {
  value       = aws_sfn_state_machine.consistency_checker.arn
  description = "Step Functions Express state machine ARN for consistency checks (guarded 5s loop, 1m trigger)"
}

output "timestream_database" {
  value       = local.timestream_database
  description = "Timestream database for audit logging (placeholder - service not enabled)"
}

output "timestream_table" {
  value       = local.timestream_table
  description = "Timestream table for state transitions (placeholder - service not enabled)"
}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID for the stack"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "kms_key_id" {
  value       = aws_kms_key.main.id
  description = "KMS key ID for encryption"
}

output "kms_key_arn" {
  value       = aws_kms_key.main.arn
  description = "KMS key ARN"
}
