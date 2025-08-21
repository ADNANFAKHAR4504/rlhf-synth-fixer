# DNS Module - Creates Route 53 hosted zone and health checks
# This module implements failover routing between regions using health checks
# Primary region gets priority, secondary region serves as failover

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}


# Reference existing hosted zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Health check for primary region ALB
# This monitors the primary ALB endpoint and triggers failover if unhealthy
resource "aws_route53_health_check" "primary" {
  fqdn                            = var.primary_alb_dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = var.health_check_path
  failure_threshold              = var.health_check_failure_threshold
  request_interval               = var.health_check_request_interval
  insufficient_data_health_status = "Failure"
  
  tags = {
    Name        = "${var.environment}-primary-health-check"
    Environment = var.environment
    Region      = "primary"
  }
}

# Health check for secondary region ALB
# This monitors the secondary ALB endpoint for backup routing
resource "aws_route53_health_check" "secondary" {
  fqdn                            = var.secondary_alb_dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = var.health_check_path
  failure_threshold              = var.health_check_failure_threshold
  request_interval               = var.health_check_request_interval
  insufficient_data_health_status = "Failure"
  
  tags = {
    Name        = "${var.environment}-secondary-health-check"
    Environment = var.environment
    Region      = "secondary"
  }
}

# Primary Route 53 record (failover routing policy)
# This record points to the primary region ALB and is marked as PRIMARY
resource "aws_route53_record" "primary" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
  type    = "A"
  
  set_identifier = "primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = var.primary_alb_dns_name
    zone_id               = var.primary_alb_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

# Secondary Route 53 record (failover routing policy)
# This record points to the secondary region ALB and is marked as SECONDARY
resource "aws_route53_record" "secondary" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
  type    = "A"
  
  set_identifier = "secondary"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = var.secondary_alb_dns_name
    zone_id               = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.secondary.id
}

# Optional: CNAME record for www subdomain
# Redirects www.domain.com to the main domain for consistency
resource "aws_route53_record" "www" {
  count   = var.create_www_record ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name]
}