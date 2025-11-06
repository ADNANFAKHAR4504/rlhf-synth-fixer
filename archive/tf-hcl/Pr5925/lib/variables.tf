variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-east-2"
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

variable "availability_zones_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "payments"
}

variable "domain_name" {
  description = "Domain name for API endpoints"
  type        = string
  default     = "payments-api.example.com"
}

variable "health_check_path" {
  description = "Health check path for API"
  type        = string
  default     = "/health"
}

variable "replication_lag_threshold" {
  description = "Aurora replication lag threshold in milliseconds"
  type        = number
  default     = 10000
}
