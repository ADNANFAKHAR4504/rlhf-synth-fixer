# modules/monitoring/main.tf - CloudWatch Monitoring and Alerting Module

# ================================
# SNS TOPIC - Alerts and Notifications
# ================================

resource "aws_sns_topic" "payment_alerts" {
  name = var.sns_alerts_topic_name

  # Server-side encryption
  kms_master_key_id = "alias/aws/sns"

  tags = merge(var.common_tags, {
    Name    = var.sns_alerts_topic_name
    Purpose = "Payment processing alerts and notifications"
    Service = "SNS"
  })
}

# ================================
# CLOUDWATCH ALARMS - Queue Monitoring
# ================================

# CloudWatch Alarm for Transaction Validation Queue Depth
resource "aws_cloudwatch_metric_alarm" "validation_queue_depth" {
  alarm_name          = "${var.name_prefix}-validation-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for transaction validation"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.validation_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-validation-queue-depth-alarm"
    Purpose = "Monitor transaction validation queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Fraud Detection Queue Depth
resource "aws_cloudwatch_metric_alarm" "fraud_queue_depth" {
  alarm_name          = "${var.name_prefix}-fraud-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for fraud detection"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.fraud_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-fraud-queue-depth-alarm"
    Purpose = "Monitor fraud detection queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Payment Notification Queue Depth
resource "aws_cloudwatch_metric_alarm" "notification_queue_depth" {
  alarm_name          = "${var.name_prefix}-notification-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for payment notifications"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.notification_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-notification-queue-depth-alarm"
    Purpose = "Monitor payment notification queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Transaction Validation DLQ Messages
resource "aws_cloudwatch_metric_alarm" "validation_dlq_messages" {
  alarm_name          = "${var.name_prefix}-validation-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for transaction validation"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.validation_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-validation-dlq-messages-alarm"
    Purpose = "Monitor transaction validation DLQ messages"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Fraud Detection DLQ Messages
resource "aws_cloudwatch_metric_alarm" "fraud_dlq_messages" {
  alarm_name          = "${var.name_prefix}-fraud-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for fraud detection"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.fraud_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-fraud-dlq-messages-alarm"
    Purpose = "Monitor fraud detection DLQ messages"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Payment Notification DLQ Messages
resource "aws_cloudwatch_metric_alarm" "notification_dlq_messages" {
  alarm_name          = "${var.name_prefix}-notification-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for payment notifications"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.notification_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-notification-dlq-messages-alarm"
    Purpose = "Monitor payment notification DLQ messages"
    Service = "CloudWatch"
  })
}

# ================================
# CLOUDWATCH LOG GROUPS - Lambda Function Logs
# ================================

# Log Group for Transaction Validation Lambda
resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = var.log_group_validation
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_validation
    Purpose = "Log group for transaction validation Lambda"
    Service = "CloudWatch"
  })
}

# Log Group for Fraud Detection Lambda
resource "aws_cloudwatch_log_group" "fraud_lambda" {
  name              = var.log_group_fraud
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_fraud
    Purpose = "Log group for fraud detection Lambda"
    Service = "CloudWatch"
  })
}

# Log Group for Payment Notification Lambda
resource "aws_cloudwatch_log_group" "notification_lambda" {
  name              = var.log_group_notification
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_notification
    Purpose = "Log group for payment notification Lambda"
    Service = "CloudWatch"
  })
}

# ================================
# CLOUDWATCH DASHBOARD - Payment Processing Overview
# ================================

resource "aws_cloudwatch_dashboard" "payment_processing" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfVisibleMessages", "QueueName", var.validation_queue_name],
            [".", ".", ".", var.fraud_queue_name],
            [".", ".", ".", var.notification_queue_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Queue Depths"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfVisibleMessages", "QueueName", var.validation_dlq_name],
            [".", ".", ".", var.fraud_dlq_name],
            [".", ".", ".", var.notification_dlq_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Dead Letter Queue Messages"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.validation_queue_name],
            [".", ".", ".", var.fraud_queue_name],
            [".", ".", ".", var.notification_queue_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Messages Sent"
          period  = 300
        }
      }
    ]
  })
}