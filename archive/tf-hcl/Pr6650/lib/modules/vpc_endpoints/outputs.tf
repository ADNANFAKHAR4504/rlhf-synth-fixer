output "s3_endpoint_id" {
  description = "ID of S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "secrets_manager_endpoint_id" {
  description = "ID of Secrets Manager VPC endpoint"
  value       = aws_vpc_endpoint.secrets_manager.id
}

output "cloudwatch_logs_endpoint_id" {
  description = "ID of CloudWatch Logs VPC endpoint"
  value       = aws_vpc_endpoint.cloudwatch_logs.id
}

output "cloudwatch_monitoring_endpoint_id" {
  description = "ID of CloudWatch Monitoring VPC endpoint"
  value       = aws_vpc_endpoint.cloudwatch_monitoring.id
}

output "sns_endpoint_id" {
  description = "ID of SNS VPC endpoint"
  value       = aws_vpc_endpoint.sns.id
}

output "kms_endpoint_id" {
  description = "ID of KMS VPC endpoint"
  value       = aws_vpc_endpoint.kms.id
}