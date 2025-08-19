# Check for existing GuardDuty detector
data "aws_guardduty_detector" "existing" {
  count = 1
}

# Enable GuardDuty only if not already enabled
resource "aws_guardduty_detector" "main" {
  count                        = length(data.aws_guardduty_detector.existing) > 0 ? 0 : 1
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = {
    Name        = "${var.application_name}-guardduty-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}

# Use the existing detector ID or the new one
locals {
  guardduty_detector_id = length(data.aws_guardduty_detector.existing) > 0 ? data.aws_guardduty_detector.existing[0].id : aws_guardduty_detector.main[0].id
}

# Enable S3 protection
resource "aws_guardduty_detector_feature" "s3_logs" {
  detector_id = local.guardduty_detector_id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# Enable EKS Audit Log Monitoring
resource "aws_guardduty_detector_feature" "eks_audit_logs" {
  detector_id = local.guardduty_detector_id
  name        = "EKS_AUDIT_LOGS"
  status      = "ENABLED"
}

# Enable Malware Protection
resource "aws_guardduty_detector_feature" "malware_protection" {
  detector_id = local.guardduty_detector_id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# Enable Runtime Monitoring
resource "aws_guardduty_detector_feature" "runtime_monitoring" {
  detector_id = local.guardduty_detector_id
  name        = "RUNTIME_MONITORING"
  status      = "ENABLED"

  additional_configuration {
    name   = "ECS_FARGATE_AGENT_MANAGEMENT"
    status = "ENABLED"
  }

  additional_configuration {
    name   = "EKS_ADDON_MANAGEMENT"
    status = "ENABLED"
  }
}