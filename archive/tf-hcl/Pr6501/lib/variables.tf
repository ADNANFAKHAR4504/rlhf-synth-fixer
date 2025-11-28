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
  description = "VPC ID where EMR will be deployed. When supplying vpc_id, also provide public_subnet_id and at least two private_subnet_ids."
  type        = string
  default     = null
}

variable "public_subnet_id" {
  description = "Public subnet ID for EMR master node"
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EMR core/task nodes across at least two AZs"
  type        = list(string)
  default     = null

  validation {
    condition     = var.private_subnet_ids == null || length(var.private_subnet_ids) >= 2
    error_message = "Provide at least two private subnet IDs spanning multiple AZs."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the automatically created EMR VPC (when existing VPC is not supplied)"
  type        = string
  default     = "10.60.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet when creating networking resources"
  type        = string
  default     = "10.60.0.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets when creating networking resources"
  type        = list(string)
  default     = ["10.60.1.0/24", "10.60.2.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "Provide at least two CIDR blocks for private subnets."
  }
}

variable "availability_zones" {
  description = "Availability zones used when creating networking resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "Provide at least two availability zones."
  }
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

variable "task_spot_bid_price" {
  description = "Maximum Spot bid price for task instance group"
  type        = string
  default     = "0.50"
}

variable "yarn_memory_scale_out_threshold" {
  description = "YARNMemoryAvailablePercentage threshold that triggers scaling out task nodes"
  type        = number
  default     = 25
}

variable "yarn_memory_scale_in_threshold" {
  description = "YARNMemoryAvailablePercentage threshold that triggers scaling in task nodes"
  type        = number
  default     = 75
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
  default     = null
}


variable "enable_in_transit_encryption" {
  description = "Enable TLS in-transit encryption for EMR cluster (requires valid TLS certificate)"
  type        = bool
  default     = false
}