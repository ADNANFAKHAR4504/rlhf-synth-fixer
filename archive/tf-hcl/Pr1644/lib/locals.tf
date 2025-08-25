locals {
  common_tags = merge({
    Project     = "IaC - AWS Nova Model Breaking"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }, var.tags)

  name_prefix = "${var.org_prefix}-${var.environment}-${var.environment_suffix}"
}
