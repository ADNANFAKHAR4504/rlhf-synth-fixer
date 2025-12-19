output "proxy_endpoint" {
  description = "RDS Proxy endpoint"
  value       = aws_db_proxy.main.endpoint
}

output "proxy_arn" {
  description = "RDS Proxy ARN"
  value       = aws_db_proxy.main.arn
}

output "proxy_name" {
  description = "RDS Proxy name"
  value       = aws_db_proxy.main.name
}

output "security_group_id" {
  description = "Security group ID for the RDS Proxy"
  value       = aws_security_group.rds_proxy.id
}