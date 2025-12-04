# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
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

# ===================================================================
# APPLICATION-SPECIFIC VARIABLES
# ===================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_prefix" {
  description = "Project prefix for resource naming"
  type        = string
  default     = "tap"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Kinesis Configuration
variable "kinesis_telemetry_shard_count" {
  description = "Number of shards for telemetry stream"
  type        = number
}

variable "kinesis_retention_hours" {
  description = "Data retention period in hours"
  type        = number
}

# Lambda Configuration
variable "lambda_processor_memory" {
  description = "Memory allocation for Lambda processors"
  type        = number
}

variable "lambda_processor_timeout" {
  description = "Timeout for Lambda processors in seconds"
  type        = number
}

variable "lambda_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
}

# DynamoDB Configuration
variable "dynamodb_vehicle_rcu" {
  description = "Read capacity units for vehicle table"
  type        = number
}

variable "dynamodb_vehicle_wcu" {
  description = "Write capacity units for vehicle table"
  type        = number
}

variable "dynamodb_diagnostics_rcu" {
  description = "Read capacity units for diagnostics table"
  type        = number
}

variable "dynamodb_diagnostics_wcu" {
  description = "Write capacity units for diagnostics table"
  type        = number
}

variable "dynamodb_inventory_rcu" {
  description = "Read capacity units for inventory table"
  type        = number
}

variable "dynamodb_inventory_wcu" {
  description = "Write capacity units for inventory table"
  type        = number
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in Redis cluster"
  type        = number
}

# Aurora Configuration
variable "aurora_instance_class" {
  description = "Instance class for Aurora PostgreSQL"
  type        = string
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
}

variable "aurora_backup_retention" {
  description = "Backup retention period in days"
  type        = number
}

# Firehose Configuration
variable "firehose_buffer_size" {
  description = "Buffer size in MB for Firehose"
  type        = number
}

variable "firehose_buffer_interval" {
  description = "Buffer interval in seconds for Firehose"
  type        = number
}

# Step Functions Configuration
variable "step_functions_timeout_seconds" {
  description = "Step Functions execution timeout"
  type        = number
}