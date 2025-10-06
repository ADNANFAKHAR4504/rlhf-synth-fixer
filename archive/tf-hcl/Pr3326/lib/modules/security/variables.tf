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

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  type        = string
  default     = ""
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

variable "bastion_allowed_cidr" {
  description = "CIDR blocks allowed to access bastion host"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
  default     = []
}

variable "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  type        = string
  default     = ""
}
