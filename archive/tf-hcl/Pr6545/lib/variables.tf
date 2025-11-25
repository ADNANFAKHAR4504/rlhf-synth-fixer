# variables.tf
# Input variables for the compliance checking system

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment isolation"
  type        = string
  default     = "prod"
}

variable "config_snapshot_frequency" {
  description = "Frequency for Config snapshot delivery (One_Hour, Three_Hours, Six_Hours, Twelve_Hours, or TwentyFour_Hours)"
  type        = string
  default     = "TwentyFour_Hours"
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda function in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 60
}

variable "lambda_runtime" {
  description = "Python runtime version for Lambda function"
  type        = string
  default     = "python3.11"
}

variable "notification_email" {
  description = "Email address for compliance violation notifications (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ComplianceChecking"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}
