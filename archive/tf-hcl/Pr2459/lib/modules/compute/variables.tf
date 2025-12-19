variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "prod-project-166"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  default     = ""
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
  default     = []
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "EC2 Key Pair name (optional - leave empty to launch without key pair)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}