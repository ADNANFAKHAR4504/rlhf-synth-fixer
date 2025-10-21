# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "prod"
}

variable "unique_prefix" {
  description = "Unique suffix for globally unique resource names"
  type        = string
  default     = "iac-243"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (if needed)"
  type        = string
  default     = "10.0.0.0/8"
}

variable "enable_pitr" {
  description = "Enable Point-in-Time Recovery for DynamoDB"
  type        = bool
  default     = true
}

variable "enable_kinesis_encryption" {
  description = "Enable server-side encryption for Kinesis streams"
  type        = bool
  default     = true
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "kinesis_shard_count" {
  description = "Number of shards for Kinesis stream"
  type        = number
  default     = 10  # ~10,000 events/min = 167 events/sec, each shard handles 1000 records/sec
}

variable "kinesis_retention_period" {
  description = "Kinesis data retention period in hours"
  type        = number
  default     = 24
}

variable "dynamodb_read_capacity" {
  description = "Initial DynamoDB read capacity units"
  type        = number
  default     = 20
}

variable "dynamodb_write_capacity" {
  description = "Initial DynamoDB write capacity units"
  type        = number
  default     = 20
}

variable "state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  type        = string
  default     = "terraform-state-bucket"
}

variable "state_lock_table_name" {
  description = "DynamoDB table name for state locking"
  type        = string
  default     = "terraform-state-lock"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "ClickStream"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Resource naming convention
  resource_prefix = "${var.unique_prefix}-${var.environment}"
  
  # Common tags
  common_tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      iac-rlhf-amazon = "true"
      team = 2
    }
  
  # Network configuration
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 0),  # 10.0.0.0/20
    cidrsubnet(var.vpc_cidr, 4, 1),  # 10.0.16.0/20
  ]
  
  nat_gateway_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 32), # 10.0.32.0/24
    cidrsubnet(var.vpc_cidr, 8, 33), # 10.0.33.0/24
  ]
  
  # Feature toggles
  enable_vpc_flow_logs = true
  enable_enhanced_monitoring = true
  
  # Lambda configuration
  lambda_batch_size = 100
  lambda_max_batching_window = 5
  lambda_parallelization_factor = 10
  lambda_retry_attempts = 3
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================================================
# VPC & NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpc"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.azs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# NAT Gateway Subnets (small public subnets for NAT Gateways only)
resource "aws_subnet" "nat" {
  count = length(var.azs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.nat_gateway_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-subnet-${count.index + 1}"
      Type = "NAT"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-igw"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.azs)
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.azs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.nat[count.index].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-gateway-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route table for NAT subnets
resource "aws_route_table" "nat" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-rt"
    }
  )
}

# Associate NAT subnets with route table
resource "aws_route_table_association" "nat" {
  count = length(var.azs)
  
  subnet_id      = aws_subnet.nat[count.index].id
  route_table_id = aws_route_table.nat.id
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count = length(var.azs)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
    }
  )
}

# Associate private subnets with route tables
resource "aws_route_table_association" "private" {
  count = length(var.azs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpce-dynamodb"
    }
  )
}

resource "aws_vpc_endpoint" "kinesis" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpce-kinesis"
    }
  )
}

resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpce-lambda"
    }
  )
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = local.enable_vpc_flow_logs ? 1 : 0
  
  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpc-flow-logs"
    }
  )
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = local.enable_vpc_flow_logs ? 1 : 0
  
  name              = "/aws/vpc/${local.resource_prefix}-2"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_iam_role" "flow_logs" {
  count = local.enable_vpc_flow_logs ? 1 : 0
  
  name = "${local.resource_prefix}-flow-logs-role"
  
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

resource "aws_iam_role_policy" "flow_logs" {
  count = local.enable_vpc_flow_logs ? 1 : 0
  
  name = "${local.resource_prefix}-flow-logs-policy"
  role = aws_iam_role.flow_logs[0].id
  
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
      }
    ]
  })
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.resource_prefix}-vpce-sg"
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
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpce-sg"
    }
  )
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-sg"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-sg"
    }
  )
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${local.resource_prefix}-alb-sg"
  vpc_id      = aws_vpc.main.id
  
  # Open to outside for E2E testing purposes
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
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
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-alb-sg"
    }
  )
}

# ============================================================================
# KINESIS DATA STREAMS
# ============================================================================

resource "aws_kinesis_stream" "clickstream" {
  name             = "${local.resource_prefix}-clickstream"
  shard_count      = var.kinesis_shard_count
  retention_period = var.kinesis_retention_period
  
  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
  ]
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  encryption_type = var.enable_kinesis_encryption ? "KMS" : "NONE"
  kms_key_id      = var.enable_kinesis_encryption ? aws_kms_key.kinesis[0].id : null
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-clickstream"
    }
  )
}

# KMS Key for Kinesis Encryption
resource "aws_kms_key" "kinesis" {
  count = var.enable_kinesis_encryption ? 1 : 0
  
  description             = "KMS key for Kinesis stream encryption"
  deletion_window_in_days = 7

   policy = jsonencode({
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnableIAMUserPermissions",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
      "Action": "kms:*",
      "Resource": "*"
    },
    // Kinesis service pode criptografar/descr. via serviço (producer e consumer)
    {
      "Sid": "AllowKinesisServiceViaService",
      "Effect": "Allow",
      "Principal": { "Service": "kinesis.amazonaws.com" },
      "Action": [ "kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey" ],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "kms:ViaService": "kinesis.${var.aws_region}.amazonaws.com" }
      }
    },
    // (opcional) Lambda service via Kinesis — pode manter ou remover; não é estritamente necessário
    {
      "Sid": "AllowLambdaServiceViaKinesis",
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": [ "kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey" ],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "kms:ViaService": "kinesis.${var.aws_region}.amazonaws.com" }
      }
    },
    // Permite o produtor (sua Lambda ingest) gerar data keys (erro que você já viu)
    {
      "Sid": "AllowProducerLambdaGenerateDataKey",
      "Effect": "Allow",
      "Principal": { "AWS": "${aws_iam_role.lambda_execution_ingest.arn}" },
      "Action": [ "kms:GenerateDataKey", "kms:DescribeKey" ],
      "Resource": "*"
    }
  ]
})

  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-kinesis-kms"
    }
  )
}

resource "aws_kms_alias" "kinesis" {
  count = var.enable_kinesis_encryption ? 1 : 0
  
  name          = "alias/${local.resource_prefix}-kinesis"
  target_key_id = aws_kms_key.kinesis[0].key_id
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-execution-role"
  
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

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards",
          "kinesis:DescribeStreamSummary",
          "kinesis:SubscribeToShard",
          "kinesis:ListStreams"
        ]
        Resource = aws_kinesis_stream.clickstream.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.processed_data.arn,
          "${aws_dynamodb_table.processed_data.arn}/index/*"
        ]
      },
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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [  "kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"  ],
        Resource = aws_kms_key.kinesis[0].arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_execution.name
}

data "archive_file" "stream_process_simple" {
  type        = "zip"
  source_file = "${path.module}/runtime/stream_process.py"
  output_path = "${path.module}/runtime/stream_process.zip"
}

resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.stream_process_simple.output_path
  function_name    = "${local.resource_prefix}-processor"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "stream_process.lambda_handler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout

  source_code_hash = data.archive_file.stream_process_simple.output_base64sha256

  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.processed_data.name
      ENVIRONMENT    = var.environment
    }
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-processor"
    }
  )
  
  depends_on = [
    aws_iam_role_policy_attachment.lambda_vpc_execution,
    aws_cloudwatch_log_group.lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.resource_prefix}-processor"
  retention_in_days = 7
  
  tags = local.common_tags
}

# Event Source Mapping
resource "aws_lambda_event_source_mapping" "kinesis_lambda" {
  event_source_arn  = aws_kinesis_stream.clickstream.arn
  function_name     = aws_lambda_function.processor.arn
  starting_position = "LATEST"
  
  batch_size                         = local.lambda_batch_size
  maximum_batching_window_in_seconds = local.lambda_max_batching_window
  parallelization_factor            = local.lambda_parallelization_factor
  maximum_retry_attempts            = local.lambda_retry_attempts
  
  bisect_batch_on_function_error = true
  maximum_record_age_in_seconds  = 3600
}

# ============================================================================
# DYNAMODB
# ============================================================================

resource "aws_dynamodb_table" "processed_data" {
  name           = "${local.resource_prefix}-processed-data"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
  hash_key       = "userId"
  range_key      = "timestamp"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "eventType"
    type = "S"
  }
  
  global_secondary_index {
    name            = "eventTypeIndex"
    hash_key        = "eventType"
    range_key       = "timestamp"
    write_capacity  = var.dynamodb_write_capacity
    read_capacity   = var.dynamodb_read_capacity
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled = true
  }
  
  point_in_time_recovery {
    enabled = var.enable_pitr
  }
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-processed-data"
    }
  )
}

resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  count = var.dynamodb_read_capacity > 0 ? 1 : 0
  
  max_capacity       = var.dynamodb_read_capacity * 10
  min_capacity       = var.dynamodb_read_capacity
  resource_id        = "table/${aws_dynamodb_table.processed_data.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  count = var.dynamodb_write_capacity > 0 ? 1 : 0
  
  max_capacity       = var.dynamodb_write_capacity * 10
  min_capacity       = var.dynamodb_write_capacity
  resource_id        = "table/${aws_dynamodb_table.processed_data.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  count = var.dynamodb_read_capacity > 0 ? 1 : 0
  
  name               = "${local.resource_prefix}-dynamodb-read-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  count = var.dynamodb_write_capacity > 0 ? 1 : 0
  
  name               = "${local.resource_prefix}-dynamodb-write-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER
# ============================================================================

resource "aws_lb" "api" {
  name               = "${local.resource_prefix}-api-alb"
  # Open to outside for E2E testing purposes
  internal           = false # lets not make it internal so we can test it
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.nat[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "api-alb"
    enabled = true
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-alb"
    }
  )
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.resource_prefix}-alb-logs-v2"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-alb-logs-v2"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "api" {
  name     = "${local.resource_prefix}-api-tg"
  target_type = "lambda"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 5
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-tg"
    }
  )
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM Role for Lambda
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "lambda_execution_ingest" {
  name = "${local.resource_prefix}-lambda-ingest-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

# Minimal inline policy: Kinesis write + CloudWatch Logs + VPC ENI (if in VPC)
resource "aws_iam_role_policy" "lambda_execution_ingest" {
  name = "${local.resource_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution_ingest.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Kinesis producer permissions
      {
        Effect   = "Allow"
        Action   = ["kinesis:PutRecord", "kinesis:PutRecords", "kinesis:DescribeStream", "kinesis:DescribeStreamSummary"]
        Resource = aws_kinesis_stream.clickstream.arn
      },
      # Logs
      {
        Effect = "Allow"
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "*"
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
        Effect = "Allow",
        Action = [ "kms:GenerateDataKey", "kms:DescribeKey" ],
        Resource = aws_kms_key.kinesis[0].arn
      }
    ]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# Package the ingest Lambda (single file -> zip)
# ─────────────────────────────────────────────────────────────────────────────
data "archive_file" "stream_ingest_zip" {
  type        = "zip"
  source_file = "${path.module}/runtime/stream_ingest.py"
  output_path = "${path.module}/runtime/stream_ingest.zip"
}

# ─────────────────────────────────────────────────────────────────────────────
# Lambda: stream-ingest (producer to Kinesis)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lambda_function" "stream_ingest" {
  filename         = data.archive_file.stream_ingest_zip.output_path
  source_code_hash = data.archive_file.stream_ingest_zip.output_base64sha256

  function_name = "${local.resource_prefix}-stream-ingest"
  role          = aws_iam_role.lambda_execution_ingest.arn
  handler       = "stream_ingest.handler"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = 256

  # Keep only if you truly need VPC access. If no NAT/Endpoints, Kinesis calls will fail.
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      STREAM_NAME = aws_kinesis_stream.clickstream.name
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-stream-ingest"
  })

  depends_on = [
    aws_cloudwatch_log_group.stream_ingest
  ]
}

# ─────────────────────────────────────────────────────────────────────────────
# CloudWatch Log Group for the ingest Lambda
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "stream_ingest" {
  name              = "/aws/lambda/${local.resource_prefix}-stream-ingest"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_lambda_permission" "allow_from_alb_tg" {
  statement_id  = "AllowExecutionFromALBTargetGroup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stream_ingest.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.api.arn
}

resource "aws_lb_target_group_attachment" "api_lambda" {
  target_group_arn = aws_lb_target_group.api.arn
  target_id        = aws_lambda_function.stream_ingest.arn

  depends_on = [
    aws_lambda_permission.allow_from_alb_tg  # ensure permission exists first
  ]
}

resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = merge(
    local.common_tags,
    { Name = "${local.resource_prefix}-api-listener" }
  )
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${local.resource_prefix}-kinesis-iterator-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "60000"  # 1 minute
  alarm_description   = "Kinesis iterator age is too high"
  
  dimensions = {
    StreamName = aws_kinesis_stream.clickstream.name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.resource_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Lambda function error rate is too high"
  
  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.resource_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB system errors detected"
  
  dimensions = {
    TableName = aws_dynamodb_table.processed_data.name
  }
  
  tags = local.common_tags
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "CIDR block of the VPC"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "IDs of private subnets"
}

output "nat_gateway_ids" {
  value       = aws_nat_gateway.main[*].id
  description = "IDs of NAT gateways"
}

output "kinesis_stream_name" {
  value       = aws_kinesis_stream.clickstream.name
  description = "Name of the Kinesis stream"
}

output "kinesis_stream_arn" {
  value       = aws_kinesis_stream.clickstream.arn
  description = "ARN of the Kinesis stream"
}

output "lambda_function_name" {
  value       = aws_lambda_function.processor.function_name
  description = "Name of the Lambda function"
}

output "lambda_function_arn" {
  value       = aws_lambda_function.processor.arn
  description = "ARN of the Lambda function"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.processed_data.name
  description = "Name of the DynamoDB table"
}

output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.processed_data.arn
  description = "ARN of the DynamoDB table"
}

output "alb_dns_name" {
  value       = aws_lb.api.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "alb_arn" {
  value       = aws_lb.api.arn
  description = "ARN of the Application Load Balancer"
}

output "alb_target_group_arn" {
  value       = aws_lb_target_group.api.arn
  description = "ARN of the ALB target group"
}

output "vpc_endpoint_dynamodb_id" {
  value       = aws_vpc_endpoint.dynamodb.id
  description = "ID of the DynamoDB VPC endpoint"
}

output "vpc_endpoint_kinesis_id" {
  value       = aws_vpc_endpoint.kinesis.id
  description = "ID of the Kinesis VPC endpoint"
}

output "vpc_endpoint_lambda_id" {
  value       = aws_vpc_endpoint.lambda.id
  description = "ID of the Lambda VPC endpoint"
}

output "security_group_lambda_id" {
  value       = aws_security_group.lambda.id
  description = "ID of the Lambda security group"
}

output "security_group_alb_id" {
  value       = aws_security_group.alb.id
  description = "ID of the ALB security group"
}

output "cloudwatch_log_group_lambda" {
  value       = aws_cloudwatch_log_group.lambda.name
  description = "CloudWatch log group for Lambda function"
}
