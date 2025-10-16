# Project Configuration
variable "project_name" {
  description = "Name of the project used for resource naming"
  type        = string
  default     = "financial-services"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix to append to resource names for multi-deployment support"
  type        = string
  default     = "dev"
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

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "example.com"
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
  default     = ""
}

# VPC Configuration - Primary Region (us-east-1)
variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "availability_zones_primary" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets_primary" {
  description = "Private subnet CIDR blocks for primary region"
  type        = list(string)
  default     = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
}

variable "public_subnets_primary" {
  description = "Public subnet CIDR blocks for primary region"
  type        = list(string)
  default     = ["10.10.101.0/24", "10.10.102.0/24", "10.10.103.0/24"]
}

variable "database_subnets_primary" {
  description = "Database subnet CIDR blocks for primary region"
  type        = list(string)
  default     = ["10.10.201.0/24", "10.10.202.0/24", "10.10.203.0/24"]
}

# VPC Configuration - DR Region (us-west-2)
variable "vpc_cidr_dr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones_dr" {
  description = "Availability zones for DR region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnets_dr" {
  description = "Private subnet CIDR blocks for DR region"
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"]
}

variable "public_subnets_dr" {
  description = "Public subnet CIDR blocks for DR region"
  type        = list(string)
  default     = ["10.20.101.0/24", "10.20.102.0/24", "10.20.103.0/24"]
}

variable "database_subnets_dr" {
  description = "Database subnet CIDR blocks for DR region"
  type        = list(string)
  default     = ["10.20.201.0/24", "10.20.202.0/24", "10.20.203.0/24"]
}

# Aurora Configuration
variable "database_name" {
  description = "Name of the primary database"
  type        = string
  default     = "financial_transactions"
}

variable "db_master_username" {
  description = "Master username for Aurora"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "aurora_instance_count_primary" {
  description = "Number of Aurora instances in primary region"
  type        = number
  default     = 2
}

variable "aurora_instance_count_dr" {
  description = "Number of Aurora instances in DR region"
  type        = number
  default     = 1
}

variable "aurora_instance_class" {
  description = "Instance class for Aurora primary instances"
  type        = string
  default     = "db.r6g.large"
}

variable "aurora_instance_class_dr" {
  description = "Instance class for Aurora DR instances (can be smaller)"
  type        = string
  default     = "db.r6g.large"
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for Aurora instances"
  type        = bool
  default     = true
}

# Recovery Time and Point Objectives
variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 5
}

variable "rpo_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 1
}

# Monitoring and Alerting
variable "alarm_email" {
  description = "Email address for DR notifications"
  type        = string
  default     = "alerts@example.com"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for DR notifications"
  type        = string
  sensitive   = true
  default     = ""
}

# SSL Certificates
variable "acm_certificate_arn_primary" {
  description = "ACM certificate ARN for primary ALB"
  type        = string
  default     = ""
}

variable "acm_certificate_arn_dr" {
  description = "ACM certificate ARN for DR ALB"
  type        = string
  default     = ""
}

# Compliance and Security
variable "enable_flow_logs" {
  description = "Enable VPC flow logs for compliance"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 35
}

# Cost Optimization
variable "enable_dr_cost_optimization" {
  description = "Enable cost optimization features in DR region"
  type        = bool
  default     = true
}

variable "dr_standby_min_capacity" {
  description = "Minimum capacity for DR region during standby"
  type        = number
  default     = 1
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
