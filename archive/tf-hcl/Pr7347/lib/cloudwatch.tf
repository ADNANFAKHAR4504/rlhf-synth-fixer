# cloudwatch.tf - CloudWatch dashboards and alarms

# Custom CloudWatch namespace for metrics (Constraint #5)

# Child alarm #1: High error rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "PaymentTransactions/${var.environment_suffix}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggers when error rate exceeds threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }
}

# Child alarm #2: High latency
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "high-latency-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 5000 # 5 seconds
  alarm_description   = "Triggers when Lambda duration exceeds 5 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }
}

# Child alarm #3: High throttle rate
resource "aws_cloudwatch_metric_alarm" "high_throttles" {
  alarm_name          = "high-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Triggers when Lambda throttles exceed threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }
}

# Child alarm #4: Kinesis iterator age
resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "kinesis-iterator-age-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = 60
  statistic           = "Maximum"
  threshold           = 60000 # 60 seconds
  alarm_description   = "Triggers when Kinesis iterator age exceeds 60 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    StreamName = aws_kinesis_stream.transactions.name
  }
}

# Composite alarm #1: Processing health (Constraint #1)
resource "aws_cloudwatch_composite_alarm" "processing_health" {
  alarm_name        = "processing-health-composite-${var.environment_suffix}"
  alarm_description = "Composite alarm for overall processing health"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alarms.arn]
  ok_actions        = [aws_sns_topic.alarms.arn]

  # Combines error rate AND latency
  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.high_error_rate.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.high_latency.alarm_name})"
}

# Composite alarm #2: System capacity (Constraint #1)
resource "aws_cloudwatch_composite_alarm" "system_capacity" {
  alarm_name        = "system-capacity-composite-${var.environment_suffix}"
  alarm_description = "Composite alarm for system capacity issues"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alarms.arn]
  ok_actions        = [aws_sns_topic.alarms.arn]

  # Combines throttles AND iterator age
  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.high_throttles.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.kinesis_iterator_age.alarm_name})"
}

# CloudWatch Dashboard with 10 custom widgets
resource "aws_cloudwatch_dashboard" "observability" {
  dashboard_name = "payment-transactions-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: Transaction Volume
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentTransactions/${var.environment_suffix}", "TransactionCount", { stat = "Sum" }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Transaction Volume"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Widget 2: Error Rate
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentTransactions/${var.environment_suffix}", "Errors", { stat = "Sum", color = "#d62728" }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Error Rate"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Widget 3: Lambda Duration
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", dimensions = { FunctionName = aws_lambda_function.processor.function_name } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Processing Duration"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Widget 4: Lambda Invocations
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.processor.function_name } }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Invocations"
        }
      },
      # Widget 5: Lambda Errors
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.processor.function_name }, color = "#d62728" }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Errors"
        }
      },
      # Widget 6: Lambda Throttles
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Throttles", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.processor.function_name }, color = "#ff7f0e" }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Throttles"
        }
      },
      # Widget 7: Kinesis Incoming Records
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Kinesis", "IncomingRecords", { stat = "Sum", dimensions = { StreamName = aws_kinesis_stream.transactions.name } }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Kinesis Incoming Records"
        }
      },
      # Widget 8: Kinesis Iterator Age
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Kinesis", "IteratorAgeMilliseconds", { stat = "Maximum", dimensions = { StreamName = aws_kinesis_stream.transactions.name } }]
          ]
          period = 60
          stat   = "Maximum"
          region = var.aws_region
          title  = "Kinesis Iterator Age"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Widget 9: DLQ Message Count
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", dimensions = { QueueName = aws_sqs_queue.dlq.name } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Dead Letter Queue Messages"
        }
      },
      # Widget 10: Composite Alarm Status
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudWatch", "CompositeAlarmState", { stat = "Maximum", dimensions = { AlarmName = aws_cloudwatch_composite_alarm.processing_health.alarm_name } }],
            ["...", { stat = "Maximum", dimensions = { AlarmName = aws_cloudwatch_composite_alarm.system_capacity.alarm_name } }]
          ]
          period = 60
          stat   = "Maximum"
          region = var.aws_region
          title  = "Composite Alarm Status"
        }
      }
    ]
  })
}
