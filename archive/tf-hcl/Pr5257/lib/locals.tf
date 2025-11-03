# Random suffix for unique resource naming (fallback when environment_suffix not provided)
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local Values
locals {
  # Resource naming
  name_prefix = "${var.project_name}-${var.environment}"

  # Use environment_suffix if provided (from ENVIRONMENT_SUFFIX env var), otherwise use random suffix
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  # AWS Account and Region
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id
  partition  = data.aws_partition.current.partition

  # Common tags for all resources
  common_tags = {
    Project        = var.project_name
    Environment    = var.environment
    Owner          = var.owner
    ManagedBy      = "Terraform"
    ComplianceType = "FinancialServices"
    SecurityLevel  = "High"
  }

  # IAM policy conditions
  ip_condition = {
    IpAddress = {
      "aws:SourceIp" = var.allowed_ip_ranges
    }
  }

  mfa_condition = {
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
    }
    NumericLessThan = {
      "aws:MultiFactorAuthAge" = var.mfa_max_age
    }
  }

  region_condition = {
    StringEquals = {
      "aws:RequestedRegion" = var.allowed_regions
    }
  }

  vpc_endpoint_condition = var.vpc_endpoint_id != "" ? {
    StringEquals = {
      "aws:SourceVpce" = var.vpc_endpoint_id
    }
  } : {}

  # Time-based access condition
  time_condition = {
    DateGreaterThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'${var.business_hours_start}Z", timestamp())
    }
    DateLessThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'${var.business_hours_end}Z", timestamp())
    }
  }

  # S3 bucket names
  financial_data_bucket = "${local.name_prefix}-${var.financial_data_bucket_name}-${local.name_suffix}"
  access_logs_bucket    = "${local.name_prefix}-access-logs-${local.name_suffix}"

  # SNS topic name
  security_alerts_topic = "${local.name_prefix}-security-alerts-${local.name_suffix}"

  # Lambda function names
  access_expiration_lambda = "${local.name_prefix}-access-expiration-${local.name_suffix}"

  # CloudWatch log group names
  iam_events_log_group        = "/aws/iam/${local.name_prefix}-events-${local.name_suffix}"
  access_expiration_log_group = "/aws/lambda/${local.access_expiration_lambda}"
  cloudtrail_log_group        = "/aws/cloudtrail/${local.name_prefix}-${local.name_suffix}"

  # KMS key alias
  kms_key_alias = "alias/${local.name_prefix}-${local.name_suffix}"
}
