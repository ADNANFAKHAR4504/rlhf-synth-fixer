variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = "9k2"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Owner   = "DevOps Team"
    Purpose = "Multi-Environment Infrastructure"
  }
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs (disable for LocalStack compatibility)"
  type        = bool
  default     = false
}

variable "enable_ec2_instances" {
  description = "Enable EC2 instances (disable for LocalStack compatibility)"
  type        = bool
  default     = false
}
