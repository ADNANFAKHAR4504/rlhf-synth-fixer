# outputs.tf

output "vpc_id" {
  description = "VPC ID"
  value       = data.aws_vpc.default.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

# Database outputs commented out since RDS is disabled
# output "database_endpoint" {
#   description = "RDS database endpoint"
#   value       = aws_db_instance.main.endpoint
#   sensitive   = true
# }

# output "database_port" {
#   description = "RDS database port"
#   value       = aws_db_instance.main.port
# }

output "public_subnets" {
  description = "Public subnet IDs"
  value       = data.aws_subnets.existing_public.ids
}

output "private_subnets" {
  description = "Private subnet IDs (using existing public subnets)"
  value       = data.aws_subnets.existing_public.ids
}

output "database_subnets" {
  description = "Database subnet IDs (using existing public subnets)"
  value       = data.aws_subnets.existing_public.ids
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "security_group_alb_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "security_group_web_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}

output "security_group_db_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}