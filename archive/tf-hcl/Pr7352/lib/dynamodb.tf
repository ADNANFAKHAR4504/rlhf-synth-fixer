# dynamodb.tf - DynamoDB Tables for Session State Management

# DynamoDB Table for Session State
resource "aws_dynamodb_table" "session_state" {
  name         = "session-state-${var.environment_suffix}"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "SessionId"
  range_key    = "Timestamp"

  attribute {
    name = "SessionId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }

  attribute {
    name = "UserId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "UserId"
    range_key       = "Timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ExpirationTime"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name = "session-state-${var.environment_suffix}"
  }
}

# DynamoDB Table for Migration State Tracking
resource "aws_dynamodb_table" "migration_state" {
  name         = "migration-state-${var.environment_suffix}"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "MigrationId"
  range_key    = "TableName"

  attribute {
    name = "MigrationId"
    type = "S"
  }

  attribute {
    name = "TableName"
    type = "S"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    range_key       = "TableName"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name = "migration-state-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for DynamoDB Read Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttles" {
  alarm_name          = "dynamodb-read-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors DynamoDB read throttles"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.session_state.name
  }

  tags = {
    Name = "dynamodb-read-throttles-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for DynamoDB Write Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttles" {
  alarm_name          = "dynamodb-write-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors DynamoDB write throttles"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.session_state.name
  }

  tags = {
    Name = "dynamodb-write-throttles-alarm-${var.environment_suffix}"
  }
}
