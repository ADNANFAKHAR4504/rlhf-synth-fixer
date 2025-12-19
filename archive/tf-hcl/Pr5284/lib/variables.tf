# variables.tf - All input variables with sensible defaults

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest)-[1-9]$", var.aws_region))
    error_message = "Must be a valid AWS region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "security-framework"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, 4-30 characters."
  }
}

variable "allowed_regions" {
  description = "List of allowed AWS regions"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "allowed_environments" {
  description = "List of allowed environment tag values"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "cost_centers" {
  description = "List of valid cost center codes"
  type        = list(string)
  default     = ["IT", "Engineering", "Finance", "Operations", "Security"]
}

variable "prohibited_instance_types" {
  description = "List of prohibited EC2 instance types"
  type        = list(string)
  default     = ["*.8xlarge", "*.12xlarge", "*.16xlarge", "*.24xlarge", "*.32xlarge"]
}

variable "security_team_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security-alerts@example.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.security_team_email))
    error_message = "Must be a valid email address."
  }
}

variable "audit_account_ids" {
  description = "List of AWS account IDs that can assume the audit role"
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for id in var.audit_account_ids : can(regex("^\\d{12}$", id))])
    error_message = "All audit account IDs must be 12-digit AWS account IDs."
  }
}

variable "audit_external_id" {
  description = "External ID for secure cross-account audit role assumption"
  type        = string
  default     = "change-me-external-id-minimum-32-characters-required-for-security"
  sensitive   = true
  validation {
    condition     = length(var.audit_external_id) >= 32
    error_message = "External ID must be at least 32 characters for security."
  }
}

variable "target_organizational_units" {
  description = "List of organizational unit IDs to apply SCPs and tag policies"
  type        = list(string)
  default     = []
}

variable "enable_hybrid_activation" {
  description = "Enable SSM activation for hybrid/on-premises servers"
  type        = bool
  default     = false
}

variable "hybrid_activation_limit" {
  description = "Maximum number of on-premises servers that can be registered"
  type        = number
  default     = 10
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail log retention in days"
  type        = number
  default     = 365
}

variable "session_timeout_minutes" {
  description = "Session Manager idle timeout in minutes"
  type        = number
  default     = 20
  validation {
    condition     = var.session_timeout_minutes >= 1 && var.session_timeout_minutes <= 60
    error_message = "Session timeout must be between 1 and 60 minutes."
  }
}

variable "enable_auto_tagging" {
  description = "Enable automatic tagging of new resources"
  type        = bool
  default     = true
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}

variable "enable_organization_policies" {
  description = "Enable AWS Organizations policies (SCPs and tag policies). Requires organization admin access."
  type        = bool
  default     = false
}

variable "enable_config_recorder" {
  description = "Enable AWS Config recorder and delivery channel. Set to false if account already has Config enabled."
  type        = bool
  default     = false
}

variable "enable_audit_role" {
  description = "Enable cross-account audit role. Requires audit_account_ids to be specified."
  type        = bool
  default     = false
}