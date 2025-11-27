variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment identification"
  type        = string
  default     = ""
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

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "dbadmin"
}

variable "instance_types" {
  description = "List of instance types for Auto Scaling mixed instances"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium"]
}

variable "min_capacity" {
  description = "Minimum number of instances in Auto Scaling group"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of instances in Auto Scaling group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling group"
  type        = number
  default     = 3
}

variable "logs_retention_days" {
  description = "Retention period for application logs in days"
  type        = number
  default     = 30
}

variable "documents_retention_days" {
  description = "Retention period for loan documents in days"
  type        = number
  default     = 90
}

variable "documents_glacier_days" {
  description = "Days before transitioning documents to Glacier"
  type        = number
  default     = 60
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "LoanProcessing"
    ManagedBy  = "Terraform"
    Compliance = "PCI-DSS"
  }
}
