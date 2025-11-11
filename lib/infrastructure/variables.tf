variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "db_cluster_identifier" {
  description = "RDS Aurora cluster identifier"
  type        = string
}

variable "db_master_username" {
  description = "RDS master username"
  type        = string
}

variable "db_master_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "cache_cluster_id" {
  description = "ElastiCache cluster ID"
  type        = string
}

variable "cognito_user_pool_name" {
  description = "Cognito user pool name"
  type        = string
}

variable "ecr_repository_names" {
  description = "List of ECR repository names"
  type        = list(string)
}

variable "github_repo" {
  description = "GitHub repository for OIDC"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    "iac-rlhf-amazon" = "true"
  }
}