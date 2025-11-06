variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "microservices" {
  description = "List of microservices to deploy"
  type        = list(string)
  default = [
    "payment-api",
    "fraud-detection",
    "notification-service",
    "audit-logger",
    "webhook-processor"
  ]
}

variable "service_config" {
  description = "Configuration for each microservice"
  type = map(object({
    cpu    = number
    memory = number
    port   = number
    path   = string
  }))
  default = {
    payment-api = {
      cpu    = 512
      memory = 1024
      port   = 8080
      path   = "/api/payments/*"
    }
    fraud-detection = {
      cpu    = 1024
      memory = 2048
      port   = 8081
      path   = "/api/fraud/*"
    }
    notification-service = {
      cpu    = 256
      memory = 512
      port   = 8082
      path   = "/api/notifications/*"
    }
    audit-logger = {
      cpu    = 256
      memory = 512
      port   = 8083
      path   = "/api/audit/*"
    }
    webhook-processor = {
      cpu    = 512
      memory = 1024
      port   = 8084
      path   = "/api/webhooks/*"
    }
  }
}

variable "desired_count" {
  description = "Desired number of tasks per service"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for scaling"
  type        = number
  default     = 70
}

variable "scale_down_cpu_threshold" {
  description = "CPU threshold for scaling down"
  type        = number
  default     = 30
}

variable "ecr_image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}
