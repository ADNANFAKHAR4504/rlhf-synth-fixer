variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
}

variable "primary_endpoint" {
  description = "Primary endpoint URL"
  type        = string
}

variable "secondary_endpoint" {
  description = "Secondary endpoint URL"
  type        = string
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 10
}

variable "failure_threshold" {
  description = "Number of consecutive failures before marking unhealthy"
  type        = number
  default     = 3
}
