output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "nameservers" {
  description = "Route 53 nameservers"
  value       = aws_route53_zone.main.name_servers
}

output "failover_domain" {
  description = "Failover domain name"
  value       = var.domain_name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "Secondary health check ID"
  value       = aws_route53_health_check.secondary.id
}
