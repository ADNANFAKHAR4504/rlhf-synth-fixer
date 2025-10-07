resource "aws_cloudwatch_event_bus" "webhook_events" {
  name = "${local.resource_prefix}-webhook-events"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_rule" "webhook_processed" {
  name           = "${local.resource_prefix}-webhook-processed"
  description    = "Capture all processed webhook events"
  event_bus_name = aws_cloudwatch_event_bus.webhook_events.name

  event_pattern = jsonencode({
    source      = ["webhook.processor"]
    detail-type = ["Webhook Processed"]
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_archive" "webhook_events" {
  name             = "${local.resource_prefix}-webhook-archive"
  event_source_arn = aws_cloudwatch_event_bus.webhook_events.arn
  retention_days   = 7

  description = "Archive for webhook events"
}