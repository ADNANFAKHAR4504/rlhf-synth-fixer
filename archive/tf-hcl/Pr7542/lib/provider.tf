# =============================================================================
# Provider Configuration for Cost-Optimized EMR Data Pipeline
# =============================================================================
# This file configures Terraform providers and input variables for deploying
# a production-ready big data pipeline with cost optimization features including
# spot instances, S3 lifecycle policies, and auto-termination policies.
# Target deployment: us-east-1 for cost-effective data processing
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

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

# =============================================================================
# AWS Provider with Default Tags for Cost Tracking and Compliance
# =============================================================================
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment        = var.environment
      Application        = "emr-data-pipeline"
      ManagedBy          = "terraform"
      Owner              = "data-engineering"
      CostCenter         = "analytics"
      DataClassification = "confidential"
    }
  }
}

# =============================================================================
# Input Variables for Pipeline Configuration
# =============================================================================
# These variables enable environment-specific deployments and cost optimization
# tuning without modifying the core infrastructure code
# =============================================================================

variable "environment" {
  description = "Environment name for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "emr_release_label" {
  description = "EMR release version with Spark, Hadoop, and Hive"
  type        = string
  default     = "emr-6.10.0"
}

variable "master_instance_type" {
  description = "Instance type for EMR master node (on-demand for stability)"
  type        = string
  default     = "m5.xlarge"
}

variable "core_instance_type" {
  description = "Instance type for EMR core nodes (on-demand for HDFS reliability)"
  type        = string
  default     = "m5.xlarge"
}

variable "task_instance_types" {
  description = "Instance types for EMR task nodes (spot for cost savings)"
  type        = list(string)
  default     = ["m5.xlarge", "m5.2xlarge"]
}

variable "spot_bid_percentage" {
  description = "Percentage of on-demand price for spot instances (60%+ savings)"
  type        = number
  default     = 80
}

variable "idle_timeout_seconds" {
  description = "EMR auto-termination idle timeout in seconds (cost safety net)"
  type        = number
  default     = 7200 # 2 hours
}

variable "glacier_transition_days" {
  description = "Days before transitioning processed data to Glacier Deep Archive"
  type        = number
  default     = 90
}

variable "notification_email" {
  description = "Email address for SNS notifications (requires confirmation)"
  type        = string
  default     = "kanakatla.k@turing.com"
}