variable "name_prefix" {
  description = "Prefix to be used for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "A map of tags to be applied to all resources"
  type        = map(string)
  default     = {}
}

variable "kms_key_id" {
  description = "KMS key ID to be used for encrypting CloudTrail logs"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudTrail logs in CloudWatch"
  type        = number
  default     = 30
}

variable "alarm_actions" {
  description = "List of ARNs to notify when CloudTrail alarms trigger"
  type        = list(string)
  default     = []
}
