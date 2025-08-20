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
