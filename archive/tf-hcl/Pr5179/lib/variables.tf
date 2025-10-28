# Core project variables
variable "project_name" {
  description = "Name of the zero-trust security project"
  type        = string
  default     = "financial-zero-trust"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "dev"
}

variable "environment" {
  description = "Deployment environment (pilot or production)"
  type        = string
  default     = "pilot"
  validation {
    condition     = contains(["pilot", "production"], var.environment)
    error_message = "Environment must be either 'pilot' or 'production'."
  }
}

variable "multi_account_enabled" {
  description = "Enable multi-account AWS Organizations features"
  type        = bool
  default     = false
}

# Account configuration (optional, for multi-account mode)
variable "pilot_accounts" {
  description = "List of AWS account IDs for pilot deployment"
  type        = list(string)
  default     = []
}

variable "all_accounts" {
  description = "List of all 50 AWS account IDs"
  type        = list(string)
  default     = []
}

variable "security_account_id" {
  description = "Central security account ID for aggregated monitoring (optional)"
  type        = string
  default     = ""
}

variable "logging_account_id" {
  description = "Central logging account ID for compliance logs (optional)"
  type        = string
  default     = ""
}

# Network configuration
variable "vpc_cidr" {
  description = "VPC CIDR block for single-account deployment"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidrs" {
  description = "Map of account IDs to VPC CIDR blocks (for multi-account mode)"
  type        = map(string)
  default     = {}
}

variable "availability_zones" {
  description = "List of availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "AZ count must be between 2 and 3 for high availability."
  }
}

variable "transit_gateway_asn" {
  description = "ASN for Transit Gateway"
  type        = number
  default     = 64512
}

variable "enable_network_firewall" {
  description = "Enable AWS Network Firewall for deep packet inspection"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs for network monitoring"
  type        = bool
  default     = true
}

# Security configuration
variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges for access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  sensitive   = true
}

variable "max_session_duration" {
  description = "Maximum session duration in seconds"
  type        = number
  default     = 3600 # 1 hour
}

variable "enable_auto_remediation" {
  description = "Enable automatic security incident remediation"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable Amazon GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub for centralized security management"
  type        = bool
  default     = false
}

variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail for audit logging"
  type        = bool
  default     = false
}

variable "security_notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "security@example.com"
  sensitive   = true
}

# Compliance configuration
variable "log_retention_days" {
  description = "Number of days to retain compliance logs"
  type        = number
  default     = 2557 # 7 years for banking compliance
}

variable "cloudtrail_log_retention_days" {
  description = "Number of days to retain CloudTrail logs in CloudWatch"
  type        = number
  default     = 90
}

variable "flow_log_retention_days" {
  description = "Number of days to retain VPC Flow Logs in CloudWatch"
  type        = number
  default     = 30
}