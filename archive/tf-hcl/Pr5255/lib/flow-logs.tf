# VPC Flow Logs
module "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  source = "./modules/flow-logs"

  bucket_name = "shared-${var.region}-s3-flowlogs-${local.name_suffix}"
  name_suffix = local.name_suffix

  vpc_configs = {
    hub = {
      vpc_id      = module.vpc_hub.vpc_id
      name_prefix = "hub-${var.region}"
    }
    production = {
      vpc_id      = module.vpc_production.vpc_id
      name_prefix = "production-${var.region}"
    }
    development = {
      vpc_id      = module.vpc_development.vpc_id
      name_prefix = "development-${var.region}"
    }
  }

  transition_days = var.flow_logs_glacier_transition_days
  expiration_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Environment = "shared"
    Purpose     = "logging"
  })
}
