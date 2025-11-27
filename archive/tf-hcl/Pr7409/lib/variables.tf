# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix to append to resource names for multiple deployments"
  type        = string
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

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster to monitor"
  type        = string
}

variable "rds_cluster_identifier" {
  description = "Identifier of the RDS Aurora cluster to monitor"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer"
  type        = string
}

variable "log_group_names" {
  description = "List of CloudWatch Log Group names for application logs"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "security_account_id" {
  description = "AWS account ID for cross-account log sharing (security account)"
  type        = string
  default     = ""
}

variable "critical_email_endpoints" {
  description = "List of email addresses for critical alerts"
  type        = list(string)
  default     = []
}

variable "warning_email_endpoints" {
  description = "List of email addresses for warning alerts"
  type        = list(string)
  default     = []
}

variable "info_email_endpoints" {
  description = "List of email addresses for info alerts"
  type        = list(string)
  default     = []
}

variable "critical_sms_endpoints" {
  description = "List of phone numbers for critical SMS alerts"
  type        = list(string)
  default     = []
}

variable "api_endpoint_url" {
  description = "API endpoint URL for synthetic monitoring"
  type        = string
}

variable "canary_check_interval" {
  description = "Interval in minutes for canary checks"
  type        = number
  default     = 5
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold percentage for alarms"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilization threshold percentage for alarms"
  type        = number
  default     = 80
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for ECS"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Enable AWS X-Ray distributed tracing"
  type        = bool
  default     = false
}

variable "enable_eventbridge_enrichment" {
  description = "Enable EventBridge rules for alarm enrichment"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "PaymentProcessing"
    ManagedBy = "Terraform"
  }
}
