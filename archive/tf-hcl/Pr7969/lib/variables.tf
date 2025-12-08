################################################################################
# Variables - Infrastructure Configuration
################################################################################

# Provider Configuration
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
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

# Environment Configuration
variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "telematics"
}

variable "owner" {
  description = "Owner team or individual"
  type        = string
  default     = "fleet-ops"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "operations"
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = true
}

# Kinesis Configuration
variable "diagnostics_stream_name" {
  description = "Name of diagnostics Kinesis stream"
  type        = string
  default     = "vehicle-diagnostics"
}

variable "hos_stream_name" {
  description = "Name of HOS (Hours of Service) Kinesis stream"
  type        = string
  default     = "driver-hos-status"
}

variable "gps_stream_name" {
  description = "Name of GPS location Kinesis stream"
  type        = string
  default     = "vehicle-locations"
}

variable "stream_mode" {
  description = "Kinesis stream mode (ON_DEMAND or PROVISIONED)"
  type        = string
  default     = "ON_DEMAND"
}

variable "diagnostics_shard_count" {
  description = "Number of shards for diagnostics stream"
  type        = number
  default     = 10
}

variable "hos_shard_count" {
  description = "Number of shards for HOS stream"
  type        = number
  default     = 5
}

variable "gps_shard_count" {
  description = "Number of shards for GPS stream"
  type        = number
  default     = 8
}

variable "retention_hours" {
  description = "Kinesis data retention in hours"
  type        = number
  default     = 168 # 7 days
}

# DynamoDB Configuration
variable "diagnostics_table" {
  description = "DynamoDB table for vehicle diagnostics"
  type        = string
  default     = "vehicle-diagnostics"
}

variable "thresholds_table" {
  description = "DynamoDB table for alert thresholds"
  type        = string
  default     = "alert-thresholds"
}

variable "predictions_table" {
  description = "DynamoDB table for predictive maintenance"
  type        = string
  default     = "predicted-failures"
}

variable "driver_logs_table" {
  description = "DynamoDB table for driver logs"
  type        = string
  default     = "driver-logs"
}

variable "compliance_rules_table" {
  description = "DynamoDB table for DOT compliance rules"
  type        = string
  default     = "compliance-rules"
}

variable "locations_table" {
  description = "DynamoDB table for vehicle locations"
  type        = string
  default     = "vehicle-locations"
}

variable "geofences_table" {
  description = "DynamoDB table for geofences"
  type        = string
  default     = "geofences"
}

variable "compliance_status_table" {
  description = "DynamoDB table for compliance status"
  type        = string
  default     = "compliance-status"
}

variable "billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "rcu" {
  description = "DynamoDB read capacity units (if provisioned)"
  type        = number
  default     = 100
}

variable "wcu" {
  description = "DynamoDB write capacity units (if provisioned)"
  type        = number
  default     = 100
}

variable "ttl_enabled" {
  description = "Enable TTL on DynamoDB tables"
  type        = bool
  default     = true
}

variable "ttl_attribute" {
  description = "TTL attribute name for DynamoDB"
  type        = string
  default     = "ttl"
}

# Lambda Configuration
variable "processor_memory" {
  description = "Memory for stream processor Lambda (MB)"
  type        = number
  default     = 1024
}

variable "anomaly_memory" {
  description = "Memory for anomaly detection Lambda (MB)"
  type        = number
  default     = 2048
}

variable "maintenance_memory" {
  description = "Memory for maintenance Lambda (MB)"
  type        = number
  default     = 512
}

variable "driver_notifier_memory" {
  description = "Memory for driver notification Lambda (MB)"
  type        = number
  default     = 512
}

variable "fleet_memory" {
  description = "Memory for fleet management Lambda (MB)"
  type        = number
  default     = 1024
}

variable "predictive_memory" {
  description = "Memory for predictive maintenance Lambda (MB)"
  type        = number
  default     = 3072
}

variable "hos_memory" {
  description = "Memory for HOS processing Lambda (MB)"
  type        = number
  default     = 1024
}

variable "location_memory" {
  description = "Memory for location processing Lambda (MB)"
  type        = number
  default     = 1024
}

variable "fuel_memory" {
  description = "Memory for fuel analytics Lambda (MB)"
  type        = number
  default     = 1024
}

variable "coaching_memory" {
  description = "Memory for driver coaching Lambda (MB)"
  type        = number
  default     = 512
}

variable "timeout_s" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 60
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

# Redis Configuration
variable "node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.large"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters"
  type        = number
  default     = 2
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots"
  type        = number
  default     = 7
}

# Aurora Configuration
variable "cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
  default     = "fleet-analytics"
}

variable "database_name" {
  description = "Aurora database name"
  type        = string
  default     = "telematics"
}

variable "master_username" {
  description = "Aurora master username"
  type        = string
  default     = "fleetadmin"
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "min_capacity" {
  description = "Aurora Serverless v2 minimum capacity"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Aurora Serverless v2 maximum capacity"
  type        = number
  default     = 4
}

variable "backup_retention_days" {
  description = "Aurora backup retention period"
  type        = number
  default     = 30
}

# SageMaker Configuration
variable "predictive_endpoint_name" {
  description = "SageMaker endpoint for predictive maintenance"
  type        = string
  default     = "fleet-predictive-maintenance"
}

# SNS Topics
variable "alerts_topic" {
  description = "SNS topic for vehicle alerts"
  type        = string
  default     = "vehicle-alerts"
}

variable "maintenance_topic" {
  description = "SNS topic for maintenance required"
  type        = string
  default     = "maintenance-required"
}

variable "violations_topic" {
  description = "SNS topic for HOS violations"
  type        = string
  default     = "hos-violations"
}

variable "summary_topic" {
  description = "SNS topic for compliance summary"
  type        = string
  default     = "compliance-summary"
}

variable "geofence_topic" {
  description = "SNS topic for geofence alerts"
  type        = string
  default     = "geofence-alerts"
}

variable "coaching_topic" {
  description = "SNS topic for driver coaching"
  type        = string
  default     = "driver-coaching"
}

# SQS Queues
variable "maintenance_queue" {
  description = "SQS queue for maintenance alerts"
  type        = string
  default     = "maintenance-alerts"
}

variable "driver_queue" {
  description = "SQS queue for driver notifications"
  type        = string
  default     = "driver-notifications"
}

variable "fleet_queue" {
  description = "SQS queue for fleet manager updates"
  type        = string
  default     = "fleet-manager-queue"
}

variable "training_queue" {
  description = "SQS queue for driver training"
  type        = string
  default     = "driver-training-queue"
}

variable "visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "retention_seconds" {
  description = "SQS message retention in seconds"
  type        = number
  default     = 1209600 # 14 days
}

# EventBridge Configuration
variable "compliance_schedule_expression" {
  description = "EventBridge schedule for compliance reporting"
  type        = string
  default     = "rate(1 day)"
}

# S3 Buckets
variable "reports_bucket" {
  description = "S3 bucket for compliance reports"
  type        = string
  default     = "compliance-reports"
}

variable "data_lake_bucket" {
  description = "S3 bucket for data lake"
  type        = string
  default     = "telematics-data-lake"
}

variable "lifecycle_archive_days" {
  description = "Days before archiving to Glacier"
  type        = number
  default     = 90
}

# Kinesis Firehose
variable "diagnostics_firehose_name" {
  description = "Kinesis Firehose delivery stream name"
  type        = string
  default     = "diagnostics-archive"
}

variable "buffer_interval_s" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 300
}

variable "buffer_size_mb" {
  description = "Firehose buffer size in MB"
  type        = number
  default     = 5
}

variable "data_format_conversion_enabled" {
  description = "Enable Parquet conversion in Firehose"
  type        = bool
  default     = true
}

# Glue Configuration
variable "crawler_name" {
  description = "Glue crawler name"
  type        = string
  default     = "telematics-crawler"
}

variable "glue_database_name" {
  description = "Glue catalog database name"
  type        = string
  default     = "telematics_catalog"
}

variable "crawler_schedule" {
  description = "Glue crawler schedule"
  type        = string
  default     = "cron(0 2 * * ? *)" # 2 AM daily
}

# Athena Configuration
variable "workgroup_name" {
  description = "Athena workgroup name"
  type        = string
  default     = "fleet-analytics"
}

variable "output_bucket" {
  description = "S3 bucket for Athena query results"
  type        = string
  default     = "athena-results"
}

# CloudWatch Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}