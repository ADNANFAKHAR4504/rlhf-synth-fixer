output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "rds_cluster_id" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "health_monitor_function_arn" {
  description = "Health monitor Lambda function ARN"
  value       = module.lambda.health_monitor_function_arn
}

output "failover_function_arn" {
  description = "Failover Lambda function ARN"
  value       = module.lambda.failover_function_arn
}
