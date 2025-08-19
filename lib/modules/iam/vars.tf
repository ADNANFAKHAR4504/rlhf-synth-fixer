variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "s3_data_bucket_arn" {
  description = "The ARN of the S3 data bucket."
  type        = string
}

variable "iam_users" {
  description = "A list of IAM users to create."
  type        = list(string)
}
