terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
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
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Environment        = "dev"
      DataClassification = "sensitive"
      Compliance         = "pci-dss"
      Owner              = "platform-team"
      ManagedBy          = "terraform"
    }
  }
}

provider "random" {}
provider "archive" {}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}

variable "lambda_memory" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 360
}

variable "dlq_retention_days" {
  description = "DLQ message retention in days"
  type        = number
  default     = 14
}