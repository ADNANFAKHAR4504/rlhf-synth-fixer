# EventBridge Rules for Migration Event Tracking (Optional Enhancement)

# EventBridge rule for S3 replication events
resource "aws_cloudwatch_event_rule" "s3_replication_events" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-s3-${var.environment_suffix}"
  description = "Track S3 replication events for migration"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutObject",
        "DeleteObject",
        "CopyObject"
      ]
      requestParameters = {
        bucketName = [aws_s3_bucket.source_documents.id]
      }
    }
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-s3-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge target for S3 events
resource "aws_cloudwatch_event_target" "s3_replication_lambda" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  rule     = aws_cloudwatch_event_rule.s3_replication_events[0].name
  arn      = aws_lambda_function.data_sync.arn
}

# Lambda permission for EventBridge S3 events
resource "aws_lambda_permission" "eventbridge_s3_invoke" {
  count         = var.enable_eventbridge ? 1 : 0
  provider      = aws.source
  statement_id  = "AllowEventBridgeS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_replication_events[0].arn
}

# EventBridge rule for DynamoDB stream events
resource "aws_cloudwatch_event_rule" "dynamodb_events" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-dynamodb-${var.environment_suffix}"
  description = "Track DynamoDB replication events for migration"

  event_pattern = jsonencode({
    source      = ["aws.dynamodb"]
    detail-type = ["DynamoDB Stream Record"]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-dynamodb-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge rule for migration phase changes
resource "aws_cloudwatch_event_rule" "migration_phase_change" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-phase-${var.environment_suffix}"
  description = "Track migration phase changes"

  event_pattern = jsonencode({
    source      = ["custom.migration"]
    detail-type = ["Migration Phase Change"]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-phase-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge custom event bus for migration events
resource "aws_cloudwatch_event_bus" "migration" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-eventbus-migration-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbus-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge archive for compliance
resource "aws_cloudwatch_event_archive" "migration_events" {
  count            = var.enable_eventbridge ? 1 : 0
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-archive-events-${var.environment_suffix}"
  event_source_arn = aws_cloudwatch_event_bus.migration[0].arn
  retention_days   = 90

  description = "Archive migration events for compliance and audit"
}
