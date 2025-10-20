# Random suffix for unique resource naming (fallback when environment_suffix not provided)
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  # Resource naming
  name_prefix = "${var.project_name}-${var.environment}"
  # Use environment_suffix if provided (from ENVIRONMENT_SUFFIX env var), otherwise use random suffix
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  # S3 bucket names
  primary_bucket_name   = var.primary_bucket_name != "" ? var.primary_bucket_name : "${local.name_prefix}-primary-${local.name_suffix}"
  audit_bucket_name     = var.audit_bucket_name != "" ? var.audit_bucket_name : "${local.name_prefix}-audit-${local.name_suffix}"
  reporting_bucket_name = var.reporting_bucket_name != "" ? var.reporting_bucket_name : "${local.name_prefix}-reports-${local.name_suffix}"

  # CloudTrail configuration
  cloudtrail_name           = "${local.name_prefix}-trail-${local.name_suffix}"
  cloudtrail_log_group_name = "/aws/cloudtrail/${local.cloudtrail_name}"
  cloudtrail_s3_key_prefix  = "cloudtrail-logs"

  # Lambda function names
  compliance_lambda_name = "${local.name_prefix}-compliance-check-${local.name_suffix}"
  reporting_lambda_name  = "${local.name_prefix}-monthly-report-${local.name_suffix}"

  # CloudWatch Log Groups
  compliance_lambda_log_group = "/aws/lambda/${local.compliance_lambda_name}"
  reporting_lambda_log_group  = "/aws/lambda/${local.reporting_lambda_name}"

  # EventBridge rule names
  compliance_check_rule_name = "${local.name_prefix}-compliance-daily-${local.name_suffix}"
  reporting_rule_name        = "${local.name_prefix}-report-monthly-${local.name_suffix}"

  # SNS topic names
  alerts_topic_name = "${local.name_prefix}-alerts-${local.name_suffix}"

  # CloudWatch dashboard name
  dashboard_name = "${local.name_prefix}-storage-dashboard"

  # S3 Inventory configuration
  inventory_prefix = "inventory"

  # Calculated retention periods
  legal_retention_days   = var.legal_retention_years * 365
  noncurrent_delete_days = local.legal_retention_days

  # Common tags
  common_tags = merge(
    {
      Project            = var.project_name
      Environment        = var.environment
      ManagedBy          = "Terraform"
      Purpose            = "Legal Document Storage"
      Compliance         = "Legal Retention Policy"
      DataClassification = "Confidential"
      RetentionYears     = tostring(var.legal_retention_years)
    },
    var.additional_tags
  )

  # IAM role names
  uploader_role_name = "${local.name_prefix}-uploader-role-${local.name_suffix}"
  auditor_role_name  = "${local.name_prefix}-auditor-role-${local.name_suffix}"
  admin_role_name    = "${local.name_prefix}-admin-role-${local.name_suffix}"

  # Lambda execution role names
  compliance_lambda_role_name = "${local.name_prefix}-compliance-lambda-role-${local.name_suffix}"
  reporting_lambda_role_name  = "${local.name_prefix}-reporting-lambda-role-${local.name_suffix}"

  # CloudTrail role name
  cloudtrail_cloudwatch_role_name = "${local.name_prefix}-cloudtrail-cw-role-${local.name_suffix}"

  # CloudWatch alarm names
  alarm_failed_requests_name      = "${local.name_prefix}-failed-requests-${local.name_suffix}"
  alarm_unexpected_deletes_name   = "${local.name_prefix}-unexpected-deletes-${local.name_suffix}"
  alarm_high_download_volume_name = "${local.name_prefix}-high-downloads-${local.name_suffix}"
  alarm_upload_failures_name      = "${local.name_prefix}-upload-failures-${local.name_suffix}"
  alarm_compliance_failures_name  = "${local.name_prefix}-compliance-failures-${local.name_suffix}"

  # Metric filter names
  filter_access_denied_name      = "${local.name_prefix}-access-denied-filter"
  filter_deletions_name          = "${local.name_prefix}-deletions-filter"
  filter_versioning_changes_name = "${local.name_prefix}-versioning-changes-filter"

  # KMS key aliases
  primary_kms_key_alias = "alias/${local.name_prefix}-primary-key"
  audit_kms_key_alias   = "alias/${local.name_prefix}-audit-key"
}
