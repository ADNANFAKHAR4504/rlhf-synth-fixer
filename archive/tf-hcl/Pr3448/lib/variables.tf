variable "aws_region" {
  description = "AWS region to deploy infrastructure"
  type        = string
}

variable "regions" {
  description = "List of AWS regions to deploy infrastructure"
  type        = list(string)
  validation {
    condition     = length(var.regions) > 0
    error_message = "At least one region must be specified"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "vpc_cidrs" {
  description = "Map of VPC CIDR blocks per region"
  type        = map(string)
  validation {
    condition     = alltrue([for cidr in values(var.vpc_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All CIDR blocks must be valid"
  }
}

variable "availability_zones_per_region" {
  description = "Number of AZs to use per region"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type for compute resources"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 4
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_engine" {
  description = "RDS database engine"
  type        = string
  default     = "mysql"
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 30
}

variable "rds_maintenance_window" {
  description = "RDS maintenance window"
  type        = string
  default     = "sun:02:00-sun:04:00"
}

variable "rds_backup_window" {
  description = "RDS backup window"
  type        = string
  default     = "00:00-02:00"
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail S3 retention in days"
  type        = number
  default     = 90
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}


