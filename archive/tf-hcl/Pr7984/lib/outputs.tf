# Outputs for Payment Processing Infrastructure
# OPTIMIZATION #8: Mark sensitive outputs and add descriptions

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.payment_alb.dns_name
}

output "alb_zone_id" {
  description = "Route53 Zone ID of the Application Load Balancer"
  value       = aws_lb.payment_alb.zone_id
}

output "database_endpoint" {
  description = "Connection endpoint for RDS PostgreSQL database"
  value       = aws_db_instance.payment_db.endpoint
  sensitive   = true
}

output "database_address" {
  description = "Hostname of the RDS PostgreSQL database"
  value       = aws_db_instance.payment_db.address
  sensitive   = true
}

output "database_port" {
  description = "Port of the RDS PostgreSQL database"
  value       = aws_db_instance.payment_db.port
}

output "s3_bucket_names" {
  description = "Map of S3 bucket names for transaction logs"
  value       = { for k, v in aws_s3_bucket.transaction_logs : k => v.id }
}

output "s3_bucket_arns" {
  description = "Map of S3 bucket ARNs for transaction logs"
  value       = { for k, v in aws_s3_bucket.transaction_logs : k => v.arn }
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = aws_instance.payment_server[*].id
}

output "ec2_private_ips" {
  description = "List of EC2 instance private IP addresses"
  value       = aws_instance.payment_server[*].private_ip
}

output "security_group_id" {
  description = "Security group ID for payment processing instances"
  value       = aws_security_group.payment_sg.id
}

output "alb_logs_bucket" {
  description = "S3 bucket name for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}
