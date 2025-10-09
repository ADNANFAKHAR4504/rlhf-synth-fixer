# ========== GENERAL VARIABLES ==========

variable "aws_region" {
  description = "Primary AWS region for centralized management account resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "compliance-framework"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the compliance resources"
  type        = string
  default     = "security-team"
}

# ========== ORGANIZATION VARIABLES ==========

variable "organization_id" {
  description = "AWS Organization ID for multi-account management"
  type        = string
  default     = ""
}

variable "member_account_ids" {
  description = "List of AWS member account IDs for compliance monitoring"
  type        = list(string)
  default     = []
}

variable "organizational_unit_names" {
  description = "Names of organizational units for account grouping"
  type        = list(string)
  default     = ["Production", "Development", "Security", "Compliance"]
}

# ========== COMPLIANCE VARIABLES ==========

variable "create_config_recorder" {
  description = "Create AWS Config recorder (set to true only for fresh accounts without existing recorder)"
  type        = bool
  default     = false
}

variable "create_security_hub" {
  description = "Create Security Hub account (set to false if already subscribed)"
  type        = bool
  default     = false
}

variable "compliance_standards" {
  description = "Compliance standards to enable in Security Hub"
  type        = list(string)
  default     = ["aws-foundational-security-best-practices", "cis-aws-foundations-benchmark", "pci-dss"]
}

variable "gdpr_enabled" {
  description = "Enable GDPR-specific compliance monitoring"
  type        = bool
  default     = true
}

variable "hipaa_enabled" {
  description = "Enable HIPAA-specific compliance monitoring"
  type        = bool
  default     = true
}

variable "config_rule_names" {
  description = "List of AWS Config rule names for compliance monitoring"
  type        = list(string)
  default = [
    "encrypted-volumes",
    "s3-bucket-public-read-prohibited",
    "s3-bucket-public-write-prohibited",
    "s3-bucket-server-side-encryption-enabled",
    "s3-bucket-versioning-enabled",
    "cloudtrail-enabled",
    "rds-storage-encrypted",
    "iam-password-policy",
    "root-account-mfa-enabled",
    "vpc-flow-logs-enabled"
  ]
}

# ========== STORAGE AND RETENTION VARIABLES ==========

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 365
}

variable "audit_log_retention_days" {
  description = "S3 audit log retention in days (for lifecycle policies)"
  type        = number
  default     = 2555 # 7 years for HIPAA compliance
}

variable "kms_key_deletion_window_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "enable_s3_mfa_delete" {
  description = "Enable MFA delete protection for S3 buckets"
  type        = bool
  default     = false # Set to true in production, but requires manual configuration
}

# ========== NOTIFICATION VARIABLES ==========

variable "security_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security@example.com"
}

variable "compliance_email" {
  description = "Email address for compliance notifications"
  type        = string
  default     = "compliance@example.com"
}

variable "critical_alert_email" {
  description = "Email address for critical compliance violation alerts"
  type        = string
  default     = "critical-alerts@example.com"
}

# ========== REMEDIATION VARIABLES ==========

variable "auto_remediation_enabled" {
  description = "Enable automated remediation of compliance violations"
  type        = bool
  default     = true
}

variable "remediation_lambda_timeout" {
  description = "Timeout in seconds for remediation Lambda functions"
  type        = number
  default     = 300
}

variable "remediation_lambda_memory" {
  description = "Memory allocation in MB for remediation Lambda functions"
  type        = number
  default     = 512
}

# ========== GUARDDUTY VARIABLES ==========

variable "guardduty_finding_publishing_frequency" {
  description = "GuardDuty finding publishing frequency (FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS)"
  type        = string
  default     = "FIFTEEN_MINUTES"
}

# ========== QUICKSIGHT VARIABLES ==========

variable "quicksight_user_email" {
  description = "Email address for QuickSight admin user"
  type        = string
  default     = "admin@example.com"
}

variable "quicksight_edition" {
  description = "QuickSight edition (STANDARD or ENTERPRISE)"
  type        = string
  default     = "ENTERPRISE"
}

# ========== COST CONTROL VARIABLES ==========

variable "enable_cost_allocation_tags" {
  description = "Enable cost allocation tags for compliance resources"
  type        = bool
  default     = true
}

variable "budget_monthly_limit" {
  description = "Monthly budget limit in USD for compliance infrastructure"
  type        = number
  default     = 10000
}

