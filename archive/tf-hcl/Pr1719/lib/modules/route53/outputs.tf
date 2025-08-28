output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "primary_dns_record" {
  description = "Primary DNS record (US East 1)"
  value       = aws_route53_record.primary.name
}

output "regional_dns_records" {
  description = "Regional DNS records"
  value = {
    us_east_1      = aws_route53_record.us_east_1.name
    eu_west_1      = aws_route53_record.eu_west_1.name
    ap_southeast_1 = aws_route53_record.ap_southeast_1.name
  }
}

output "health_check_ids" {
  description = "Health check IDs for each region"
  value = {
    us_east_1      = aws_route53_health_check.us_east_1.id
    eu_west_1      = aws_route53_health_check.eu_west_1.id
    ap_southeast_1 = aws_route53_health_check.ap_southeast_1.id
  }
}

output "www_dns_record" {
  description = "WWW DNS record"
  value       = aws_route53_record.www.name
}
