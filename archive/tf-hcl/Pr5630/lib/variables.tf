variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "security_team_emails" {
  description = "List of security team email addresses for alerts"
  type        = list(string)
  default     = ["security@example.com"]
}

variable "config_evaluation_frequency" {
  description = "Frequency for Config rule evaluation in hours"
  type        = number
  default     = 6
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 180
}

variable "dashboard_refresh_interval" {
  description = "CloudWatch dashboard refresh interval in seconds"
  type        = number
  default     = 300
}
