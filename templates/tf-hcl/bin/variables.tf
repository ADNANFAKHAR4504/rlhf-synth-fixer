variable "secret_key" {}
variable "access_key" {}
variable "region" {}
variable "environment_suffix" {
  type        = string
  default     = "dev"
  description = "Environment suffix like dev/staging/prod"
}

variable "stack_name" {
  type        = string
  default     = "tap-stack"
  description = "Stack name used for backend key"
}

variable "state_bucket" {
  type        = string
  default     = "iac-rlhf-tf-states"
  description = "S3 bucket name for remote state"
}

variable "state_bucket_region" {
  type        = string
  default     = "us-east-1"
  description = "Region of the S3 state bucket"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS provider region"
}

variable "default_tags" {
  type = map(string)
  default = {
    Project = "MyApp"
    Owner   = "DevOps"
  }
  description = "Default tags applied to all resources"
}

variable "s3_bucket_name" {
  type        = string
  default     = "rlhf-demo-54321"
  description = "Demo to create a bucket"
}
