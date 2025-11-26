variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_lb_dns" {
  description = "Primary load balancer DNS name"
  type        = string
}

variable "primary_lb_zone_id" {
  description = "Primary load balancer zone ID"
  type        = string
}

variable "dr_lb_dns" {
  description = "DR load balancer DNS name"
  type        = string
}

variable "dr_lb_zone_id" {
  description = "DR load balancer zone ID"
  type        = string
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
