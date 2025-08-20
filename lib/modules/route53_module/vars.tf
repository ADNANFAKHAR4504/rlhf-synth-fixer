# Domain configuration
variable "domain_name" {
  description = "The domain name for the hosted zone (e.g., example.com)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9.-]+\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format (e.g., example.com)."
  }
}

variable "subdomain" {
  description = "Optional subdomain for the application (e.g., 'app' for app.example.com). Leave empty for apex domain"
  type        = string
  default     = ""
}

# Primary region ALB configuration
variable "primary_alb_dns_name" {
  description = "DNS name of the primary region Application Load Balancer"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Zone ID of the primary region Application Load Balancer"
  type        = string
}

# Secondary region ALB configuration
variable "secondary_alb_dns_name" {
  description = "DNS name of the secondary region Application Load Balancer"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Zone ID of the secondary region Application Load Balancer"
  type        = string
}

# Environment and tagging
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Health check configuration
variable "health_check_path" {
  description = "The path for Route 53 health checks"
  type        = string
  default     = "/health"
}

variable "health_check_failure_threshold" {
  description = "Number of consecutive health check failures before marking unhealthy"
  type        = number
  default     = 3
  validation {
    condition     = var.health_check_failure_threshold >= 1 && var.health_check_failure_threshold <= 10
    error_message = "Health check failure threshold must be between 1 and 10."
  }
}

variable "health_check_request_interval" {
  description = "The number of seconds between health check requests (10 or 30)"
  type        = number
  default     = 30
  validation {
    condition     = contains([10, 30], var.health_check_request_interval)
    error_message = "Health check request interval must be either 10 or 30 seconds."
  }
}

# Optional features
variable "create_www_record" {
  description = "Whether to create a www CNAME record pointing to the main domain"
  type        = bool
  default     = true
}