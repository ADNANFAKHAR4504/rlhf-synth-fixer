variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
}

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
}

variable "multi_az" {
  description = "Enable Multi-AZ"
  type        = bool
}

variable "ecs_security_group_id" {
  description = "ECS security group ID"
  type        = string
}
