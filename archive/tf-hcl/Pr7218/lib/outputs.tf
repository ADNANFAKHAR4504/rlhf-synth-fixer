output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = { for k, v in aws_subnet.database : k => v.id }
}

output "nat_gateway_eips" {
  description = "Elastic IP addresses associated with NAT Gateways"
  value       = { for k, v in aws_eip.nat : k => v.public_ip }
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = { for k, v in aws_nat_gateway.main : k => v.id }
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.vpc_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.vpc_encryption.arn
}

output "vpc_endpoints" {
  description = "VPC endpoint IDs"
  value = {
    s3       = aws_vpc_endpoint.s3.id
    dynamodb = aws_vpc_endpoint.dynamodb.id
  }
}

output "flow_logs_s3_bucket" {
  description = "S3 bucket name for VPC flow logs"
  value       = var.enable_flow_logs ? aws_s3_bucket.flow_logs[0].id : null
}

output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = var.enable_transit_gateway ? (var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id) : null
}

output "transit_gateway_attachment_id" {
  description = "ID of the Transit Gateway VPC attachment"
  value       = var.enable_transit_gateway ? aws_ec2_transit_gateway_vpc_attachment.main[0].id : null
}

output "availability_zones" {
  description = "Availability zones used for the VPC"
  value       = local.azs
}

output "network_acl_ids" {
  description = "Network ACL IDs"
  value = {
    public   = aws_network_acl.public.id
    private  = aws_network_acl.private.id
    database = aws_network_acl.database.id
  }
}