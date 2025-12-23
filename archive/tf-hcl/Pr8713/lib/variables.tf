variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
  default     = "synth101912554v6"
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "container_image" {
  description = "Docker container image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Container port for the application"
  type        = number
  default     = 80
}

variable "desired_task_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
}

variable "min_task_count" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 3
}

variable "max_task_count" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "512"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "financialdb"
}

variable "db_username" {
  description = "Master username for database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "financial-portal.example.com"
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "FinancialServices"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "compliance" {
  description = "Compliance tag value"
  type        = string
  default     = "PCI-DSS"
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo-blocking"
  type        = list(string)
  default     = ["KP", "IR", "SY", "CU"]
}
