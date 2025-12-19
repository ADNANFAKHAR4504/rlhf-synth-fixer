variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across environments"
  type        = string
}

variable "region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region Synthetics canaries"
  type        = string
  default     = "us-west-2"
}

variable "cost_center" {
  description = "Cost center tag for billing attribution"
  type        = string
  default     = "FinOps"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "Confidential"
}

variable "metric_retention_days" {
  description = "Metric data retention in days (15 months = 450 days)"
  type        = number
  default     = 450
}

variable "cross_account_ids" {
  description = "List of AWS account IDs for cross-account observability"
  type        = list(string)
  default     = []
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for Container Insights"
  type        = string
  default     = "microservices-cluster"
}

variable "monitored_endpoints" {
  description = "List of endpoints to monitor with Synthetics canaries"
  type        = list(string)
  default     = ["https://api.example.com/health", "https://app.example.com"]
}

variable "alarm_email_endpoints" {
  description = "List of email addresses for alarm notifications"
  type        = list(string)
  default     = []
}
