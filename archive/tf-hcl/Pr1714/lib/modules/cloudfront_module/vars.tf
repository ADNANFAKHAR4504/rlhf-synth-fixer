variable "environment" {
  description = "Environment name"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
}

# variable "s3_bucket_domain_name" {
#   description = "S3 bucket domain name"
#   type        = string
# }

variable "logging_bucket_domain_name" {
  description = "S3 logging bucket domain name"
  type        = string
}

variable "cloudfront_access_identity_path" {
    type = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}