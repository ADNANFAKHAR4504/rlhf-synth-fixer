variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
}

variable "primary_subnet_ids" {
  description = "Primary region subnet IDs"
  type        = list(string)
}

variable "secondary_subnet_ids" {
  description = "Secondary region subnet IDs"
  type        = list(string)
}

variable "primary_db_sg_id" {
  description = "Primary database security group ID"
  type        = string
}

variable "secondary_db_sg_id" {
  description = "Secondary database security group ID"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "Primary KMS key ARN"
  type        = string
}

variable "secondary_kms_key_arn" {
  description = "Secondary KMS key ARN"
  type        = string
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

