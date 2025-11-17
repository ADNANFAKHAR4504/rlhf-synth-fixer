# DynamoDB Global Tables for session state persistence

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# DynamoDB Table in Primary Region
resource "aws_dynamodb_table" "session_state" {
  provider = aws.primary

  name         = "session-state-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"
  range_key    = "timestamp"

  # Enable Point-in-Time Recovery
  point_in_time_recovery {
    enabled = true
  }

  # Enable Global Tables v2
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Session ID attribute
  attribute {
    name = "session_id"
    type = "S"
  }

  # Timestamp attribute
  attribute {
    name = "timestamp"
    type = "N"
  }

  # User ID for GSI
  attribute {
    name = "user_id"
    type = "S"
  }

  # TTL attribute for automatic session expiry
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  # Global Secondary Index for querying by user
  global_secondary_index {
    name            = "user-sessions-index"
    hash_key        = "user_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Encryption at rest
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.primary_kms_key_arn
  }

  # Enable global table replicas
  replica {
    region_name = var.secondary_region
    kms_key_arn = var.secondary_kms_key_arn
  }

  tags = {
    Name        = "dynamodb-session-state-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "GlobalTable"
  }

  lifecycle {
    ignore_changes = [replica]
  }
}

# Application State Table (for caching and temporary data)
resource "aws_dynamodb_table" "app_state" {
  provider = aws.primary

  name         = "app-state-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "state_key"
  range_key    = "version"

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "state_key"
    type = "S"
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "app_name"
    type = "S"
  }

  # TTL for cache expiry
  ttl {
    enabled        = true
    attribute_name = "expiry"
  }

  # GSI for app-specific queries
  global_secondary_index {
    name            = "app-state-index"
    hash_key        = "app_name"
    range_key       = "version"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.primary_kms_key_arn
  }

  replica {
    region_name = var.secondary_region
    kms_key_arn = var.secondary_kms_key_arn

  }

  tags = {
    Name        = "dynamodb-app-state-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "GlobalTable"
  }

  lifecycle {
    ignore_changes = [replica]
  }
}

# CloudWatch Alarms for DynamoDB
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider = aws.primary

  alarm_name          = "dynamodb-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB throttling detected"

  dimensions = {
    TableName = aws_dynamodb_table.session_state.name
  }

  alarm_actions = [var.sns_topic_arn]

  tags = {
    Name        = "alarm-dynamodb-throttles-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  provider = aws.primary

  alarm_name          = "dynamodb-system-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB system errors detected"

  dimensions = {
    TableName = aws_dynamodb_table.session_state.name
  }

  alarm_actions = [var.sns_topic_arn]

  tags = {
    Name        = "alarm-dynamodb-errors-${var.environment_suffix}"
    Environment = var.environment
  }
}

# IAM Policy for Lambda/Application access to DynamoDB
resource "aws_iam_policy" "dynamodb_access" {
  provider = aws.primary

  name_prefix = "dynamodb-access-${var.environment_suffix}-"
  description = "Policy for accessing DynamoDB global tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.session_state.arn,
          "${aws_dynamodb_table.session_state.arn}/index/*",
          aws_dynamodb_table.app_state.arn,
          "${aws_dynamodb_table.app_state.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive"
        ]
        Resource = [
          aws_dynamodb_table.session_state.arn,
          aws_dynamodb_table.app_state.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "policy-dynamodb-access-${var.environment_suffix}"
    Environment = var.environment
  }
}