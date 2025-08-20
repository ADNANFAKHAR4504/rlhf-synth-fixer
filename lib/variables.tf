# variables.tf
variable "staging_region" {
  description = "AWS region for staging"
  default     = "ap-south-1"
}

variable "production_region" {
  description = "AWS region for production"
  default     = "us-east-1"
}
