variable "region" {
  description = "AWS region"
  type        = string
}

variable "project_name" {
  description = "Project or system identifier"
  type        = string
  default     = "security-baseline"
}

variable "alarm_email" {
  description = "Email for SNS subscription"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

variable "enable_aws_config" {
  description = "Create AWS Config recorder & delivery channel"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Create GuardDuty detector"
  type        = bool
  default     = true
}
