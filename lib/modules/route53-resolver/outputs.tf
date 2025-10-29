# Outputs from the Route53 Resolver module

output "inbound_endpoint_id" {
  description = "ID of the inbound Route53 Resolver endpoint"
  value       = aws_route53_resolver_endpoint.inbound.id
}

output "outbound_endpoint_id" {
  description = "ID of the outbound Route53 Resolver endpoint"
  value       = aws_route53_resolver_endpoint.outbound.id
}

output "security_group_id" {
  description = "ID of the security group for Route53 Resolver"
  value       = aws_security_group.resolver.id
}

output "inbound_endpoint_ips" {
  description = "IP addresses of the inbound endpoint"
  value       = aws_route53_resolver_endpoint.inbound.ip_address[*].ip
}

output "outbound_endpoint_ips" {
  description = "IP addresses of the outbound endpoint"
  value       = aws_route53_resolver_endpoint.outbound.ip_address[*].ip
}

