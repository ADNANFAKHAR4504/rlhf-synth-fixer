# eventbridge.tf - EventBridge rules with content-based filtering

# EventBridge rule for high-value transactions (Constraint #6)
resource "aws_cloudwatch_event_rule" "high_value_transactions" {
  name        = "high-value-transactions-${var.environment_suffix}"
  description = "Routes high-value transactions to dedicated processing"

  # Content-based filtering pattern
  event_pattern = jsonencode({
    source      = ["custom.payment.transactions"]
    detail-type = ["Transaction Processed"]
    detail = {
      amount = [{ numeric = [">", 10000] }]
      status = ["SUCCESS"]
    }
  })

  tags = {
    Name = "high-value-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "high_value_sns" {
  rule      = aws_cloudwatch_event_rule.high_value_transactions.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alarms.arn
}

# EventBridge rule for failed transactions
resource "aws_cloudwatch_event_rule" "failed_transactions" {
  name        = "failed-transactions-${var.environment_suffix}"
  description = "Routes failed transactions for investigation"

  # Content-based filtering pattern
  event_pattern = jsonencode({
    source      = ["custom.payment.transactions"]
    detail-type = ["Transaction Processed"]
    detail = {
      status = ["FAILED", "ERROR"]
    }
  })

  tags = {
    Name = "failed-transactions-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "failed_sns" {
  rule      = aws_cloudwatch_event_rule.failed_transactions.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alarms.arn
}

# EventBridge rule for fraud detection patterns
resource "aws_cloudwatch_event_rule" "fraud_patterns" {
  name        = "fraud-patterns-${var.environment_suffix}"
  description = "Routes suspicious transaction patterns"

  # Content-based filtering with multiple conditions
  event_pattern = jsonencode({
    source      = ["custom.payment.transactions"]
    detail-type = ["Transaction Processed"]
    detail = {
      risk_score       = [{ numeric = [">", 80] }]
      merchant_country = [{ "anything-but" = ["US", "CA", "GB"] }]
    }
  })

  tags = {
    Name = "fraud-pattern-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "fraud_sns" {
  rule      = aws_cloudwatch_event_rule.fraud_patterns.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alarms.arn
}

# EventBridge rule for velocity checks
resource "aws_cloudwatch_event_rule" "velocity_checks" {
  name        = "velocity-checks-${var.environment_suffix}"
  description = "Routes transactions exceeding velocity thresholds"

  # Content-based filtering pattern
  event_pattern = jsonencode({
    source      = ["custom.payment.transactions"]
    detail-type = ["Transaction Processed"]
    detail = {
      velocity_flag     = ["HIGH"]
      transaction_count = [{ numeric = [">", 20] }]
    }
  })

  tags = {
    Name = "velocity-check-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "velocity_sns" {
  rule      = aws_cloudwatch_event_rule.velocity_checks.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alarms.arn
}
