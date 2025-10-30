locals {
  # stable unique suffix per deployment
  suffix     = random_string.suffix.result
  # Use Go reference time layout for formatdate (2006-01-02T15:04:05Z07:00)
  # to produce a compact YYYYMMDDHHMMSS timestamp
  timestamp  = formatdate("20060102150405", timestamp())

  name_prefix = join("-", [var.project, var.environment, local.suffix, local.timestamp])

  common_tags = merge({
    Environment       = var.environment
    Project           = var.project
    CostCenter        = var.cost_center
    CreatedBy         = "iac-automation"
    iac-rlhf-amazon   = "true"
  }, {})
}
