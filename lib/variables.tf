variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = ""
}

variable "create_vpc" {
  description = "Whether to create a new VPC or use an existing one"
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
}

variable "vpc_id" {
  description = "ID of existing VPC (required only if create_vpc is false)"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs (required only if create_vpc is false)"
  type        = list(string)
  default     = []
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs (required only if create_vpc is false)"
  type        = list(string)
  default     = []
}

variable "enable_https" {
  description = "Enable HTTPS listener on ALB"
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (required only if enable_https is true)"
  type        = string
  default     = ""
}

variable "enable_route53" {
  description = "Enable Route53 DNS configuration"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.fintech-app.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID (required only if enable_route53 is true)"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "fintechdb"
}

variable "database_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
}

variable "aurora_engine_version" {
  description = "Specific Aurora PostgreSQL engine version to deploy. Leave empty to use AWS default/latest."
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "Instance class for RDS Aurora instances"
  type        = string
  default     = "db.t3.medium"
}

variable "task_cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "4096" # 4 vCPUs
}

variable "task_memory" {
  description = "Memory for ECS task"
  type        = string
  default     = "8192" # 8GB
}

variable "min_tasks" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 3
}

variable "max_tasks" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 15
}

variable "cpu_target_value" {
  description = "Target CPU utilization for auto-scaling"
  type        = number
  default     = 70
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "fintech-app"
    ManagedBy   = "terraform"
  }
}