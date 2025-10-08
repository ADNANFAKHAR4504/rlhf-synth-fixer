# Global Variables
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "finserv"
}

variable "application_name" {
  description = "Application name"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
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

# Tagging Variables
variable "tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Owner       = "platform-team"
    CostCentre  = "CC-12345"
    Project     = "disaster-recovery"
    Compliance  = "PCI-DSS"
  }
}

# Database Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r5.xlarge"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Compute Variables
variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.large"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 1
}

# Network Variables
variable "vpc_cidr" {
  description = "CIDR blocks for VPCs"
  type        = map(string)
  default = {
    primary   = "10.0.0.0/16"
    secondary = "10.1.0.0/16"
  }
}

# Failover Variables
variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 10
}

variable "failover_threshold" {
  description = "Number of failed health checks before failover"
  type        = number
  default     = 3
}

# Feature toggles
variable "enable_dns_failover" {
  description = "Enable Global Accelerator-based failover (no DNS setup required)"
  type        = bool
  default     = true
}

