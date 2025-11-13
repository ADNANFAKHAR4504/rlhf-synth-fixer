variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names for environment isolation"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "trading-analytics"
}

variable "vpc_id" {
  description = "VPC ID where EMR will be deployed"
  type        = string
  default     = "vpc-1234567890abcdef0"
}

variable "public_subnet_id" {
  description = "Public subnet ID for EMR master node"
  type        = string
  default     = "subnet-aaaaaaaaaaaaaaaaa"
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EMR core/task nodes across at least two AZs"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "Provide at least two private subnet IDs spanning multiple AZs."
  }

  default = [
    "subnet-bbbbbbbbbbbbbbbbb",
    "subnet-ccccccccccccccccc"
  ]
}

variable "corporate_cidr" {
  description = "Corporate CIDR block for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "s3_raw_bucket_name" {
  description = "Optional override for the raw input S3 bucket name"
  type        = string
  default     = null
}

variable "s3_curated_bucket_name" {
  description = "Optional override for the curated output S3 bucket name"
  type        = string
  default     = null
}

variable "s3_logs_bucket_name" {
  description = "Optional override for the EMR logs S3 bucket name"
  type        = string
  default     = null
}

variable "emr_release_label" {
  description = "EMR release version"
  type        = string
  default     = "emr-6.9.0"
}

variable "master_instance_type" {
  description = "Instance type for master node"
  type        = string
  default     = "m5.xlarge"
}

variable "core_instance_type" {
  description = "Instance type for core nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "core_instance_count" {
  description = "Number of core instances"
  type        = number
  default     = 2

  validation {
    condition     = var.core_instance_count >= 2
    error_message = "Core instance group must contain at least two instances for HDFS replication."
  }
}

variable "task_instance_type" {
  description = "Instance type for task nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "task_instance_min" {
  description = "Minimum number of task instances"
  type        = number
  default     = 0
}

variable "task_instance_max" {
  description = "Maximum number of task instances"
  type        = number
  default     = 10
}

variable "yarn_memory_target" {
  description = "Target value for YARNMemoryAvailablePercentage used by the autoscaling policy"
  type        = number
  default     = 25
}

variable "idle_timeout_seconds" {
  description = "Idle timeout in seconds (8 hours)"
  type        = number
  default     = 28800
}

variable "step_concurrency_level" {
  description = "Maximum concurrent steps"
  type        = number
  default     = 5
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = "emr-default-key"
}

variable "emr_kms_key_deletion_window_days" {
  description = "Number of days before the EMR-specific KMS key is deleted after destroy"
  type        = number
  default     = 7

  validation {
    condition     = var.emr_kms_key_deletion_window_days >= 7 && var.emr_kms_key_deletion_window_days <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}