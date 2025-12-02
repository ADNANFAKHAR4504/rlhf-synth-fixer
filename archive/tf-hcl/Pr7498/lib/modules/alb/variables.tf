# modules/alb/variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ALB"
  type        = list(string)
}

variable "target_port" {
  description = "Target port for application"
  type        = number
  default     = 80
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
