variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region for resource deployment"
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
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "rds_instance_class" {
  description = "RDS Aurora instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "aurora_instance_count" {
  description = "Number of Aurora cluster instances (1 for dev, 2 for staging/prod)"
  type        = number
  default     = 1
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env-infra"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "multi-env-infra"
  }
}
