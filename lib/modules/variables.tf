variable "bucket_name" {
  type        = string
  default     = null
  description = "Name of the S3 bucket to create. If not provided, a unique name will be generated"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment name for tagging"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to the bucket"
}

variable "project_name" {
  type        = string
  default     = "tap"
  description = "Project name to use in bucket naming"
}
