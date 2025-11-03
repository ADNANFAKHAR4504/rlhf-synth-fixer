terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name (qua, staging, prod)"
  type        = string
  default     = "qua"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "image-processor"
}

variable "cost_center" {
  description = "Cost center for billing tracking"
  type        = string
  default     = "MEDIA-001"

}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = "kanakatla.k@turing.com"
}