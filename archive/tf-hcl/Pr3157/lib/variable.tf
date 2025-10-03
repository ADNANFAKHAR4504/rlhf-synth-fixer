variable "app_name" {
  description = "Name of the application"
  default     = "search-api"
}

variable "environment" {
  description = "Environment (e.g., dev, prod)"
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for deployment"
  default     = "us-east-1"
}