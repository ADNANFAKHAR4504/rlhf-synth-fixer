# outputs.tf - Output values for the infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

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

# Aurora Outputs
output "aurora_cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_identifier" {
  description = "Identifier of the Aurora cluster"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_database_name" {
  description = "Name of the Aurora database"
  value       = aws_rds_cluster.aurora.database_name
}

output "aurora_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Aurora credentials"
  value       = aws_secretsmanager_secret.aurora_credentials.arn
}

# Auto Scaling Outputs
output "asg_blue_name" {
  description = "Name of the blue Auto Scaling Group"
  value       = aws_autoscaling_group.blue.name
}

output "asg_green_name" {
  description = "Name of the green Auto Scaling Group"
  value       = aws_autoscaling_group.green.name
}

output "active_deployment_color" {
  description = "Currently active deployment color"
  value       = var.deployment_color
}

# CloudWatch Outputs
output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.arn
}

# Route 53 Outputs
output "route53_health_check_id" {
  description = "ID of the Route 53 health check"
  value       = aws_route53_health_check.alb_primary.id
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

output "aurora_security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}
