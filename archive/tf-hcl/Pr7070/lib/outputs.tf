# outputs.tf - Payment Processing Platform Outputs

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# ================================
# SUBNET OUTPUTS (GROUPED BY TIER)
# ================================

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "all_subnet_ids_by_tier" {
  description = "All subnet IDs grouped by tier"
  value = {
    public      = aws_subnet.public[*].id
    application = aws_subnet.private_app[*].id
    database    = aws_subnet.private_db[*].id
  }
}

# ================================
# NAT INSTANCE OUTPUTS
# ================================

output "nat_instance_id" {
  description = "The ID of the NAT instance"
  value       = aws_instance.nat_instance.id
}

output "nat_instance_private_ip" {
  description = "Private IP address of the NAT instance"
  value       = aws_instance.nat_instance.private_ip
}

output "nat_instance_public_ip" {
  description = "Public IP address of the NAT instance"
  value       = aws_eip.nat_instance.public_ip
}

# ================================
# TRANSIT GATEWAY OUTPUTS
# ================================

output "transit_gateway_id" {
  description = "The ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_attachment_id" {
  description = "The ID of the Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.main.id
}

output "transit_gateway_route_table_id" {
  description = "The ID of the Transit Gateway route table"
  value       = aws_ec2_transit_gateway_route_table.main.id
}

# ================================
# SECURITY OUTPUTS
# ================================

output "nat_instance_security_group_id" {
  description = "Security group ID for the NAT instance"
  value       = aws_security_group.nat_instance.id
}

output "network_acl_ids" {
  description = "Network ACL IDs by tier"
  value = {
    public      = aws_network_acl.public.id
    application = aws_network_acl.private_app.id
    database    = aws_network_acl.private_db.id
  }
}

# ================================
# MONITORING OUTPUTS
# ================================

output "vpc_flow_logs_s3_bucket" {
  description = "S3 bucket name for VPC Flow Logs"
  value       = aws_s3_bucket.vpc_flow_logs.bucket
}

output "vpc_flow_log_id" {
  description = "The ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

# ================================
# NETWORKING OUTPUTS
# ================================

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "route_table_ids" {
  description = "Route table IDs by type"
  value = {
    public      = aws_route_table.public.id
    application = aws_route_table.private_app.id
    database    = aws_route_table.private_db.id
  }
}

# ================================
# AVAILABILITY ZONE OUTPUTS
# ================================

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# ================================
# INTEGRATION OUTPUTS
# ================================

output "integration_summary" {
  description = "Summary of key infrastructure components for integration"
  value = {
    vpc_id                     = aws_vpc.main.id
    vpc_cidr                   = aws_vpc.main.cidr_block
    public_subnets             = aws_subnet.public[*].id
    application_subnets        = aws_subnet.private_app[*].id
    database_subnets           = aws_subnet.private_db[*].id
    nat_instance_id            = aws_instance.nat_instance.id
    transit_gateway_id         = aws_ec2_transit_gateway.main.id
    transit_gateway_attachment = aws_ec2_transit_gateway_vpc_attachment.main.id
    flow_logs_bucket           = aws_s3_bucket.vpc_flow_logs.bucket
    region                     = var.aws_region
  }
}