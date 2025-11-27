output "route_ids" {
  description = "Map of route identifiers"
  value       = { for k, v in aws_ec2_transit_gateway_route.routes : k => v.id }
}

output "blackhole_route_ids" {
  description = "Map of blackhole route identifiers"
  value       = { for k, v in aws_ec2_transit_gateway_route.blackhole : k => v.id }
}