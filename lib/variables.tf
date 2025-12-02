variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "fintech-app"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_backup_retention_days" {
  description = "Database backup retention period in days"
  type        = number
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
}

variable "enable_s3_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
}

variable "s3_lifecycle_days" {
  description = "Days before transitioning S3 objects to cheaper storage"
  type        = number
}

variable "enable_ssl" {
  description = "Enable SSL certificate for ALB"
  type        = bool
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "fintechdb"
}

