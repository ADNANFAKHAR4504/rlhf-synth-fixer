locals {
  common_tags = {
    Owner       = var.owner_tag
    Environment = var.environment_tag
    CostCenter  = var.cost_center_tag
    ManagedBy   = "Terraform"
  }

  # Business hours restriction (9 AM - 6 PM EST)
  business_hours_condition = {
    DateGreaterThan = {
      "aws:CurrentTime" = "2024-01-01T14:00:00Z" # 9 AM EST
    }
    DateLessThan = {
      "aws:CurrentTime" = "2024-01-01T23:00:00Z" # 6 PM EST
    }
  }
}
