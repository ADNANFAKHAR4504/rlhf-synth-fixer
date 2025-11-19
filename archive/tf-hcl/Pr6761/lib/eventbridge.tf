# EventBridge Rule for Pipeline State Changes
# Note: GitHub triggers pipeline automatically via CodeStar Connection
# This rule monitors pipeline state changes for notifications
resource "aws_cloudwatch_event_rule" "pipeline_trigger" {
  name        = "pipeline-state-monitor-${var.environment_suffix}"
  description = "Monitor CodePipeline state changes"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.terraform_pipeline.name]
    }
  })

  tags = {
    Name = "pipeline-state-monitor-${var.environment_suffix}"
  }
}

# EventBridge Target - Send pipeline state changes to SNS
resource "aws_cloudwatch_event_target" "pipeline" {
  rule      = aws_cloudwatch_event_rule.pipeline_trigger.name
  target_id = "SNSNotification"
  arn       = aws_sns_topic.pipeline_notifications.arn
}

# Note: EventBridge does not need IAM role for SNS target
# SNS topic policy already allows events.amazonaws.com to publish
