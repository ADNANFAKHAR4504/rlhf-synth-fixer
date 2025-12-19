variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for ALB"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "instance_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "iam_instance_profile" {
  description = "IAM instance profile name for EC2"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for EBS encryption"
  type        = string
}

variable "alb_dns" {
  description = "ALB DNS name"
  type        = string
  default     = ""
}

variable "s3_bucket" {
  description = "S3 bucket name"
  type        = string
  default     = ""
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
  default     = ""
}

variable "secret_name" {
  description = "Secrets Manager secret name"
  type        = string
  default     = ""
}

variable "kms_rds_key_id" {
  description = "KMS key ID for RDS"
  type        = string
  default     = ""
}

variable "kms_ebs_key_id" {
  description = "KMS key ID for EBS"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}