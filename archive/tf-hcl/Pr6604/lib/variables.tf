# variables.tf

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "FINTECH-001"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "confidential"
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "lambda_source_path" {
  description = "Path to Lambda deployment package"
  type        = string
  default     = "lambda.zip"

  validation {
    condition     = var.environment != "prod" || can(regex("^(?!.*lambda\\.zip$).*", var.lambda_source_path))
    error_message = "PRODUCTION SAFETY: Cannot use 'lambda.zip' placeholder in production environment. Please provide a valid Lambda deployment package path."
  }
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

variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN (optional). If provided, will use this instead of creating a new certificate."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
  default     = "payment-api.example.com"
}

variable "enable_certificate_validation" {
  description = "Enable ACM certificate validation (requires DNS records to be created). Set to false to skip validation and avoid deployment blocking."
  type        = bool
  default     = false
}