output "primary_db_endpoint" {
  description = "Primary database endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "dr_db_endpoint" {
  description = "DR database endpoint"
  value       = aws_db_instance.dr.endpoint
}

output "route53_failover_endpoint" {
  description = "Route53 failover DNS endpoint"
  value       = "db.${var.domain_name}"
}

output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = aws_vpc.dr.id
}

output "lambda_function_name" {
  description = "Lambda monitoring function name"
  value       = aws_lambda_function.monitoring.function_name
}

output "primary_db_secret_arn" {
  description = "Primary database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_password_primary.arn
  sensitive   = true
}

output "dr_db_secret_arn" {
  description = "DR database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_password_dr.arn
  sensitive   = true
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.primary_to_dr.id
}
