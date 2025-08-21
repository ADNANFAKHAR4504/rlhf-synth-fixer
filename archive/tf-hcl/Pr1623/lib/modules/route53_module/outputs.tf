# Hosted Zone outputs
output "hosted_zone_id" {
  description = "The hosted zone ID for the domain"
  value       = data.aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = data.aws_route53_zone.main.name_servers
}

# DNS record outputs
output "record_name" {
  description = "The FQDN of the Route 53 record"
  value       = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

output "record_fqdn" {
  description = "The fully qualified domain name of the Route 53 record"
  value       = aws_route53_record.primary.fqdn
}

# Health check outputs
output "primary_health_check_id" {
  description = "The ID of the primary health check"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "The ID of the secondary health check"
  value       = aws_route53_health_check.secondary.id
}

# Domain configuration outputs
output "domain_name" {
  description = "The domain name used for the hosted zone"
  value       = var.domain_name
}

output "full_domain_name" {
  description = "The full domain name including subdomain if specified"
  value       = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

# WWW record output (conditional)
output "www_record_name" {
  description = "The FQDN of the www CNAME record (if created)"
  value       = var.create_www_record ? "www.${var.domain_name}" : null
}