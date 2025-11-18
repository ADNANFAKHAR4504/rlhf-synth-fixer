# CloudWatch Log Group for Terraform Validate
resource "aws_cloudwatch_log_group" "terraform_validate" {
  name              = "/aws/codebuild/terraform-validate-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-validate-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Terraform Plan
resource "aws_cloudwatch_log_group" "terraform_plan" {
  name              = "/aws/codebuild/terraform-plan-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-plan-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Terraform Apply
resource "aws_cloudwatch_log_group" "terraform_apply" {
  name              = "/aws/codebuild/terraform-apply-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-apply-logs-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Pipeline Failures (optional)
resource "aws_cloudwatch_metric_alarm" "pipeline_failed" {
  count               = var.enable_pipeline_alarms ? 1 : 0
  alarm_name          = "pipeline-failed-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "PipelineExecutionFailure"
  namespace           = "AWS/CodePipeline"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when pipeline execution fails"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.terraform_pipeline.name
  }

  tags = {
    Name = "pipeline-failed-alarm-${var.environment_suffix}"
  }
}
