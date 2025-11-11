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
  default     = "admin"
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

variable "eks_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "rds_engine_version" {
  description = "RDS Aurora MySQL engine version"
  type        = string
  default     = "8.0.mysql_aurora.3.02.0"
}

variable "eks_node_instance_type" {
  description = "EKS node instance type"
  type        = string
  default     = "t3.medium"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}