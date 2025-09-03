variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Environment suffix for resource isolation"
  type        = string
  default     = ""
}

variable "random_id" {
  description = "Random identifier for resource naming"
  type        = string
  default     = "a1b2c3"
}