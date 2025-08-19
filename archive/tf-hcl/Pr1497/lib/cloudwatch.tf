resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.environment_suffix}-${var.project_name}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-codebuild-logs"
    Environment = var.environment_suffix
  })
}

resource "aws_cloudwatch_metric_alarm" "pipeline_failure" {
  alarm_name          = "${var.environment_suffix}-${var.project_name}-pipeline-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PipelineExecutionFailure"
  namespace           = "AWS/CodePipeline"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors pipeline failures"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.main_pipeline.name
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-pipeline-failure-alarm"
    Environment = var.environment_suffix
  })
}

resource "aws_cloudwatch_metric_alarm" "pipeline_success" {
  alarm_name          = "${var.environment_suffix}-${var.project_name}-pipeline-success"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PipelineExecutionSuccess"
  namespace           = "AWS/CodePipeline"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors pipeline successes"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.main_pipeline.name
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-pipeline-success-alarm"
    Environment = var.environment_suffix
  })
}