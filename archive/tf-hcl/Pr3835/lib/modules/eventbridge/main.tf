# EventBridge Module - Health Monitoring Rules

resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "${var.name_prefix}-health-check"
  description         = "Trigger failover automation on health check failures"
  schedule_expression = var.schedule_expression

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-health-check-rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "lambda_failover" {
  rule      = aws_cloudwatch_event_rule.health_check.name
  target_id = "FailoverLambdaTarget"
  arn       = var.lambda_function_arn
}

