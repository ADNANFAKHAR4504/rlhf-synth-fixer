output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "s3_bucket_alb_logs" {
  description = "S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "s3_bucket_app_logs" {
  description = "S3 bucket for application logs"
  value       = aws_s3_bucket.application_logs.id
}

output "s3_bucket_audit_logs" {
  description = "S3 bucket for audit logs"
  value       = aws_s3_bucket.audit_logs.id
}
