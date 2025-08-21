# outputs.tf
output "bucket_names" {
  value = {
    (local.env) = module.storage.bucket_name
  }
}

output "security_group_ids" {
  value = {
    (local.env) = module.network.security_group_id
  }
}

output "iam_role_arns" {
  value = {
    (local.env) = module.iam_role.role_arn
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
