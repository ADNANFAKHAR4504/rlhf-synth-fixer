output "zone_id" {
  description = "Route53 zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Route53 zone name"
  value       = aws_route53_zone.main.name
}

output "failover_domain" {
  description = "Failover domain name"
  value       = aws_route53_record.primary.name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}

output "name_servers" {
  description = "Route53 zone name servers"
  value       = aws_route53_zone.main.name_servers
}
