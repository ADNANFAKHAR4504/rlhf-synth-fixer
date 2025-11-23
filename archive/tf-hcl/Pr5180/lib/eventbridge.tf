# eventbridge.tf - EventBridge rules for scaling events

# EventBridge rule for Aurora scaling events
resource "aws_cloudwatch_event_rule" "aurora_scaling" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-scaling"
  description = "Capture Aurora Serverless scaling events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventCategories  = ["configuration change"]
      SourceIdentifier = [aws_rds_cluster.aurora_serverless.cluster_identifier]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-scaling-rule"
    }
  )
}

# EventBridge rule for Aurora failover events
resource "aws_cloudwatch_event_rule" "aurora_failover" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-failover"
  description = "Capture Aurora cluster failover events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventCategories  = ["failover"]
      SourceIdentifier = [aws_rds_cluster.aurora_serverless.cluster_identifier]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-failover-rule"
    }
  )
}

# EventBridge target for scaling notifications
resource "aws_cloudwatch_event_target" "aurora_scaling_sns" {
  rule      = aws_cloudwatch_event_rule.aurora_scaling.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.aurora_alerts.arn

  input_transformer {
    input_paths = {
      time      = "$.time"
      cluster   = "$.detail.SourceIdentifier"
      message   = "$.detail.Message"
      eventName = "$.detail.EventCategories[0]"
    }

    input_template = <<EOF
{
  "Environment": "${var.environment}",
  "Time": <time>,
  "Cluster": <cluster>,
  "Event": <eventName>,
  "Message": <message>,
  "Alert": "Aurora Serverless scaling event detected"
}
EOF
  }
}

# EventBridge target for failover notifications
resource "aws_cloudwatch_event_target" "aurora_failover_sns" {
  rule      = aws_cloudwatch_event_rule.aurora_failover.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.aurora_alerts.arn

  input_transformer {
    input_paths = {
      time    = "$.time"
      cluster = "$.detail.SourceIdentifier"
      message = "$.detail.Message"
    }

    input_template = <<EOF
{
  "Environment": "${var.environment}",
  "Time": <time>,
  "Cluster": <cluster>,
  "Event": "FAILOVER",
  "Message": <message>,
  "Alert": "Aurora cluster failover event - immediate attention required!"
}
EOF
  }
}

# Lambda function for custom event processing
resource "aws_lambda_function" "aurora_event_processor" {
  filename         = "${path.module}/lambda/aurora-events.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-aurora-events"
  role             = aws_iam_role.aurora_event_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/aurora-events.zip")
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      ENVIRONMENT   = var.environment
      SNS_TOPIC_ARN = aws_sns_topic.aurora_alerts.arn
      CLUSTER_ID    = aws_rds_cluster.aurora_serverless.cluster_identifier
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-processor"
    }
  )

  depends_on = [aws_iam_role_policy_attachment.aurora_event_lambda]
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.aurora_event_processor.function_name
  principal     = "events.amazonaws.com"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "aurora_event_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.aurora_event_processor.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.aurora.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-logs"
    }
  )
}