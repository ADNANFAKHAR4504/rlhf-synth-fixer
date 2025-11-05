output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution domain name"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}
