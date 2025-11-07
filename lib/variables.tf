variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
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
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
}

variable "ecs_task_count" {
  description = "Number of ECS tasks"
  type        = number
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "s3_transition_days" {
  description = "Days before transitioning to STANDARD_IA"
  type        = number
}

variable "s3_glacier_days" {
  description = "Days before transitioning to GLACIER"
  type        = number
}

variable "s3_expiration_days" {
  description = "Days before expiring objects"
  type        = number
}
