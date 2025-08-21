output "flow_logs_role_primary_arn" {
  description = "ARN of the VPC Flow Logs IAM role for primary region"
  value       = data.aws_iam_role.flow_logs_role_primary.arn
}

output "flow_logs_role_secondary_arn" {
  description = "ARN of the VPC Flow Logs IAM role for secondary region"
  value       = data.aws_iam_role.flow_logs_role_secondary.arn
}