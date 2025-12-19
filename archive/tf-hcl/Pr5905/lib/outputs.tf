# ALB Outputs
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

# Target Group Outputs
output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

# Auto Scaling Group Outputs
output "blue_asg_name" {
  description = "Name of the blue Auto Scaling Group"
  value       = aws_autoscaling_group.blue.name
}

output "green_asg_name" {
  description = "Name of the green Auto Scaling Group"
  value       = aws_autoscaling_group.green.name
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_proxy_endpoint" {
  description = "Endpoint of the RDS Proxy"
  value       = aws_db_proxy.main.endpoint
}

output "rds_cluster_identifier" {
  description = "Identifier of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.cluster_identifier
}

# S3 Outputs
output "artifacts_bucket_name" {
  description = "Name of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "artifacts_bucket_arn" {
  description = "ARN of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.arn
}

# Route 53 Outputs
output "application_domain" {
  description = "Domain name for the application"
  value       = var.domain_name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "rds_proxy_security_group_id" {
  description = "ID of the RDS Proxy security group"
  value       = aws_security_group.rds_proxy.id
}

# IAM Outputs
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance role"
  value       = aws_iam_role.ec2_instance_role.arn
}

# CloudWatch Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}

# Deployment Information
output "blue_traffic_weight" {
  description = "Current traffic weight for blue environment"
  value       = var.blue_traffic_weight
}

output "green_traffic_weight" {
  description = "Current traffic weight for green environment"
  value       = var.green_traffic_weight
}

output "blue_app_version" {
  description = "Current application version in blue environment"
  value       = var.app_version_blue
}

output "green_app_version" {
  description = "Current application version in green environment"
  value       = var.app_version_green
}
