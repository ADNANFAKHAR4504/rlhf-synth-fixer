variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "db_master_username" {
  description = "Master username for RDS Aurora"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "alb_certificate_arn" {
  description = "ARN of ACM certificate for ALB HTTPS listener"
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name"
  type        = string
  default     = "example.com"
}

variable "onpremises_endpoint" {
  description = "On-premises application endpoint for weighted routing"
  type        = string
  default     = "onprem.example.com"
}

variable "aws_weighted_routing_weight" {
  description = "Weight for AWS environment in Route53 weighted routing (0-100)"
  type        = number
  default     = 0
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "trading-migration"
}

variable "migration_phase" {
  description = "Current migration phase"
  type        = string
  default     = "preparation"
}

variable "container_image" {
  description = "Docker container image for ECS"
  type        = string
  default     = "nginx:latest"
}