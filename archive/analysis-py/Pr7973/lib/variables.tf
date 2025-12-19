# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
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

# Infrastructure analysis variables
variable "ec2_instance_ids" {
  description = "List of EC2 instance IDs to analyze"
  type        = list(string)
  default     = []
}

variable "rds_db_instance_ids" {
  description = "List of RDS database instance identifiers to analyze"
  type        = list(string)
  default     = []
}

variable "s3_bucket_names" {
  description = "List of S3 bucket names to analyze"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs to analyze"
  type        = list(string)
  default     = []
}