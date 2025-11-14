# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Archive for Lambda function code
data "archive_file" "lambda_code" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/.terraform/lambda_function.zip"
}

# ==================== IAM Roles and Policies ====================

# Ingestion Lambda Role
resource "aws_iam_role" "lambda_ingestion" {
  name = "role-lambda-ingestion-${var.environment}"

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

  tags = {
    FunctionType = "ingestion"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_ingestion_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_ingestion.name
}

resource "aws_iam_role_policy" "lambda_ingestion_custom" {
  name = "policy-lambda-ingestion-custom-${var.environment}"
  role = aws_iam_role.lambda_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          aws_dynamodb_table.audit.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq_ingestion.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/market-data-processor/*"
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

# Processing Lambda Role
resource "aws_iam_role" "lambda_processing" {
  name = "role-lambda-processing-${var.environment}"

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

  tags = {
    FunctionType = "processing"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_processing_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_processing.name
}

resource "aws_iam_role_policy" "lambda_processing_custom" {
  name = "policy-lambda-processing-custom-${var.environment}"
  role = aws_iam_role.lambda_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:PutItem"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          "${aws_dynamodb_table.events.arn}/index/*",
          aws_dynamodb_table.audit.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq_processing.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/market-data-processor/*"
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

# Notification Lambda Role
resource "aws_iam_role" "lambda_notification" {
  name = "role-lambda-notification-${var.environment}"

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

  tags = {
    FunctionType = "notification"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_notification_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_notification.name
}

resource "aws_iam_role_policy" "lambda_notification_custom" {
  name = "policy-lambda-notification-custom-${var.environment}"
  role = aws_iam_role.lambda_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:PutItem"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          "${aws_dynamodb_table.events.arn}/index/*",
          aws_dynamodb_table.audit.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.critical_events.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq_notification.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/market-data-processor/*"
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

# ==================== DynamoDB Tables ====================

resource "aws_dynamodb_table" "events" {
  name         = "dynamodb-events-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "timestamp"

  deletion_protection_enabled = false

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "event_type"
    type = "S"
  }

  global_secondary_index {
    name            = "event_type_timestamp_index"
    hash_key        = "event_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    TableType = "events"
  }
}

resource "aws_dynamodb_table" "audit" {
  name         = "dynamodb-audit-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "audit_id"
  range_key    = "timestamp"

  deletion_protection_enabled = false

  attribute {
    name = "audit_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    TableType = "audit"
  }
}

# ==================== SQS Dead Letter Queues ====================

resource "aws_sqs_queue" "dlq_ingestion" {
  name                       = "sqs-dlq-ingestion-${var.environment}"
  message_retention_seconds  = var.dlq_message_retention_days * 24 * 60 * 60
  visibility_timeout_seconds = var.lambda_timeout_seconds

  tags = {
    QueueType = "dlq"
    Function  = "ingestion"
  }
}

resource "aws_sqs_queue" "dlq_processing" {
  name                       = "sqs-dlq-processing-${var.environment}"
  message_retention_seconds  = var.dlq_message_retention_days * 24 * 60 * 60
  visibility_timeout_seconds = var.lambda_timeout_seconds

  tags = {
    QueueType = "dlq"
    Function  = "processing"
  }
}

resource "aws_sqs_queue" "dlq_notification" {
  name                       = "sqs-dlq-notification-${var.environment}"
  message_retention_seconds  = var.dlq_message_retention_days * 24 * 60 * 60
  visibility_timeout_seconds = var.lambda_timeout_seconds

  tags = {
    QueueType = "dlq"
    Function  = "notification"
  }
}

# ==================== SNS Topic ====================

resource "aws_sns_topic" "critical_events" {
  name = "sns-critical-events-${var.environment}"

  tags = {
    TopicType = "alerts"
  }
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.critical_events.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ==================== SSM Parameters ====================

resource "aws_ssm_parameter" "events_table_name" {
  name  = "/market-data-processor/dynamodb/events-table"
  type  = "String"
  value = aws_dynamodb_table.events.name

  tags = {
    ConfigType = "table"
  }
}

resource "aws_ssm_parameter" "audit_table_name" {
  name  = "/market-data-processor/dynamodb/audit-table"
  type  = "String"
  value = aws_dynamodb_table.audit.name

  tags = {
    ConfigType = "table"
  }
}

resource "aws_ssm_parameter" "sns_topic_arn" {
  name  = "/market-data-processor/sns/topic-arn"
  type  = "String"
  value = aws_sns_topic.critical_events.arn

  tags = {
    ConfigType = "topic"
  }
}

resource "aws_ssm_parameter" "event_bus_name" {
  name  = "/market-data-processor/eventbridge/bus-name"
  type  = "String"
  value = aws_cloudwatch_event_bus.market_data.name

  tags = {
    ConfigType = "eventbridge"
  }
}

# ==================== EventBridge ====================

resource "aws_cloudwatch_event_bus" "market_data" {
  name = "eventbridge-market-data-${var.environment}"

  tags = {
    BusType = "custom"
  }
}

resource "aws_cloudwatch_event_rule" "ingestion" {
  name           = "rule-ingestion-${var.environment}"
  description    = "Route raw market data events to ingestion Lambda"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name

  event_pattern = jsonencode({
    detail-type = ["MarketData.Raw"]
  })

  tags = {
    RuleType = "ingestion"
  }
}

resource "aws_cloudwatch_event_rule" "processing" {
  name           = "rule-processing-${var.environment}"
  description    = "Route validated events to processing Lambda"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name

  event_pattern = jsonencode({
    detail-type = ["MarketData.Validated"]
  })

  tags = {
    RuleType = "processing"
  }
}

resource "aws_cloudwatch_event_rule" "notification" {
  name           = "rule-notification-${var.environment}"
  description    = "Route alert events to notification Lambda"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name

  event_pattern = jsonencode({
    detail-type = ["MarketData.Alert"]
  })

  tags = {
    RuleType = "notification"
  }
}

resource "aws_cloudwatch_event_target" "ingestion" {
  rule           = aws_cloudwatch_event_rule.ingestion.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "lambda-ingestion"
  arn            = aws_lambda_function.ingestion.arn
}

resource "aws_cloudwatch_event_target" "processing" {
  rule           = aws_cloudwatch_event_rule.processing.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "lambda-processing"
  arn            = aws_lambda_function.processing.arn
}

resource "aws_cloudwatch_event_target" "notification" {
  rule           = aws_cloudwatch_event_rule.notification.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "lambda-notification"
  arn            = aws_lambda_function.notification.arn
}

# ==================== Lambda Functions ====================

resource "aws_lambda_function" "ingestion" {
  function_name = "lambda-ingestion-${var.environment}"
  role          = aws_iam_role.lambda_ingestion.arn
  handler       = "lambda_function.ingestion_handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = data.aws_region.current.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_ingestion.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_ingestion_basic,
    aws_iam_role_policy.lambda_ingestion_custom
  ]

  tags = {
    FunctionType = "ingestion"
  }
}


resource "aws_lambda_function" "processing" {
  function_name = "lambda-processing-${var.environment}"
  role          = aws_iam_role.lambda_processing.arn
  handler       = "lambda_function.processing_handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = data.aws_region.current.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_processing.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_processing_basic,
    aws_iam_role_policy.lambda_processing_custom
  ]

  tags = {
    FunctionType = "processing"
  }
}


resource "aws_lambda_function" "notification" {
  function_name = "lambda-notification-${var.environment}"
  role          = aws_iam_role.lambda_notification.arn
  handler       = "lambda_function.notification_handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = data.aws_region.current.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_notification.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_notification_basic,
    aws_iam_role_policy.lambda_notification_custom
  ]

  tags = {
    FunctionType = "notification"
  }
}


# Lambda Permissions for EventBridge
resource "aws_lambda_permission" "allow_eventbridge_ingestion" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestion.arn
}

resource "aws_lambda_permission" "allow_eventbridge_processing" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.processing.arn
}

resource "aws_lambda_permission" "allow_eventbridge_notification" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.notification.arn
}

# ==================== CloudWatch Log Groups ====================

resource "aws_cloudwatch_log_group" "lambda_ingestion" {
  name              = "/aws/lambda/${aws_lambda_function.ingestion.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    LogType  = "lambda"
    Function = "ingestion"
  }
}

resource "aws_cloudwatch_log_group" "lambda_processing" {
  name              = "/aws/lambda/${aws_lambda_function.processing.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    LogType  = "lambda"
    Function = "processing"
  }
}

resource "aws_cloudwatch_log_group" "lambda_notification" {
  name              = "/aws/lambda/${aws_lambda_function.notification.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    LogType  = "lambda"
    Function = "notification"
  }
}

# ==================== CloudWatch Alarms ====================

resource "aws_cloudwatch_metric_alarm" "lambda_ingestion_errors" {
  alarm_name          = "alarm-lambda-ingestion-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when ingestion Lambda has errors"

  dimensions = {
    FunctionName = aws_lambda_function.ingestion.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_processing_errors" {
  alarm_name          = "alarm-lambda-processing-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when processing Lambda has errors"

  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_notification_errors" {
  alarm_name          = "alarm-lambda-notification-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when notification Lambda has errors"

  dimensions = {
    FunctionName = aws_lambda_function.notification.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_ingestion_throttles" {
  alarm_name          = "alarm-lambda-ingestion-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when ingestion Lambda is throttled"

  dimensions = {
    FunctionName = aws_lambda_function.ingestion.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-throttles"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_processing_throttles" {
  alarm_name          = "alarm-lambda-processing-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when processing Lambda is throttled"

  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-throttles"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_notification_throttles" {
  alarm_name          = "alarm-lambda-notification-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when notification Lambda is throttled"

  dimensions = {
    FunctionName = aws_lambda_function.notification.function_name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "lambda-throttles"
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_events_read_capacity" {
  alarm_name          = "alarm-dynamodb-events-read-capacity-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "Monitors DynamoDB events table read capacity"

  dimensions = {
    TableName = aws_dynamodb_table.events.name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "dynamodb-capacity"
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_events_write_capacity" {
  alarm_name          = "alarm-dynamodb-events-write-capacity-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "Monitors DynamoDB events table write capacity"

  dimensions = {
    TableName = aws_dynamodb_table.events.name
  }

  alarm_actions = [aws_sns_topic.critical_events.arn]

  tags = {
    AlarmType = "dynamodb-capacity"
  }
}

# ==================== EventBridge Archive ====================

resource "aws_cloudwatch_event_archive" "market_data" {
  name             = "archive-market-data-${var.environment}"
  event_source_arn = aws_cloudwatch_event_bus.market_data.arn
  retention_days   = var.archive_retention_days
  description      = "Archive all market data events for compliance and replay"

  event_pattern = jsonencode({
    account = [data.aws_caller_identity.current.account_id]
  })
}

# ==================== Outputs ====================

# Lambda Outputs
output "lambda_ingestion_name" {
  description = "Name of the ingestion Lambda function"
  value       = aws_lambda_function.ingestion.function_name
}

output "lambda_ingestion_arn" {
  description = "ARN of the ingestion Lambda function"
  value       = aws_lambda_function.ingestion.arn
}

output "lambda_ingestion_role_arn" {
  description = "ARN of the ingestion Lambda execution role"
  value       = aws_iam_role.lambda_ingestion.arn
}

output "lambda_processing_name" {
  description = "Name of the processing Lambda function"
  value       = aws_lambda_function.processing.function_name
}

output "lambda_processing_arn" {
  description = "ARN of the processing Lambda function"
  value       = aws_lambda_function.processing.arn
}

output "lambda_processing_role_arn" {
  description = "ARN of the processing Lambda execution role"
  value       = aws_iam_role.lambda_processing.arn
}

output "lambda_notification_name" {
  description = "Name of the notification Lambda function"
  value       = aws_lambda_function.notification.function_name
}

output "lambda_notification_arn" {
  description = "ARN of the notification Lambda function"
  value       = aws_lambda_function.notification.arn
}

output "lambda_notification_role_arn" {
  description = "ARN of the notification Lambda execution role"
  value       = aws_iam_role.lambda_notification.arn
}

# EventBridge Outputs
output "eventbridge_bus_name" {
  description = "Name of the EventBridge custom event bus"
  value       = aws_cloudwatch_event_bus.market_data.name
}

output "eventbridge_bus_arn" {
  description = "ARN of the EventBridge custom event bus"
  value       = aws_cloudwatch_event_bus.market_data.arn
}

output "eventbridge_rule_names" {
  description = "List of EventBridge rule names"
  value = [
    aws_cloudwatch_event_rule.ingestion.name,
    aws_cloudwatch_event_rule.processing.name,
    aws_cloudwatch_event_rule.notification.name
  ]
}

output "eventbridge_archive_arn" {
  description = "ARN of the EventBridge archive"
  value       = aws_cloudwatch_event_archive.market_data.arn
}

# DynamoDB Outputs
output "dynamodb_events_table_name" {
  description = "Name of the DynamoDB events table"
  value       = aws_dynamodb_table.events.name
}

output "dynamodb_events_table_arn" {
  description = "ARN of the DynamoDB events table"
  value       = aws_dynamodb_table.events.arn
}

output "dynamodb_audit_table_name" {
  description = "Name of the DynamoDB audit table"
  value       = aws_dynamodb_table.audit.name
}

output "dynamodb_audit_table_arn" {
  description = "ARN of the DynamoDB audit table"
  value       = aws_dynamodb_table.audit.arn
}

# SQS Outputs
output "sqs_dlq_ingestion_url" {
  description = "URL of the ingestion dead letter queue"
  value       = aws_sqs_queue.dlq_ingestion.id
  sensitive   = true
}

output "sqs_dlq_ingestion_arn" {
  description = "ARN of the ingestion dead letter queue"
  value       = aws_sqs_queue.dlq_ingestion.arn
}

output "sqs_dlq_processing_url" {
  description = "URL of the processing dead letter queue"
  value       = aws_sqs_queue.dlq_processing.id
  sensitive   = true
}

output "sqs_dlq_processing_arn" {
  description = "ARN of the processing dead letter queue"
  value       = aws_sqs_queue.dlq_processing.arn
}

output "sqs_dlq_notification_url" {
  description = "URL of the notification dead letter queue"
  value       = aws_sqs_queue.dlq_notification.id
  sensitive   = true
}

output "sqs_dlq_notification_arn" {
  description = "ARN of the notification dead letter queue"
  value       = aws_sqs_queue.dlq_notification.arn
}

# SNS Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for critical events"
  value       = aws_sns_topic.critical_events.arn
  sensitive   = true
}

output "sns_topic_name" {
  description = "Name of the SNS topic for critical events"
  value       = aws_sns_topic.critical_events.name
}

# CloudWatch Outputs
output "cloudwatch_log_groups" {
  description = "List of CloudWatch log group names"
  value = [
    aws_cloudwatch_log_group.lambda_ingestion.name,
    aws_cloudwatch_log_group.lambda_processing.name,
    aws_cloudwatch_log_group.lambda_notification.name
  ]
}

output "cloudwatch_alarm_names" {
  description = "List of CloudWatch alarm names"
  value = [
    aws_cloudwatch_metric_alarm.lambda_ingestion_errors.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_processing_errors.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_notification_errors.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_ingestion_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_processing_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_notification_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_events_read_capacity.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_events_write_capacity.alarm_name
  ]
}

# SSM Outputs
output "ssm_parameter_names" {
  description = "List of SSM parameter names"
  value = [
    aws_ssm_parameter.events_table_name.name,
    aws_ssm_parameter.audit_table_name.name,
    aws_ssm_parameter.sns_topic_arn.name,
    aws_ssm_parameter.event_bus_name.name
  ]
}

# Metadata Outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Additional Configuration Outputs
output "lambda_memory_mb" {
  description = "Lambda memory configuration in MB"
  value       = var.lambda_memory_mb
}

output "lambda_timeout_seconds" {
  description = "Lambda timeout configuration in seconds"
  value       = var.lambda_timeout_seconds
}

output "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions per Lambda"
  value       = var.lambda_reserved_concurrent_executions
}

output "log_retention_days" {
  description = "CloudWatch log retention period in days"
  value       = var.log_retention_days
}

output "archive_retention_days" {
  description = "EventBridge archive retention period in days"
  value       = var.archive_retention_days
}

output "notification_email" {
  description = "Email address for notifications"
  value       = var.notification_email
}

output "deployment_timestamp" {
  description = "Timestamp of the deployment"
  value       = timestamp()
}