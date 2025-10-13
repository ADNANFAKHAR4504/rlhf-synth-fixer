variable "primary_alb_arn" {
  description = "ARN of the primary ALB"
  type        = string
}

variable "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  type        = string
}

variable "primary_alb_dns" {
  description = "DNS name of the primary ALB"
  type        = string
}

variable "secondary_alb_dns" {
  description = "DNS name of the secondary ALB"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  type        = string
}


variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
}

variable "failover_threshold" {
  description = "Number of failed health checks before failover"
  type        = number
}

variable "primary_db_arn" {
  description = "ARN of the primary database"
  type        = string
}

variable "secondary_db_arn" {
  description = "ARN of the secondary database"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
