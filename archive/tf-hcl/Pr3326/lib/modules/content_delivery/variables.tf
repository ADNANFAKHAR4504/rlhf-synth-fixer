variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "s3_bucket_domain" {
  description = "Domain name of the S3 bucket"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "geo_restrictions" {
  description = "Geo restriction settings for CloudFront"
  type = object({
    restriction_type = string
    locations        = list(string)
  })
}

variable "ttl_settings" {
  description = "TTL settings for CloudFront cache behaviors"
  type = object({
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
  })
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for CloudFront"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "regions" {
  description = "List of AWS regions for latency-based routing"
  type        = list(string)
}
