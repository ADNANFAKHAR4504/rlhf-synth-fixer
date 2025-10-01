# ===========================
# VARIABLES
# PCI-DSS Compliant Infrastructure
# ===========================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "pci-payment"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block for payment processing environment"
  type        = string
  default     = "10.16.0.0/16"
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups (PCI-DSS requires minimum 35 days)"
  type        = number
  default     = 35
  
  validation {
    condition     = var.backup_retention_days >= 35
    error_message = "PCI-DSS Requirement 3.1 mandates minimum 35 days backup retention."
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days (PCI-DSS requires minimum 365 days)"
  type        = number
  default     = 365
  
  validation {
    condition     = var.log_retention_days >= 365
    error_message = "PCI-DSS Requirement 10.7 mandates minimum 1 year log retention."
  }
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class for Aurora cluster"
  type        = string
  default     = "db.r6g.large"
}

variable "db_replica_count" {
  description = "Number of Aurora read replicas for high availability"
  type        = number
  default     = 3
  
  validation {
    condition     = var.db_replica_count >= 2
    error_message = "PCI-DSS requires minimum 2 read replicas for high availability."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on critical resources"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS (PCI-DSS requirement)"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "WAF rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 10000
}

variable "allowed_countries" {
  description = "List of country codes allowed to access the application (geo-blocking)"
  type        = list(string)
  default     = ["US", "CA"]
}

variable "secret_rotation_days" {
  description = "Number of days before automatic secret rotation"
  type        = number
  default     = 30
  
  validation {
    condition     = var.secret_rotation_days <= 90
    error_message = "PCI-DSS recommends secret rotation every 90 days maximum."
  }
}

variable "enable_guardduty" {
  description = "Enable GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable Security Hub for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config for configuration compliance"
  type        = bool
  default     = true
}

variable "enable_macie" {
  description = "Enable Amazon Macie for data discovery"
  type        = bool
  default     = true
}

variable "enable_mfa_delete" {
  description = "Enable MFA delete on S3 audit buckets (PCI-DSS requirement)"
  type        = bool
  default     = true
}

variable "cloudtrail_multi_region" {
  description = "Enable multi-region CloudTrail (PCI-DSS requirement)"
  type        = bool
  default     = true
}

variable "enable_cloudtrail_validation" {
  description = "Enable log file validation for CloudTrail (PCI-DSS requirement)"
  type        = bool
  default     = true
}

variable "alb_access_logs_enabled" {
  description = "Enable ALB access logs"
  type        = bool
  default     = true
}

variable "db_backup_window" {
  description = "Preferred backup window for RDS"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window for RDS"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

variable "performance_insights_retention" {
  description = "Performance Insights retention period in days"
  type        = number
  default     = 7
}
