# outputs.tf
# Outputs for the secure infrastructure module

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS database instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_data_s3_bucket_name" {
  description = "Name of the S3 bucket for application data"
  value       = aws_s3_bucket.app_data.bucket
}

output "alb_logs_s3_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances in the Auto Scaling group"
  value       = aws_autoscaling_group.app.instances
}
