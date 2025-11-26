output "transit_gateway_id" {
  description = "Transit Gateway ID"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "Transit Gateway ARN"
  value       = aws_ec2_transit_gateway.main.arn
}

output "transit_gateway_association_default_route_table_id" {
  description = "Transit Gateway association default route table ID"
  value       = aws_ec2_transit_gateway.main.association_default_route_table_id
}

output "transit_gateway_propagation_default_route_table_id" {
  description = "Transit Gateway propagation default route table ID"
  value       = aws_ec2_transit_gateway.main.propagation_default_route_table_id
}