variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-1"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Application = "quiz-processor"
    ManagedBy   = "terraform"
  }
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = ""
}

variable "environment_suffix" {
  description = "Suffix to append to resource names to avoid conflicts"
  type        = string
  default     = "dev"
}