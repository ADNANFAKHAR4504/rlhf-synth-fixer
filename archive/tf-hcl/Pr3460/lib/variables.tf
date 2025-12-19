# variables.tf
# Variable definitions for AWS region migration

variable "source_region" {
  description = "Source AWS region for migration (us-west-1)"
  type        = string
  default     = "us-west-1"
}

variable "target_region" {
  description = "Target AWS region for migration (us-west-2)"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "serverless-app"
}

variable "dynamodb_table_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
  default     = "serverless_app"
}

variable "dax_node_type" {
  description = "DAX cluster node type"
  type        = string
  default     = "dax.r5.large"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.large"
}

variable "kinesis_shard_count" {
  description = "Number of Kinesis shards"
  type        = number
  default     = 10
}

variable "alert_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = "alerts@example.com"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "prod"
    Application = "ServerlessApp"
    ManagedBy   = "Terraform"
    Project     = "RegionMigration"
  }
}

# Migration-specific variables
variable "migration_phase" {
  description = "Migration phase (preparation, migration, validation, cutover)"
  type        = string
  default     = "preparation"
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication during migration"
  type        = bool
  default     = false
}

variable "dns_ttl_seconds" {
  description = "DNS TTL for cutover"
  type        = number
  default     = 60
}
