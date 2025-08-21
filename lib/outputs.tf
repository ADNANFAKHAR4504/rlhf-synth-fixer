# outputs.tf
output "bucket_names" {
  value = {
    staging    = module.storage.bucket_name
    production = module.storage.bucket_name
  }
}

output "security_group_ids" {
  value = {
    staging    = module.network.security_group_id
    production = module.network.security_group_id
  }
}

output "iam_role_arns" {
  value = {
    staging    = module.iam_role.role_arn
    production = module.iam_role.role_arn
  }
}

# Environment-specific outputs for current deployment
output "current_bucket_name" {
  value = module.storage.bucket_name
}

output "current_security_group_id" {
  value = module.network.security_group_id
}

output "current_iam_role_arn" {
  value = module.iam_role.role_arn
}
