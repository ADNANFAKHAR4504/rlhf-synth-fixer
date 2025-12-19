output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "Connection endpoint for RDS PostgreSQL instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "Name of the PostgreSQL database"
  value       = aws_db_instance.main.db_name
}

output "static_assets_bucket" {
  description = "Name of S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "flow_logs_bucket" {
  description = "Name of S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "kms_key_id" {
  description = "ID of KMS key used for encryption"
  value       = aws_kms_key.main.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}
