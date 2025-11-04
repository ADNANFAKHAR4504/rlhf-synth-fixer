output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.arn
}

output "production_route_table_id" {
  description = "ID of the production route table"
  value       = aws_ec2_transit_gateway_route_table.production.id
}

output "non_production_route_table_id" {
  description = "ID of the non-production route table"
  value       = aws_ec2_transit_gateway_route_table.non_production.id
}
