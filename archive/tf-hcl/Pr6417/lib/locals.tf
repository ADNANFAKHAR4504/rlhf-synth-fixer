locals {
  common_tags = {
    Environment = var.environmentSuffix
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
    Region      = var.aws_region
  }

  resource_prefix = "${var.project_name}-${var.environmentSuffix}"

  db_port = 3306
}