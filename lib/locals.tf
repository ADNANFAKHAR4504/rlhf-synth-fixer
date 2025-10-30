locals {
  # stable unique suffix per deployment
  suffix     = random_string.suffix.result
  timestamp  = formatdate("YYYYMMDDHHMMSS", timestamp())

  name_prefix = join("-", [var.project, var.environment, local.suffix, local.timestamp])

  common_tags = merge({
    Environment       = var.environment
    Project           = var.project
    CostCenter        = var.cost_center
    CreatedBy         = "iac-automation"
    iac-rlhf-amazon   = "true"
  }, {})
}
