terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "domain_name" { type = string }
variable "primary_alb_dns" { type = string }
variable "primary_alb_zone_id" { type = string }
variable "dr_alb_dns" { type = string }
variable "dr_alb_zone_id" { type = string }

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "transaction-zone-${var.environment_suffix}"
  }
}

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "transaction-health-check-primary-${var.environment_suffix}"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_alb_dns
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = var.dr_alb_dns
    zone_id                = var.dr_alb_zone_id
    evaluate_target_health = true
  }
}

output "zone_id" { value = aws_route53_zone.main.zone_id }
output "name_servers" { value = aws_route53_zone.main.name_servers }
output "health_check_id" { value = aws_route53_health_check.primary.id }
