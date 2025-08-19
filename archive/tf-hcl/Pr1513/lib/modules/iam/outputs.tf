output "saml_provider_arn" {
  description = "ARN of the SAML provider"
  value       = var.saml_metadata_document != "" ? aws_iam_saml_provider.main[0].arn : ""
}

output "admin_role_arn" {
  description = "ARN of the admin role"
  value       = aws_iam_role.admin_role.arn
}

output "readonly_role_arn" {
  description = "ARN of the readonly role"
  value       = var.saml_metadata_document != "" ? aws_iam_role.readonly_role[0].arn : ""
}

output "saml_role_arn" {
  description = "ARN of the SAML role"
  value       = var.saml_metadata_document != "" ? aws_iam_role.saml_role[0].arn : ""
}

output "mfa_policy_arn" {
  description = "ARN of the MFA policy"
  value       = aws_iam_policy.mfa_policy.arn
}
