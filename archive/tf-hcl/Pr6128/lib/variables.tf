variable "environment" {
  description = "Environment name (dev/staging/prod) - typically set via workspace"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets"
  type        = bool
  default     = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "paymentdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "dbadmin"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_backup_retention" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "ecs_task_count" {
  description = "Number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "512"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "s3_transition_days" {
  description = "Days before transitioning to STANDARD_IA"
  type        = number
  default     = 30
}

variable "s3_glacier_days" {
  description = "Days before transitioning to GLACIER"
  type        = number
  default     = 90
}

variable "s3_expiration_days" {
  description = "Days before expiring objects"
  type        = number
  default     = 365
}

variable "health_check_bucket" {
  description = "S3 bucket containing the health_check.py script"
  type        = string
  default     = "payment-health-check-scripts"
}
