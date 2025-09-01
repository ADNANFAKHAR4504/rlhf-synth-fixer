variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "prod-project-166"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "instance_ids" {
  description = "List of EC2 instance IDs to monitor"
  type        = list(string)
  default     = []
}

variable "db_instance_id" {
  description = "RDS instance ID to monitor"
  type        = string
  default     = ""
}

variable "sns_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "devops-team@company.com"
}

variable "vpc_id" {
  description = "ID of the VPC for monitoring resources"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}