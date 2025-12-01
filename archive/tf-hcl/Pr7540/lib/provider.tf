# =========================================
# Terraform and Provider Configuration
# =========================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "prd"
      Application = "payment-processing"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
      CostCenter  = "engineering"
      Compliance  = "pci-dss"
    }
  }
}

# =========================================
# Input Variables
# =========================================

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "prd"
}

variable "availability_zones" {
  description = "List of availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = string
  default     = "1024"
}

variable "ecs_task_memory" {
  description = "Memory in MB for ECS task"
  type        = string
  default     = "2048"
}

variable "ecs_min_tasks" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "ecs_max_tasks" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "aurora_instance_class" {
  description = "Instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r6g.large"
}

variable "backup_retention_days" {
  description = "Aurora backup retention period in days"
  type        = number
  default     = 30
}