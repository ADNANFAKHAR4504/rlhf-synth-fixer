output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.ecommerce_vpc.id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.ecommerce_alb.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.ecommerce_db.endpoint
  sensitive   = true
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.ecommerce_kms_key.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.ecommerce_asg.name
}