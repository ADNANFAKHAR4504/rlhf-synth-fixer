# outputs.tf
output "bucket_names" {
  value = {
    staging    = local.env == "staging" ? module.storage_staging[0].bucket_name : null
    production = local.env == "production" ? module.storage_production[0].bucket_name : null
  }
}

output "security_group_ids" {
  value = {
    staging    = local.env == "staging" ? module.network_staging[0].security_group_id : null
    production = local.env == "production" ? module.network_production[0].security_group_id : null
  }
}

output "iam_role_arns" {
  value = {
    staging    = local.env == "staging" ? module.iam_role_staging[0].role_arn : null
    production = local.env == "production" ? module.iam_role_production[0].role_arn : null
  }
}

# Environment-specific outputs for current deployment
output "current_bucket_name" {
  value = local.env == "staging" ? module.storage_staging[0].bucket_name : module.storage_production[0].bucket_name
}

output "current_security_group_id" {
  value = local.env == "staging" ? module.network_staging[0].security_group_id : module.network_production[0].security_group_id
}

output "current_iam_role_arn" {
  value = local.env == "staging" ? module.iam_role_staging[0].role_arn : module.iam_role_production[0].role_arn
}
