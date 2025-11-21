# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alarms" {
  name         = "transaction-processing-alarms-${var.environment}"
  display_name = "Financial Transaction Processing Alarms"

  tags = {
    Name = "transaction-processing-alarms-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "ops_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.ops_email
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    sid    = "AllowCloudWatchToPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = [
      "SNS:Publish"
    ]

    resources = [aws_sns_topic.alarms.arn]
  }
}

resource "aws_sns_topic_policy" "alarms" {
  arn    = aws_sns_topic.alarms.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

# Dead Letter Queues (created first)
resource "aws_sqs_queue" "transaction_validation_dlq" {
  name                        = "transaction-validation-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  tags = {
    Name = "transaction-validation.dlq.fifo"
    Type = "DLQ"
  }
}

resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                        = "fraud-detection-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  tags = {
    Name = "fraud-detection.dlq.fifo"
    Type = "DLQ"
  }
}

resource "aws_sqs_queue" "notification_dispatch_dlq" {
  name                        = "notification-dispatch-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  tags = {
    Name = "notification-dispatch.dlq.fifo"
    Type = "DLQ"
  }
}

# Main Queues with Redrive Policies
resource "aws_sqs_queue" "transaction_validation" {
  name                        = "transaction-validation.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transaction_validation_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "transaction-validation.fifo"
    Type = "Main"
  }

  depends_on = [aws_sqs_queue.transaction_validation_dlq]
}

resource "aws_sqs_queue" "fraud_detection" {
  name                        = "fraud-detection.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fraud_detection_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "fraud-detection.fifo"
    Type = "Main"
  }

  depends_on = [aws_sqs_queue.fraud_detection_dlq]
}

resource "aws_sqs_queue" "notification_dispatch" {
  name                        = "notification-dispatch.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"
  message_retention_seconds   = 604800
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  receive_wait_time_seconds   = 20
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dispatch_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "notification-dispatch.fifo"
    Type = "Main"
  }

  depends_on = [aws_sqs_queue.notification_dispatch_dlq]
}

# Queue Access Policies
data "aws_iam_policy_document" "transaction_validation_queue_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.transaction_validation.arn]
  }
}

resource "aws_sqs_queue_policy" "transaction_validation" {
  queue_url = aws_sqs_queue.transaction_validation.id
  policy    = data.aws_iam_policy_document.transaction_validation_queue_policy.json
}

data "aws_iam_policy_document" "fraud_detection_queue_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.fraud_detection.arn]
  }
}

resource "aws_sqs_queue_policy" "fraud_detection" {
  queue_url = aws_sqs_queue.fraud_detection.id
  policy    = data.aws_iam_policy_document.fraud_detection_queue_policy.json
}

data "aws_iam_policy_document" "notification_dispatch_queue_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.notification_dispatch.arn]
  }
}

resource "aws_sqs_queue_policy" "notification_dispatch" {
  queue_url = aws_sqs_queue.notification_dispatch.id
  policy    = data.aws_iam_policy_document.notification_dispatch_queue_policy.json
}

# DLQ Access Policies
data "aws_iam_policy_document" "transaction_validation_dlq_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.transaction_validation_dlq.arn]
  }
}

resource "aws_sqs_queue_policy" "transaction_validation_dlq" {
  queue_url = aws_sqs_queue.transaction_validation_dlq.id
  policy    = data.aws_iam_policy_document.transaction_validation_dlq_policy.json
}

data "aws_iam_policy_document" "fraud_detection_dlq_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.fraud_detection_dlq.arn]
  }
}

resource "aws_sqs_queue_policy" "fraud_detection_dlq" {
  queue_url = aws_sqs_queue.fraud_detection_dlq.id
  policy    = data.aws_iam_policy_document.fraud_detection_dlq_policy.json
}

data "aws_iam_policy_document" "notification_dispatch_dlq_policy" {
  statement {
    sid    = "RestrictToSameAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage"
    ]

    resources = [aws_sqs_queue.notification_dispatch_dlq.arn]
  }
}

resource "aws_sqs_queue_policy" "notification_dispatch_dlq" {
  queue_url = aws_sqs_queue.notification_dispatch_dlq.id
  policy    = data.aws_iam_policy_document.notification_dispatch_dlq_policy.json
}

# IAM Role for Lambda
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_sqs_processor" {
  name               = "lambda-sqs-processor-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name = "lambda-sqs-processor-${var.environment}"
  }
}

# IAM Policy for SQS Access
data "aws_iam_policy_document" "sqs_message_processing" {
  statement {
    sid    = "SQSQueueAccess"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:SendMessage",
      "sqs:DeleteMessageBatch",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]

    resources = [
      aws_sqs_queue.transaction_validation.arn,
      aws_sqs_queue.fraud_detection.arn,
      aws_sqs_queue.notification_dispatch.arn,
      aws_sqs_queue.transaction_validation_dlq.arn,
      aws_sqs_queue.fraud_detection_dlq.arn,
      aws_sqs_queue.notification_dispatch_dlq.arn
    ]
  }

  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
    ]
  }
}

resource "aws_iam_policy" "sqs_message_processing" {
  name        = "sqs-message-processing-${var.environment}"
  description = "Policy for Lambda functions to process SQS messages"
  policy      = data.aws_iam_policy_document.sqs_message_processing.json

  tags = {
    Name = "sqs-message-processing-${var.environment}"
  }

  depends_on = [aws_iam_role.lambda_sqs_processor]
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_processing" {
  role       = aws_iam_role.lambda_sqs_processor.name
  policy_arn = aws_iam_policy.sqs_message_processing.arn

  depends_on = [
    aws_iam_role.lambda_sqs_processor,
    aws_iam_policy.sqs_message_processing
  ]
}

# CloudWatch Alarms for Main Queues
resource "aws_cloudwatch_metric_alarm" "transaction_validation_high_depth" {
  alarm_name          = "transaction-validation-high-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "Alert when transaction validation queue depth exceeds 10000 messages"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.transaction_validation.name
  }

  tags = {
    Name  = "transaction-validation-high-depth-alarm"
    Queue = "transaction-validation.fifo"
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detection_high_depth" {
  alarm_name          = "fraud-detection-high-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "Alert when fraud detection queue depth exceeds 10000 messages"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.fraud_detection.name
  }

  tags = {
    Name  = "fraud-detection-high-depth-alarm"
    Queue = "fraud-detection.fifo"
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_dispatch_high_depth" {
  alarm_name          = "notification-dispatch-high-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "Alert when notification dispatch queue depth exceeds 10000 messages"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.notification_dispatch.name
  }

  tags = {
    Name  = "notification-dispatch-high-depth-alarm"
    Queue = "notification-dispatch.fifo"
  }
}

# CloudWatch Alarms for DLQs
resource "aws_cloudwatch_metric_alarm" "transaction_validation_dlq_alarm" {
  alarm_name          = "transaction-validation-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in transaction validation DLQ"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.transaction_validation_dlq.name
  }

  tags = {
    Name  = "transaction-validation-dlq-alarm"
    Queue = "transaction-validation.dlq.fifo"
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detection_dlq_alarm" {
  alarm_name          = "fraud-detection-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in fraud detection DLQ"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.fraud_detection_dlq.name
  }

  tags = {
    Name  = "fraud-detection-dlq-alarm"
    Queue = "fraud-detection.dlq.fifo"
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_dispatch_dlq_alarm" {
  alarm_name          = "notification-dispatch-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in notification dispatch DLQ"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.notification_dispatch_dlq.name
  }

  tags = {
    Name  = "notification-dispatch-dlq-alarm"
    Queue = "notification-dispatch.dlq.fifo"
  }
}

# CloudWatch Dashboard
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "financial_transaction_processing" {
  dashboard_name = "financial-transaction-processing-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          title   = "Transaction Validation Queue"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.transaction_validation.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.transaction_validation.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          title   = "Transaction Validation DLQ"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.transaction_validation_dlq.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.transaction_validation_dlq.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          title   = "Fraud Detection Queue"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.fraud_detection.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.fraud_detection.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          title   = "Fraud Detection DLQ"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.fraud_detection_dlq.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.fraud_detection_dlq.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          title   = "Notification Dispatch Queue"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.notification_dispatch.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.notification_dispatch.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6

        properties = {
          title   = "Notification Dispatch DLQ"
          region  = data.aws_region.current.name
          view    = "timeSeries"
          stacked = false
          period  = 300
          start   = "-PT3H"
          end     = "P0D"
          yAxis = {
            left = {
              label = "Message Count"
            }
          }

          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.notification_dispatch_dlq.name, { stat = "Average", label = "Visible Messages" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.notification_dispatch_dlq.name, { stat = "Maximum", label = "Oldest Message Age (sec)", yAxis = "right" }]
          ]
        }
      }
    ]
  })
}

# Outputs
output "transaction_validation_queue_url" {
  description = "URL of the transaction validation FIFO queue"
  value       = aws_sqs_queue.transaction_validation.id
}

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation FIFO queue"
  value       = aws_sqs_queue.transaction_validation.arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection FIFO queue"
  value       = aws_sqs_queue.fraud_detection.id
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection FIFO queue"
  value       = aws_sqs_queue.fraud_detection.arn
}

output "notification_dispatch_queue_url" {
  description = "URL of the notification dispatch FIFO queue"
  value       = aws_sqs_queue.notification_dispatch.id
}

output "notification_dispatch_queue_arn" {
  description = "ARN of the notification dispatch FIFO queue"
  value       = aws_sqs_queue.notification_dispatch.arn
}

output "transaction_validation_dlq_url" {
  description = "URL of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.id
}

output "transaction_validation_dlq_arn" {
  description = "ARN of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.arn
}

output "fraud_detection_dlq_url" {
  description = "URL of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.id
}

output "fraud_detection_dlq_arn" {
  description = "ARN of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.arn
}

output "notification_dispatch_dlq_url" {
  description = "URL of the notification dispatch dead letter queue"
  value       = aws_sqs_queue.notification_dispatch_dlq.id
}

output "notification_dispatch_dlq_arn" {
  description = "ARN of the notification dispatch dead letter queue"
  value       = aws_sqs_queue.notification_dispatch_dlq.arn
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role for SQS processing"
  value       = aws_iam_role.lambda_sqs_processor.arn
}

output "sqs_message_processing_policy_arn" {
  description = "ARN of the IAM policy for SQS message processing"
  value       = aws_iam_policy.sqs_message_processing.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarms.arn
}

output "transaction_validation_high_depth_alarm_arn" {
  description = "ARN of the CloudWatch alarm for transaction validation queue high depth"
  value       = aws_cloudwatch_metric_alarm.transaction_validation_high_depth.arn
}

output "fraud_detection_high_depth_alarm_arn" {
  description = "ARN of the CloudWatch alarm for fraud detection queue high depth"
  value       = aws_cloudwatch_metric_alarm.fraud_detection_high_depth.arn
}

output "notification_dispatch_high_depth_alarm_arn" {
  description = "ARN of the CloudWatch alarm for notification dispatch queue high depth"
  value       = aws_cloudwatch_metric_alarm.notification_dispatch_high_depth.arn
}

output "transaction_validation_dlq_alarm_arn" {
  description = "ARN of the CloudWatch alarm for transaction validation DLQ messages"
  value       = aws_cloudwatch_metric_alarm.transaction_validation_dlq_alarm.arn
}

output "fraud_detection_dlq_alarm_arn" {
  description = "ARN of the CloudWatch alarm for fraud detection DLQ messages"
  value       = aws_cloudwatch_metric_alarm.fraud_detection_dlq_alarm.arn
}

output "notification_dispatch_dlq_alarm_arn" {
  description = "ARN of the CloudWatch alarm for notification dispatch DLQ messages"
  value       = aws_cloudwatch_metric_alarm.notification_dispatch_dlq_alarm.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard for monitoring all queues"
  value       = aws_cloudwatch_dashboard.financial_transaction_processing.dashboard_name
}

output "aws_account_id" {
  description = "AWS account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}

output "deployment_region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "transaction_validation_queue_name" {
  description = "Name of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.name
}

output "fraud_detection_queue_name" {
  description = "Name of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.name
}

output "notification_dispatch_queue_name" {
  description = "Name of the notification dispatch queue"
  value       = aws_sqs_queue.notification_dispatch.name
}

output "transaction_validation_dlq_name" {
  description = "Name of the transaction validation DLQ"
  value       = aws_sqs_queue.transaction_validation_dlq.name
}

output "fraud_detection_dlq_name" {
  description = "Name of the fraud detection DLQ"
  value       = aws_sqs_queue.fraud_detection_dlq.name
}

output "notification_dispatch_dlq_name" {
  description = "Name of the notification dispatch DLQ"
  value       = aws_sqs_queue.notification_dispatch_dlq.name
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_sqs_processor.name
}

output "sqs_message_processing_policy_name" {
  description = "Name of the SQS message processing IAM policy"
  value       = aws_iam_policy.sqs_message_processing.name
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.name
}

output "sns_topic_subscription_arn" {
  description = "ARN of the SNS topic email subscription"
  value       = aws_sns_topic_subscription.ops_email.arn
}

output "environment" {
  description = "Environment name used for resource tagging"
  value       = var.environment
}

output "queue_message_retention_seconds" {
  description = "Message retention period for all queues in seconds"
  value       = 604800
}

output "queue_visibility_timeout_seconds" {
  description = "Visibility timeout for all queues in seconds"
  value       = 300
}