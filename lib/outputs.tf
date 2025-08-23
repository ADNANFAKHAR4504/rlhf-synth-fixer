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

output "active_region" {
  description = "Currently active region (us-east-1 or eu-central-1)"
  value       = var.blue_green_deployment.active_color == "blue" ? "us-east-1" : "eu-central-1"
}

###################
# Load Balancer Outputs
###################

output "load_balancer_dns_names" {
  description = "DNS names of the load balancers in each region"
  value = {
    us_east_1    = aws_lb.app_us_east_1.dns_name
    eu_central_1 = aws_lb.app_eu_central_1.dns_name
  }
}

###################
# DNS Outputs
###################

output "application_urls" {
  description = "URLs for accessing the application"
  value = {
    main  = var.create_zone ? "https://${var.domain_name}" : aws_cloudfront_distribution.main.domain_name
    blue  = "https://blue.${var.domain_name}"
    green = "https://green.${var.domain_name}"
  }
}

###################
# VPC Outputs
###################

output "vpc_ids" {
  description = "IDs of the VPCs in each region"
  value = {
    us_east_1    = aws_vpc.main_us_east_1.id
    eu_central_1 = aws_vpc.main_eu_central_1.id
  }
}

output "private_subnet_ids" {
  description = "IDs of private subnets in each region"
  value = {
    us_east_1    = aws_subnet.private_us_east_1[*].id
    eu_central_1 = aws_subnet.private_eu_central_1[*].id
  }
}

output "public_subnet_ids" {
  description = "IDs of public subnets in each region"
  value = {
    us_east_1    = aws_subnet.public_us_east_1[*].id
    eu_central_1 = aws_subnet.public_eu_central_1[*].id
  }
}

###################
# Security Outputs
###################

output "security_group_ids" {
  description = "IDs of security groups in each region"
  value = {
    us_east_1 = {
      alb = aws_security_group.alb_us_east_1.id
      app = aws_security_group.app_us_east_1.id
    }
    eu_central_1 = {
      alb = aws_security_group.alb_eu_central_1.id
      app = aws_security_group.app_eu_central_1.id
    }
  }
}
