output "saml_provider_arn" {
  description = "ARN of the SAML provider"
  value       = aws_iam_saml_provider.main.arn
}

output "admin_role_arn" {
  description = "ARN of the admin role"
  value       = aws_iam_role.admin_role.arn
}

output "readonly_role_arn" {
  description = "ARN of the readonly role"
  value       = aws_iam_role.readonly_role.arn
}

output "saml_role_arn" {
  description = "ARN of the SAML role"
  value       = aws_iam_role.saml_role.arn
}