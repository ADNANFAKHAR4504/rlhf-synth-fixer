variable "domain_name" {
  description = "Domain name for hosted zone"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_endpoint" {
  description = "Primary ALB DNS name"
  type        = string
}

variable "secondary_endpoint" {
  description = "Secondary ALB DNS name"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Primary ALB hosted zone ID"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Secondary ALB hosted zone ID"
  type        = string
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
}
