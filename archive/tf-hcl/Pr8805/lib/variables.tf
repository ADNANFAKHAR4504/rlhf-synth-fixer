variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable parallel deployments"
  type        = string
}

variable "aws_region" {
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
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "instance_type" {
  description = "EC2 instance type for compute resources"
  type        = string
  default     = "t3.large"

  validation {
    condition     = contains(["t3.medium", "t3.large", "t3.xlarge"], var.instance_type)
    error_message = "Instance type must be one of: t3.medium, t3.large, t3.xlarge."
  }
}

variable "instance_count" {
  description = "Number of EC2 instances to create"
  type        = number
  default     = 12
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "db_instance_class" {
  description = "RDS Aurora instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "FinancialServices"
}

variable "vpc_name_tag" {
  description = "Name tag to filter VPC data source"
  type        = string
  default     = "main-vpc"
}