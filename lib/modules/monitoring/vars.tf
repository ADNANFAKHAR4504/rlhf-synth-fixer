variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "cloudtrail_bucket_name" {
  description = "The name of the S3 bucket for CloudTrail logs."
  type        = string
}
