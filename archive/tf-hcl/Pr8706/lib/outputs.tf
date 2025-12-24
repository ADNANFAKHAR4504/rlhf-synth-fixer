# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
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
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_ips" {
  description = "Public IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Transit Gateway Outputs
# Commented out due to AWS quota constraints
/*
output "transit_gateway_id" {
  description = "ID of Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_attachment_id" {
  description = "ID of Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.main.id
}

output "transit_gateway_route_table_id" {
  description = "ID of Transit Gateway route table"
  value       = aws_ec2_transit_gateway_route_table.main.id
}
*/

# VPC Endpoint Outputs
# Commented out due to AWS quota constraints
/*
output "s3_endpoint_id" {
  description = "ID of S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_endpoint_id" {
  description = "ID of DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}
*/

# Flow Logs Outputs
output "flow_logs_bucket" {
  description = "S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

# output "flow_log_id" {
#   description = "ID of VPC flow log"
#   value       = aws_flow_log.main.id
# }

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}