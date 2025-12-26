locals {
  common_tags = {
    Environment  = var.environment
    ManagedBy    = "Terraform"
    CostCenter   = var.cost_center
    LastModified = timestamp()
    Project      = "Infrastructure-Refactoring"
  }

  resource_prefix = "finserv-${var.environment_suffix}"
}
