# variables.tf
# Payment Processing Application Variables

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "payment-processing"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "fintech-payments"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
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
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.100.0/24", "10.0.101.0/24", "10.0.102.0/24"]
}

# Database Configuration
variable "postgres_engine_version" {
  description = "PostgreSQL engine version for Aurora"
  type        = string
  default     = "15.6"
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "payments"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
}

variable "db_instance_class" {
  description = "RDS instance class for Aurora cluster instances"
  type        = string
  default     = "db.t4g.medium"

  validation {
    condition     = can(regex("^db\\.(t4g|r6g|r5|r4)\\.", var.db_instance_class))
    error_message = "DB instance class must be a valid Aurora PostgreSQL instance class (e.g., db.t4g.medium, db.r6g.large)."
  }
}

# ECS Configuration
variable "container_image" {
  description = "Docker image for the payment processing application"
  type        = string
  default     = "nginx:latest" # Replace with actual application image
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
  default     = 3000
}

variable "fargate_cpu" {
  description = "CPU units for Fargate task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "fargate_memory" {
  description = "Memory for Fargate task in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks for auto scaling"
  type        = number
  default     = 10
}

variable "health_check_path" {
  description = "Health check path for the application"
  type        = string
  default     = "/health"
}

# Route53 Configuration
variable "domain_name" {
  description = "Domain name for the application. Leave empty to skip Route53 configuration"
  type        = string
  default     = ""
}

variable "route53_weight" {
  description = "Weight for Route53 weighted routing (0-255). Use 0 for dev, gradually increase for prod traffic shifting"
  type        = number
  default     = 100

  validation {
    condition     = var.route53_weight >= 0 && var.route53_weight <= 255
    error_message = "Route53 weight must be between 0 and 255."
  }
}

variable "create_www_record" {
  description = "Whether to create a www CNAME record"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS. Leave empty to serve HTTP traffic directly without SSL/TLS"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "notification_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = "admin@company.com"
}