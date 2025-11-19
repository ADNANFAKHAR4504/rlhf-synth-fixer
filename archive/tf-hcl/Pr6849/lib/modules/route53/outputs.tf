output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}
