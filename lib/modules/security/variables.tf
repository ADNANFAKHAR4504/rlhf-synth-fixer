variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  type        = string
}

variable "waf_rate_limits" {
  description = "Rate limiting rules for WAF"
  type = list(object({
    name        = string
    priority    = number
    limit       = number
    metric_name = string
  }))
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}
