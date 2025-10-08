output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
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
  description = "Endpoint of the RDS database"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for resume uploads"
  value       = aws_s3_bucket.resumes.id
}

output "s3_express_bucket_name" {
  description = "Name of the S3 Express One Zone bucket"
  value       = aws_s3_directory_bucket.frequent_resumes.bucket
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}
