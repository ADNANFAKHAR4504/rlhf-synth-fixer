// Outputs for cross-region network

output "primary_vpc_id" {
  value = var.create_vpcs ? aws_vpc.primary[0].id : null
}

output "secondary_vpc_id" {
  value = var.create_vpcs ? aws_vpc.secondary[0].id : null
}

output "primary_public_subnet_id" {
  value = var.create_vpcs ? aws_subnet.primary_public[0].id : null
}

output "secondary_public_subnet_id" {
  value = var.create_vpcs ? aws_subnet.secondary_public[0].id : null
}

output "primary_private_subnet_id" {
  value = var.create_vpcs ? aws_subnet.primary_private[0].id : null
}

output "secondary_private_subnet_id" {
  value = var.create_vpcs ? aws_subnet.secondary_private[0].id : null
}

output "primary_security_group_id" {
  value = var.create_vpcs ? aws_security_group.primary[0].id : null
}

output "secondary_security_group_id" {
  value = var.create_vpcs ? aws_security_group.secondary[0].id : null
}

output "vpc_peering_connection_id" {
  value = var.create_vpcs ? aws_vpc_peering_connection.primary_to_secondary[0].id : null
}
