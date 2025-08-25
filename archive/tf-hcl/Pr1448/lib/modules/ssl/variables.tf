variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "Domain name for the SSL certificate"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for certificate validation"
  type        = string
}

variable "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
}

variable "load_balancer_security_group_id" {
  description = "Security group ID of the load balancer"
  type        = string
}
