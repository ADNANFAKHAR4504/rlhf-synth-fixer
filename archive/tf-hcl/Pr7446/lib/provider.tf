provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Team        = var.team
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
      Project     = "eks-cluster"
    }
  }
}
