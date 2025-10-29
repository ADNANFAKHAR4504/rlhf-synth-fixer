# === VARIABLES ===
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project - used for resource naming"
  type        = string
  default     = "app-pipeline"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "owner_email" {
  description = "Email of the project owner for tagging"
  type        = string
  default     = "devops@example.com"
}

variable "source_bucket_name" {
  description = "S3 bucket where source zips are uploaded"
  type        = string
  default     = "app-source-uploads" # You'll want to make this unique
}

variable "source_key_prefix" {
  description = "S3 key prefix to watch for changes"
  type        = string
  default     = "releases/"
}

variable "notification_emails" {
  description = "Email addresses for pipeline notifications"
  type        = list(string)
  default     = ["team@example.com"] # Replace with your email
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ecs_cpu" {
  description = "CPU units for ECS task (256, 512, 1024, etc.)"
  type        = string
  default     = "256"
}

variable "ecs_memory" {
  description = "Memory for ECS task in MB (512, 1024, 2048, etc.)"
  type        = string
  default     = "512"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 80
}

variable "image_tag" {
  description = "Initial image tag for ECS (will be updated by pipeline)"
  type        = string
  default     = "latest"
}
