variable "dr_role" {
  description = "DR role (primary or secondary)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the proxy will be created"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the RDS Proxy"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect to the proxy"
  type        = list(string)
}

variable "rds_cluster_id" {
  description = "RDS cluster identifier"
  type        = string
}

variable "secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for decrypting secrets"
  type        = string
}