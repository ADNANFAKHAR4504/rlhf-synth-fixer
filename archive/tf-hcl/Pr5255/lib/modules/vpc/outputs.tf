output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "tgw_attachment_subnet_ids" {
  description = "IDs of Transit Gateway attachment subnets"
  value       = aws_subnet.tgw_attachment[*].id
}

output "public_route_table_id" {
  description = "ID of public route table"
  value       = var.create_public_subnets ? aws_route_table.public[0].id : null
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "igw_id" {
  description = "ID of Internet Gateway"
  value       = var.create_igw ? aws_internet_gateway.this[0].id : null
}
