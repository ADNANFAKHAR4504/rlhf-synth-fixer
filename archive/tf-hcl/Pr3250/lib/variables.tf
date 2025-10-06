# variables.tf

variable "environment_suffix" {
  description = "Suffix to append to all resource names"
  type        = string
  default     = "synth15839204"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for patient data"
  type        = string
  default     = "healthcare-patient-records-secure"
}

variable "kms_key_alias" {
  description = "Alias for the KMS key"
  type        = string
  default     = "alias/patient-data-encryption"
}

variable "cloudtrail_name" {
  description = "Name of the CloudTrail"
  type        = string
  default     = "healthcare-audit-trail"
}

variable "cloudtrail_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
  default     = "healthcare-cloudtrail-logs"
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "security@healthcare.example"
}

variable "lifecycle_transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "object_lock_days" {
  description = "Object lock retention period in days"
  type        = number
  default     = 365
}

variable "tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Purpose     = "PatientData"
    ManagedBy   = "Terraform"
    Compliance  = "HIPAA"
  }
}