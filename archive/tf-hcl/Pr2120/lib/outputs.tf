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

#==============================================================================
# ROUTE53 AND DNS OUTPUTS
#=============================================================================

output "route53_zone_id" {
  description = "Route53 zone ID"
  value       = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.main.arn
}

output "app_blue_dns" {
  description = "Blue environment DNS record"
  value       = aws_route53_record.app_blue.name
}

output "app_green_dns" {
  description = "Green environment DNS record"
  value       = aws_route53_record.app_green.name
}

output "app_main_dns" {
  description = "Main application DNS record"
  value       = aws_route53_record.app_main.name
}

#==============================================================================
# AUTO SCALING GROUP OUTPUTS
#==============================================================================

output "asg_blue_name" {
  description = "Blue Auto Scaling Group name"
  value       = aws_autoscaling_group.app_blue_us_east_1.name
}

output "asg_green_name" {
  description = "Green Auto Scaling Group name"
  value       = aws_autoscaling_group.app_green_eu_central_1.name
}

output "launch_template_blue_id" {
  description = "Launch template ID for blue environment"
  value       = aws_launch_template.app_us_east_1.id
}

output "launch_template_green_id" {
  description = "Launch template ID for green environment"  
  value       = aws_launch_template.app_eu_central_1.id
}

#==============================================================================
# CLOUDTRAIL OUTPUTS
#==============================================================================

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "cloudtrail_cloudwatch_log_group" {
  description = "CloudTrail CloudWatch log group name"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}
