# CloudWatch Log Groups for CodeBuild projects
resource "aws_cloudwatch_log_group" "validate_logs" {
  name              = "/aws/codebuild/validate-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "validate-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "validate"
  }
}

resource "aws_cloudwatch_log_group" "plan_logs" {
  name              = "/aws/codebuild/plan-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "plan-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "plan"
  }
}

resource "aws_cloudwatch_log_group" "apply_logs" {
  name              = "/aws/codebuild/apply-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "apply-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "apply"
  }
}

# CloudWatch Event Rule for pipeline failures
resource "aws_cloudwatch_event_rule" "pipeline_failure" {
  name        = "pipeline-failure-${var.environment_suffix}"
  description = "Trigger on pipeline execution failures"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      state    = ["FAILED"]
      pipeline = [aws_codepipeline.terraform_pipeline.name]
    }
  })

  tags = {
    Name        = "pipeline-failure-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "pipeline_failure_sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_failure.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}
