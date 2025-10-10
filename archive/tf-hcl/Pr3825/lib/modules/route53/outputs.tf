output "health_checks" {
  description = "Route53 health check IDs"
  value = {
    primary_check   = aws_route53_health_check.primary_alb.id
    secondary_check = aws_route53_health_check.secondary_alb.id
  }
}

