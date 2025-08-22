output "user_names" {
  description = "Names of created users"
  value       = [for user in aws_iam_user.users : user.name]
}

output "user_arns" {
  description = "ARNs of created users"
  value       = [for user in aws_iam_user.users : user.arn]
}

output "access_keys" {
  description = "Access keys for users (sensitive)"
  value = {
    for k, v in aws_iam_access_key.user_keys : k => {
      id     = v.id
      secret = v.secret
    }
  }
  sensitive = true
}