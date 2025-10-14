# variables.tf
variable "aws_region"{
  default = "us-east-1"
}

variable "vpc_id" {
  description = "ID of existing VPC. If not provided, a new VPC will be created"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "List of existing private subnet IDs. If not provided, new subnets will be created"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project            = "Healthcare-DB"
    Environment        = "Production"
    Owner              = "Platform-Team"
    DataClassification = "PHI"
    Compliance         = "HIPAA-eligible"
  }
}

variable "db_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = "healthcare-mysql-db"
}

variable "db_name" {
  description = "Initial database name to create"
  type        = string
  default     = "healthcare"
}

variable "db_username" {
  description = "Master username for RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Master password for RDS instance. Store in AWS Secrets Manager in production"
  type        = string
  sensitive   = true
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.40"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for RDS instance"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage autoscaling limit in GB (0 to disable)"
  type        = number
  default     = 50
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights (not supported on db.t3.micro - requires db.t3.small or larger)"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights data retention in days"
  type        = number
  default     = 7
}

variable "enhanced_monitoring_enabled" {
  description = "Enable Enhanced Monitoring"
  type        = bool
  default     = false
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced Monitoring interval in seconds"
  type        = number
  default     = 60
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket name used for snapshot exports"
  type        = string
  default     = "healthcare-rds-snapshots"
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "alarm_storage_threshold" {
  description = "Free storage space threshold in bytes for CloudWatch alarm"
  type        = number
  default     = 2147483648 # 2GB
}

variable "alarm_connections_threshold" {
  description = "Database connections threshold for CloudWatch alarm"
  type        = number
  default     = 40
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications (optional)"
  type        = string
  default     = ""
}