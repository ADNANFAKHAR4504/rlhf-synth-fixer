variable "bucket_name" {
  description = "Name for the S3 bucket for video storage"
  type        = string
}

variable "cloudfront_oai_iam_arn" {
  description = "IAM ARN of the CloudFront Origin Access Identity"
  type        = string
  default     = ""
}
