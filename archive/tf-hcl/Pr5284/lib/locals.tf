# locals.tf - Naming conventions and reusable values

locals {
  # Naming prefix for all resources
  name_prefix = "${var.project_name}-${var.environment}"

  # Common mandatory tags
  mandatory_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "PCI-DSS-Compliance"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )

  # Account and organization information
  account_id = data.aws_caller_identity.current.account_id
  org_id     = var.enable_organization_policies ? data.aws_organizations_organization.current[0].id : null

  # Region-specific service endpoints
  s3_service_endpoints = [
    for region in var.allowed_regions : "s3.${region}.amazonaws.com"
  ]

  rds_service_endpoints = [
    for region in var.allowed_regions : "rds.${region}.amazonaws.com"
  ]

  ec2_service_endpoints = [
    for region in var.allowed_regions : "ec2.${region}.amazonaws.com"
  ]

  # Compliance standards
  compliance_standards = {
    password_min_length       = 14
    password_max_age          = 90
    password_reuse_prevention = 24
    mfa_max_age_seconds       = 3600
    session_max_duration      = 43200 # 12 hours
    log_retention_days        = 365
  }

  # Resource limits
  resource_limits = {
    max_iam_policies_per_role = 10
    max_tags_per_resource     = 50
    max_kms_key_aliases       = 100
  }

  # Notification settings
  notification_settings = {
    alarm_evaluation_periods  = 1
    alarm_period_seconds      = 300
    alarm_datapoints_to_alarm = 1
  }

  # Service principal mapping
  service_principals = {
    config        = "config.amazonaws.com"
    cloudtrail    = "cloudtrail.amazonaws.com"
    lambda        = "lambda.amazonaws.com"
    events        = "events.amazonaws.com"
    ssm           = "ssm.amazonaws.com"
    ec2           = "ec2.amazonaws.com"
    s3            = "s3.amazonaws.com"
    rds           = "rds.amazonaws.com"
    organizations = "organizations.amazonaws.com"
  }

  # CloudWatch alarm thresholds
  alarm_thresholds = {
    root_usage_count         = 0
    unauthorized_api_count   = 10
    iam_policy_changes_count = 0
    signin_failures_count    = 5
  }

  # Lambda function settings
  lambda_settings = {
    runtime = "python3.9"
    timeout = 60
    memory  = 128
  }

  # S3 bucket naming
  s3_bucket_names = {
    config       = "${local.name_prefix}-config-bucket-${local.account_id}"
    session_logs = "${local.name_prefix}-session-logs-${local.account_id}"
    cloudtrail   = "${local.name_prefix}-cloudtrail-${local.account_id}"
  }

  # CloudWatch log group names
  log_group_names = {
    audit   = "/aws/audit/${local.name_prefix}"
    session = "/aws/ssm/${local.name_prefix}-sessions"
    lambda  = "/aws/lambda/${local.name_prefix}"
  }
}

# Timestamp for resource creation tracking
locals {
  current_timestamp = timestamp()
  current_date      = formatdate("YYYY-MM-DD", local.current_timestamp)
  current_year      = formatdate("YYYY", local.current_timestamp)
}

# Environment-specific settings
locals {
  is_production = var.environment == "prod"

  # Stricter settings for production
  deletion_protection = local.is_production ? true : false
  backup_enabled      = local.is_production ? true : false

  # Environment-specific retention
  retention_days = {
    dev     = 90
    staging = 180
    prod    = 365
  }
}