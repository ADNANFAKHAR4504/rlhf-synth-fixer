###################
# CloudFront Outputs
###################

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

###################
# Blue-Green Deployment Outputs
###################

output "active_environment" {
  description = "Currently active environment (blue or green)"
  value       = var.deployment_target
}

output "environment_weights" {
  description = "Current traffic distribution between blue and green"
  value = {
    blue  = var.blue_green_deployment_config.blue_weight
    green = var.blue_green_deployment_config.green_weight
  }
}

###################
# DNS Outputs
###################

output "application_url" {
  description = "URL of the application"
  value       = var.create_dns_zone ? "https://${var.domain_name}" : aws_cloudfront_distribution.main.domain_name
}

###################
# VPC Outputs
###################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

###################
# Security Outputs
###################

output "security_group_ids" {
  description = "IDs of security groups"
  value = {
    alb     = aws_security_group.alb.id
    app     = aws_security_group.app.id
    db      = aws_security_group.db.id
  }
}
