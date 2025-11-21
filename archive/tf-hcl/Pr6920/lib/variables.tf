variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness. Can be set via TF_VAR_environment_suffix environment variable or ENVIRONMENT_SUFFIX in CI."
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "environment_suffix must be between 1 and 20 characters"
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "service_name" {
  description = "Service name for tagging"
  type        = string
  default     = "microservices-platform"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "api_cpu" {
  description = "CPU units for API service (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "Memory for API service in MB"
  type        = number
  default     = 512
}

variable "worker_cpu" {
  description = "CPU units for worker service"
  type        = number
  default     = 512
}

variable "worker_memory" {
  description = "Memory for worker service in MB"
  type        = number
  default     = 1024
}

variable "scheduler_cpu" {
  description = "CPU units for scheduler service"
  type        = number
  default     = 256
}

variable "scheduler_memory" {
  description = "Memory for scheduler service in MB"
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "worker_desired_count" {
  description = "Desired number of worker tasks"
  type        = number
  default     = 2
}

variable "scheduler_desired_count" {
  description = "Desired number of scheduler tasks"
  type        = number
  default     = 1
}

variable "container_image" {
  description = "Container image for services"
  type        = string
  default     = "nginx:latest"
}