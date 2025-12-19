# CloudWatch Module - Log Groups and Alarms

# Lambda Log Group
resource "aws_cloudwatch_log_group" "lambda_failover" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.lambda_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-failover-logs"
    }
  )
}

# Application Log Group
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.name_prefix}"
  retention_in_days = var.application_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-application-logs"
    }
  )
}

# Lambda Error Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function has errors"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-lambda-errors-alarm"
      Severity = "high"
    }
  )
}

# S3 Bucket Errors Alarm
resource "aws_cloudwatch_metric_alarm" "s3_bucket_errors" {
  alarm_name          = "${var.name_prefix}-s3-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert on S3 bucket access errors"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    BucketName = var.primary_bucket_name
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-s3-errors-alarm"
      Severity = "medium"
    }
  )
}

# Lambda Duration Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.name_prefix}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 250000
  alarm_description   = "Alert when Lambda execution duration exceeds threshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-lambda-duration-alarm"
      Severity = "low"
    }
  )
}

# Lambda Throttles Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${var.name_prefix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when Lambda function is throttled"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-lambda-throttles-alarm"
      Severity = "medium"
    }
  )
}

# ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "${var.name_prefix}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when ALB has unhealthy targets"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    TargetGroup  = split(":", var.alb_target_group_arn)[5]
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-alb-unhealthy-targets-alarm"
      Severity = "high"
    }
  )
}

# ALB Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Alert when ALB response time exceeds threshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-alb-response-time-alarm"
      Severity = "medium"
    }
  )
}

