variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB"
  }
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds"
  }
}

variable "source_path" {
  description = "Path to Lambda source code"
  type        = string
}

variable "subnet_ids" {
  description = "VPC subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "iam_role_arn" {
  description = "IAM role ARN"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}
