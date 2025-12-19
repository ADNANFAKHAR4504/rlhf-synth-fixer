# Anomaly Detector for Lambda Duration with customized bands
resource "aws_cloudwatch_metric_alarm" "lambda_duration_anomaly" {
  alarm_name          = "${local.name_prefix}-lambda-duration-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_detection"
  alarm_description   = "Detects anomalies in Lambda function duration"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "actual"
    return_data = true

    metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Average"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  metric_query {
    id          = "anomaly_detection"
    expression  = "ANOMALY_DETECTION_BAND(actual, 2)"
    label       = "Lambda Duration Anomaly (2 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-duration-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for Error Count with wider bands
resource "aws_cloudwatch_metric_alarm" "error_count_anomaly" {
  alarm_name          = "${local.name_prefix}-error-count-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_band"
  alarm_description   = "Detects anomalies in error count with 3 std dev bands"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "errors"
    return_data = true

    metric {
      metric_name = "ErrorCount"
      namespace   = "CustomMetrics/${local.name_prefix}"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id          = "anomaly_band"
    expression  = "ANOMALY_DETECTION_BAND(errors, 3)"
    label       = "Error Count Anomaly (3 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-error-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for Response Time
resource "aws_cloudwatch_metric_alarm" "response_time_anomaly" {
  alarm_name          = "${local.name_prefix}-response-time-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 3
  threshold_metric_id = "ad_threshold"
  alarm_description   = "Detects response time anomalies with tight bands (1.5 std dev)"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "response"
    return_data = true

    metric {
      metric_name = "ResponseTime"
      namespace   = "CustomMetrics/${local.name_prefix}"
      period      = 300
      stat        = "Average"
    }
  }

  metric_query {
    id          = "ad_threshold"
    expression  = "ANOMALY_DETECTION_BAND(response, 1.5)"
    label       = "Response Time Anomaly (1.5 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-response-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for ECS Memory Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_memory_anomaly" {
  alarm_name          = "${local.name_prefix}-ecs-memory-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "memory_band"
  alarm_description   = "Detects memory utilization anomalies in ECS cluster"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "memory"
    return_data = true

    metric {
      metric_name = "MemoryUtilization"
      namespace   = "AWS/ECS"
      period      = 300
      stat        = "Average"

      dimensions = {
        ClusterName = var.ecs_cluster_name
      }
    }
  }

  metric_query {
    id          = "memory_band"
    expression  = "ANOMALY_DETECTION_BAND(memory, 2)"
    label       = "Memory Anomaly Band"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ecs-memory-anomaly"
      Type = "AnomalyDetection"
    }
  )
}
