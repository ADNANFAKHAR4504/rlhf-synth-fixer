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

# Centralized variables from tap_stack.tf

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
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
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# API Gateway Configuration
variable "api_gateway_name" {
  description = "Name for API Gateway"
  type        = string
  default     = "tap-maintenance-api"
}

variable "api_gateway_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}

variable "api_gateway_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 1000
}

variable "api_gateway_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

variable "api_key_required" {
  description = "Require API key for API Gateway"
  type        = bool
  default     = true
}

# DynamoDB Configuration
variable "dynamodb_maintenance_requests_read_capacity" {
  description = "Read capacity for maintenance_requests table"
  type        = number
  default     = 5
}

variable "dynamodb_maintenance_requests_write_capacity" {
  description = "Write capacity for maintenance_requests table"
  type        = number
  default     = 5
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PROVISIONED"
}

variable "dynamodb_vendor_availability_read_capacity" {
  description = "Read capacity for vendor_availability table"
  type        = number
  default     = 5
}

variable "dynamodb_vendor_availability_write_capacity" {
  description = "Write capacity for vendor_availability table"
  type        = number
  default     = 5
}

variable "dynamodb_priority_matrix_read_capacity" {
  description = "Read capacity for priority_matrix table"
  type        = number
  default     = 2
}

variable "dynamodb_priority_matrix_write_capacity" {
  description = "Write capacity for priority_matrix table"
  type        = number
  default     = 2
}

variable "dynamodb_quality_rules_read_capacity" {
  description = "Read capacity for quality_rules table"
  type        = number
  default     = 2
}

variable "dynamodb_quality_rules_write_capacity" {
  description = "Write capacity for quality_rules table"
  type        = number
  default     = 2
}

variable "dynamodb_penalty_rates_read_capacity" {
  description = "Read capacity for penalty_rates table"
  type        = number
  default     = 2
}

variable "dynamodb_penalty_rates_write_capacity" {
  description = "Write capacity for penalty_rates table"
  type        = number
  default     = 2
}

variable "dynamodb_vendor_scores_read_capacity" {
  description = "Read capacity for vendor_scores table"
  type        = number
  default     = 3
}

variable "dynamodb_vendor_scores_write_capacity" {
  description = "Write capacity for vendor_scores table"
  type        = number
  default     = 3
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.12"
}

variable "lambda_validator_memory" {
  description = "Memory for validator Lambda"
  type        = number
  default     = 256
}

variable "lambda_validator_timeout" {
  description = "Timeout for validator Lambda"
  type        = number
  default     = 30
}

variable "lambda_router_memory" {
  description = "Memory for router Lambda"
  type        = number
  default     = 512
}

variable "lambda_router_timeout" {
  description = "Timeout for router Lambda"
  type        = number
  default     = 60
}

variable "lambda_notification_memory" {
  description = "Memory for notification Lambda"
  type        = number
  default     = 256
}

variable "lambda_notification_timeout" {
  description = "Timeout for notification Lambda"
  type        = number
  default     = 30
}

variable "lambda_status_processor_memory" {
  description = "Memory for status processor Lambda"
  type        = number
  default     = 256
}

variable "lambda_status_processor_timeout" {
  description = "Timeout for status processor Lambda"
  type        = number
  default     = 30
}

variable "lambda_workflow_controller_memory" {
  description = "Memory for workflow controller Lambda"
  type        = number
  default     = 512
}

variable "lambda_workflow_controller_timeout" {
  description = "Timeout for workflow controller Lambda"
  type        = number
  default     = 60
}

variable "lambda_quality_check_memory" {
  description = "Memory for quality check Lambda"
  type        = number
  default     = 256
}

variable "lambda_quality_check_timeout" {
  description = "Timeout for quality check Lambda"
  type        = number
  default     = 30
}

variable "lambda_compliance_checker_memory" {
  description = "Memory for compliance checker Lambda"
  type        = number
  default     = 512
}

variable "lambda_compliance_checker_timeout" {
  description = "Timeout for compliance checker Lambda"
  type        = number
  default     = 300
}

variable "lambda_report_generator_memory" {
  description = "Memory for report generator Lambda"
  type        = number
  default     = 1024
}

variable "lambda_report_generator_timeout" {
  description = "Timeout for report generator Lambda"
  type        = number
  default     = 300
}

variable "lambda_redis_updater_memory" {
  description = "Memory for Redis updater Lambda"
  type        = number
  default     = 256
}

variable "lambda_redis_updater_timeout" {
  description = "Timeout for Redis updater Lambda"
  type        = number
  default     = 60
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_multi_az_enabled" {
  description = "Enable Multi-AZ for Redis"
  type        = bool
  default     = false
}

# Aurora Configuration
variable "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
  default     = "tap-aurora-cluster"
}

variable "aurora_master_username" {
  description = "Aurora master username"
  type        = string
  default     = "tapmaster"
}

variable "aurora_database_name" {
  description = "Aurora database name"
  type        = string
  default     = "tapdb"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "aurora_min_capacity" {
  description = "Aurora serverless minimum capacity"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora serverless maximum capacity"
  type        = number
  default     = 1
}

variable "aurora_backup_retention_period" {
  description = "Aurora backup retention period in days"
  type        = number
  default     = 7
}

variable "aurora_preferred_backup_window" {
  description = "Aurora preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "aurora_preferred_maintenance_window" {
  description = "Aurora preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# SNS Topic Names
variable "sns_topic_request_assigned" {
  description = "Name for request-assigned SNS topic"
  type        = string
  default     = "tap-request-assigned"
}

variable "sns_topic_status_updates" {
  description = "Name for status-updates SNS topic"
  type        = string
  default     = "tap-status-updates"
}

variable "sns_topic_compliance_alerts" {
  description = "Name for compliance-alerts SNS topic"
  type        = string
  default     = "tap-compliance-alerts"
}

variable "sns_topic_escalation_alerts" {
  description = "Name for escalation-alerts SNS topic"
  type        = string
  default     = "tap-escalation-alerts"
}

# SQS Queue Configuration
variable "sqs_vendor_notifications_queue" {
  description = "Name for vendor notifications queue"
  type        = string
  default     = "vendor-notifications"
}

variable "sqs_tenant_acknowledgments_queue" {
  description = "Name for tenant acknowledgments queue"
  type        = string
  default     = "tenant-acknowledgments"
}

variable "sqs_visibility_timeout" {
  description = "Visibility timeout for SQS queues"
  type        = number
  default     = 30
}

variable "sqs_message_retention_seconds" {
  description = "Message retention period in seconds"
  type        = number
  default     = 345600
}

variable "sqs_max_receive_count" {
  description = "Max receive count before moving to DLQ"
  type        = number
  default     = 5
}

# EventBridge Configuration
variable "eventbridge_compliance_schedule" {
  description = "Schedule for compliance checks (cron)"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

variable "eventbridge_redis_update_schedule" {
  description = "Schedule for Redis updates (rate)"
  type        = string
  default     = "rate(5 minutes)"
}

variable "eventbridge_emergency_pattern" {
  description = "Event pattern for emergency events"
  type        = string
  default     = "{\"source\": [\"tap.emergency\"], \"detail-type\": [\"EmergencyEvent\"]}"
}

# S3 Buckets
variable "s3_archive_bucket" {
  description = "Name for archive S3 bucket"
  type        = string
  default     = "archive"
}

variable "s3_compliance_bucket" {
  description = "Name for compliance S3 bucket"
  type        = string
  default     = "compliance"
}

variable "s3_archive_lifecycle_days" {
  description = "Lifecycle days for archive bucket"
  type        = number
  default     = 365
}

variable "s3_compliance_lifecycle_days" {
  description = "Lifecycle days for compliance bucket"
  type        = number
  default     = 180
}

# Step Functions Configuration
variable "step_function_name" {
  description = "Name for maintenance workflow step function"
  type        = string
  default     = "tap-maintenance-workflow"
}

variable "step_function_timeout_seconds" {
  description = "Timeout for step function execution"
  type        = number
  default     = 900
}

variable "step_function_retry_attempts" {
  description = "Retry attempts for step function tasks"
  type        = number
  default     = 3
}

# CloudWatch Configuration
variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "cloudwatch_alarm_api_error_threshold" {
  description = "API error rate alarm threshold"
  type        = number
  default     = 5
}

variable "cloudwatch_alarm_lambda_duration_threshold" {
  description = "Lambda duration alarm threshold (ms)"
  type        = number
  default     = 5000
}

variable "cloudwatch_alarm_dynamodb_throttle_threshold" {
  description = "DynamoDB throttle events threshold"
  type        = number
  default     = 10
}

variable "cloudwatch_alarm_redis_latency_threshold" {
  description = "Redis latency alarm threshold (ms)"
  type        = number
  default     = 50
}

variable "cloudwatch_alarm_aurora_connections_threshold" {
  description = "Aurora connections alarm threshold"
  type        = number
  default     = 100
}

variable "cloudwatch_alarm_sqs_age_threshold" {
  description = "SQS message age alarm threshold (seconds)"
  type        = number
  default     = 300
}

variable "cloudwatch_alarm_stepfunctions_failure_threshold" {
  description = "Step Functions failures alarm threshold"
  type        = number
  default     = 1
}
