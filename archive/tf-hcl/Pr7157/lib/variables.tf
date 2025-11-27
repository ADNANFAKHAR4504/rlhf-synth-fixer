variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "compliance-check"
}

variable "aws_region" {
  description = "AWS region for resource analysis"
  type        = string
  default     = "us-east-1"
}

# EC2 Variables
variable "ec2_instance_ids" {
  description = "List of EC2 instance IDs to analyze for compliance"
  type        = list(string)
  default     = []
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs for EC2 instances"
  type        = list(string)
  default     = []
}

# RDS Variables
variable "rds_instance_identifiers" {
  description = "List of RDS instance identifiers to analyze"
  type        = list(string)
  default     = []
}

variable "minimum_backup_retention_days" {
  description = "Minimum required backup retention period in days"
  type        = number
  default     = 7
}

# S3 Variables
variable "s3_bucket_names" {
  description = "List of S3 bucket names to analyze for security compliance"
  type        = list(string)
  default     = []
}

variable "production_bucket_names" {
  description = "List of S3 bucket names considered production (require versioning)"
  type        = list(string)
  default     = []
}

# IAM Variables
variable "iam_role_names" {
  description = "List of IAM role names to analyze for security compliance"
  type        = list(string)
  default     = []
}

# VPC Variables
variable "vpc_ids" {
  description = "List of VPC IDs to analyze (leave empty to query all VPCs)"
  type        = list(string)
  default     = []
}

variable "required_tags" {
  description = "Map of required tags for production resources"
  type        = map(string)
  default = {
    Environment = ""
    Owner       = ""
    Project     = ""
  }
}

variable "sensitive_ports" {
  description = "List of ports that should not be open to 0.0.0.0/0"
  type        = list(number)
  default     = [22, 3389, 3306, 5432, 1433, 27017]
}
