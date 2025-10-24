variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must be lowercase alphanumeric with hyphens"
  }
}

variable "primary_region" {
  description = "Primary AWS region for global tables"
  type        = string
  default     = "us-east-1"
}

variable "replica_regions" {
  description = "List of replica regions for DynamoDB global tables"
  type        = list(string)
  default = [
    "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1",
    "ap-northeast-1", "ap-south-1", "ca-central-1", "sa-east-1",
    "eu-north-1", "ap-southeast-2", "us-east-2"
  ]
}

variable "microservices_count" {
  description = "Number of microservices"
  type        = number
  default     = 156
}

variable "business_rules_count" {
  description = "Number of business rules to validate"
  type        = number
  default     = 234
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ for production environments"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "platform-team"
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 7
}

variable "aws_region" {
  description = "AWS region for provider configuration"
  type        = string
  default     = "us-east-1"
}

locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "terraform"
      Service     = "feature-flags"
      CostCenter  = var.cost_center
      Owner       = var.owner
    }
  )

  name_prefix   = "${var.environment}-feature-flags"
  is_production = var.environment == "prod"

  # Ensure we don't exceed AWS limits
  max_sqs_queues_per_region = min(var.microservices_count, 1000)
  batch_size                = 10
}
