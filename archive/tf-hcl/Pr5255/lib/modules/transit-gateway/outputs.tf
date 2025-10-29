output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.this.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.this.arn
}

output "hub_route_table_id" {
  description = "ID of the hub route table"
  value       = aws_ec2_transit_gateway_route_table.hub.id
}

output "spoke_route_table_id" {
  description = "ID of the spoke route table"
  value       = aws_ec2_transit_gateway_route_table.spoke.id
}

output "vpc_attachment_ids" {
  description = "Map of VPC attachment IDs"
  value       = { for k, v in aws_ec2_transit_gateway_vpc_attachment.attachments : k => v.id }
}
