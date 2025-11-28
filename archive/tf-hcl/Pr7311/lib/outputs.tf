# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.payment_vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.payment_vpc.cidr_block
}

# Internet Gateway
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.payment_igw.id
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.nat[*].id
}

output "nat_gateway_eips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of database route table"
  value       = aws_route_table.database.id
}

# Network ACL Outputs
output "public_nacl_id" {
  description = "ID of public network ACL"
  value       = aws_network_acl.public.id
}

output "private_nacl_id" {
  description = "ID of private network ACL"
  value       = aws_network_acl.private.id
}

output "database_nacl_id" {
  description = "ID of database network ACL"
  value       = aws_network_acl.database.id
}

# Flow Logs Outputs
output "flow_logs_log_group" {
  description = "CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "flow_logs_iam_role_arn" {
  description = "IAM Role ARN for VPC Flow Logs"
  value       = aws_iam_role.vpc_flow_logs.arn
}
