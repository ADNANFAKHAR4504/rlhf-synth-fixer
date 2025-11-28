/*
 * Provider Configuration File
 * ============================
 * This file defines the Terraform version constraints, required providers,
 * provider configuration with default tags, and all input variables used
 * throughout the infrastructure deployment.
 * 
 * The configuration ensures consistent tagging across all resources for
 * cost allocation, compliance tracking, and resource management.
 */

# Terraform version constraint ensuring compatibility with modern features
terraform {
  required_version = ">= 1.5.0"

  # Provider version constraints using pessimistic operator for stability
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Allows 5.x updates but prevents major version changes
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4" # Required for Lambda function packaging
    }
  }
  backend "s3" {

  }
}

/*
 * AWS Provider Configuration
 * ==========================
 * Configures the AWS provider with the target region and default tags
 * that will be automatically applied to all resources supporting tagging.
 * This ensures consistent metadata for compliance and cost tracking.
 */
provider "aws" {
  region = "us-east-1" # Primary region for financial services infrastructure

  # Default tags applied to all taggable resources for governance
  default_tags {
    tags = {
      Environment = "dev"           # Environment designation for resource lifecycle
      CostCenter  = "devops"        # Cost allocation for financial tracking
      ManagedBy   = "terraform"     # Infrastructure as Code management indicator
      Compliance  = "pci-dss"       # Regulatory compliance framework
      Owner       = "platform-team" # Team ownership for support routing
    }
  }
}

/*
 * Input Variables
 * ===============
 * These variables allow customization of the infrastructure deployment
 * while maintaining sensible defaults for development environments.
 */

# Environment designation variable for resource naming and configuration
variable "environment" {
  description = "Environment name used in resource naming and tagging (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# CloudWatch Logs retention period in days for compliance requirements
variable "retention_days" {
  description = "Number of days to retain CloudWatch Logs for microservices (compliance: minimum 30 days)"
  type        = number
  default     = 30

  validation {
    condition     = var.retention_days >= 1 && var.retention_days <= 3653
    error_message = "Retention days must be between 1 and 3653 (10 years)."
  }
}

# List of all microservice names including future services for scalability
variable "service_names" {
  description = "List of microservice names for observability infrastructure (includes future services)"
  type        = list(string)
  default = [
    "auth-service",        # Authentication and authorization service
    "payment-service",     # Payment processing service
    "order-service",       # Order management service
    "inventory-service",   # Inventory tracking service (future)
    "notification-service" # Notification dispatch service (future)
  ]

  validation {
    condition     = length(var.service_names) >= 3
    error_message = "At least 3 service names must be defined."
  }
}

# Configurable alarm thresholds for flexible monitoring policies
variable "alarm_thresholds" {
  description = "Map of alarm threshold values for monitoring configuration"
  type        = map(number)
  default = {
    error_rate_percent        = 5    # Percentage of errors triggering alarm
    response_time_ms          = 1000 # Response time in milliseconds
    error_count_threshold     = 10   # Absolute error count in 5 minutes
    request_rate_drop_percent = 50   # Percentage drop indicating outage
    anomaly_std_deviations    = 2    # Standard deviations for anomaly detection
  }

  validation {
    condition = alltrue([
      var.alarm_thresholds["error_rate_percent"] > 0,
      var.alarm_thresholds["response_time_ms"] > 0,
      var.alarm_thresholds["error_count_threshold"] > 0
    ])
    error_message = "All alarm thresholds must be positive numbers."
  }
}

variable "critical_alert_email" {
  description = "Email address to receive critical alerts"
  type        = string
  default     = "kanakatla.k@turing.com"

}