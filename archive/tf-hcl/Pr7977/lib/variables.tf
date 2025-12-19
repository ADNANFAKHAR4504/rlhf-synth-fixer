# variables.tf

variable "aws_region" {
  description = "AWS region for CloudWatch resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "platform"
}

variable "microservices" {
  description = "List of microservice names to monitor"
  type        = list(string)
  default     = ["auth-service", "payment-service", "order-service", "inventory-service", "notification-service"]
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster to monitor"
  type        = string
}

variable "alb_endpoints" {
  description = "Map of service names to their ALB endpoint URLs"
  type        = map(string)
  default = {
    "auth-service"         = "https://auth.example.com/health"
    "payment-service"      = "https://payment.example.com/health"
    "order-service"        = "https://order.example.com/health"
    "inventory-service"    = "https://inventory.example.com/health"
    "notification-service" = "https://notification.example.com/health"
  }
}

variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
}

variable "alert_webhook_url" {
  description = "Webhook URL for alert notifications (e.g., Slack, PagerDuty)"
  type        = string
  default     = ""
}

variable "warning_threshold_percentage" {
  description = "Warning threshold percentage for alarms"
  type        = number
  default     = 70
}

variable "critical_threshold_percentage" {
  description = "Critical threshold percentage for alarms"
  type        = number
  default     = 90
}

variable "dev_account_id" {
  description = "AWS Account ID for dev environment (for cross-account monitoring)"
  type        = string
  default     = ""
}

variable "staging_account_id" {
  description = "AWS Account ID for staging environment (for cross-account monitoring)"
  type        = string
  default     = ""
}

variable "additional_tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    CostCenter  = "engineering"
  }
}