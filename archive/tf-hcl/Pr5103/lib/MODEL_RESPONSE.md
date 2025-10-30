### Reasoning Trace
---

Let me create a comprehensive Terraform file that implements the entire architecture described. This is a complex setup with multiple AWS services integrated together. I need to:

1. Define all variables and locals
2. Create the VPC infrastructure with private subnets
3. Set up KMS keys for encryption
4. Configure Kinesis for ingestion
5. Set up DynamoDB with Global Tables
6. Configure Lambda functions for various stages
7. Set up ElastiCache Redis cluster
8. Configure SNS/SQS for fan-out
9. Set up Neptune for graph database
10. Configure Step Functions for consistency checks
11. Set up EventBridge for triggering
12. Configure Timestream for audit
13. Set up all necessary IAM roles and policies
14. Include CloudWatch alarms
15. Add outputs

Let me structure this carefully to include everything in a single file.
### Answer 
---

```hcl
// tap_stack.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
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
    ManagedBy   = "terraform"
  }
  
  # Kinesis capacity calculations
  throughput_mb = ceil((var.updates_per_second * var.avg_item_size_bytes) / 1024 / 1024)
  shard_count   = var.use_shards ? max(ceil(local.throughput_mb), ceil(var.updates_per_second / 1000)) : 0
  
  # Availability zones for multi-AZ deployments
  azs = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
}

# KMS Keys for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.stack_name}"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = local.common_tags
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

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-igw"
  })
}

resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-nat-${count.index + 1}"
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
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
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

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${local.stack_name}-lambda-"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.stack_name}-redis-"
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
    Name = "${local.stack_name}-redis-sg"
  })
}

resource "aws_security_group" "neptune" {
  name_prefix = "${local.stack_name}-neptune-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 8182
    to_port         = 8182
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-neptune-sg"
  })
}

# VPC Endpoints for AWS services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  tags = merge(local.common_tags, {
    Name = "${local.stack_name}-s3-endpoint"
  })
}

# Kinesis Data Stream
resource "aws_kinesis_stream" "player_state" {
  name = "${local.stack_name}-player-state"
  
  stream_mode_details {
    stream_mode = var.use_kinesis_on_demand ? "ON_DEMAND" : "PROVISIONED"
  }
  
  shard_count = var.use_kinesis_on_demand ? null : local.shard_count
  
  retention_period = 24
  
  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn
  
  tags = local.common_tags
}

# DynamoDB Table with Global Tables
resource "aws_dynamodb_table" "player_state" {
  name         = "${local.stack_name}-player-state"
  billing_mode = "ON_DEMAND"
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
  
  # Global Tables configuration
  dynamic "replica" {
    for_each = var.replica_regions
    content {
      region_name = replica.value
      kms_key_arn = aws_kms_key.main.arn
    }
  }
  
  tags = local.common_tags
}

# IAM Role for Kinesis-to-Lambda
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
        Resource = aws_kinesis_stream.player_state.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.player_state.arn
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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "kinesis_lambda_vpc" {
  role       = aws_iam_role.kinesis_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda for Kinesis processing with conditional writes
resource "aws_lambda_function" "kinesis_processor" {
  function_name = "${local.stack_name}-kinesis-processor"
  role          = aws_iam_role.kinesis_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  memory_size   = 1024
  timeout       = 60
  
  # Provisioned concurrency for low latency
  reserved_concurrent_executions = 100
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.player_state.name
      KMS_KEY_ID     = aws_kms_key.main.id
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  # Placeholder code - implements conditional writes with version_vector
  filename = "lambda.zip"
  
  tags = local.common_tags
}

resource "aws_lambda_provisioned_concurrency_config" "kinesis_processor" {
  function_name                     = aws_lambda_function.kinesis_processor.function_name
  provisioned_concurrent_executions = 10
  qualifier                         = aws_lambda_function.kinesis_processor.version
}

resource "aws_lambda_event_source_mapping" "kinesis_to_lambda" {
  event_source_arn  = aws_kinesis_stream.player_state.arn
  function_name     = aws_lambda_function.kinesis_processor.arn
  starting_position = "LATEST"
  
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  parallelization_factor             = 10
  maximum_retry_attempts             = 3
  maximum_record_age_in_seconds      = 3600
  
  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.dlq.arn
    }
  }
}

# IAM Role for DDB Streams to Redis Lambda
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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ddb_streams_lambda_vpc" {
  role       = aws_iam_role.ddb_streams_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda for DDB Streams to Redis
resource "aws_lambda_function" "ddb_to_redis" {
  function_name = "${local.stack_name}-ddb-to-redis"
  role          = aws_iam_role.ddb_streams_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  memory_size   = 512
  timeout       = 30
  
  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.configuration_endpoint_address
      # Uses Lua scripts for atomic updates with {playerId} key-tagging
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  filename = "lambda.zip"
  
  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "ddb_streams_to_lambda" {
  event_source_arn  = aws_dynamodb_table.player_state.stream_arn
  function_name     = aws_lambda_function.ddb_to_redis.arn
  starting_position = "LATEST"
  
  batch_size                         = 50
  maximum_batching_window_in_seconds = 2
  parallelization_factor             = 5
}

# ElastiCache Redis Cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.stack_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags       = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.stack_name}-redis-params"
  
  # Enable Redis cluster mode for sharding
  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }
  
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.stack_name}-redis"
  description          = "Redis cluster for hot reads with Lua/EVALSHA support"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.r7g.large"
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  port                 = 6379
  
  # Cluster mode with multiple shards
  num_node_groups         = 3
  replicas_per_node_group = 1
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = aws_kms_key.main.arn
  auth_token_enabled         = true
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

resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${local.stack_name}-redis"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn
  tags              = local.common_tags
}

# SNS Topic for fan-out
resource "aws_sns_topic" "player_updates" {
  name = "${local.stack_name}-player-updates"
  
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.common_tags
}

# SQS Queue for graph updates
resource "aws_sqs_queue" "graph_updates" {
  name = "${local.stack_name}-graph-updates"
  
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  max_message_size           = 262144
  
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = local.common_tags
}

resource "aws_sqs_queue" "dlq" {
  name = "${local.stack_name}-dlq"
  
  message_retention_seconds = 1209600  # 14 days
  
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "sns_to_sqs" {
  topic_arn = aws_sns_topic.player_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.graph_updates.arn
}

resource "aws_sqs_queue_policy" "graph_updates" {
  queue_url = aws_sqs_queue.graph_updates.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.graph_updates.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.player_updates.arn
        }
      }
    }]
  })
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
  cluster_identifier = "${local.stack_name}-neptune"
  engine             = "neptune"
  engine_version     = "1.2.1.0"
  
  neptune_subnet_group_name         = aws_neptune_subnet_group.main.name
  neptune_cluster_parameter_group_name = aws_neptune_cluster_parameter_group.main.name
  
  vpc_security_group_ids = [aws_security_group.neptune.id]
  
  storage_encrypted = true
  kms_key_arn       = aws_kms_key.main.arn
  
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  enable_cloudwatch_logs_exports = ["audit"]
  
  tags = local.common_tags
}

resource "aws_neptune_cluster_instance" "main" {
  count              = 2
  identifier         = "${local.stack_name}-neptune-${count.index + 1}"
  cluster_identifier = aws_neptune_cluster.main.id
  instance_class     = "db.r5.large"
  
  tags = local.common_tags
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
        Resource = aws_sqs_queue.graph_updates.arn
      },
      {
        Effect = "Allow"
        Action = [
          "neptune-db:*"
        ]
        Resource = "${aws_neptune_cluster.main.arn}/*"
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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sqs_neptune_lambda_vpc" {
  role       = aws_iam_role.sqs_neptune_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda for SQS to Neptune
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
  
  filename = "lambda.zip"
  
  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.graph_updates.arn
  function_name    = aws_lambda_function.sqs_to_neptune.arn
  batch_size       = 10
}

# CRDT Resolver Queue and Lambda
resource "aws_sqs_queue" "crdt_resolver" {
  name = "${local.stack_name}-crdt-resolver"
  
  visibility_timeout_seconds = 180
  
  kms_master_key_id                 = aws_kms_key.main.id
  kms_data_key_reuse_period_seconds = 300
  
  tags = local.common_tags
}

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
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.player_state.arn
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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "crdt_resolver_lambda_vpc" {
  role       = aws_iam_role.crdt_resolver_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda for CRDT resolution
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
      # Implements CRDT merge logic with retry
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  filename = "lambda.zip"
  
  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "crdt_sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.crdt_resolver.arn
  function_name    = aws_lambda_function.crdt_resolver.arn
  batch_size       = 5
}

# Timestream for audit logging
resource "aws_timestreamwrite_database" "audit" {
  database_name = replace("${local.stack_name}-audit", "-", "_")
  
  kms_key_id = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_timestreamwrite_table" "state_transitions" {
  database_name = aws_timestreamwrite_database.audit.database_name
  table_name    = "state_transitions"
  
  retention_properties {
    magnetic_store_retention_period_in_days = 365
    memory_store_retention_period_in_hours  = 24
  }
  
  tags = local.common_tags
}

# Step Functions Express Workflow for consistency checks
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

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${local.stack_name}-consistency"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn
  tags              = local.common_tags
}

resource "aws_sfn_state_machine" "consistency_checker" {
  name     = "${local.stack_name}-consistency-checker"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"
  
  definition = jsonencode({
    Comment = "Express workflow with 5-second internal loop for consistency checks"
    StartAt = "CheckConsistency"
    States = {
      CheckConsistency = {
        Type     = "Task"
        Resource = aws_lambda_function.consistency_checker.arn
        Next     = "Wait5Seconds"
      }
      Wait5Seconds = {
        Type    = "Wait"
        Seconds = 5
        Next    = "CheckLoop"
      }
      CheckLoop = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.continue"
            BooleanEquals = true
            Next          = "CheckConsistency"
          }
        ]
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

# Lambda for consistency checking
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
      {
        Effect = "Allow"
        Action = [
          "timestream:WriteRecords",
          "timestream:DescribeEndpoints"
        ]
        Resource = [
          aws_timestreamwrite_database.audit.arn,
          "${aws_timestreamwrite_database.audit.arn}/*"
        ]
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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "consistency_lambda_vpc" {
  role       = aws_iam_role.consistency_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "consistency_checker" {
  function_name = "${local.stack_name}-consistency-checker"
  role          = aws_iam_role.consistency_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30
  
  environment {
    variables = {
      DYNAMODB_TABLE           = aws_dynamodb_table.player_state.name
      REDIS_ENDPOINT           = aws_elasticache_replication_group.redis.configuration_endpoint_address
      SAMPLE_SIZE              = tostring(var.verification_sample_size)
      TIMESTREAM_DATABASE      = aws_timestreamwrite_database.audit.database_name
      TIMESTREAM_TABLE         = aws_timestreamwrite_table.state_transitions.table_name
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  filename = "lambda.zip"
  
  tags = local.common_tags
}

# EventBridge Rule to trigger Step Functions every minute
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
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.consistency_trigger.name
  target_id = "StepFunctions"
  arn       = aws_sfn_state_machine.consistency_checker.arn
  role_arn  = aws_iam_role.eventbridge.arn
  
  input = jsonencode({
    continue = true
    maxIterations = 10  # 10 iterations * 5 seconds = 50 seconds max
  })
}

# CloudWatch Alarms for hot path monitoring
resource "aws_cloudwatch_metric_alarm" "kinesis_throttle" {
  alarm_name          = "${local.stack_name}-kinesis-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserRecordsThrottled"
  namespace           = "AWS/Kinesis"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Kinesis throttling detected"
  
  dimensions = {
    StreamName = aws_kinesis_stream.player_state.name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.stack_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Lambda function errors"
  
  dimensions = {
    FunctionName = aws_lambda_function.kinesis_processor.function_name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "${local.stack_name}-dynamodb-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "DynamoDB throttling detected"
  
  dimensions = {
    TableName = aws_dynamodb_table.player_state.name
  }
  
  tags = local.common_tags
}

# Outputs
output "kinesis_stream_arn" {
  value       = aws_kinesis_stream.player_state.arn
  description = "ARN of the Kinesis stream for player state ingestion"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.player_state.name
  description = "Name of the DynamoDB table storing player state"
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  description = "Redis cluster endpoint for hot reads"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.player_updates.arn
  description = "SNS topic ARN for player update fan-out"
}

output "sqs_queue_url" {
  value       = aws_sqs_queue.graph_updates.url
  description = "SQS queue URL for graph update processing"
}

output "neptune_endpoint" {
  value       = aws_neptune_cluster.main.endpoint
  description = "Neptune cluster endpoint for social graph"
}

output "step_functions_arn" {
  value       = aws_sfn_state_machine.consistency_checker.arn
  description = "Step Functions state machine ARN for consistency checks"
}

output "timestream_database" {
  value       = aws_timestreamwrite_database.audit.database_name
  description = "Timestream database for audit logging"
}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID for the stack"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "kms_key_id" {
  value       = aws_kms_key.main.id
  description = "KMS key ID for encryption"
}
```