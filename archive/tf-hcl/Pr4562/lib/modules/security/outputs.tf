# modules/security/outputs.tf - Security Module Outputs

output "vpc_a_security_group_id" {
  description = "Security group ID for VPC-A"
  value       = aws_security_group.vpc_a.id
}

output "vpc_b_security_group_id" {
  description = "Security group ID for VPC-B"
  value       = aws_security_group.vpc_b.id
}

output "flow_logs_role_arn" {
  description = "ARN of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.flow_logs.arn
}

output "flow_logs_role_id" {
  description = "ID of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.flow_logs.id
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.vpc_protection.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.vpc_protection.arn
}