output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_subnet_ids" {
  description = "IDs of public subnets (DMZ tier)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets (Application tier)"
  value       = aws_subnet.private[*].id
}

output "isolated_subnet_ids" {
  description = "IDs of isolated subnets (Data tier)"
  value       = aws_subnet.isolated[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "isolated_route_table_ids" {
  description = "IDs of the isolated route tables"
  value       = aws_route_table.isolated[*].id
}

output "security_group_web_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "security_group_app_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app.id
}

output "security_group_data_id" {
  description = "ID of the data tier security group"
  value       = aws_security_group.data.id
}

# VPC Flow Log output commented out due to LocalStack compatibility
# NOTE: The aws_flow_log.main resource is disabled for LocalStack testing
# output "vpc_flow_log_id" {
#   description = "ID of the VPC flow log"
#   value       = aws_flow_log.main.id
# }

output "vpc_flow_log_group_name" {
  description = "CloudWatch Log Group name for VPC flow logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}
