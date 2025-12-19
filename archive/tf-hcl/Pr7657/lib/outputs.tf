# outputs.tf
# Outputs for multi-tier VPC architecture

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Public Subnet Outputs
output "public_subnet_ids" {
  description = "List of public subnet IDs (for ALB placement)"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

# Private Subnet Outputs
output "private_subnet_ids" {
  description = "List of private subnet IDs (for application servers)"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

# Database Subnet Outputs
output "database_subnet_ids" {
  description = "List of database subnet IDs (no internet routing)"
  value       = aws_subnet.database[*].id
}

output "database_subnet_cidrs" {
  description = "List of database subnet CIDR blocks"
  value       = aws_subnet.database[*].cidr_block
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "List of Elastic IP addresses associated with NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# Security Group Outputs
output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database.id
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of the database route table"
  value       = aws_route_table.database.id
}

# VPC Flow Logs Outputs
output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}

output "vpc_flow_log_cloudwatch_log_group" {
  description = "CloudWatch Log Group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# Grouped Outputs for Easy Reference
output "subnet_ids_by_tier" {
  description = "Subnet IDs grouped by tier"
  value = {
    public   = aws_subnet.public[*].id
    private  = aws_subnet.private[*].id
    database = aws_subnet.database[*].id
  }
}

output "security_group_ids_by_tier" {
  description = "Security Group IDs grouped by tier"
  value = {
    web      = aws_security_group.web.id
    app      = aws_security_group.app.id
    database = aws_security_group.database.id
  }
}
