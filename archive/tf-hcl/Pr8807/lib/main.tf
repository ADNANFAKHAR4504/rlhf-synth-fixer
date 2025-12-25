# Main Terraform configuration file
# This file serves as the entry point and references all other module files

# Data source for AWS account information
data "aws_caller_identity" "current" {}

# Data source for AWS region
data "aws_region" "current" {}

# Local values for common resource naming
locals {
  cluster_name = "eks-cluster-${var.environment_suffix}"
  common_tags = {
    Project     = "EKS Cluster"
    Environment = var.environment_suffix
    Team        = var.team
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }
}
