variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "security"
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for data events logging"
  type        = string
}

variable "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN for CloudTrail"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}