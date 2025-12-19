output "security_admin_role_arn" {
  description = "ARN of the SecurityAdmin IAM role"
  value       = aws_iam_role.security_admin.arn
}

output "devops_role_arn" {
  description = "ARN of the DevOps IAM role"
  value       = aws_iam_role.devops.arn
}

output "auditor_role_arn" {
  description = "ARN of the Auditor IAM role"
  value       = aws_iam_role.auditor.arn
}

output "application_data_key_id" {
  description = "ID of the application data KMS key"
  value       = aws_kms_key.application_data.id
}

output "application_data_key_arn" {
  description = "ARN of the application data KMS key"
  value       = aws_kms_key.application_data.arn
}

output "infrastructure_secrets_key_id" {
  description = "ID of the infrastructure secrets KMS key"
  value       = aws_kms_key.infrastructure_secrets.id
}

output "infrastructure_secrets_key_arn" {
  description = "ARN of the infrastructure secrets KMS key"
  value       = aws_kms_key.infrastructure_secrets.arn
}

output "terraform_state_key_id" {
  description = "ID of the Terraform state KMS key"
  value       = aws_kms_key.terraform_state.id
}

output "terraform_state_key_arn" {
  description = "ARN of the Terraform state KMS key"
  value       = aws_kms_key.terraform_state.arn
}

output "external_id" {
  description = "External ID for cross-account assume role (sensitive)"
  value       = random_string.external_id.result
  sensitive   = true
}

output "iam_activity_log_group_name" {
  description = "Name of the IAM activity CloudWatch log group"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

output "permission_boundary_arn" {
  description = "ARN of the permission boundary policy"
  value       = aws_iam_policy.permission_boundary.arn
}

output "ecs_service_role_arn" {
  description = "ARN of the ECS service role"
  value       = aws_iam_role.ecs_service_role.arn
}

output "rds_service_role_arn" {
  description = "ARN of the RDS service role"
  value       = aws_iam_role.rds_service_role.arn
}
