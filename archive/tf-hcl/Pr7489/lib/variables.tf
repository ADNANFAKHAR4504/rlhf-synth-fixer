variable "environment_suffix" {
  description = "Unique suffix for resource naming to support parallel deployments"
  type        = string
  default     = "dev"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = "example.com"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_dr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for RDS Aurora"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS Aurora"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"
}

variable "alert_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "alerts@example.com"
}

variable "availability_zones_primary" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "availability_zones_dr" {
  description = "Availability zones for DR region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}
