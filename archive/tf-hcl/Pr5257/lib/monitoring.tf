# CloudWatch Monitoring and Alerting for IAM Security

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  count = var.enable_iam_monitoring ? 1 : 0

  name              = local.security_alerts_topic
  kms_master_key_id = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count = var.enable_iam_monitoring ? 1 : 0

  topic_arn = aws_sns_topic.security_alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Log Group for IAM Events
resource "aws_cloudwatch_log_group" "iam_events" {
  count = var.enable_iam_monitoring ? 1 : 0

  name              = local.iam_events_log_group
  retention_in_days = var.log_retention_days
  kms_key_id        = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags
}

# EventBridge Rule - IAM Policy Changes
resource "aws_cloudwatch_event_rule" "iam_policy_changes" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-iam-policy-changes-${local.name_suffix}"
  description = "Capture IAM policy modification events"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreatePolicy",
        "DeletePolicy",
        "CreatePolicyVersion",
        "DeletePolicyVersion",
        "SetDefaultPolicyVersion",
        "AttachUserPolicy",
        "DetachUserPolicy",
        "AttachRolePolicy",
        "DetachRolePolicy",
        "AttachGroupPolicy",
        "DetachGroupPolicy",
        "PutUserPolicy",
        "PutRolePolicy",
        "PutGroupPolicy"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "iam_policy_changes_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.iam_policy_changes[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
      policyArn = "$.detail.requestParameters.policyArn"
    }
    input_template = "\"IAM Policy Change Detected: <eventName> by <userName> from IP <sourceIP> at <time>. Policy ARN: <policyArn>\""
  }
}

# EventBridge Rule - Role Assumption
resource "aws_cloudwatch_event_rule" "role_assumption" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-role-assumption-${local.name_suffix}"
  description = "Capture IAM role assumption events"

  event_pattern = jsonencode({
    source      = ["aws.sts"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["sts.amazonaws.com"]
      eventName   = ["AssumeRole"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "role_assumption_log" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.role_assumption[0].name
  target_id = "SendToLogGroup"
  arn       = aws_cloudwatch_log_group.iam_events[0].arn
}

# EventBridge Rule - Failed Authentication Attempts
resource "aws_cloudwatch_event_rule" "failed_auth" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-failed-auth-${local.name_suffix}"
  description = "Capture failed authentication attempts"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      eventName = ["ConsoleLogin"]
      errorCode = ["Failed authentication"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "failed_auth_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.failed_auth[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      userName = "$.detail.userIdentity.principalId"
      sourceIP = "$.detail.sourceIPAddress"
      time     = "$.time"
    }
    input_template = "\"Failed Authentication Attempt: User <userName> from IP <sourceIP> at <time>\""
  }
}

# EventBridge Rule - IAM User/Role Creation
resource "aws_cloudwatch_event_rule" "iam_user_role_creation" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-iam-user-role-creation-${local.name_suffix}"
  description = "Capture IAM user and role creation events"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName   = ["CreateUser", "CreateRole", "DeleteUser", "DeleteRole"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "iam_user_role_creation_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.iam_user_role_creation[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
    }
    input_template = "\"IAM Identity Change: <eventName> by <userName> from IP <sourceIP> at <time>\""
  }
}

# EventBridge Rule - Administrative Actions in Production
resource "aws_cloudwatch_event_rule" "admin_actions" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-admin-actions-${local.name_suffix}"
  description = "Capture administrative actions requiring audit"

  event_pattern = jsonencode({
    source      = ["aws.iam", "aws.s3", "aws.kms", "aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "PutBucketPolicy",
        "DeleteBucket",
        "DisableKey",
        "ScheduleKeyDeletion",
        "StopLogging",
        "DeleteTrail"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "admin_actions_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.admin_actions[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
    }
    input_template = "\"CRITICAL: Administrative Action Detected - <eventName> by <userName> from IP <sourceIP> at <time>\""
  }
}

# CloudWatch Metric Filter - Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  count = var.enable_iam_monitoring ? 1 : 0

  name           = "${local.name_prefix}-unauthorized-api-calls-${local.name_suffix}"
  log_group_name = aws_cloudwatch_log_group.iam_events[0].name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.iam_events]
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  count = var.enable_iam_monitoring ? 1 : 0

  alarm_name          = "${local.name_prefix}-unauthorized-api-calls-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert on multiple unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts[0].arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# CloudWatch Metric Filter - MFA Bypass Attempts
resource "aws_cloudwatch_log_metric_filter" "no_mfa_console_login" {
  count = var.enable_iam_monitoring ? 1 : 0

  name           = "${local.name_prefix}-no-mfa-console-login-${local.name_suffix}"
  log_group_name = aws_cloudwatch_log_group.iam_events[0].name
  pattern        = "{ ($.eventName = \"ConsoleLogin\") && ($.additionalEventData.MFAUsed != \"Yes\") }"

  metric_transformation {
    name      = "ConsoleLoginWithoutMFA"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.iam_events]
}

resource "aws_cloudwatch_metric_alarm" "no_mfa_console_login" {
  count = var.enable_iam_monitoring ? 1 : 0

  alarm_name          = "${local.name_prefix}-no-mfa-console-login-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsoleLoginWithoutMFA"
  namespace           = "${var.project_name}/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert on console login without MFA"
  alarm_actions       = [aws_sns_topic.security_alerts[0].arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# SNS Topic Policy to allow EventBridge and CloudWatch to publish
data "aws_iam_policy_document" "security_alerts_topic_policy" {
  count = var.enable_iam_monitoring ? 1 : 0

  statement {
    sid    = "AllowEventBridgePublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts[0].arn]
  }

  statement {
    sid    = "AllowCloudWatchPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts[0].arn]
  }
}

resource "aws_sns_topic_policy" "security_alerts" {
  count = var.enable_iam_monitoring ? 1 : 0

  arn    = aws_sns_topic.security_alerts[0].arn
  policy = data.aws_iam_policy_document.security_alerts_topic_policy[0].json
}

# CloudWatch Log Resource Policy for EventBridge
resource "aws_cloudwatch_log_resource_policy" "eventbridge_logs" {
  count = var.enable_iam_monitoring ? 1 : 0

  policy_name = "${local.name_prefix}-eventbridge-logs-${local.name_suffix}"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeToCreateLogStreams"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.iam_events[0].arn}:*"
      }
    ]
  })
}
