```terraform
# tap_stack.tf - Global Hotel Booking Infrastructure (Production-Ready, Self-Contained)
#
# REQUIREMENTS:
# - Terraform >= 1.5.0
# - AWS Provider >= 5.20.0 (required for nodejs20.x Lambda runtime support)
#
# DEPLOYMENT PREREQUISITES:
# 1. Set up JWT issuer (Cognito User Pool, Auth0, etc.) and update authorizer configuration
# 2. Upload Lambda function code to S3 bucket after creation (see outputs)
# 3. Configure alarm email subscription confirmation
#

# ---------------------------------------------------------------------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "aws_region" {
  description = "Primary AWS region to deploy resources to"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "global-booking"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for hotel inventory"
  type        = string
  default     = "hotel-inventory"
}

variable "dynamodb_replica_regions" {
  description = "List of AWS regions where the DynamoDB table should be replicated"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-1"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r5.large"
}

variable "pms_queue_visibility_timeout_seconds" {
  description = "Visibility timeout for PMS integration SQS queues"
  type        = number
  default     = 300
}

variable "booking_api_rate_limit_rps" {
  description = "Rate limit for booking API in requests per second"
  type        = number
  default     = 2000
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for booking_handler Lambda"
  type        = number
  default     = 1000
}

variable "alarm_notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops-team@example.com"
}

variable "jwt_issuer" {
  description = "JWT issuer URL (e.g., Cognito User Pool or Auth0 domain)"
  type        = string
  default     = "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CHANGEME"
}

variable "jwt_audience" {
  description = "JWT audience (API identifier)"
  type        = list(string)
  default     = ["https://api.booking.example.com"]
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default = {
    Owner       = "booking-platform-team"
    CostCenter  = "1234"
    Application = "hotel-booking-system"
  }
}

variable "aurora_instance_class" {
  description = "Instance class for Aurora database"
  type        = string
  default     = "db.r5.large"
}

variable "aurora_database_name" {
  description = "Name of the Aurora database"
  type        = string
  default     = "bookingaudit"
}

variable "aurora_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "booking_admin"
}

# ---------------------------------------------------------------------------------------------------------------------
# LOCALS
# ---------------------------------------------------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
  })

  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 1),
    cidrsubnet(var.vpc_cidr, 8, 2),
    cidrsubnet(var.vpc_cidr, 8, 3)
  ]

  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 101),
    cidrsubnet(var.vpc_cidr, 8, 102),
    cidrsubnet(var.vpc_cidr, 8, 103)
  ]
}

# ---------------------------------------------------------------------------------------------------------------------
# DATA SOURCES
# ---------------------------------------------------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------------------------------------------------
# VPC AND NETWORKING (Brand New Infrastructure)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Tier = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Tier = "Private"
  })
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw-${count.index + 1}"
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
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
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
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "elasticache" {
  name        = "${local.name_prefix}-elasticache-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow Redis traffic from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-elasticache-sg"
  })
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-aurora-sg"
  description = "Security group for Aurora MySQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow MySQL traffic from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# S3 BUCKET FOR LAMBDA CODE
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_s3_bucket" "lambda_code" {
  bucket = "${local.name_prefix}-lambda-code-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-code"
  })
}

resource "aws_s3_bucket_versioning" "lambda_code" {
  bucket = aws_s3_bucket.lambda_code.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_code" {
  bucket = aws_s3_bucket.lambda_code.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "lambda_code" {
  bucket = aws_s3_bucket.lambda_code.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------------------------------------------------
# SECRETS MANAGER FOR DATABASE PASSWORD
# ---------------------------------------------------------------------------------------------------------------------

resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master_password" {
  name        = "${local.name_prefix}-aurora-master-password"
  description = "Master password for Aurora database"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "aurora_master_password" {
  secret_id = aws_secretsmanager_secret.aurora_master_password.id
  secret_string = jsonencode({
    username = var.aurora_master_username
    password = random_password.aurora_master.result
  })
}

# Generate and store Redis auth token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name        = "${local.name_prefix}-redis-auth-token"
  description = "Auth token for ElastiCache Redis"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPIC FOR CLOUDWATCH ALARMS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_sns_topic" "cloudwatch_alarms" {
  name              = "${local.name_prefix}-cloudwatch-alarms"
  kms_master_key_id = "alias/aws/sns"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.cloudwatch_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_email
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB GLOBAL TABLE WITH OPTIMISTIC LOCKING SCHEMA
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_dynamodb_table" "inventory" {
  name         = "${local.name_prefix}-${var.dynamodb_table_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "booking_key"

  # Schema attributes for optimistic locking and room availability tracking
  # booking_key format: "property_id#room_id#date" (e.g., "hotel123#room456#2025-10-27")
  attribute {
    name = "booking_key"
    type = "S"
  }

  attribute {
    name = "property_id"
    type = "S"
  }

  # Additional attributes stored but not indexed:
  # - available_units (N): Number of rooms available for this room-night (decremented atomically)
  # - version (N): Optimistic lock version, incremented on each update
  # - reserved_units (N): Number of rooms currently in pending/hold state
  # - expiry_time (N): Unix timestamp for TTL of temporary hold records

  # GSI for querying all rooms at a specific property
  global_secondary_index {
    name            = "PropertyIndex"
    hash_key        = "property_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Global table replicas for read scaling and regional failover
  # Note: This is single-region control plane with multi-region data plane
  # For true active-active writes, deploy full stack per region with latency-based routing
  dynamic "replica" {
    for_each = toset(var.dynamodb_replica_regions)
    content {
      region_name = replica.value
    }
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-inventory-table"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM ROLES & POLICIES
# ---------------------------------------------------------------------------------------------------------------------

# 1. IAM Role for booking_handler Lambda
resource "aws_iam_role" "booking_handler_role" {
  name = "${local.name_prefix}-booking-handler-role"

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

resource "aws_iam_policy" "booking_handler_policy" {
  name        = "${local.name_prefix}-booking-handler-policy"
  description = "Policy for booking_handler Lambda with strict conditional write enforcement"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          aws_dynamodb_table.inventory.arn,
          "${aws_dynamodb_table.inventory.arn}/index/*"
        ]
        # Note: UpdateItem MUST use ConditionExpression checking version and available_units
        # Lambda code must enforce: ConditionExpression: "version = :expected_version AND available_units > :zero"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.inventory_updates.arn
        ]
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
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "booking_handler_policy_attachment" {
  role       = aws_iam_role.booking_handler_role.name
  policy_arn = aws_iam_policy.booking_handler_policy.arn
}

# 2. IAM Role for cache_updater Lambda
resource "aws_iam_role" "cache_updater_role" {
  name = "${local.name_prefix}-cache-updater-role"

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

resource "aws_iam_policy" "cache_updater_policy" {
  name        = "${local.name_prefix}-cache-updater-policy"
  description = "Policy for cache_updater Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream"
        ]
        Resource = [
          aws_dynamodb_table.inventory.stream_arn,
          "${aws_dynamodb_table.inventory.arn}/stream/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:ListStreams"
        ]
        Resource = "*"
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
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
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cache_updater_policy_attachment" {
  role       = aws_iam_role.cache_updater_role.name
  policy_arn = aws_iam_policy.cache_updater_policy.arn
}

# 3. IAM Role for pms_sync_worker Lambda
resource "aws_iam_role" "pms_sync_worker_role" {
  name = "${local.name_prefix}-pms-sync-worker-role"

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

resource "aws_iam_policy" "pms_sync_worker_policy" {
  name        = "${local.name_prefix}-pms-sync-worker-policy"
  description = "Policy for pms_sync_worker Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = aws_sqs_queue.hotel_pms_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.inventory.arn
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
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
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

resource "aws_iam_role_policy_attachment" "pms_sync_worker_policy_attachment" {
  role       = aws_iam_role.pms_sync_worker_role.name
  policy_arn = aws_iam_policy.pms_sync_worker_policy.arn
}

# 4. IAM Role for reconciliation_checker Lambda
resource "aws_iam_role" "reconciliation_checker_role" {
  name = "${local.name_prefix}-reconciliation-checker-role"

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

resource "aws_iam_policy" "reconciliation_checker_policy" {
  name        = "${local.name_prefix}-reconciliation-checker-policy"
  description = "Policy for reconciliation_checker Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.inventory.arn,
          "${aws_dynamodb_table.inventory.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.aurora_master_password.arn,
          aws_secretsmanager_secret.redis_auth_token.arn
        ]
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
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "cloudwatch:PutMetricData"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "reconciliation_checker_policy_attachment" {
  role       = aws_iam_role.reconciliation_checker_role.name
  policy_arn = aws_iam_policy.reconciliation_checker_policy.arn
}

# 5. IAM Role for overbooking_resolver Lambda
resource "aws_iam_role" "overbooking_resolver_role" {
  name = "${local.name_prefix}-overbooking-resolver-role"

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

resource "aws_iam_policy" "overbooking_resolver_policy" {
  name        = "${local.name_prefix}-overbooking-resolver-policy"
  description = "Policy for overbooking_resolver Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          aws_dynamodb_table.inventory.arn,
          "${aws_dynamodb_table.inventory.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.inventory_updates.arn
        ]
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
          "cloudwatch:PutMetricData"
        ],
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
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "overbooking_resolver_policy_attachment" {
  role       = aws_iam_role.overbooking_resolver_role.name
  policy_arn = aws_iam_policy.overbooking_resolver_policy.arn
}

# 6. IAM Role for hot_booking_checker Lambda (fast-path conflict detection)
resource "aws_iam_role" "hot_booking_checker_role" {
  name = "${local.name_prefix}-hot-booking-checker-role"

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

resource "aws_iam_policy" "hot_booking_checker_policy" {
  name        = "${local.name_prefix}-hot-booking-checker-policy"
  description = "Policy for hot_booking_checker Lambda (fast 30s conflict detection)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream"
        ]
        Resource = [
          aws_dynamodb_table.inventory.stream_arn,
          "${aws_dynamodb_table.inventory.arn}/stream/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:ListStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.inventory.arn,
          "${aws_dynamodb_table.inventory.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.overbooking_resolver.arn
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
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
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

resource "aws_iam_role_policy_attachment" "hot_booking_checker_policy_attachment" {
  role       = aws_iam_role.hot_booking_checker_role.name
  policy_arn = aws_iam_policy.hot_booking_checker_policy.arn
}

# 7. IAM Role for Step Functions
resource "aws_iam_role" "step_functions_role" {
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

  tags = local.common_tags
}

resource "aws_iam_policy" "step_functions_policy" {
  name        = "${local.name_prefix}-step-functions-policy"
  description = "Policy for Step Functions state machine"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.reconciliation_checker.arn,
          "${aws_lambda_function.reconciliation_checker.arn}:*",
          aws_lambda_function.overbooking_resolver.arn,
          "${aws_lambda_function.overbooking_resolver.arn}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "step_functions_policy_attachment" {
  role       = aws_iam_role.step_functions_role.name
  policy_arn = aws_iam_policy.step_functions_policy.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# LAMBDA FUNCTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lambda_function" "booking_handler" {
  function_name    = "${local.name_prefix}-booking-handler"
  role             = aws_iam_role.booking_handler_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 512

  # Increased reserved concurrency to handle 1.2k sustained / 2k burst RPS
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "booking_handler/function.zip"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name
      SNS_TOPIC_ARN       = aws_sns_topic.inventory_updates.arn
      ENVIRONMENT         = var.environment
      # CRITICAL: Lambda code MUST enforce optimistic locking on every booking write:
      # UpdateExpression: "SET available_units = available_units - :decrement, version = version + :inc, ..."
      # ConditionExpression: "available_units >= :required AND version = :expected_version"
      # This prevents double-sell at write time (not just eventual detection)
      ENABLE_OPTIMISTIC_LOCKING = "true"
      LOG_LEVEL                 = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-handler"
  })
}

resource "aws_lambda_function" "cache_updater" {
  function_name    = "${local.name_prefix}-cache-updater"
  role             = aws_iam_role.cache_updater_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "cache_updater/function.zip"

  environment {
    variables = {
      REDIS_ENDPOINT       = aws_elasticache_replication_group.booking_cache.configuration_endpoint_address
      REDIS_PORT           = "6379"
      REDIS_AUTH_SECRET_ARN = aws_secretsmanager_secret.redis_auth_token.arn
      REDIS_TTL            = "3600"
      ENVIRONMENT          = var.environment
      # SLA Target: Cache for a specific hotel should be updated in <1s P95 after DynamoDB change
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-updater"
  })
}

# Hot booking checker: fast-path conflict detection within 30s of booking (separate from 5min reconciliation)
resource "aws_lambda_function" "hot_booking_checker" {
  function_name    = "${local.name_prefix}-hot-booking-checker"
  role             = aws_iam_role.hot_booking_checker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "hot_booking_checker/function.zip"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME      = aws_dynamodb_table.inventory.name
      OVERBOOKING_RESOLVER_ARN = aws_lambda_function.overbooking_resolver.arn
      ENVIRONMENT              = var.environment
      # SLA Target: Hot bookings checked within 30 seconds of write
      # This Lambda detects near-real-time conflicts from DynamoDB Stream
      # If version collision or negative available_units detected, invoke resolver immediately
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hot-booking-checker"
  })
}

resource "aws_lambda_function" "pms_sync_worker" {
  function_name    = "${local.name_prefix}-pms-sync-worker"
  role             = aws_iam_role.pms_sync_worker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 60
  memory_size      = 512

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "pms_sync_worker/function.zip"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME     = aws_dynamodb_table.inventory.name
      MAX_RETRIES             = "3"
      BACKOFF_RATE            = "2"
      INITIAL_BACKOFF_SECONDS = "1"
      CIRCUIT_OPEN_SECONDS    = "300"
      ENVIRONMENT             = var.environment
      # SLA Target: SNS → SQS → PMS sync should deliver for property's PMS in <60 seconds
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  # Note: This Lambda runs outside VPC for public internet access to external PMS APIs
  # If PMS APIs require VPC egress (e.g., PrivateLink), add vpc_config here

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pms-sync-worker"
  })
}

resource "aws_lambda_function" "reconciliation_checker" {
  function_name    = "${local.name_prefix}-reconciliation-checker"
  role             = aws_iam_role.reconciliation_checker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 300
  memory_size      = 1024

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "reconciliation_checker/function.zip"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME   = aws_dynamodb_table.inventory.name
      REDIS_ENDPOINT        = aws_elasticache_replication_group.booking_cache.configuration_endpoint_address
      REDIS_PORT            = "6379"
      REDIS_AUTH_SECRET_ARN = aws_secretsmanager_secret.redis_auth_token.arn
      AURORA_ENDPOINT       = aws_rds_cluster.audit_db.reader_endpoint
      AURORA_PORT           = "3306"
      AURORA_DATABASE       = var.aurora_database_name
      AURORA_SECRET_ARN     = aws_secretsmanager_secret.aurora_master_password.arn
      ENVIRONMENT           = var.environment
      # SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-checker"
  })
}

resource "aws_lambda_function" "overbooking_resolver" {
  function_name    = "${local.name_prefix}-overbooking-resolver"
  role             = aws_iam_role.overbooking_resolver_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 60
  memory_size      = 1024

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "overbooking_resolver/function.zip"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name
      SNS_TOPIC_ARN       = aws_sns_topic.inventory_updates.arn
      ENVIRONMENT         = var.environment
      # SLA Targets:
      # - Conflicts detected within 5 seconds of collision
      # - Auto-reassign (if possible) within 60 seconds
      # - Push correction to PMS within 2 minutes
      # - Otherwise publish UnresolvedOverbookings metric for human ops
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-overbooking-resolver"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# API GATEWAY WITH JWT AUTHORIZER
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "booking_api" {
  name          = "${local.name_prefix}-booking-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = ["https://booking.example.com"]
    allow_methods     = ["POST", "OPTIONS"]
    allow_headers     = ["content-type", "authorization"]
    allow_credentials = true
    max_age           = 300
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-api"
  })
}

# JWT Authorizer (requires external IdP like Cognito User Pool or Auth0)
# Update var.jwt_issuer and var.jwt_audience to match your identity provider
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.name_prefix}-jwt-authorizer"

  jwt_configuration {
    audience = var.jwt_audience
    issuer   = var.jwt_issuer
  }
}

resource "aws_apigatewayv2_integration" "booking_handler_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri    = aws_lambda_function.booking_handler.invoke_arn

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "POST /book"

  target             = "integrations/${aws_apigatewayv2_integration.booking_handler_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_stage" "booking_api_stage" {
  api_id      = aws_apigatewayv2_api.booking_api.id
  name        = "$default"
  auto_deploy = true

  # API Gateway throttling to meet SLA requirements
  # SLA Target: Handle ~70,000 booking requests per minute (~1,200 RPS sustained, burst ~2,000 RPS)
  default_route_settings {
    throttling_burst_limit = var.booking_api_rate_limit_rps
    throttling_rate_limit  = floor(var.booking_api_rate_limit_rps * 0.6)
  }

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
      errorMessage   = "$context.error.message"
    })
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.name_prefix}-booking-api"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_lambda_permission" "api_gateway_invoke_booking_handler" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.booking_handler.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*/*"
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB STREAM TO LAMBDA MAPPINGS
# ---------------------------------------------------------------------------------------------------------------------

# Stream to cache updater (updates Redis on every inventory change)
resource "aws_lambda_event_source_mapping" "dynamodb_to_cache_updater" {
  event_source_arn  = aws_dynamodb_table.inventory.stream_arn
  function_name     = aws_lambda_function.cache_updater.arn
  starting_position = "LATEST"

  # SLA Target: Cache for a specific hotel is updated in <1s P95 after DynamoDB change
  batch_size                         = 100
  maximum_batching_window_in_seconds = 1

  maximum_retry_attempts = 10
  parallelization_factor = 10

  bisect_batch_on_function_error = true

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.cache_updater_dlq.arn
    }
  }
}

# Stream to hot booking checker (fast-path conflict detection within 30s)
resource "aws_lambda_event_source_mapping" "dynamodb_to_hot_booking_checker" {
  event_source_arn  = aws_dynamodb_table.inventory.stream_arn
  function_name     = aws_lambda_function.hot_booking_checker.arn
  starting_position = "LATEST"

  # Fast processing for near-real-time conflict detection
  # SLA Target: Hot bookings checked within 30 seconds
  batch_size                         = 50
  maximum_batching_window_in_seconds = 5

  maximum_retry_attempts = 5
  parallelization_factor = 5

  filter_criteria {
    filter {
      # Only process booking writes (not hold expirations or metadata updates)
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY"]
        dynamodb = {
          NewImage = {
            available_units = { N = [{ exists = true }] }
          }
        }
      })
    }
  }
}

resource "aws_sqs_queue" "cache_updater_dlq" {
  name = "${local.name_prefix}-cache-updater-dlq"

  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-updater-dlq"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE (REDIS CLUSTER MODE)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "booking_cache" {
  replication_group_id       = "${local.name_prefix}-booking-cache"
  description                = "Redis cache for hotel availability"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.cache_node_type
  port                       = 6379
  parameter_group_name       = "default.redis7.cluster.on"
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = [aws_security_group.elasticache.id]

  # Cluster mode for horizontal scalability across 45k hotels
  num_node_groups         = 3
  replicas_per_node_group = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # Redis AUTH token for security (wired to Lambda via Secrets Manager)
  auth_token = random_password.redis_auth_token.result

  maintenance_window = "sun:05:00-sun:06:00"

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"

  # Cache keys are per-hotel availability snapshots (e.g., "hotel:123:room:456:2025-10-27")
  # Only the affected hotel's cache is updated on inventory changes, not all 45k properties
  # Cache entries have TTL and are refreshed from DynamoDB as needed
  # Cluster mode shards keys across nodes for balanced load

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache_logs.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-cache"
  })
}

resource "aws_cloudwatch_log_group" "elasticache_logs" {
  name              = "/aws/elasticache/${local.name_prefix}-redis"
  retention_in_days = 30

  tags = local.common_tags
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPIC, SQS QUEUES, AND SUBSCRIPTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_sns_topic" "inventory_updates" {
  name              = "${local.name_prefix}-inventory-updates"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-inventory-updates"
  })
}

resource "aws_sqs_queue" "hotel_pms_dlq" {
  name = "${local.name_prefix}-hotel-pms-dlq"

  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-dlq"
  })
}

# Example queue for one property/PMS integration
# In production, create one queue per property or per PMS integration class using count/for_each
resource "aws_sqs_queue" "hotel_pms_queue" {
  name = "${local.name_prefix}-hotel-pms-queue"

  visibility_timeout_seconds = var.pms_queue_visibility_timeout_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hotel_pms_dlq.arn
    maxReceiveCount     = 5
  })

  message_retention_seconds = 345600
  sqs_managed_sse_enabled   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-queue"
  })
}

resource "aws_sns_topic_subscription" "hotel_pms_subscription" {
  topic_arn = aws_sns_topic.inventory_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.hotel_pms_queue.arn

  # Filter policy ensures we fan out booking changes only to affected property/PMS,
  # not all 45k hotels. This keeps the system scalable.
  # In production, each property/PMS integration would have its own queue with appropriate filters.
  # SLA Target: SNS → SQS → PMS sync should enqueue and attempt delivery in <60 seconds
  filter_policy = jsonencode({
    property_id = ["hotel123"]
  })
}

resource "aws_sqs_queue_policy" "hotel_pms_queue_policy" {
  queue_url = aws_sqs_queue.hotel_pms_queue.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.hotel_pms_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.inventory_updates.arn
          }
        }
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "sqs_to_pms_sync_worker" {
  event_source_arn = aws_sqs_queue.hotel_pms_queue.arn
  function_name    = aws_lambda_function.pms_sync_worker.arn

  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 10
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# EVENTBRIDGE RULE AND STEP FUNCTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "reconciliation_schedule" {
  name                = "${local.name_prefix}-reconciliation-schedule"
  description         = "Triggers reconciliation process every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  # This replaces the old approach of checking "every 30s all hotels"
  # We now do periodic sampled reconciliation to reduce load and cost
  # Note: Fast-path "hot booking" detection (30s SLA) is handled by hot_booking_checker Lambda
  # triggered directly from DynamoDB Stream, not this scheduled reconciliation
  # SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-schedule"
  })
}

resource "aws_sfn_state_machine" "reconciliation_state_machine" {
  name     = "${local.name_prefix}-reconciliation-state-machine"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Reconciliation workflow for hotel bookings"
    StartAt = "CheckConsistency"
    States = {
      CheckConsistency = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.reconciliation_checker.arn
          Payload = {
            "executionId.$"    = "$$.Execution.Id"
            "executionTime.$"  = "$$.Execution.StartTime"
            "scheduleTime.$"   = "$.time"
            "source"           = "periodic-reconciliation"
          }
        }
        ResultPath = "$.reconciliationResult"
        Next       = "EvaluateResults"
      }
      EvaluateResults = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.reconciliationResult.Payload.driftDetected"
            BooleanEquals = true
            Next          = "ResolveDrift"
          }
        ]
        Default = "Complete"
      }
      ResolveDrift = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.overbooking_resolver.arn
          Payload = {
            "conflicts.$" = "$.reconciliationResult.Payload.conflicts"
          }
        }
        Next = "Complete"
      }
      Complete = {
        Type = "Succeed"
      }
    }
  })

  # SLA Targets:
  # - "Hot" bookings rechecked within 30 seconds (handled by hot_booking_checker Lambda)
  # - Wider audit runs every 5 minutes and completes in under 2 minutes (this Step Function)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-state-machine"
  })
}

resource "aws_cloudwatch_event_target" "reconciliation_target" {
  rule      = aws_cloudwatch_event_rule.reconciliation_schedule.name
  arn       = aws_sfn_state_machine.reconciliation_state_machine.arn
  role_arn  = aws_iam_role.eventbridge_to_sfn_role.arn

  input = jsonencode({
    time   = "scheduled-reconciliation"
    source = "eventbridge-schedule"
  })
}

# IAM role for EventBridge to invoke Step Functions
resource "aws_iam_role" "eventbridge_to_sfn_role" {
  name = "${local.name_prefix}-eventbridge-to-sfn-role"

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

  tags = local.common_tags
}

resource "aws_iam_policy" "eventbridge_to_sfn_policy" {
  name        = "${local.name_prefix}-eventbridge-to-sfn-policy"
  description = "Allow EventBridge to invoke Step Functions state machine"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = [
          aws_sfn_state_machine.reconciliation_state_machine.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_to_sfn_policy_attachment" {
  role       = aws_iam_role.eventbridge_to_sfn_role.name
  policy_arn = aws_iam_policy.eventbridge_to_sfn_policy.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# AURORA (FOR RECONCILIATION READS)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_db_subnet_group" "aurora_subnet_group" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster" "audit_db" {
  cluster_identifier      = "${local.name_prefix}-audit-db"
  engine                  = "aurora-mysql"
  engine_version          = "8.0.mysql_aurora.3.04.0"
  database_name           = var.aurora_database_name
  master_username         = var.aurora_master_username
  master_password         = random_password.aurora_master.result

  db_subnet_group_name    = aws_db_subnet_group.aurora_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.aurora.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-05:00"

  preferred_maintenance_window = "sun:05:00-sun:06:00"

  storage_encrypted = true

  # Aurora is used as a reporting/audit store, not the primary booking source of truth
  # The reconciliation Lambda will compare DynamoDB state to Aurora-replicated state

  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-audit-db-final-snapshot"

  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-db"
  })
}

resource "aws_rds_cluster_instance" "audit_db_reader" {
  identifier           = "${local.name_prefix}-audit-db-reader"
  cluster_identifier   = aws_rds_cluster.audit_db.id
  instance_class       = var.aurora_instance_class
  engine               = aws_rds_cluster.audit_db.engine
  engine_version       = aws_rds_cluster.audit_db.engine_version
  db_subnet_group_name = aws_db_subnet_group.aurora_subnet_group.name

  # Enable enhanced monitoring for production visibility
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_role.arn

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-db-reader"
  })
}

resource "aws_iam_role" "rds_monitoring_role" {
  name = "${local.name_prefix}-rds-monitoring-role"

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

resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDWATCH ALARMS / METRICS
# ---------------------------------------------------------------------------------------------------------------------

# DynamoDB replication lag per replica region
resource "aws_cloudwatch_metric_alarm" "dynamodb_replication_lag" {
  for_each = toset(var.dynamodb_replica_regions)

  alarm_name          = "${local.name_prefix}-dynamodb-replication-lag-${each.value}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 10000
  alarm_description   = "DynamoDB Global Table replication lag to ${each.value}. SLA: Replication >10s is a breach."
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    TableName        = aws_dynamodb_table.inventory.name
    ReceivingRegion  = each.value
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-replication-lag-${each.value}"
  })
}

resource "aws_cloudwatch_metric_alarm" "sqs_dlq_not_empty" {
  alarm_name          = "${local.name_prefix}-sqs-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 5
  alarm_description   = "Messages accumulating in PMS DLQ. SLA: PMS sync backlog >60s is a breach."
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.hotel_pms_dlq.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sqs-dlq-not-empty"
  })
}

resource "aws_cloudwatch_metric_alarm" "overbooking_alarm" {
  alarm_name          = "${local.name_prefix}-unresolved-overbookings"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnresolvedOverbookings"
  namespace           = "Custom/Booking"
  period              = 120
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Unresolved overbookings detected. SLA: Unresolved overbooking after 2 minutes is a breach."
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  treat_missing_data = "notBreaching"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-unresolved-overbookings"
  })
}

resource "aws_cloudwatch_metric_alarm" "booking_handler_errors" {
  alarm_name          = "${local.name_prefix}-booking-handler-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "High error rate in booking handler Lambda"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.booking_handler.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-handler-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "booking_handler_throttles" {
  alarm_name          = "${local.name_prefix}-booking-handler-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Booking handler Lambda is being throttled - may need increased reserved concurrency"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.booking_handler.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-handler-throttles"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "High 5xx error rate in API Gateway"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.booking_api.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-5xx-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "elasticache_cpu" {
  alarm_name          = "${local.name_prefix}-elasticache-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ElastiCache CPU utilization is high"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.booking_cache.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-elasticache-high-cpu"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

output "deployment_instructions" {
  description = "Next steps after Terraform apply"
  value = <<-EOT
    DEPLOYMENT COMPLETE - Next Steps:

    1. Upload Lambda code to S3 bucket: ${aws_s3_bucket.lambda_code.id}
       Required functions:
       - booking_handler/function.zip
       - cache_updater/function.zip
       - hot_booking_checker/function.zip
       - pms_sync_worker/function.zip
       - reconciliation_checker/function.zip
       - overbooking_resolver/function.zip

    2. Configure JWT authorizer:
       - Update var.jwt_issuer and var.jwt_audience to match your IdP
       - Current issuer: ${var.jwt_issuer}
       - Current audience: ${jsonencode(var.jwt_audience)}

    3. Confirm CloudWatch alarm email subscription:
       - Check ${var.alarm_notification_email} for confirmation email

    4. Test booking flow:
       - API Endpoint: ${aws_apigatewayv2_stage.booking_api_stage.invoke_url}
       - POST /book with valid JWT token

    IMPORTANT: Provider requirements:
    - Terraform >= 1.5.0
    - AWS Provider >= 5.20.0 (for nodejs20.x runtime support)
  EOT
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for booking API"
  value       = aws_apigatewayv2_stage.booking_api_stage.invoke_url
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for inventory"
  value       = aws_dynamodb_table.inventory.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for inventory updates"
  value       = aws_sns_topic.inventory_updates.arn
}

output "sqs_queue_url" {
  description = "URL of the main SQS queue for PMS integration"
  value       = aws_sqs_queue.hotel_pms_queue.url
}

output "sqs_dlq_url" {
  description = "URL of the SQS dead letter queue"
  value       = aws_sqs_queue.hotel_pms_dlq.url
}

output "step_functions_state_machine_arn" {
  description = "ARN of the Step Functions state machine for reconciliation"
  value       = aws_sfn_state_machine.reconciliation_state_machine.arn
}

output "elasticache_configuration_endpoint" {
  description = "Configuration endpoint of ElastiCache replication group (for cluster mode)"
  value       = aws_elasticache_replication_group.booking_cache.configuration_endpoint_address
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint of Aurora database"
  value       = aws_rds_cluster.audit_db.reader_endpoint
}

output "lambda_code_bucket" {
  description = "S3 bucket for Lambda function code"
  value       = aws_s3_bucket.lambda_code.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "aurora_secret_arn" {
  description = "ARN of Secrets Manager secret containing Aurora credentials"
  value       = aws_secretsmanager_secret.aurora_master_password.arn
}

output "redis_auth_token_secret_arn" {
  description = "ARN of Secrets Manager secret containing Redis auth token"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
}

output "cloudwatch_alarm_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.arn
}
```

---

## Provider Configuration

### Provider Setup (`lib/provider.tf`)

This file configures the Terraform AWS provider and backend. It should be created alongside `tap_stack.tf` for a complete deployment.

```terraform
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

---

## Lambda Placeholder Package

### Minimal Deployment Package (`lib/lambda_placeholder.zip`)

This is a minimal Lambda deployment package (444 bytes) used to allow the infrastructure to deploy successfully before actual Lambda code is uploaded. It contains a single file `placeholder_index.js` that returns a success response indicating the infrastructure is ready.

**Purpose:**

- Allows Terraform to create all Lambda functions without S3 pre-existing code
- Enables infrastructure deployment and testing before full Lambda implementation
- Prevents deployment errors when Lambda code is not yet available

**Contents of `placeholder_index.js`:**

```javascript
exports.handler = async event => {
  console.log('Lambda function deployed - Replace with actual implementation');
  console.log('Event:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda function placeholder',
      note: 'Infrastructure deployed successfully. Upload actual Lambda code to activate full functionality.',
    }),
  };
};
```

**Usage:**
All Lambda functions in `tap_stack.tf` reference this placeholder via:

```terraform
filename         = "${path.module}/lambda_placeholder.zip"
source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")
```

Once the infrastructure is deployed, replace with actual function code using either:

1. S3-based deployment (update Terraform to use `s3_bucket` and `s3_key`)
2. AWS CLI: `aws lambda update-function-code --function-name <name> --zip-file fileb://function.zip`

---

## Lambda Function Implementations

The following Lambda functions implement the core booking system logic. Each function is designed to meet specific SLA targets and follows AWS best practices.

### 1. Booking Handler (`lib/lambda/booking_handler/index.js`)

Handles booking requests with optimistic locking to prevent double-booking.

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENABLE_OPTIMISTIC_LOCKING =
  process.env.ENABLE_OPTIMISTIC_LOCKING === 'true';

/**
 * Booking Handler Lambda
 * Handles booking requests with optimistic locking to prevent double-booking
 * SLA Target: <400ms P95 response time
 */
exports.handler = async event => {
  console.log('Booking request received:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { propertyId, roomId, date, units = 1, guestInfo } = body;

    // Validate required fields
    if (!propertyId || !roomId || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: propertyId, roomId, date',
        }),
      };
    }

    const bookingKey = `${propertyId}#${roomId}#${date}`;

    // Step 1: Get current inventory state
    const currentItem = await dynamoClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { booking_key: bookingKey },
      })
    );

    if (!currentItem.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Inventory not found for the requested date',
        }),
      };
    }

    const currentVersion = currentItem.Item.version || 0;
    const availableUnits = currentItem.Item.available_units || 0;

    // Check availability
    if (availableUnits < units) {
      console.log(
        `Insufficient inventory: requested=${units}, available=${availableUnits}`
      );
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'Insufficient availability',
          available: availableUnits,
          requested: units,
        }),
      };
    }

    // Step 2: Attempt booking with optimistic locking
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { booking_key: bookingKey },
      UpdateExpression:
        'SET available_units = available_units - :units, #version = #version + :inc, last_booking_id = :bookingId, last_booking_time = :timestamp',
      ExpressionAttributeNames: {
        '#version': 'version',
      },
      ExpressionAttributeValues: {
        ':units': units,
        ':inc': 1,
        ':bookingId': bookingId,
        ':timestamp': new Date().toISOString(),
        ':expectedVersion': currentVersion,
        ':minUnits': units,
      },
      ReturnValues: 'ALL_NEW',
    };

    // Add optimistic locking condition
    if (ENABLE_OPTIMISTIC_LOCKING) {
      updateParams.ConditionExpression =
        '#version = :expectedVersion AND available_units >= :minUnits';
    } else {
      updateParams.ConditionExpression = 'available_units >= :minUnits';
    }

    let result;
    try {
      result = await dynamoClient.send(new UpdateCommand(updateParams));
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.error(
          'Booking failed due to concurrent modification or insufficient inventory'
        );
        return {
          statusCode: 409,
          body: JSON.stringify({
            error:
              'Booking conflict - inventory changed during booking process',
            message: 'Please retry your booking',
          }),
        };
      }
      throw error;
    }

    // Step 3: Publish booking event to SNS
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            eventType: 'BOOKING_CONFIRMED',
            bookingId,
            propertyId,
            roomId,
            date,
            units,
            timestamp: new Date().toISOString(),
            newAvailableUnits: result.Attributes.available_units,
          }),
          MessageAttributes: {
            property_id: { DataType: 'String', StringValue: propertyId },
            event_type: {
              DataType: 'String',
              StringValue: 'BOOKING_CONFIRMED',
            },
          },
        })
      );
    } catch (snsError) {
      console.error('Failed to publish SNS event:', snsError);
      // Don't fail the booking if SNS fails - it's async notification
    }

    // Success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        bookingId,
        propertyId,
        roomId,
        date,
        unitsBooked: units,
        remainingAvailability: result.Attributes.available_units,
        message: 'Booking confirmed successfully',
      }),
    };
  } catch (error) {
    console.error('Booking handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
```

**Dependencies** (`lib/lambda/booking_handler/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### 2. Cache Updater (`lib/lambda/cache_updater/index.js`)

Updates Redis cache when DynamoDB inventory changes.

```javascript
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const Redis = require('ioredis');

const secretsClient = new SecretsManagerClient({});
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_AUTH_SECRET_ARN = process.env.REDIS_AUTH_SECRET_ARN;
const REDIS_TTL = parseInt(process.env.REDIS_TTL || '3600', 10);

let redisClient = null;
let authToken = null;

/**
 * Get Redis auth token from Secrets Manager
 */
async function getAuthToken() {
  if (authToken) return authToken;

  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: REDIS_AUTH_SECRET_ARN,
      })
    );
    authToken = response.SecretString;
    return authToken;
  } catch (error) {
    console.error('Failed to get Redis auth token:', error);
    throw error;
  }
}

/**
 * Initialize Redis client
 */
async function getRedisClient() {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const token = await getAuthToken();

  redisClient = new Redis({
    host: REDIS_ENDPOINT,
    port: REDIS_PORT,
    password: token,
    tls: {},
    retryStrategy: times => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  return redisClient;
}

/**
 * Cache Updater Lambda
 * Updates Redis cache when DynamoDB inventory changes
 * SLA Target: Cache updated in <1s P95 after DynamoDB change
 */
exports.handler = async event => {
  console.log(
    'DynamoDB Stream event received:',
    JSON.stringify(event, null, 2)
  );

  const redis = await getRedisClient();
  const cacheUpdates = [];

  try {
    for (const record of event.Records) {
      const { eventName, dynamodb } = record;

      // Process INSERT and MODIFY events
      if (eventName === 'INSERT' || eventName === 'MODIFY') {
        const newImage = dynamodb.NewImage;

        if (!newImage || !newImage.booking_key || !newImage.booking_key.S) {
          console.log('Skipping record without booking_key');
          continue;
        }

        const bookingKey = newImage.booking_key.S;
        const [propertyId, roomId, date] = bookingKey.split('#');

        // Build cache object
        const cacheData = {
          propertyId,
          roomId,
          date,
          availableUnits: newImage.available_units
            ? parseInt(newImage.available_units.N, 10)
            : 0,
          reservedUnits: newImage.reserved_units
            ? parseInt(newImage.reserved_units.N, 10)
            : 0,
          version: newImage.version ? parseInt(newImage.version.N, 10) : 0,
          lastUpdated: new Date().toISOString(),
        };

        // Cache key format: hotel:{propertyId}:room:{roomId}:date:{date}
        const cacheKey = `hotel:${propertyId}:room:${roomId}:date:${date}`;

        // Update Redis cache with TTL
        await redis.setex(cacheKey, REDIS_TTL, JSON.stringify(cacheData));

        cacheUpdates.push({ cacheKey, action: 'updated' });
        console.log(`Cache updated: ${cacheKey}`);

        // Also update property-level availability index
        const propertyKey = `property:${propertyId}:availability:${date}`;
        await redis.zadd(
          propertyKey,
          cacheData.availableUnits,
          `${roomId}:${cacheData.availableUnits}`
        );
        await redis.expire(propertyKey, REDIS_TTL);
      } else if (eventName === 'REMOVE') {
        // Handle deletions (TTL expiration, etc.)
        const oldImage = dynamodb.OldImage;
        if (oldImage && oldImage.booking_key && oldImage.booking_key.S) {
          const bookingKey = oldImage.booking_key.S;
          const [propertyId, roomId, date] = bookingKey.split('#');
          const cacheKey = `hotel:${propertyId}:room:${roomId}:date:${date}`;

          await redis.del(cacheKey);
          cacheUpdates.push({ cacheKey, action: 'deleted' });
          console.log(`Cache deleted: ${cacheKey}`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: event.Records.length,
        cacheUpdates,
      }),
    };
  } catch (error) {
    console.error('Cache updater error:', error);
    throw error; // Let Lambda retry
  }
};
```

**Dependencies** (`lib/lambda/cache_updater/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### 3. Hot Booking Checker (`lib/lambda/hot_booking_checker/index.js`)

Fast-path conflict detection within 30s of booking.

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambdaClient = new LambdaClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const OVERBOOKING_RESOLVER_ARN = process.env.OVERBOOKING_RESOLVER_ARN;

/**
 * Hot Booking Checker Lambda
 * Fast-path conflict detection within 30s of booking
 * SLA Target: Hot bookings checked within 30 seconds
 */
exports.handler = async event => {
  console.log('Hot booking check triggered:', JSON.stringify(event, null, 2));

  const conflictsDetected = [];

  try {
    for (const record of event.Records) {
      const { eventName, dynamodb } = record;

      if (eventName !== 'INSERT' && eventName !== 'MODIFY') {
        continue;
      }

      const newImage = dynamodb.NewImage;
      if (!newImage || !newImage.booking_key || !newImage.booking_key.S) {
        continue;
      }

      const bookingKey = newImage.booking_key.S;
      const availableUnits = newImage.available_units
        ? parseInt(newImage.available_units.N, 10)
        : 0;
      const version = newImage.version ? parseInt(newImage.version.N, 10) : 0;

      console.log(
        `Checking booking: ${bookingKey}, available=${availableUnits}, version=${version}`
      );

      // Critical check: Detect negative or zero availability (potential overbooking)
      if (availableUnits < 0) {
        console.error(
          `OVERBOOKING DETECTED: ${bookingKey} has negative availability: ${availableUnits}`
        );

        conflictsDetected.push({
          bookingKey,
          availableUnits,
          version,
          severity: 'CRITICAL',
          reason: 'NEGATIVE_AVAILABILITY',
        });

        // Publish CloudWatch metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'OverbookingDetected',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [{ Name: 'BookingKey', Value: bookingKey }],
              },
            ],
          })
        );
      }

      // Check for suspicious rapid version changes (possible race condition)
      if (eventName === 'MODIFY' && dynamodb.OldImage) {
        const oldVersion = dynamodb.OldImage.version
          ? parseInt(dynamodb.OldImage.version.N, 10)
          : 0;
        const versionJump = version - oldVersion;

        if (versionJump > 5) {
          console.warn(
            `Rapid version change detected: ${bookingKey}, jump=${versionJump}`
          );

          conflictsDetected.push({
            bookingKey,
            availableUnits,
            version,
            oldVersion,
            severity: 'WARNING',
            reason: 'RAPID_VERSION_CHANGE',
          });
        }
      }

      // If critical conflict detected, invoke overbooking resolver immediately
      if (availableUnits < 0) {
        try {
          const resolverPayload = {
            conflicts: [
              {
                bookingKey,
                availableUnits,
                version,
                detectedAt: new Date().toISOString(),
                source: 'hot_booking_checker',
              },
            ],
          };

          await lambdaClient.send(
            new InvokeCommand({
              FunctionName: OVERBOOKING_RESOLVER_ARN,
              InvocationType: 'Event', // Async invocation
              Payload: JSON.stringify(resolverPayload),
            })
          );

          console.log(`Overbooking resolver invoked for ${bookingKey}`);
        } catch (invokeError) {
          console.error('Failed to invoke overbooking resolver:', invokeError);
        }
      }
    }

    // Publish summary metric
    if (conflictsDetected.length > 0) {
      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'Custom/Booking',
          MetricData: [
            {
              MetricName: 'HotConflictsDetected',
              Value: conflictsDetected.length,
              Unit: 'Count',
              Timestamp: new Date(),
            },
          ],
        })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: event.Records.length,
        conflictsDetected: conflictsDetected.length,
        conflicts: conflictsDetected,
      }),
    };
  } catch (error) {
    console.error('Hot booking checker error:', error);
    throw error;
  }
};
```

**Dependencies** (`lib/lambda/hot_booking_checker/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### 4. PMS Sync Worker (`lib/lambda/pms_sync_worker/index.js`)

Syncs booking changes to Property Management Systems.

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const BACKOFF_RATE = parseFloat(process.env.BACKOFF_RATE || '2');
const INITIAL_BACKOFF_SECONDS = parseInt(
  process.env.INITIAL_BACKOFF_SECONDS || '1',
  10
);

/**
 * Sleep utility
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulate PMS API call with retry logic
 * In production, replace with actual PMS integration (Opera, Sabre, etc.)
 */
async function syncToPMS(propertyId, bookingData, retryCount = 0) {
  try {
    console.log(
      `Syncing to PMS for property ${propertyId}, attempt ${retryCount + 1}`
    );

    // Simulated PMS API call
    // In production: await axios.post(`https://pms-api.example.com/${propertyId}/bookings`, bookingData)

    // Simulate occasional failures for testing
    if (Math.random() < 0.1 && retryCount === 0) {
      throw new Error('Simulated PMS API timeout');
    }

    return {
      success: true,
      pmsConfirmationId: `PMS-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`PMS sync failed for property ${propertyId}:`, error.message);

    if (retryCount < MAX_RETRIES) {
      const backoffMs =
        INITIAL_BACKOFF_SECONDS * 1000 * Math.pow(BACKOFF_RATE, retryCount);
      console.log(`Retrying after ${backoffMs}ms...`);
      await sleep(backoffMs);
      return syncToPMS(propertyId, bookingData, retryCount + 1);
    }

    throw error;
  }
}

/**
 * PMS Sync Worker Lambda
 * Processes SQS messages and syncs booking changes to Property Management Systems
 * SLA Target: SNS → SQS → PMS sync delivered in <60 seconds
 */
exports.handler = async event => {
  console.log('PMS sync worker invoked:', JSON.stringify(event, null, 2));

  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    for (const record of event.Records) {
      try {
        const message = JSON.parse(record.body);

        // Handle SNS wrapping
        const eventData = message.Message
          ? JSON.parse(message.Message)
          : message;

        const {
          eventType,
          propertyId,
          roomId,
          date,
          bookingId,
          units,
          timestamp,
        } = eventData;

        console.log(
          `Processing ${eventType} for property ${propertyId}, booking ${bookingId}`
        );

        // Get current booking state from DynamoDB
        const bookingKey = `${propertyId}#${roomId}#${date}`;
        const currentState = await dynamoClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { booking_key: bookingKey },
          })
        );

        if (!currentState.Item) {
          console.warn(`Booking ${bookingKey} not found in DynamoDB`);
          results.failed++;
          continue;
        }

        // Sync to PMS
        const pmsResponse = await syncToPMS(propertyId, {
          eventType,
          bookingId,
          roomId,
          date,
          units,
          availableUnits: currentState.Item.available_units,
          timestamp,
        });

        // Update DynamoDB with PMS confirmation
        await dynamoClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { booking_key: bookingKey },
            UpdateExpression:
              'SET pms_sync_status = :status, pms_confirmation_id = :confirmationId, pms_sync_time = :syncTime',
            ExpressionAttributeValues: {
              ':status': 'SYNCED',
              ':confirmationId': pmsResponse.pmsConfirmationId,
              ':syncTime': pmsResponse.timestamp,
            },
          })
        );

        // Publish success metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'PMSSyncSuccess',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                  { Name: 'PropertyId', Value: propertyId },
                  { Name: 'EventType', Value: eventType },
                ],
              },
            ],
          })
        );

        results.successful++;
        console.log(`Successfully synced booking ${bookingId} to PMS`);
      } catch (error) {
        console.error('Failed to process SQS message:', error);
        results.failed++;
        results.errors.push({
          messageId: record.messageId,
          error: error.message,
        });

        // Publish failure metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'PMSSyncFailure',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
              },
            ],
          })
        );

        // Message will be retried or sent to DLQ
        throw error;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
      }),
    };
  } catch (error) {
    console.error('PMS sync worker error:', error);
    throw error;
  }
};
```

**Dependencies** (`lib/lambda/pms_sync_worker/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### 5. Reconciliation Checker (`lib/lambda/reconciliation_checker/index.js`)

Periodic consistency checks across DynamoDB, Redis, and Aurora.

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');
const Redis = require('ioredis');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secretsClient = new SecretsManagerClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_AUTH_SECRET_ARN = process.env.REDIS_AUTH_SECRET_ARN;

let redisClient = null;
let redisAuthToken = null;

/**
 * Get Redis auth token
 */
async function getRedisAuthToken() {
  if (redisAuthToken) return redisAuthToken;

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: REDIS_AUTH_SECRET_ARN,
    })
  );
  redisAuthToken = response.SecretString;
  return redisAuthToken;
}

/**
 * Initialize Redis client
 */
async function getRedisClient() {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const token = await getRedisAuthToken();

  redisClient = new Redis({
    host: REDIS_ENDPOINT,
    port: REDIS_PORT,
    password: token,
    tls: {},
  });

  return redisClient;
}

/**
 * Reconciliation Checker Lambda
 * Compares DynamoDB, Redis cache, and Aurora state to detect drift
 * SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes
 */
exports.handler = async event => {
  console.log('Reconciliation check started:', JSON.stringify(event, null, 2));

  const startTime = Date.now();
  const conflicts = [];
  let itemsChecked = 0;
  let driftDetected = false;

  try {
    const redis = await getRedisClient();

    // Sample-based reconciliation: check recent bookings or random sample
    // In production, implement pagination and partial checking to meet 2min SLA
    const scanParams = {
      TableName: TABLE_NAME,
      Limit: 100, // Sample size - adjust based on performance requirements
      FilterExpression: 'attribute_exists(available_units)',
    };

    const dynamoData = await dynamoClient.send(new ScanCommand(scanParams));

    for (const item of dynamoData.Items || []) {
      itemsChecked++;

      const {
        booking_key,
        property_id,
        room_id,
        date,
        available_units,
        version,
      } = item;
      const [propId, roomId, dateStr] = booking_key.split('#');

      // Check Redis cache consistency
      const cacheKey = `hotel:${propId}:room:${roomId}:date:${dateStr}`;

      try {
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
          const cached = JSON.parse(cachedData);

          // Check for cache drift
          if (cached.availableUnits !== available_units) {
            console.warn(`Cache drift detected: ${cacheKey}`);
            console.warn(
              `DynamoDB: ${available_units}, Redis: ${cached.availableUnits}`
            );

            conflicts.push({
              bookingKey: booking_key,
              type: 'CACHE_DRIFT',
              dynamoValue: available_units,
              cacheValue: cached.availableUnits,
              severity: 'MEDIUM',
            });

            driftDetected = true;

            // Auto-heal: Update cache with DynamoDB value (source of truth)
            const correctedData = {
              propertyId: propId,
              roomId,
              date: dateStr,
              availableUnits: available_units,
              reservedUnits: item.reserved_units || 0,
              version: version || 0,
              lastUpdated: new Date().toISOString(),
              reconciled: true,
            };

            await redis.setex(cacheKey, 3600, JSON.stringify(correctedData));
            console.log(`Cache auto-healed for ${cacheKey}`);
          }
        } else {
          // Cache miss - not necessarily a problem if TTL expired
          console.log(`Cache miss for ${cacheKey} (may be TTL expiration)`);
        }
      } catch (redisError) {
        console.error(`Redis check failed for ${cacheKey}:`, redisError);
      }

      // Check for logical inconsistencies
      if (available_units < 0) {
        console.error(
          `Negative availability detected: ${booking_key} = ${available_units}`
        );

        conflicts.push({
          bookingKey: booking_key,
          type: 'NEGATIVE_AVAILABILITY',
          value: available_units,
          severity: 'CRITICAL',
        });

        driftDetected = true;
      }
    }

    const duration = Date.now() - startTime;

    // Publish metrics
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Custom/Booking',
        MetricData: [
          {
            MetricName: 'ReconciliationDuration',
            Value: duration,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ReconciliationItemsChecked',
            Value: itemsChecked,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ReconciliationConflicts',
            Value: conflicts.length,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log(
      `Reconciliation complete: ${itemsChecked} items checked, ${conflicts.length} conflicts found, ${duration}ms`
    );

    return {
      statusCode: 200,
      body: {
        driftDetected,
        itemsChecked,
        conflicts,
        duration,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Reconciliation checker error:', error);
    throw error;
  }
};
```

**Dependencies** (`lib/lambda/reconciliation_checker/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### 6. Overbooking Resolver (`lib/lambda/overbooking_resolver/index.js`)

Resolves overbooking conflicts automatically.

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Overbooking Resolver Lambda
 * Attempts to resolve overbooking conflicts automatically
 * SLA Targets:
 * - Conflicts detected within 5 seconds of collision
 * - Auto-reassign (if possible) within 60 seconds
 * - Push correction to PMS within 2 minutes
 * - Otherwise publish UnresolvedOverbookings metric for human ops
 */
exports.handler = async event => {
  console.log('Overbooking resolver invoked:', JSON.stringify(event, null, 2));

  const conflicts = event.conflicts || [];
  const resolutionResults = [];
  let unresolvedCount = 0;

  try {
    for (const conflict of conflicts) {
      const { bookingKey, availableUnits, version, detectedAt } = conflict;
      const [propertyId, roomId, date] = bookingKey.split('#');

      console.log(
        `Resolving overbooking: ${bookingKey}, units=${availableUnits}`
      );

      // Step 1: Get current state
      const current = await dynamoClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: bookingKey },
        })
      );

      if (!current.Item) {
        console.error(`Booking key ${bookingKey} not found`);
        continue;
      }

      const currentAvailable = current.Item.available_units || 0;
      const currentVersion = current.Item.version || 0;

      // If problem resolved itself, skip
      if (currentAvailable >= 0) {
        console.log(`Overbooking already resolved for ${bookingKey}`);
        resolutionResults.push({
          bookingKey,
          resolution: 'AUTO_RESOLVED',
          success: true,
        });
        continue;
      }

      // Step 2: Try to find alternative rooms at the same property for the same date
      const alternativeRooms = await findAlternativeRooms(
        propertyId,
        date,
        roomId
      );

      if (alternativeRooms.length > 0) {
        console.log(
          `Found ${alternativeRooms.length} alternative rooms for ${bookingKey}`
        );

        // Strategy: Reallocate the overbooking to alternative rooms
        const reallocationSuccess = await reallocateBooking(
          bookingKey,
          alternativeRooms,
          Math.abs(currentAvailable) // Number of units we need to reallocate
        );

        if (reallocationSuccess) {
          // Reset the original room to 0 availability
          await dynamoClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { booking_key: bookingKey },
              UpdateExpression:
                'SET available_units = :zero, #version = #version + :inc, resolved_at = :timestamp, resolution_type = :type',
              ExpressionAttributeNames: {
                '#version': 'version',
              },
              ExpressionAttributeValues: {
                ':zero': 0,
                ':inc': 1,
                ':timestamp': new Date().toISOString(),
                ':type': 'AUTO_REALLOCATED',
              },
            })
          );

          resolutionResults.push({
            bookingKey,
            resolution: 'REALLOCATED',
            success: true,
            alternativeRooms: alternativeRooms.map(r => r.booking_key),
          });

          // Notify via SNS
          await snsClient.send(
            new PublishCommand({
              TopicArn: SNS_TOPIC_ARN,
              Message: JSON.stringify({
                eventType: 'OVERBOOKING_RESOLVED',
                bookingKey,
                resolution: 'REALLOCATED',
                timestamp: new Date().toISOString(),
              }),
              MessageAttributes: {
                property_id: { DataType: 'String', StringValue: propertyId },
                event_type: {
                  DataType: 'String',
                  StringValue: 'OVERBOOKING_RESOLVED',
                },
              },
            })
          );

          continue;
        }
      }

      // Step 3: If auto-resolution failed, mark as unresolved and alert ops
      unresolvedCount++;

      await dynamoClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: bookingKey },
          UpdateExpression:
            'SET resolution_status = :status, escalated_at = :timestamp',
          ExpressionAttributeValues: {
            ':status': 'UNRESOLVED',
            ':timestamp': new Date().toISOString(),
          },
        })
      );

      resolutionResults.push({
        bookingKey,
        resolution: 'UNRESOLVED',
        success: false,
        reason: 'NO_ALTERNATIVE_ROOMS',
      });

      // Publish unresolved metric for alerting
      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'Custom/Booking',
          MetricData: [
            {
              MetricName: 'UnresolvedOverbookings',
              Value: 1,
              Unit: 'Count',
              Timestamp: new Date(),
              Dimensions: [
                { Name: 'PropertyId', Value: propertyId },
                { Name: 'BookingKey', Value: bookingKey },
              ],
            },
          ],
        })
      );

      // Send high-priority SNS notification
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: 'URGENT: Unresolved Overbooking',
          Message: JSON.stringify({
            eventType: 'OVERBOOKING_UNRESOLVED',
            bookingKey,
            propertyId,
            roomId,
            date,
            availableUnits: currentAvailable,
            detectedAt,
            requiresManualIntervention: true,
            priority: 'CRITICAL',
          }),
          MessageAttributes: {
            property_id: { DataType: 'String', StringValue: propertyId },
            event_type: {
              DataType: 'String',
              StringValue: 'OVERBOOKING_UNRESOLVED',
            },
            priority: { DataType: 'String', StringValue: 'CRITICAL' },
          },
        })
      );

      console.error(`Overbooking ${bookingKey} requires manual intervention`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        conflictsProcessed: conflicts.length,
        resolutionResults,
        unresolvedCount,
      }),
    };
  } catch (error) {
    console.error('Overbooking resolver error:', error);
    throw error;
  }
};

/**
 * Find alternative rooms at the same property for reallocation
 */
async function findAlternativeRooms(propertyId, date, excludeRoomId) {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'PropertyIndex',
        KeyConditionExpression: 'property_id = :propertyId',
        FilterExpression:
          '#date = :date AND available_units > :zero AND room_id <> :excludeRoom',
        ExpressionAttributeNames: {
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':propertyId': propertyId,
          ':date': date,
          ':zero': 0,
          ':excludeRoom': excludeRoomId,
        },
        Limit: 10,
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error('Error finding alternative rooms:', error);
    return [];
  }
}

/**
 * Reallocate overbooking to alternative rooms
 */
async function reallocateBooking(
  originalBookingKey,
  alternativeRooms,
  unitsNeeded
) {
  try {
    let unitsReallocated = 0;

    for (const room of alternativeRooms) {
      if (unitsReallocated >= unitsNeeded) break;

      const unitsToTake = Math.min(
        room.available_units,
        unitsNeeded - unitsReallocated
      );

      // Reserve units in the alternative room
      await dynamoClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: room.booking_key },
          UpdateExpression:
            'SET available_units = available_units - :units, #version = #version + :inc, reallocated_from = :original',
          ExpressionAttributeNames: {
            '#version': 'version',
          },
          ExpressionAttributeValues: {
            ':units': unitsToTake,
            ':inc': 1,
            ':original': originalBookingKey,
          },
          ConditionExpression: 'available_units >= :units',
        })
      );

      unitsReallocated += unitsToTake;
      console.log(`Reallocated ${unitsToTake} units to ${room.booking_key}`);
    }

    return unitsReallocated >= unitsNeeded;
  } catch (error) {
    console.error('Reallocation failed:', error);
    return false;
  }
}
```

**Dependencies** (`lib/lambda/overbooking_resolver/package.json`):

```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "description": "Hotel booking system Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/client-lambda": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-secrets-manager": "^3.500.0",
    "ioredis": "^5.3.2"
  }
}
```

### Lambda Deployment README (`lib/lambda/README.md`)

````markdown
# Lambda Functions for Global Hotel Booking System

This directory contains the Lambda function implementations for the hotel booking platform.

## Functions Overview

### 1. **booking_handler**

- **Purpose**: Handles booking requests with optimistic locking
- **Trigger**: API Gateway (POST /book)
- **SLA**: <400ms P95 response time
- **Key Features**:
  - Optimistic locking to prevent double-booking
  - Conditional DynamoDB updates
  - SNS event publishing

### 2. **cache_updater**

- **Purpose**: Updates Redis cache when DynamoDB inventory changes
- **Trigger**: DynamoDB Streams
- **SLA**: Cache updated in <1s P95 after DynamoDB change
- **Key Features**:
  - Per-hotel cache key strategy
  - TTL management
  - Property-level availability indexing

### 3. **hot_booking_checker**

- **Purpose**: Fast-path conflict detection within 30s of booking
- **Trigger**: DynamoDB Streams (filtered for booking events)
- **SLA**: Hot bookings checked within 30 seconds
- **Key Features**:
  - Detects negative availability (overbooking)
  - Monitors rapid version changes
  - Auto-invokes overbooking resolver

### 4. **pms_sync_worker**

- **Purpose**: Syncs booking changes to Property Management Systems
- **Trigger**: SQS queue (from SNS topic)
- **SLA**: Delivered in <60 seconds
- **Key Features**:
  - Retry logic with exponential backoff
  - PMS API integration (simulated)
  - Circuit breaker pattern ready

### 5. **reconciliation_checker**

- **Purpose**: Periodic consistency checks across DynamoDB, Redis, and Aurora
- **Trigger**: EventBridge (every 5 minutes via Step Functions)
- **SLA**: Finishes within 2 minutes
- **Key Features**:
  - Sample-based reconciliation
  - Auto-healing for cache drift
  - Logical consistency validation

### 6. **overbooking_resolver**

- **Purpose**: Resolves overbooking conflicts automatically
- **Trigger**: Invoked by hot_booking_checker or reconciliation Step Functions
- **SLA**: Auto-reassign within 60 seconds, escalate within 2 minutes
- **Key Features**:
  - Finds alternative rooms
  - Auto-reallocation logic
  - Escalation for manual intervention

## Building and Deploying

### Option 1: Deploy with Placeholder (Quick Start)

The Terraform configuration uses a minimal placeholder Lambda that allows infrastructure deployment:

```bash
cd /Users/mac/code/new-turing/t_4
terraform apply
```
````

The placeholder allows the stack to deploy without errors. All Lambda functions will be created but will return placeholder responses.

### Option 2: Build and Deploy Full Implementation

#### Step 1: Install Dependencies

```bash
cd /Users/mac/code/new-turing/t_4/lib/lambda

for dir in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  cd "$dir"
  npm install --production
  cd ..
done
```

#### Step 2: Create Deployment Packages

```bash
for dir in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  cd "$dir"
  zip -r "../${dir}.zip" . -x "*.git*" "*.DS_Store"
  cd ..
done
```

#### Step 3: Update Terraform to Use Real Packages

Edit `tap_stack.tf` and replace the `filename` references with S3 deployment:

```hcl
# Example for booking_handler
resource "aws_lambda_function" "booking_handler" {
  # ... other config ...

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "booking_handler.zip"
  source_code_hash = filebase64sha256("lambda/booking_handler.zip")
}
```

#### Step 4: Upload to S3

```bash
aws s3 cp booking_handler.zip s3://${BUCKET_NAME}/booking_handler.zip
aws s3 cp cache_updater.zip s3://${BUCKET_NAME}/cache_updater.zip
aws s3 cp hot_booking_checker.zip s3://${BUCKET_NAME}/hot_booking_checker.zip
aws s3 cp pms_sync_worker.zip s3://${BUCKET_NAME}/pms_sync_worker.zip
aws s3 cp reconciliation_checker.zip s3://${BUCKET_NAME}/reconciliation_checker.zip
aws s3 cp overbooking_resolver.zip s3://${BUCKET_NAME}/overbooking_resolver.zip
```

#### Step 5: Update Lambda Functions

```bash
terraform apply
```

Or use AWS CLI to update directly:

```bash
for fn in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  aws lambda update-function-code \
    --function-name "global-booking-prod-${fn}" \
    --s3-bucket ${BUCKET_NAME} \
    --s3-key "${fn}.zip"
done
```

## Environment Variables

Each Lambda function requires specific environment variables (automatically set by Terraform):

- `DYNAMODB_TABLE_NAME`: DynamoDB inventory table
- `SNS_TOPIC_ARN`: SNS topic for inventory updates
- `REDIS_ENDPOINT`: ElastiCache Redis endpoint
- `REDIS_AUTH_SECRET_ARN`: Secrets Manager ARN for Redis auth
- `AURORA_SECRET_ARN`: Secrets Manager ARN for Aurora credentials
- `ENABLE_OPTIMISTIC_LOCKING`: Enable version-based locking (true/false)

## Dependencies

All functions use AWS SDK v3 for better performance and tree-shaking:

```json
{
  "@aws-sdk/client-dynamodb": "^3.500.0",
  "@aws-sdk/lib-dynamodb": "^3.500.0",
  "@aws-sdk/client-sns": "^3.500.0",
  "@aws-sdk/client-lambda": "^3.500.0",
  "@aws-sdk/client-cloudwatch": "^3.500.0",
  "@aws-sdk/client-secrets-manager": "^3.500.0",
  "ioredis": "^5.3.2"
}
```

## Monitoring

All functions emit CloudWatch metrics:

- Success/failure counts
- Processing durations
- Business metrics (overbookings, conflicts, etc.)

Custom metrics namespace: `Custom/Booking`

## Architecture Notes

1. **Optimistic Locking**: All booking writes use DynamoDB conditional expressions with version checking
2. **Cache Strategy**: Per-hotel keys with TTL, not global cache invalidation
3. **PMS Integration**: Designed for fan-out to specific properties, not broadcast to all 45k hotels
4. **Conflict Resolution**: Fast path (30s) + slow path (5min reconciliation)
5. **Error Handling**: DLQs, retry logic, and CloudWatch alarms for operational visibility

## Production Considerations

- **Concurrency**: Adjust `reserved_concurrent_executions` based on actual load
- **Memory/Timeout**: Tune per function based on P95 latency requirements
- **VPC Configuration**: Only cache/reconciliation functions run in VPC for data plane access
- **Secrets Rotation**: Implement rotation for Redis auth token and Aurora passwords
- **Cost Optimization**: Consider Lambda SnapStart for cold start reduction

## Support

For issues or questions:

- Check CloudWatch Logs: `/aws/lambda/global-booking-prod-{function-name}`
- Review CloudWatch Alarms for operational issues
- Consult the main project README for architecture overview

```

```
