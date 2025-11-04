output "peering_attachment_id" {
  description = "ID of the Transit Gateway peering attachment"
  value       = aws_ec2_transit_gateway_peering_attachment.main.id
}

output "peering_attachment_state" {
  description = "State of the Transit Gateway peering attachment"
  value       = aws_ec2_transit_gateway_peering_attachment.main.state
}
