# Custom Event Bus
resource "aws_cloudwatch_event_bus" "main" {
  name = "${local.name_prefix}-event-bus"

  tags = local.common_tags
}

# Rule for Transaction Events
resource "aws_cloudwatch_event_rule" "transaction_events" {
  name           = "${local.name_prefix}-transaction-events"
  description    = "Route transaction events for processing"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.ingestion"]
    detail = {
      eventType = ["transaction"]
      payload = {
        amount = [{
          numeric = [">", 1000]
        }]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Payment Events
resource "aws_cloudwatch_event_rule" "payment_events" {
  name           = "${local.name_prefix}-payment-events"
  description    = "Route payment events for processing"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.ingestion"]
    detail = {
      eventType = ["payment"]
      payload = {
        status = ["pending", "completed"]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Processed Events
resource "aws_cloudwatch_event_rule" "processed_events" {
  name           = "${local.name_prefix}-processed-events"
  description    = "Route processed events for storage"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.processing"]
    detail = {
      status = ["processed"]
      metadata = {
        requiresStorage = [true]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Failed Events
resource "aws_cloudwatch_event_rule" "failed_events" {
  name           = "${local.name_prefix}-failed-events"
  description    = "Route failed events to DLQ"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.processing", "${var.project_name}.storage"]
    detail = {
      status = ["failed"]
    }
  })

  tags = local.common_tags
}

# Event Targets
resource "aws_cloudwatch_event_target" "transaction_to_processing" {
  rule           = aws_cloudwatch_event_rule.transaction_events.name
  target_id      = "TransactionProcessingTarget"
  arn            = aws_lambda_function.event_processing.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "payment_to_processing" {
  rule           = aws_cloudwatch_event_rule.payment_events.name
  target_id      = "PaymentProcessingTarget"
  arn            = aws_lambda_function.event_processing.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "processed_to_storage" {
  rule           = aws_cloudwatch_event_rule.processed_events.name
  target_id      = "ProcessedStorageTarget"
  arn            = aws_lambda_function.event_storage.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "failed_to_dlq" {
  rule           = aws_cloudwatch_event_rule.failed_events.name
  target_id      = "FailedDLQTarget"
  arn            = aws_sqs_queue.dlq.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

# Event Bus Permissions
resource "aws_cloudwatch_event_permission" "organization_access" {
  principal      = data.aws_caller_identity.current.account_id
  statement_id   = "AllowAccountPutEvents"
  action         = "events:PutEvents"
  event_bus_name = aws_cloudwatch_event_bus.main.name
}