variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts across environments"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "paymentdb"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "dms_source_endpoint_server" {
  description = "Hostname or IP of on-premises database server"
  type        = string
  default     = "10.1.1.100"
}

variable "dms_source_endpoint_port" {
  description = "Port number of on-premises database"
  type        = number
  default     = 5432
}

variable "dms_source_endpoint_username" {
  description = "Username for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_password" {
  description = "Password for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_database" {
  description = "Database name on on-premises server"
  type        = string
  default     = "legacy_payment_db"
}

variable "app_config_values" {
  description = "Application configuration key-value pairs"
  type        = map(string)
  default = {
    "app_version"    = "1.0.0"
    "log_level"      = "INFO"
    "feature_flag_1" = "enabled"
  }
}
