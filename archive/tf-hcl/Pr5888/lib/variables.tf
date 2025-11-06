variable "environment_suffix" {
  description = "Environment suffix for resource naming to support multiple deployments"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the existing ACM certificate for custom domain"
  type        = string
}

variable "custom_domain_name" {
  description = "Custom domain name for API Gateway"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}
