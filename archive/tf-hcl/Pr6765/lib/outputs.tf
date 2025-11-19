# outputs.tf - Hub-and-Spoke Network Architecture outputs

output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.arn
}

output "hub_vpc_id" {
  description = "ID of the hub VPC"
  value       = aws_vpc.hub.id
}

output "hub_vpc_cidr" {
  description = "CIDR block of the hub VPC"
  value       = aws_vpc.hub.cidr_block
}

output "spoke_vpc_ids" {
  description = "IDs of spoke VPCs"
  value       = { for k, v in aws_vpc.spokes : k => v.id }
}

output "spoke_vpc_cidrs" {
  description = "CIDR blocks of spoke VPCs"
  value       = { for k, v in aws_vpc.spokes : k => v.cidr_block }
}

output "hub_route_table_id" {
  description = "ID of the Transit Gateway route table for hub"
  value       = aws_ec2_transit_gateway_route_table.hub.id
}

output "spokes_route_table_id" {
  description = "ID of the Transit Gateway route table for spokes"
  value       = aws_ec2_transit_gateway_route_table.spokes.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway in hub VPC"
  value       = aws_nat_gateway.hub.id
}

output "nat_gateway_public_ip" {
  description = "Public IP address of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

output "hub_security_group_id" {
  description = "ID of the hub VPC security group"
  value       = aws_security_group.hub.id
}

output "spoke_security_group_ids" {
  description = "IDs of spoke VPC security groups"
  value       = { for k, v in aws_security_group.spokes : k => v.id }
}

output "hub_tgw_attachment_id" {
  description = "ID of the Transit Gateway attachment for hub VPC"
  value       = aws_ec2_transit_gateway_vpc_attachment.hub.id
}

output "spoke_tgw_attachment_ids" {
  description = "IDs of Transit Gateway attachments for spoke VPCs"
  value       = { for k, v in aws_ec2_transit_gateway_vpc_attachment.spokes : k => v.id }
}
