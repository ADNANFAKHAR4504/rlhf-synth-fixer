resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  name        = "${var.environment_suffix}-${var.project_name}-pipeline-state-change"
  description = "Capture pipeline state changes"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.main_pipeline.name]
      state    = ["FAILED", "SUCCEEDED"]
    }
  })

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-pipeline-state-change"
    Environment = var.environment_suffix
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  input_transformer {
    input_paths = {
      pipeline = "$.detail.pipeline"
      state    = "$.detail.state"
      region   = "$.detail.region"
      time     = "$.time"
    }
    input_template = "\"Pipeline <pipeline> has <state> at <time> in region <region>.\""
  }
}