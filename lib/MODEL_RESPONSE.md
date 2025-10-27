### Reasoning Trace
---

Alright, I'm going to create a single Terraform file named `tap_stack.tf` that defines all the infrastructure needed for the global hotel booking system as described. Let me plan out the structure of the file:

1. Variables
2. Locals
3. DynamoDB Global Table
4. IAM Roles and Policies for Lambdas
5. Lambda Functions
6. API Gateway
7. DynamoDB Stream to cache_updater Lambda mapping
8. ElastiCache (Redis)
9. SNS Topic, SQS Queues, and Subscriptions
10. EventBridge Rule and Step Functions
11. Aurora for reconciliation reads
12. CloudWatch Alarms/Metrics
13. Outputs

Let me start writing the file:

```hcl
# tap_stack.tf - Global Hotel Booking Infrastructure

# ---------------------------------------------------------------------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "aws_region" {
  description = "The AWS region to deploy resources to"
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

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r5.large" # Choose based on memory requirements
}

variable "pms_queue_visibility_timeout_seconds" {
  description = "Visibility timeout for PMS integration SQS queues"
  type        = number
  default     = 300 # 5 minutes, allow time for retries
}

variable "booking_api_rate_limit_rps" {
  description = "Rate limit for booking API in requests per second"
  type        = number
  default     = 2000 # Based on SLA requirements of ~2000 RPS burst
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

# VPC and Network variables (assuming these are managed elsewhere but needed for reference)
variable "vpc_id" {
  description = "ID of the VPC to deploy resources to"
  type        = string
  default     = null # No default, must be provided
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for resources requiring VPC access"
  type        = list(string)
  default     = [] # No default, must be provided
}

variable "security_group_ids" {
  description = "List of security group IDs for resources requiring VPC access"
  type        = list(string)
  default     = [] # No default, must be provided
}

variable "lambda_code_bucket" {
  description = "S3 bucket containing Lambda function code"
  type        = string
  default     = "hotel-booking-lambda-code"
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

variable "aurora_master_password_ssm_param" {
  description = "SSM Parameter Store ARN containing Aurora master password"
  type        = string
  default     = "arn:aws:ssm:us-west-2:123456789012:parameter/booking/aurora/master-password"
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

  dynamodb_stream_arn = aws_dynamodb_table.inventory.stream_arn
  lambda_logging_policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB GLOBAL TABLE
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_dynamodb_table" "inventory" {
  name         = "${local.name_prefix}-${var.dynamodb_table_name}"
  billing_mode = "PAY_PER_REQUEST" # Auto-scaling capacity for handling high throughput
  hash_key     = "booking_key"     # Format: property_id#room_id#date

  attribute {
    name = "booking_key"
    type = "S"
  }
  
  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }
  
  # Enable DynamoDB Streams for cache updates
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  # Global table configuration (multi-region replication)
  dynamic "replica" {
    for_each = toset(var.dynamodb_replica_regions)
    content {
      region_name = replica.value
      # Target SLA: Replication typically <5s cross-region, alert if >10s
      # (Replication monitoring handled via CloudWatch alarms)
    }
  }
  
  server_side_encryption {
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
  description = "Policy for booking_handler Lambda"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
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
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = local.dynamodb_stream_arn
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
          "ec2:DeleteNetworkInterface"
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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
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
          "ec2:DeleteNetworkInterface"
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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
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

# 6. IAM Role for Step Functions
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
          aws_lambda_function.overbooking_resolver.arn
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
  runtime          = "nodejs14.x"
  timeout          = 10 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "booking_handler/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      SNS_TOPIC_ARN = aws_sns_topic.inventory_updates.arn,
      ENVIRONMENT = var.environment,
      # Target SLA: Booking confirmation path should return in <400ms P95 in primary region
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-handler"
  })
  
  # For resources that need VPC access, uncomment these lines and provide subnet/SG info
  # vpc_config {
  #   subnet_ids         = var.private_subnet_ids
  #   security_group_ids = var.security_group_ids
  # }
}

resource "aws_lambda_function" "cache_updater" {
  function_name    = "${local.name_prefix}-cache-updater"
  role             = aws_iam_role.cache_updater_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 30 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "cache_updater/function.zip"
  
  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.booking_cache.primary_endpoint_address,
      REDIS_PORT = "6379",
      # Cache TTL in seconds - entries expire if not refreshed
      REDIS_TTL = "3600", # 1 hour TTL for cache items
      ENVIRONMENT = var.environment,
      # SLA Target: Cache for a specific hotel should be updated in <1s P95 after DynamoDB change
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config for ElastiCache access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-updater"
  })
}

resource "aws_lambda_function" "pms_sync_worker" {
  function_name    = "${local.name_prefix}-pms-sync-worker"
  role             = aws_iam_role.pms_sync_worker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 60 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "pms_sync_worker/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      # Configuration for circuit breaker pattern
      MAX_RETRIES = "3",
      BACKOFF_RATE = "2", # Exponential backoff multiplier
      INITIAL_BACKOFF_SECONDS = "1",
      CIRCUIT_OPEN_SECONDS = "300", # Temporarily stop calling broken PMS for 5 minutes
      ENVIRONMENT = var.environment,
      # SLA Target: SNS → SQS → PMS sync should deliver for property's PMS in <60 seconds
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pms-sync-worker"
  })
  
  # For resources that need VPC access, uncomment these lines and provide subnet/SG info
  # vpc_config {
  #   subnet_ids         = var.private_subnet_ids
  #   security_group_ids = var.security_group_ids
  # }
}

resource "aws_lambda_function" "reconciliation_checker" {
  function_name    = "${local.name_prefix}-reconciliation-checker"
  role             = aws_iam_role.reconciliation_checker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 300 # 5 minutes max
  memory_size      = 512 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "reconciliation_checker/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      REDIS_ENDPOINT = aws_elasticache_replication_group.booking_cache.primary_endpoint_address,
      REDIS_PORT = "6379",
      AURORA_ENDPOINT = aws_rds_cluster.audit_db.reader_endpoint,
      AURORA_PORT = "3306",
      AURORA_DATABASE = var.aurora_database_name,
      # Credentials should come from Secrets Manager - placeholder only
      AURORA_USERNAME = var.aurora_master_username, 
      AURORA_PASSWORD_PARAM = var.aurora_master_password_ssm_param,
      ENVIRONMENT = var.environment,
      # SLA Targets: 
      # - "Hot" bookings rechecked within 30 seconds
      # - Wider audit runs every 5 minutes and finishes within 2 minutes
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config for Redis and Aurora access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-checker"
  })
}

resource "aws_lambda_function" "overbooking_resolver" {
  function_name    = "${local.name_prefix}-overbooking-resolver"
  role             = aws_iam_role.overbooking_resolver_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 60 # seconds
  memory_size      = 512 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "overbooking_resolver/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      SNS_TOPIC_ARN = aws_sns_topic.inventory_updates.arn,
      ENVIRONMENT = var.environment,
      # SLA Targets:
      # - Conflicts detected within 5 seconds of collision
      # - Auto-reassign (if possible) within 60 seconds
      # - Push correction to PMS within 2 minutes
      # - Otherwise raise alert for human ops
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config if needed for resources access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-overbooking-resolver"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# API GATEWAY
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "booking_api" {
  name          = "${local.name_prefix}-booking-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"] # Should be restricted in production
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-api"
  })
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
  
  target = "integrations/${aws_apigatewayv2_integration.booking_handler_integration.id}"
  
  # API Gateway throttling to meet SLA requirements
  # SLA Target: Handle ~70,000 booking requests per minute (~1,200 RPS sustained, burst ~2,000 RPS)
  # Note: Additional throttling configuration may need to be set in the API Gateway console or via stage settings
}

resource "aws_apigatewayv2_stage" "booking_api_stage" {
  api_id      = aws_apigatewayv2_api.booking_api.id
  name        = "$default"
  auto_deploy = true
  
  # Stage variables and throttling settings
  default_route_settings {
    throttling_burst_limit = var.booking_api_rate_limit_rps
    throttling_rate_limit  = var.booking_api_rate_limit_rps * 0.8 # Set sustained rate at 80% of burst
  }
  
  tags = local.common_tags
}

resource "aws_lambda_permission" "api_gateway_invoke_booking_handler" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.booking_handler.function_name
  principal     = "apigateway.amazonaws.com"
  
  # Allow invocation from any stage, any method, any resource path
  source_arn = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*/*"
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB STREAM TO LAMBDA MAPPING
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lambda_event_source_mapping" "dynamodb_to_cache_updater" {
  event_source_arn  = local.dynamodb_stream_arn
  function_name     = aws_lambda_function.cache_updater.arn
  starting_position = "LATEST"
  
  # SLA Target: Cache for a specific hotel is updated in <1s P95 after DynamoDB change
  # We use batch size of 100 to efficiently process multiple updates for the same property
  batch_size        = 100
  maximum_batching_window_in_seconds = 1
  
  # These settings help prevent Lambda throttling during high load
  maximum_retry_attempts = 10
  parallelization_factor = 10 # Process multiple batches in parallel
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE (REDIS)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_replication_group" "booking_cache" {
  replication_group_id       = "${local.name_prefix}-booking-cache"
  description                = "Redis cache for hotel availability"
  node_type                  = var.cache_node_type
  port                       = 6379
  parameter_group_name       = "default.redis6.x"
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = var.security_group_ids
  
  # Multi-AZ configuration for high availability
  automatic_failover_enabled = true
  num_cache_clusters         = 2
  
  # Enable encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  # Apply a weekly maintenance window during off-peak hours
  maintenance_window = "sun:05:00-sun:06:00"
  
  # Auto-backup settings
  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-cache"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPIC, SQS QUEUES, AND SUBSCRIPTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_sns_topic" "inventory_updates" {
  name = "${local.name_prefix}-inventory-updates"
  
  # Enable server-side encryption
  kms_master_key_id = "alias/aws/sns"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-inventory-updates"
  })
}

# Dead Letter Queue for hotel_pms_queue
resource "aws_sqs_queue" "hotel_pms_dlq" {
  name = "${local.name_prefix}-hotel-pms-dlq"
  
  # Keep messages for 14 days (maximum allowed)
  message_retention_seconds = 1209600 # 14 days
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-dlq"
  })
}

resource "aws_sqs_queue" "hotel_pms_queue" {
  name = "${local.name_prefix}-hotel-pms-queue"
  
  # Set the visibility timeout to allow sufficient processing time
  # Must be at least as long as the Lambda timeout
  visibility_timeout_seconds = var.pms_queue_visibility_timeout_seconds
  
  # Configure the DLQ redrive policy
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hotel_pms_dlq.arn
    maxReceiveCount     = 5  # Move to DLQ after 5 failed attempts
  })
  
  # Set the delay for messages when first added to the queue
  delay_seconds = 0
  
  # Keep messages for 4 days
  message_retention_seconds = 345600 # 4 days
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  # SLA Target: SNS → SQS → PMS sync should enqueue and attempt delivery 
  # for that property's PMS in <60 seconds.
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-queue"
  })
}

resource "aws_sns_topic_subscription" "hotel_pms_subscription" {
  topic_arn = aws_sns_topic.inventory_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.hotel_pms_queue.arn
  
  # Note: In a real implementation, we would set up a filter policy here to
  # only send relevant messages to this queue (e.g., only for specific hotels)
  filter_policy = jsonencode({
    property_id = ["hotel123"]  # Example: only messages for hotel123
  })
  
  # SQS queues need a policy to allow SNS to send messages
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
        Action = "sqs:SendMessage"
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
  
  # Process up to 10 messages at a time
  batch_size       = 10
  
  # Wait up to 5 seconds to collect the batch
  maximum_batching_window_in_seconds = 5
  
  # Note: In a production environment, we would create multiple SQS queues
  # and event source mappings, one for each property/PMS integration class.
}

# ---------------------------------------------------------------------------------------------------------------------
# EVENTBRIDGE RULE AND STEP FUNCTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "reconciliation_schedule" {
  name                = "${local.name_prefix}-reconciliation-schedule"
  description         = "Triggers reconciliation process every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  
  # SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-schedule"
  })
}

resource "aws_sfn_state_machine" "reconciliation_state_machine" {
  name     = "${local.name_prefix}-reconciliation-state-machine"
  role_arn = aws_iam_role.step_functions_role.arn
  
  definition = jsonencode({
    Comment = "Reconciliation workflow for hotel bookings",
    StartAt = "CheckConsistency",
    States = {
      CheckConsistency = {
        Type = "Task",
        Resource = aws_lambda_function.reconciliation_checker.arn,
        Next = "EvaluateResults"
      },
      EvaluateResults = {
        Type = "Choice",
        Choices = [
          {
            Variable = "$.driftDetected",
            BooleanEquals = true,
            Next = "ResolveDrift"
          }
        ],
        Default = "Complete"
      },
      ResolveDrift = {
        Type = "Task",
        Resource = aws_lambda_function.overbooking_resolver.arn,
        Next = "Complete"
      },
      Complete = {
        Type = "Succeed"
      }
    }
  })
  
  # SLA Targets:
  # - "Hot" bookings rechecked within 30 seconds of booking being finalized
  # - Wider audit runs every 5 minutes and completes in under 2 minutes
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-state-machine"
  })
}

resource "aws_cloudwatch_event_target" "reconciliation_target" {
  rule      = aws_cloudwatch_event_rule.reconciliation_schedule.name
  arn       = aws_sfn_state_machine.reconciliation_state_machine.arn
  role_arn  = aws_iam_role.eventbridge_to_sfn_role.arn
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

resource "aws_rds_cluster" "audit_db" {
  cluster_identifier      = "${local.name_prefix}-audit-db"
  engine                  = "aurora-mysql"
  engine_version          = "5.7.mysql_aurora.2.10.2"
  database_name           = var.aurora_database_name
  master_username         = var.aurora_master_username
  # Password should be managed via Secrets Manager in production
  # This is just a placeholder using SSM Parameter Store
  master_password         = "placeholder_password_use_ssm_parameter"
  
  # VPC configuration
  db_subnet_group_name    = aws_db_subnet_group.aurora_subnet_group.name
  vpc_security_group_ids  = var.security_group_ids
  
  # Backup configuration
  backup_retention_period = 7
  preferred_backup_window = "03:00-05:00"
  
  # Maintenance window
  preferred_maintenance_window = "sun:05:00-sun:06:00"
  
  # Enable encryption
  storage_encrypted       = true
  
  # Aurora is used as a reporting/audit store, not the primary booking source of truth
  # The reconciliation Lambda will compare DynamoDB state to Aurora-replicated state
  
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.name_prefix}-audit-db-final-snapshot"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-db"
  })
}

resource "aws_db_subnet_group" "aurora_subnet_group" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = var.private_subnet_ids
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_instance" "audit_db_reader" {
  identifier           = "${local.name_prefix}-audit-db-reader"
  cluster_identifier   = aws_rds_cluster.audit_db.id
  instance_class       = var.aurora_instance_class
  engine               = aws_rds_cluster.audit_db.engine
  engine_version       = aws_rds_cluster.audit_db.engine_version
  db_subnet_group_name = aws_db_subnet_group.aurora_subnet_group.name
  
  # Enable enhanced monitoring
  monitoring_interval  = 60
  monitoring_role_arn  = aws_iam_role.rds_monitoring_role.arn
  
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

resource "aws_cloudwatch_metric_alarm" "dynamodb_replication_lag" {
  alarm_name          = "${local.name_prefix}-dynamodb-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 10000 # 10 seconds in milliseconds
  alarm_description   = "This alarm monitors DynamoDB Global Table replication lag. SLA: Replication >10s is a breach."
  
  dimensions = {
    TableName = aws_dynamodb_table.inventory.name
    # In real implementation, we need to add the receiving region dimension
    # which varies based on the replica regions
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-replication-lag"
  })
}

resource "aws_cloudwatch_metric_alarm" "sqs_dlq_not_empty" {
  alarm_name          = "${local.name_prefix}-sqs-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "This alarm triggers when there are messages in the DLQ. SLA: PMS sync backlog >60s is a breach."
  
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
  evaluation_periods  = 1
  metric_name         = "UnresolvedOverbookings"
  namespace           = "Custom/Booking"  # Custom metric namespace
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This alarm monitors unresolved overbookings. SLA: Unresolved overbooking after 2 minutes is a breach."
  
  # This metric would be published by the overbooking_resolver Lambda
  # when it cannot automatically resolve a conflict
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-unresolved-overbookings"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

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

output "elasticache_primary_endpoint" {
  description = "Primary endpoint address of ElastiCache replication group"
  value       = aws_elasticache_replication_group.booking_cache.primary_endpoint_address
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint of Aurora database"
  value       = aws_rds_cluster.audit_db.reader_endpoint
}
```

Let me review this file to make sure it covers all the requirements:

1. Variables - Yes, all required variables are declared including aws_region, project_name, environment, dynamodb_table_name, etc.
2. Locals - Yes, defined name_prefix and common_tags for consistent naming and tagging.
3. DynamoDB Global Table - Yes, created with stream enabled, global replication, and TTL configuration.
4. IAM Roles/Policies - Yes, created least-privilege roles for each Lambda function, Step Functions, and other services.
5. Lambda Functions - Yes, created all required Lambda functions with appropriate configurations.
6. API Gateway - Yes, set up HTTP API with route to the booking_handler Lambda.
7. DynamoDB Stream to Lambda mapping - Yes, created event source mapping from DynamoDB stream to cache_updater Lambda.
8. ElastiCache (Redis) - Yes, configured Redis replication group with encryption.
9. SNS Topic, SQS Queues, and Subscriptions - Yes, set up SNS topic, SQS queue with DLQ, and subscription.
10. EventBridge Rule and Step Functions - Yes, created EventBridge rule and Step Functions state machine.
11. Aurora - Yes, created Aurora cluster and reader instance for reconciliation.
12. CloudWatch Alarms/Metrics - Yes, created alarms for DynamoDB replication lag, SQS DLQ, and unresolved overbookings.
13. Outputs - Yes, added outputs for all required resources.

Security and best practices:
- Encryption enabled where applicable
- Least privilege IAM policies
- SQS queues with DLQ
- Comments about SLAs
- Lambda functions with X-Ray tracing
- CloudWatch logs enabled

The file seems to cover all the requirements specified in the prompt. Let me review it one more time to make sure it's syntactically valid HCL2 and logically consistent:

- The resources refer to each other correctly (e.g., IAM policies reference the correct resource ARNs)
- The naming is consistent using the name_prefix local variable
- All resources have appropriate tags
- The comments reference the SLA targets as required
- The configuration aligns with the described system architecture

I don't see any major issues, though there might be some minor syntax errors that would need to be fixed when actually implementing the infrastructure. But the structure and logic seem sound.

This file should be a good starting point for implementing the global hotel booking infrastructure as described. It includes all the required resources, follows best practices, and includes comments about SLAs where relevant.
### Answer 
---

```terraform
# tap_stack.tf - Global Hotel Booking Infrastructure

# ---------------------------------------------------------------------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "aws_region" {
  description = "The AWS region to deploy resources to"
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

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r5.large"
}

variable "pms_queue_visibility_timeout_seconds" {
  description = "Visibility timeout for PMS integration SQS queues"
  type        = number
  default     = 300 # 5 minutes, allow time for retries
}

variable "booking_api_rate_limit_rps" {
  description = "Rate limit for booking API in requests per second"
  type        = number
  default     = 2000 # Based on SLA requirements of ~2000 RPS burst
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

# VPC and Network variables
variable "vpc_id" {
  description = "ID of the VPC to deploy resources to"
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for resources requiring VPC access"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs for resources requiring VPC access"
  type        = list(string)
  default     = []
}

variable "lambda_code_bucket" {
  description = "S3 bucket containing Lambda function code"
  type        = string
  default     = "hotel-booking-lambda-code"
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

variable "aurora_master_password_ssm_param" {
  description = "SSM Parameter Store ARN containing Aurora master password"
  type        = string
  default     = "arn:aws:ssm:us-west-2:123456789012:parameter/booking/aurora/master-password"
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

  dynamodb_stream_arn = aws_dynamodb_table.inventory.stream_arn
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB GLOBAL TABLE
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_dynamodb_table" "inventory" {
  name         = "${local.name_prefix}-${var.dynamodb_table_name}"
  billing_mode = "PAY_PER_REQUEST" # Auto-scaling capacity for high throughput
  hash_key     = "booking_key"     # Format: property_id#room_id#date
  
  attribute {
    name = "booking_key"
    type = "S"
  }
  
  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }
  
  # Enable DynamoDB Streams for cache updates
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  # Global table configuration (multi-region replication)
  dynamic "replica" {
    for_each = toset(var.dynamodb_replica_regions)
    content {
      region_name = replica.value
      # Target SLA: Replication typically <5s cross-region, alert if >10s
    }
  }
  
  server_side_encryption {
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
  description = "Policy for booking_handler Lambda"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
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
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = local.dynamodb_stream_arn
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
          "ec2:DeleteNetworkInterface"
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
          "ec2:DeleteNetworkInterface"
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

# 6. IAM Role for Step Functions
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
          aws_lambda_function.overbooking_resolver.arn
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
  runtime          = "nodejs14.x"
  timeout          = 10 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "booking_handler/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      SNS_TOPIC_ARN = aws_sns_topic.inventory_updates.arn,
      ENVIRONMENT = var.environment,
      # Target SLA: Booking confirmation path should return in <400ms P95 in primary region
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-handler"
  })
}

resource "aws_lambda_function" "cache_updater" {
  function_name    = "${local.name_prefix}-cache-updater"
  role             = aws_iam_role.cache_updater_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 30 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "cache_updater/function.zip"
  
  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.booking_cache.primary_endpoint_address,
      REDIS_PORT = "6379",
      # Cache TTL in seconds - entries expire if not refreshed
      REDIS_TTL = "3600", # 1 hour TTL for cache items
      ENVIRONMENT = var.environment,
      # SLA Target: Cache for a specific hotel should be updated in <1s P95 after DynamoDB change
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config for ElastiCache access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-updater"
  })
}

resource "aws_lambda_function" "pms_sync_worker" {
  function_name    = "${local.name_prefix}-pms-sync-worker"
  role             = aws_iam_role.pms_sync_worker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 60 # seconds
  memory_size      = 256 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "pms_sync_worker/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      # Configuration for circuit breaker pattern
      MAX_RETRIES = "3",
      BACKOFF_RATE = "2", # Exponential backoff multiplier
      INITIAL_BACKOFF_SECONDS = "1",
      CIRCUIT_OPEN_SECONDS = "300", # Temporarily stop calling broken PMS for 5 minutes
      ENVIRONMENT = var.environment,
      # SLA Target: SNS → SQS → PMS sync should deliver for property's PMS in <60 seconds
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pms-sync-worker"
  })
}

resource "aws_lambda_function" "reconciliation_checker" {
  function_name    = "${local.name_prefix}-reconciliation-checker"
  role             = aws_iam_role.reconciliation_checker_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 300 # 5 minutes max
  memory_size      = 512 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "reconciliation_checker/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      REDIS_ENDPOINT = aws_elasticache_replication_group.booking_cache.primary_endpoint_address,
      REDIS_PORT = "6379",
      AURORA_ENDPOINT = aws_rds_cluster.audit_db.reader_endpoint,
      AURORA_PORT = "3306",
      AURORA_DATABASE = var.aurora_database_name,
      # Credentials should come from Secrets Manager - placeholder only
      AURORA_USERNAME = var.aurora_master_username, 
      AURORA_PASSWORD_PARAM = var.aurora_master_password_ssm_param,
      ENVIRONMENT = var.environment,
      # SLA Targets: 
      # - "Hot" bookings rechecked within 30 seconds
      # - Wider audit runs every 5 minutes and finishes within 2 minutes
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config for Redis and Aurora access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-checker"
  })
}

resource "aws_lambda_function" "overbooking_resolver" {
  function_name    = "${local.name_prefix}-overbooking-resolver"
  role             = aws_iam_role.overbooking_resolver_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  timeout          = 60 # seconds
  memory_size      = 512 # MB

  # Placeholder for code location
  s3_bucket        = var.lambda_code_bucket
  s3_key           = "overbooking_resolver/function.zip"
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.inventory.name,
      SNS_TOPIC_ARN = aws_sns_topic.inventory_updates.arn,
      ENVIRONMENT = var.environment,
      # SLA Targets:
      # - Conflicts detected within 5 seconds of collision
      # - Auto-reassign (if possible) within 60 seconds
      # - Push correction to PMS within 2 minutes
      # - Otherwise raise alert for human ops
      LOG_LEVEL = "INFO"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  # VPC config for resource access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-overbooking-resolver"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# API GATEWAY
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "booking_api" {
  name          = "${local.name_prefix}-booking-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"] # Should be restricted in production
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-api"
  })
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
  
  target = "integrations/${aws_apigatewayv2_integration.booking_handler_integration.id}"
}

resource "aws_apigatewayv2_stage" "booking_api_stage" {
  api_id      = aws_apigatewayv2_api.booking_api.id
  name        = "$default"
  auto_deploy = true
  
  # Stage variables and throttling settings
  default_route_settings {
    throttling_burst_limit = var.booking_api_rate_limit_rps
    throttling_rate_limit  = var.booking_api_rate_limit_rps * 0.8 # Set sustained rate at 80% of burst
  }
  
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
# DYNAMODB STREAM TO LAMBDA MAPPING
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lambda_event_source_mapping" "dynamodb_to_cache_updater" {
  event_source_arn  = local.dynamodb_stream_arn
  function_name     = aws_lambda_function.cache_updater.arn
  starting_position = "LATEST"
  
  # SLA Target: Cache for a specific hotel is updated in <1s P95 after DynamoDB change
  batch_size        = 100
  maximum_batching_window_in_seconds = 1
  
  # These settings help prevent Lambda throttling during high load
  maximum_retry_attempts = 10
  parallelization_factor = 10 # Process multiple batches in parallel
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE (REDIS)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_replication_group" "booking_cache" {
  replication_group_id       = "${local.name_prefix}-booking-cache"
  description                = "Redis cache for hotel availability"
  node_type                  = var.cache_node_type
  port                       = 6379
  parameter_group_name       = "default.redis6.x"
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = var.security_group_ids
  
  # Multi-AZ configuration for high availability
  automatic_failover_enabled = true
  num_cache_clusters         = 2
  
  # Enable encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  # Apply a weekly maintenance window during off-peak hours
  maintenance_window = "sun:05:00-sun:06:00"
  
  # Auto-backup settings
  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-booking-cache"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPIC, SQS QUEUES, AND SUBSCRIPTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_sns_topic" "inventory_updates" {
  name = "${local.name_prefix}-inventory-updates"
  
  # Enable server-side encryption
  kms_master_key_id = "alias/aws/sns"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-inventory-updates"
  })
}

# Dead Letter Queue for hotel_pms_queue
resource "aws_sqs_queue" "hotel_pms_dlq" {
  name = "${local.name_prefix}-hotel-pms-dlq"
  
  # Keep messages for 14 days (maximum allowed)
  message_retention_seconds = 1209600 # 14 days
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-dlq"
  })
}

resource "aws_sqs_queue" "hotel_pms_queue" {
  name = "${local.name_prefix}-hotel-pms-queue"
  
  # Set the visibility timeout to allow sufficient processing time
  # Must be at least as long as the Lambda timeout
  visibility_timeout_seconds = var.pms_queue_visibility_timeout_seconds
  
  # Configure the DLQ redrive policy
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hotel_pms_dlq.arn
    maxReceiveCount     = 5  # Move to DLQ after 5 failed attempts
  })
  
  # Keep messages for 4 days
  message_retention_seconds = 345600 # 4 days
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  # SLA Target: SNS → SQS → PMS sync should enqueue and attempt delivery 
  # for that property's PMS in <60 seconds.
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hotel-pms-queue"
  })
}

resource "aws_sns_topic_subscription" "hotel_pms_subscription" {
  topic_arn = aws_sns_topic.inventory_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.hotel_pms_queue.arn
  
  # In real implementation, we would set up a filter policy here
  # to only send relevant messages to this queue (e.g., only for specific hotels)
  filter_policy = jsonencode({
    property_id = ["hotel123"]  # Example: only messages for hotel123
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
        Action = "sqs:SendMessage"
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
  
  # Process up to 10 messages at a time
  batch_size       = 10
  
  # Wait up to 5 seconds to collect the batch
  maximum_batching_window_in_seconds = 5
}

# ---------------------------------------------------------------------------------------------------------------------
# EVENTBRIDGE RULE AND STEP FUNCTIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "reconciliation_schedule" {
  name                = "${local.name_prefix}-reconciliation-schedule"
  description         = "Triggers reconciliation process every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  
  # SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-schedule"
  })
}

resource "aws_sfn_state_machine" "reconciliation_state_machine" {
  name     = "${local.name_prefix}-reconciliation-state-machine"
  role_arn = aws_iam_role.step_functions_role.arn
  
  definition = jsonencode({
    Comment = "Reconciliation workflow for hotel bookings",
    StartAt = "CheckConsistency",
    States = {
      CheckConsistency = {
        Type = "Task",
        Resource = aws_lambda_function.reconciliation_checker.arn,
        Next = "EvaluateResults"
      },
      EvaluateResults = {
        Type = "Choice",
        Choices = [
          {
            Variable = "$.driftDetected",
            BooleanEquals = true,
            Next = "ResolveDrift"
          }
        ],
        Default = "Complete"
      },
      ResolveDrift = {
        Type = "Task",
        Resource = aws_lambda_function.overbooking_resolver.arn,
        Next = "Complete"
      },
      Complete = {
        Type = "Succeed"
      }
    }
  })
  
  # SLA Targets:
  # - "Hot" bookings rechecked within 30 seconds of booking being finalized
  # - Wider audit runs every 5 minutes and completes in under 2 minutes
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reconciliation-state-machine"
  })
}

resource "aws_cloudwatch_event_target" "reconciliation_target" {
  rule      = aws_cloudwatch_event_rule.reconciliation_schedule.name
  arn       = aws_sfn_state_machine.reconciliation_state_machine.arn
  role_arn  = aws_iam_role.eventbridge_to_sfn_role.arn
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

resource "aws_rds_cluster" "audit_db" {
  cluster_identifier      = "${local.name_prefix}-audit-db"
  engine                  = "aurora-mysql"
  engine_version          = "5.7.mysql_aurora.2.10.2"
  database_name           = var.aurora_database_name
  master_username         = var.aurora_master_username
  # Password should be managed via Secrets Manager in production
  # This is just a placeholder
  master_password         = "placeholder_password_use_ssm_parameter"
  
  # VPC configuration
  db_subnet_group_name    = aws_db_subnet_group.aurora_subnet_group.name
  vpc_security_group_ids  = var.security_group_ids
  
  # Backup configuration
  backup_retention_period = 7
  preferred_backup_window = "03:00-05:00"
  
  # Maintenance window
  preferred_maintenance_window = "sun:05:00-sun:06:00"
  
  # Enable encryption
  storage_encrypted       = true
  
  # Aurora is used as a reporting/audit store, not the primary booking source of truth
  # The reconciliation Lambda will compare DynamoDB state to Aurora-replicated state
  
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.name_prefix}-audit-db-final-snapshot"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-db"
  })
}

resource "aws_db_subnet_group" "aurora_subnet_group" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = var.private_subnet_ids
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_instance" "audit_db_reader" {
  identifier           = "${local.name_prefix}-audit-db-reader"
  cluster_identifier   = aws_rds_cluster.audit_db.id
  instance_class       = var.aurora_instance_class
  engine               = aws_rds_cluster.audit_db.engine
  engine_version       = aws_rds_cluster.audit_db.engine_version
  db_subnet_group_name = aws_db_subnet_group.aurora_subnet_group.name
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-db-reader"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDWATCH ALARMS / METRICS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "dynamodb_replication_lag" {
  alarm_name          = "${local.name_prefix}-dynamodb-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 10000 # 10 seconds in milliseconds
  alarm_description   = "This alarm monitors DynamoDB Global Table replication lag. SLA: Replication >10s is a breach."
  
  dimensions = {
    TableName = aws_dynamodb_table.inventory.name
    # In real implementation, we need to add the receiving region dimension
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-replication-lag"
  })
}

resource "aws_cloudwatch_metric_alarm" "sqs_dlq_not_empty" {
  alarm_name          = "${local.name_prefix}-sqs-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "This alarm triggers when there are messages in the DLQ. SLA: PMS sync backlog >60s is a breach."
  
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
  evaluation_periods  = 1
  metric_name         = "UnresolvedOverbookings"
  namespace           = "Custom/Booking"  # Custom metric namespace
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This alarm monitors unresolved overbookings. SLA: Unresolved overbooking after 2 minutes is a breach."
  
  # This metric would be published by the overbooking_resolver Lambda
  # when it cannot automatically resolve a conflict
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-unresolved-overbookings"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

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

output "elasticache_primary_endpoint" {
  description = "Primary endpoint address of ElastiCache replication group"
  value       = aws_elasticache_replication_group.booking_cache.primary_endpoint_address
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint of Aurora database"
  value       = aws_rds_cluster.audit_db.reader_endpoint
}
```