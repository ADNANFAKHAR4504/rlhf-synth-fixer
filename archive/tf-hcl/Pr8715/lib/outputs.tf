output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_port" {
  description = "Port for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.port
}

output "rds_cluster_database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.app.arn
}

output "db_password_parameter_name" {
  description = "Parameter Store name for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}

output "db_connection_parameter_name" {
  description = "Parameter Store name for database connection string"
  value       = aws_ssm_parameter.db_connection_string.name
}

output "alb_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "vpc_flow_logs_bucket" {
  description = "S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.vpc_flow_logs.id
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "nat_gateway_ips" {
  description = "Elastic IPs associated with NAT gateways"
  value       = aws_eip.nat[*].public_ip
}
