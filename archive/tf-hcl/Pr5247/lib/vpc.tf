# vpc.tf - VPC and core networking components

# Main VPC with /20 CIDR block
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(local.common_tags, {
    Name = local.vpc_name
    Type = "vpc"
  })
}

# Internet Gateway for public subnet internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name        = local.igw_name
    Environment = var.environment
    Project     = var.project_name
    Type        = "internet-gateway"
  })

  depends_on = [aws_vpc.main]
}

# DHCP Options Set with custom DNS servers
resource "aws_vpc_dhcp_options" "main" {
  domain_name_servers = var.custom_dns_servers
  domain_name         = var.aws_region == "us-east-1" ? "ec2.internal" : "${var.aws_region}.compute.internal"

  tags = merge(local.common_tags, {
    Name = local.dhcp_options_name
    Type = "dhcp-options"
  })
}

# Associate DHCP Options Set with VPC
resource "aws_vpc_dhcp_options_association" "main" {
  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.main.id
}