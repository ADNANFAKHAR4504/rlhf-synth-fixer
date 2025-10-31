# Main orchestrator for multi-region VPC deployment
# This file manages VPC creation across all regions using a shared module

locals {
  # Regional provider mapping for module usage
  region_providers = {
    "us-east-1"    = "us-east-1"
    "us-west-2"    = "us-west-2"
    "eu-central-1" = "eu-central-1"
  }

  # Calculate CIDR blocks for each region dynamically
  # This prevents IP exhaustion and ensures consistent allocation
  region_configs = {
    for idx, region in var.regions : region => {
      vpc_cidr             = cidrsubnet(var.base_cidr_block, 8, idx)
      public_subnet_cidrs  = [for i in range(3) : cidrsubnet(cidrsubnet(var.base_cidr_block, 8, idx), 4, i)]
      private_subnet_cidrs = [for i in range(3) : cidrsubnet(cidrsubnet(var.base_cidr_block, 8, idx), 4, i + 8)]
    }
  }

  # Explicit VPC peering pairs (mesh topology)
  peering_connections = {
    "us-east-1-to-us-west-2" = {
      requester          = "us-east-1"
      accepter           = "us-west-2"
      requester_provider = "us-east-1"
      accepter_provider  = "us-west-2"
    }
    "us-west-2-to-eu-central-1" = {
      requester          = "us-west-2"
      accepter           = "eu-central-1"
      requester_provider = "us-west-2"
      accepter_provider  = "eu-central-1"
    }
    "us-east-1-to-eu-central-1" = {
      requester          = "us-east-1"
      accepter           = "eu-central-1"
      requester_provider = "us-east-1"
      accepter_provider  = "eu-central-1"
    }
  }
}

# Get available AZs for us-east-1
data "aws_availability_zones" "us_east_1" {
  provider = aws.us-east-1
  state    = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get available AZs for us-west-2
data "aws_availability_zones" "us_west_2" {
  provider = aws.us-west-2
  state    = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get available AZs for eu-central-1
data "aws_availability_zones" "eu_central_1" {
  provider = aws.eu-central-1
  state    = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Deploy VPC module for us-east-1
module "vpc_us_east_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us-east-1
  }

  # Basic configuration
  region             = "us-east-1"
  environment        = var.environment
  environment_suffix = var.environment_suffix

  # Network configuration
  vpc_cidr             = local.region_configs["us-east-1"].vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.us_east_1.names, 0, 3)
  public_subnet_cidrs  = local.region_configs["us-east-1"].public_subnet_cidrs
  private_subnet_cidrs = local.region_configs["us-east-1"].private_subnet_cidrs

  # NAT Gateway configuration for shared egress
  enable_nat_gateway = contains(var.nat_gateway_regions, "us-east-1")
  single_nat_gateway = false

  # DNS configuration
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_logs = var.enable_flow_logs

  # Tags
  tags = {
    Name   = "${var.environment}-us-east-1-vpc-${var.environment_suffix}"
    Region = "us-east-1"
  }
}

# Deploy VPC module for us-west-2
module "vpc_us_west_2" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us-west-2
  }

  # Basic configuration
  region             = "us-west-2"
  environment        = var.environment
  environment_suffix = var.environment_suffix

  # Network configuration
  vpc_cidr             = local.region_configs["us-west-2"].vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.us_west_2.names, 0, 3)
  public_subnet_cidrs  = local.region_configs["us-west-2"].public_subnet_cidrs
  private_subnet_cidrs = local.region_configs["us-west-2"].private_subnet_cidrs

  # NAT Gateway configuration
  enable_nat_gateway = contains(var.nat_gateway_regions, "us-west-2")
  single_nat_gateway = false

  # DNS configuration
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_logs = var.enable_flow_logs

  # Tags
  tags = {
    Name   = "${var.environment}-us-west-2-vpc-${var.environment_suffix}"
    Region = "us-west-2"
  }
}

# Deploy VPC module for eu-central-1
module "vpc_eu_central_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.eu-central-1
  }

  # Basic configuration
  region             = "eu-central-1"
  environment        = var.environment
  environment_suffix = var.environment_suffix

  # Network configuration
  vpc_cidr             = local.region_configs["eu-central-1"].vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.eu_central_1.names, 0, 3)
  public_subnet_cidrs  = local.region_configs["eu-central-1"].public_subnet_cidrs
  private_subnet_cidrs = local.region_configs["eu-central-1"].private_subnet_cidrs

  # NAT Gateway configuration
  enable_nat_gateway = contains(var.nat_gateway_regions, "eu-central-1")
  single_nat_gateway = false

  # DNS configuration
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_logs = var.enable_flow_logs

  # Tags
  tags = {
    Name   = "${var.environment}-eu-central-1-vpc-${var.environment_suffix}"
    Region = "eu-central-1"
  }
}

# VPC Peering: us-east-1 to us-west-2
resource "aws_vpc_peering_connection" "us_east_1_to_us_west_2" {
  provider = aws.us-east-1

  vpc_id      = module.vpc_us_east_1.vpc_id
  peer_vpc_id = module.vpc_us_west_2.vpc_id
  peer_region = "us-west-2"

  auto_accept = false

  tags = {
    Name        = "${var.environment}-us-east-1-to-us-west-2-peer-${var.environment_suffix}"
    Type        = "inter-region-peering"
    Environment = var.environment
  }
}

resource "aws_vpc_peering_connection_accepter" "us_east_1_to_us_west_2" {
  provider = aws.us-west-2

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_us_west_2.id
  auto_accept               = true

  tags = {
    Name        = "${var.environment}-us-east-1-to-us-west-2-peer-accept-${var.environment_suffix}"
    Environment = var.environment
  }
}

# VPC Peering: us-west-2 to eu-central-1
resource "aws_vpc_peering_connection" "us_west_2_to_eu_central_1" {
  provider = aws.us-west-2

  vpc_id      = module.vpc_us_west_2.vpc_id
  peer_vpc_id = module.vpc_eu_central_1.vpc_id
  peer_region = "eu-central-1"

  auto_accept = false

  tags = {
    Name        = "${var.environment}-us-west-2-to-eu-central-1-peer-${var.environment_suffix}"
    Type        = "inter-region-peering"
    Environment = var.environment
  }
}

resource "aws_vpc_peering_connection_accepter" "us_west_2_to_eu_central_1" {
  provider = aws.eu-central-1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_west_2_to_eu_central_1.id
  auto_accept               = true

  tags = {
    Name        = "${var.environment}-us-west-2-to-eu-central-1-peer-accept-${var.environment_suffix}"
    Environment = var.environment
  }
}

# VPC Peering: us-east-1 to eu-central-1
resource "aws_vpc_peering_connection" "us_east_1_to_eu_central_1" {
  provider = aws.us-east-1

  vpc_id      = module.vpc_us_east_1.vpc_id
  peer_vpc_id = module.vpc_eu_central_1.vpc_id
  peer_region = "eu-central-1"

  auto_accept = false

  tags = {
    Name        = "${var.environment}-us-east-1-to-eu-central-1-peer-${var.environment_suffix}"
    Type        = "inter-region-peering"
    Environment = var.environment
  }
}

resource "aws_vpc_peering_connection_accepter" "us_east_1_to_eu_central_1" {
  provider = aws.eu-central-1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_central_1.id
  auto_accept               = true

  tags = {
    Name        = "${var.environment}-us-east-1-to-eu-central-1-peer-accept-${var.environment_suffix}"
    Environment = var.environment
  }
}

# Routes for VPC peering - us-east-1 private route tables
resource "aws_route" "us_east_1_to_us_west_2_private" {
  provider = aws.us-east-1

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_us_east_1.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_us_west_2.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_us_west_2.id
}

resource "aws_route" "us_east_1_to_eu_central_1_private" {
  provider = aws.us-east-1

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_us_east_1.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_eu_central_1.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_central_1.id
}

# Routes for VPC peering - us-west-2 private route tables
resource "aws_route" "us_west_2_to_us_east_1_private" {
  provider = aws.us-west-2

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_us_west_2.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_us_east_1.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_us_west_2.id
}

resource "aws_route" "us_west_2_to_eu_central_1_private" {
  provider = aws.us-west-2

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_us_west_2.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_eu_central_1.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_west_2_to_eu_central_1.id
}

# Routes for VPC peering - eu-central-1 private route tables
resource "aws_route" "eu_central_1_to_us_east_1_private" {
  provider = aws.eu-central-1

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_eu_central_1.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_us_east_1.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_central_1.id
}

resource "aws_route" "eu_central_1_to_us_west_2_private" {
  provider = aws.eu-central-1

  for_each = { for idx in range(3) : idx => idx }

  route_table_id            = module.vpc_eu_central_1.private_route_table_ids[each.key]
  destination_cidr_block    = module.vpc_us_west_2.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.us_west_2_to_eu_central_1.id
}

# Route53 Resolver endpoints for DNS resolution between VPCs (optional)
module "route53_resolver_us_east_1" {
  count  = var.enable_route53_resolver ? 1 : 0
  source = "./modules/route53-resolver"

  providers = {
    aws = aws.us-east-1
  }

  vpc_id     = module.vpc_us_east_1.vpc_id
  vpc_cidr   = module.vpc_us_east_1.vpc_cidr_block
  subnet_ids = module.vpc_us_east_1.private_subnet_ids

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region             = "us-east-1"

  tags = {
    Environment = var.environment
  }
}

module "route53_resolver_us_west_2" {
  count  = var.enable_route53_resolver ? 1 : 0
  source = "./modules/route53-resolver"

  providers = {
    aws = aws.us-west-2
  }

  vpc_id     = module.vpc_us_west_2.vpc_id
  vpc_cidr   = module.vpc_us_west_2.vpc_cidr_block
  subnet_ids = module.vpc_us_west_2.private_subnet_ids

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region             = "us-west-2"

  tags = {
    Environment = var.environment
  }
}

module "route53_resolver_eu_central_1" {
  count  = var.enable_route53_resolver ? 1 : 0
  source = "./modules/route53-resolver"

  providers = {
    aws = aws.eu-central-1
  }

  vpc_id     = module.vpc_eu_central_1.vpc_id
  vpc_cidr   = module.vpc_eu_central_1.vpc_cidr_block
  subnet_ids = module.vpc_eu_central_1.private_subnet_ids

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region             = "eu-central-1"

  tags = {
    Environment = var.environment
  }
}
