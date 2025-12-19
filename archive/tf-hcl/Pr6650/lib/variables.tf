variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cost_center" {
  description = "Cost center tag for billing"
  type        = string
  default     = "engineering"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "primary_availability_zones" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "secondary_availability_zones" {
  description = "Availability zones for secondary region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "transactions"
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
  default     = "TempPassword123!"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "python3.11"
}

variable "domain_name" {
  description = "Domain name for Route 53 failover"
  type        = string
}

variable "health_check_interval" {
  description = "Route 53 health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

variable "replication_lag_threshold" {
  description = "CloudWatch alarm threshold for replication lag in seconds"
  type        = number
  default     = 300
}

variable "sns_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "admin@example.com"
}
