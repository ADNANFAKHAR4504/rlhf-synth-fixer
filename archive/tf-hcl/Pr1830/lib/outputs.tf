# outputs.tf

# Environment-specific outputs using environment-agnostic modules
output "bucket_names" {
  value = {
    staging    = local.env == "staging" ? module.storage[0].bucket_name : null
    production = local.env == "production" ? module.storage[0].bucket_name : null
  }
}

output "security_group_ids" {
  value = {
    staging    = local.env == "staging" ? module.network[0].security_group_id : null
    production = local.env == "production" ? module.network[0].security_group_id : null
  }
}

output "iam_role_arns" {
  value = {
    staging    = local.env == "staging" ? module.iam_role[0].role_arn : null
    production = local.env == "production" ? module.iam_role[0].role_arn : null
  }
}

# Current environment outputs (for the environment being deployed)
output "current_bucket_name" {
  value = module.storage[0].bucket_name
}

output "current_security_group_id" {
  value = module.network[0].security_group_id
}

output "current_iam_role_arn" {
  value = module.iam_role[0].role_arn
}

# Environment information
output "current_environment" {
  value = local.env
}

output "current_region" {
  value = local.current_env_config.region
}
