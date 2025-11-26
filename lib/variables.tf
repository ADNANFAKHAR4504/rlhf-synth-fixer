# variables.tf

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., blue, green)"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

# Aurora Configuration
variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "14.6"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "aurora_backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 35
}

variable "aurora_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "dbadmin"
}

variable "aurora_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
  default     = "TempAuroraPassword123!"
}

# DMS Configuration
variable "dms_replication_instance_class" {
  description = "DMS replication instance class"
  type        = string
  default     = "dms.c5.large"
}

variable "onprem_db_endpoint" {
  description = "On-premises database endpoint"
  type        = string
  default     = "onprem-db.example.com"
}

variable "onprem_db_port" {
  description = "On-premises database port"
  type        = number
  default     = 5432
}

variable "onprem_db_name" {
  description = "On-premises database name"
  type        = string
  default     = "testdb"
}

variable "onprem_db_username" {
  description = "On-premises database username"
  type        = string
  default     = "onprem_admin"
}

variable "onprem_db_password" {
  description = "On-premises database password"
  type        = string
  sensitive   = true
  default     = "TempOnpremPassword123!"
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 1024
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrency for Lambda functions"
  type        = number
  default     = 10
}

# ALB Configuration
variable "alb_target_weight_blue" {
  description = "Weight for blue environment target group (0-100)"
  type        = number
  default     = 50
}

variable "alb_target_weight_green" {
  description = "Weight for green environment target group (0-100)"
  type        = number
  default     = 50
}

# Route53 Configuration
variable "domain_name" {
  description = "Domain name for Route53 hosted zone"
  type        = string
  default     = "test-migration.local"
}

variable "health_check_threshold" {
  description = "Health check failure threshold percentage"
  type        = number
  default     = 5
}

# S3 Configuration
variable "s3_logs_retention_days" {
  description = "Number of days to retain S3 logs"
  type        = number
  default     = 90
}

# Cross-Account Configuration
variable "blue_account_id" {
  description = "AWS account ID for blue environment"
  type        = string
  default     = "123456789012"
}

variable "green_account_id" {
  description = "AWS account ID for green environment"
  type        = string
  default     = "123456789012"
}

# Transit Gateway Configuration
variable "transit_gateway_id" {
  description = "Transit Gateway ID for on-premises connectivity"
  type        = string
  default     = "tgw-00000000000000000"
}

variable "onprem_cidr" {
  description = "CIDR block for on-premises network"
  type        = string
  default     = "192.168.0.0/16"
}

# SNS Configuration
variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "alerts@example.com"
}

# DynamoDB Configuration
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

# Tags
variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-migration"
}
