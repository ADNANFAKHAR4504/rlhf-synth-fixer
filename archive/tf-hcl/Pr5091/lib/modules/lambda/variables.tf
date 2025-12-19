variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "microservices_count" {
  description = "Number of microservices"
  type        = number
}

variable "business_rules_count" {
  description = "Number of business rules"
  type        = number
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for Lambda"
  type        = list(string)
}

variable "dynamodb_stream_arn" {
  description = "DynamoDB stream ARN"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis endpoint"
  type        = string
}

variable "opensearch_endpoint" {
  description = "OpenSearch endpoint"
  type        = string
}

variable "dlq_arn" {
  description = "Dead letter queue ARN"
  type        = string
}

variable "validator_package_path" {
  description = "Path to validator Lambda package"
  type        = string
}

variable "cache_updater_package_path" {
  description = "Path to cache updater Lambda package"
  type        = string
}

variable "consistency_checker_package_path" {
  description = "Path to consistency checker Lambda package"
  type        = string
}

variable "rollback_package_path" {
  description = "Path to rollback Lambda package"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}

variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for log encryption"
  type        = string
}

variable "is_production" {
  description = "Whether this is a production environment"
  type        = bool
  default     = false
}
