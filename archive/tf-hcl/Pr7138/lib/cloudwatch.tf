# CloudWatch Logs group for centralized logging
resource "aws_cloudwatch_log_group" "central" {
  name              = "/aws/security/central-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(
    var.tags,
    {
      Name = "central-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Logs resource policy for cross-account access
resource "aws_cloudwatch_log_resource_policy" "cross_account" {
  policy_name = "cross-account-logs-policy-${var.environment_suffix}"
  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
        }
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ]
        Resource = "${aws_cloudwatch_log_group.central.arn}:*"
      }
    ]
  })
}

# CloudWatch Log group for organizations
resource "aws_cloudwatch_log_group" "organizations" {
  name              = "/aws/organizations/audit-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(
    var.tags,
    {
      Name = "organizations-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log group for AWS Config
resource "aws_cloudwatch_log_group" "config" {
  name              = "/aws/config/compliance-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(
    var.tags,
    {
      Name = "config-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log group for IAM activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(
    var.tags,
    {
      Name = "iam-activity-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/audit-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(
    var.tags,
    {
      Name = "cloudtrail-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Logs IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail_logs" {
  name               = "cloudtrail-logs-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_logs_assume.json

  tags = merge(
    var.tags,
    {
      Name = "cloudtrail-logs-role-${var.environment_suffix}"
    }
  )
}

# CloudTrail Logs assume role policy
data "aws_iam_policy_document" "cloudtrail_logs_assume" {
  statement {
    sid    = "AllowCloudTrailService"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# CloudTrail Logs policy
resource "aws_iam_role_policy" "cloudtrail_logs" {
  name   = "cloudtrail-logs-policy-${var.environment_suffix}"
  role   = aws_iam_role.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_logs_policy.json
}

# CloudTrail Logs policy document
data "aws_iam_policy_document" "cloudtrail_logs_policy" {
  statement {
    sid    = "CreateLogStreamAndPutLogEvents"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    ]
  }
}

# CloudWatch metric filter for security events
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "UnauthorizedAPICallsMetricFilter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICallsCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.cloudtrail]
}

# CloudWatch metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "RootAccountUsageMetricFilter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsageCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.cloudtrail]
}

# CloudWatch metric filter for IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "IAMPolicyChangesMetricFilter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.iam_activity.name
  pattern        = "{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"

  metric_transformation {
    name      = "IAMPolicyChangesCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.iam_activity]
}

# CloudWatch metric filter for KMS key disabling
resource "aws_cloudwatch_log_metric_filter" "kms_key_disabling" {
  name           = "KMSKeyDisablingMetricFilter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = DisableKey) || ($.eventName = ScheduleKeyDeletion) }"

  metric_transformation {
    name      = "KMSKeyDisablingCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.cloudtrail]
}

# CloudWatch metric filter for config changes
resource "aws_cloudwatch_log_metric_filter" "config_changes" {
  name           = "ConfigChangesMetricFilter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.config.name
  pattern        = "{ ($.eventName = PutConfigRule) || ($.eventName = DeleteConfigRule) || ($.eventName = PutConformancePack) || ($.eventName = DeleteConformancePack) }"

  metric_transformation {
    name      = "ConfigChangesCount"
    namespace = "ConfigMetrics"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.config]
}

# CloudWatch Alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "UnauthorizedAPICallsAlarm-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAPICallsCount"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when unauthorized API calls are detected"
  treat_missing_data  = "notBreaching"

  depends_on = [aws_cloudwatch_log_metric_filter.unauthorized_api_calls]
}

# CloudWatch Alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "RootAccountUsageAlarm-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "RootAccountUsageCount"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when root account is used"
  treat_missing_data  = "notBreaching"

  depends_on = [aws_cloudwatch_log_metric_filter.root_account_usage]
}

# CloudWatch Alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "IAMPolicyChangesAlarm-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "IAMPolicyChangesCount"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when IAM policies are changed"
  treat_missing_data  = "notBreaching"

  depends_on = [aws_cloudwatch_log_metric_filter.iam_policy_changes]
}

# CloudWatch Alarm for KMS key disabling
resource "aws_cloudwatch_metric_alarm" "kms_key_disabling" {
  alarm_name          = "KMSKeyDisablingAlarm-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "KMSKeyDisablingCount"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when KMS keys are disabled"
  treat_missing_data  = "notBreaching"

  depends_on = [aws_cloudwatch_log_metric_filter.kms_key_disabling]
}
