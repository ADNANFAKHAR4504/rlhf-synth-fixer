# variables.tf

variable "aws_region" {
  description = "AWS region for this workspace"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix (prod, staging, etc.)"
  type        = string
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Removed assume_role_arn - not needed for single account setup

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones for the current region"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = string
}

variable "ecs_task_memory" {
  description = "Memory for ECS task"
  type        = string
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "aurora_instance_class" {
  description = "Instance class for Aurora DB"
  type        = string
}

variable "aurora_engine_version" {
  description = "Aurora engine version"
  type        = string
  default     = "8.0.mysql_aurora.3.04.0"
}

variable "aurora_cluster_size" {
  description = "Number of instances in Aurora cluster"
  type        = number
  default     = 2
}

variable "s3_enable_replication" {
  description = "Enable S3 cross-region replication"
  type        = bool
  default     = false
}

variable "s3_replication_destinations" {
  description = "S3 replication destination regions"
  type        = list(string)
  default     = []
}

# Aurora Global Database variables
variable "aurora_global_cluster_id" {
  description = "Global cluster ID for Aurora Global Database (only for secondary regions)"
  type        = string
  default     = ""
}

variable "is_primary_region" {
  description = "Whether this is the primary region for Aurora Global Database"
  type        = bool
  default     = false
}

locals {
  project_name = "tap"
  environment  = var.environment_suffix
  region       = var.aws_region
  workspace    = terraform.workspace

  # Derive region code from region name
  region_code = {
    "us-east-1"      = "use1"
    "eu-west-1"      = "euw1"
    "ap-southeast-1" = "apse1"
  }[var.aws_region]

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Region      = local.region
    Workspace   = local.workspace
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    ManagedBy   = "terraform"
  }
}
