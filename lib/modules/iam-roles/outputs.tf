output "role_names" {
  description = "Names of created roles"
  value       = [for role in aws_iam_role.roles : role.name]
}

output "role_arns" {
  description = "ARNs of created roles"
  value       = [for role in aws_iam_role.roles : role.arn]
}

output "instance_profile_names" {
  description = "Names of created instance profiles"
  value       = [for profile in aws_iam_instance_profile.role_profiles : profile.name]
}