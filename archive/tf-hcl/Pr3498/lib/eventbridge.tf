resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-high-severity-findings-${local.environment_suffix}"
  description = "Capture high severity GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        { numeric = [">=", 7] }
      ]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "guardduty-findings-rule-${local.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn

  input_transformer {
    input_paths = {
      severity    = "$.detail.severity"
      type        = "$.detail.type"
      region      = "$.region"
      accountId   = "$.account"
      time        = "$.time"
      description = "$.detail.description"
    }

    input_template = jsonencode({
      severity    = "<severity>"
      type        = "<type>"
      region      = "<region>"
      accountId   = "<accountId>"
      time        = "<time>"
      description = "<description>"
    })
  }
}

resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "security-hub-critical-findings-${local.environment_suffix}"
  description = "Capture critical Security Hub findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-hub-findings-rule-${local.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_event_target" "security_hub_sns" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_cloudwatch_event_target" "security_hub_lambda" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "ProcessWithLambda"
  arn       = aws_lambda_function.custom_rules_processor.arn
}

resource "aws_cloudwatch_event_rule" "cloudtrail_api_events" {
  name        = "cloudtrail-sensitive-api-calls-${local.environment_suffix}"
  description = "Monitor sensitive API calls"

  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "DeleteBucket",
        "DeleteTrail",
        "StopLogging",
        "UpdateTrail",
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "CreateAccessKey",
        "DeleteAccessKey"
      ]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-api-events-rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "cloudtrail_sns" {
  rule      = aws_cloudwatch_event_rule.cloudtrail_api_events.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}