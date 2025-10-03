resource "aws_xray_sampling_rule" "api_sampling" {
  rule_name      = "${var.app_name}-api-sampling"
  priority       = 1000
  reservoir_size = 5
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_name   = aws_api_gateway_rest_api.api.name
  service_type   = "AWS::ApiGateway::Stage"
  resource_arn   = "*"
  version        = 1
}

# EventBridge
# eventbridge.tf
resource "aws_cloudwatch_event_bus" "notification_bus" {
  name = "${var.app_name}-notifications"
}

resource "aws_cloudwatch_event_rule" "search_events" {
  name        = "${var.app_name}-search-events"
  description = "Capture search events"
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name

  event_pattern = jsonencode({
    source      = ["${var.app_name}"],
    detail-type = ["SearchPerformed"]
  })
}

resource "aws_cloudwatch_event_target" "search_events_log" {
  rule      = aws_cloudwatch_event_rule.search_events.name
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name
  target_id = "SendToCloudWatch"
  arn       = aws_cloudwatch_log_group.event_logs.arn
}

resource "aws_cloudwatch_log_group" "event_logs" {
  name              = "/aws/events/${var.app_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-event-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_resource_policy" "eventbridge_log_policy" {
  policy_name = "${var.app_name}-eventbridge-log-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EventBridgeToCloudWatchLogs"
        Effect    = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action    = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource  = aws_cloudwatch_log_group.event_logs.arn
      }
    ]
  })
}