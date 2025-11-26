locals {
  project_name = "TransitGatewayHub"
  environment  = var.environment_suffix
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
    Owner       = "SecurityTeam"
  }

  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 3)
}

data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for encryption
module "kms" {
  source = "./modules/kms"

  project_name = local.project_name
  environment  = local.environment
  tags         = local.common_tags
}

# Create VPCs
module "vpc_prod" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-prod-vpc"
  vpc_cidr        = var.vpc_configs["prod"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["prod"].public_subnets
  private_subnets = var.vpc_configs["prod"].private_subnets
  tgw_subnets     = var.vpc_configs["prod"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "prod" })
}

module "vpc_staging" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-staging-vpc"
  vpc_cidr        = var.vpc_configs["staging"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["staging"].public_subnets
  private_subnets = var.vpc_configs["staging"].private_subnets
  tgw_subnets     = var.vpc_configs["staging"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "staging" })
}

module "vpc_dev" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-dev-vpc"
  vpc_cidr        = var.vpc_configs["dev"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["dev"].public_subnets
  private_subnets = var.vpc_configs["dev"].private_subnets
  tgw_subnets     = var.vpc_configs["dev"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "dev" })
}

# Hub Transit Gateway
module "tgw_hub" {
  source = "./modules/tgw"

  tgw_name                 = "${local.project_name}-hub-tgw"
  amazon_side_asn          = 64512
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "hub" })
}

# Spoke Transit Gateways
module "tgw_us_west_2" {
  source = "./modules/tgw"
  providers = {
    aws = aws.us_west_2
  }

  tgw_name                 = "${local.project_name}-usw2-tgw"
  amazon_side_asn          = 64513
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "us-west-2" })
}

module "tgw_eu_west_1" {
  source = "./modules/tgw"
  providers = {
    aws = aws.eu_west_1
  }

  tgw_name                 = "${local.project_name}-euw1-tgw"
  amazon_side_asn          = 64514
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "eu-west-1" })
}

# TGW Route Tables
resource "aws_ec2_transit_gateway_route_table" "prod" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-prod-rt", Type = "prod" })
}

resource "aws_ec2_transit_gateway_route_table" "staging" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-staging-rt", Type = "staging" })
}

resource "aws_ec2_transit_gateway_route_table" "dev" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-dev-rt", Type = "dev" })
}

# VPC Attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "prod" {
  subnet_ids         = module.vpc_prod.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_prod.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-prod-attachment" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "staging" {
  subnet_ids         = module.vpc_staging.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_staging.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-staging-attachment" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "dev" {
  subnet_ids         = module.vpc_dev.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_dev.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-dev-attachment" })
}

# Route Table Associations
resource "aws_ec2_transit_gateway_route_table_association" "prod" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_association" "staging" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.staging.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.staging.id
}

resource "aws_ec2_transit_gateway_route_table_association" "dev" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# TGW Routes - Prod Route Table (can reach staging only)
module "routes_prod" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["staging"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# TGW Routes - Staging Route Table (can reach prod and dev)
module "routes_staging" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.staging.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["prod"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.prod.id
    },
    {
      destination_cidr_block = var.vpc_configs["dev"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.dev.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# TGW Routes - Dev Route Table (can reach staging only)
module "routes_dev" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["staging"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# VPC Private Route Tables - Route to TGW
resource "aws_route" "private_to_tgw_prod" {
  count = length(module.vpc_prod.private_route_table_ids)

  route_table_id         = module.vpc_prod.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

resource "aws_route" "private_to_tgw_staging" {
  count = length(module.vpc_staging.private_route_table_ids)

  route_table_id         = module.vpc_staging.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

resource "aws_route" "private_to_tgw_dev" {
  count = length(module.vpc_dev.private_route_table_ids)

  route_table_id         = module.vpc_dev.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

# TGW Peering Attachments
resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_usw2" {
  peer_region             = var.spoke_region_1
  peer_transit_gateway_id = module.tgw_us_west_2.transit_gateway_id
  transit_gateway_id      = module.tgw_hub.transit_gateway_id

  tags = merge(local.common_tags, { Name = "${local.project_name}-hub-to-usw2" })
}

resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_euw1" {
  peer_region             = var.spoke_region_2
  peer_transit_gateway_id = module.tgw_eu_west_1.transit_gateway_id
  transit_gateway_id      = module.tgw_hub.transit_gateway_id

  tags = merge(local.common_tags, { Name = "${local.project_name}-hub-to-euw1" })
}

# Accept peering attachments
resource "aws_ec2_transit_gateway_peering_attachment_accepter" "usw2" {
  provider = aws.us_west_2

  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_usw2.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-usw2-accepter" })
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "euw1" {
  provider = aws.eu_west_1

  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_euw1.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-euw1-accepter" })
}

# Network ACLs
module "nacl_prod" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_prod.vpc_id
  vpc_cidr      = var.vpc_configs["prod"].cidr_block
  allowed_cidrs = [var.vpc_configs["staging"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_prod.private_subnet_ids, module.vpc_prod.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-prod-nacl" })
}

module "nacl_staging" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_staging.vpc_id
  vpc_cidr      = var.vpc_configs["staging"].cidr_block
  allowed_cidrs = [var.vpc_configs["prod"].cidr_block, var.vpc_configs["dev"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_staging.private_subnet_ids, module.vpc_staging.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-staging-nacl" })
}

module "nacl_dev" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_dev.vpc_id
  vpc_cidr      = var.vpc_configs["dev"].cidr_block
  allowed_cidrs = [var.vpc_configs["staging"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_dev.private_subnet_ids, module.vpc_dev.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-dev-nacl" })
}

# VPC Flow Logs
module "flow_logs_prod" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_prod.vpc_id
  vpc_name             = "prod"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-prod-flowlogs" })
}

module "flow_logs_staging" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_staging.vpc_id
  vpc_name             = "staging"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-staging-flowlogs" })
}

module "flow_logs_dev" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_dev.vpc_id
  vpc_name             = "dev"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-dev-flowlogs" })
}

# Outputs
output "transit_gateway_ids" {
  value = {
    hub       = module.tgw_hub.transit_gateway_id
    us_west_2 = module.tgw_us_west_2.transit_gateway_id
    eu_west_1 = module.tgw_eu_west_1.transit_gateway_id
  }
}

output "tgw_route_table_ids" {
  value = {
    prod    = aws_ec2_transit_gateway_route_table.prod.id
    staging = aws_ec2_transit_gateway_route_table.staging.id
    dev     = aws_ec2_transit_gateway_route_table.dev.id
  }
}

output "vpc_ids" {
  value = {
    prod    = module.vpc_prod.vpc_id
    staging = module.vpc_staging.vpc_id
    dev     = module.vpc_dev.vpc_id
  }
}

output "subnet_ids" {
  value = {
    prod = {
      public  = module.vpc_prod.public_subnet_ids
      private = module.vpc_prod.private_subnet_ids
      tgw     = module.vpc_prod.tgw_subnet_ids
    }
    staging = {
      public  = module.vpc_staging.public_subnet_ids
      private = module.vpc_staging.private_subnet_ids
      tgw     = module.vpc_staging.tgw_subnet_ids
    }
    dev = {
      public  = module.vpc_dev.public_subnet_ids
      private = module.vpc_dev.private_subnet_ids
      tgw     = module.vpc_dev.tgw_subnet_ids
    }
  }
}

output "tgw_attachment_ids" {
  value = {
    prod             = aws_ec2_transit_gateway_vpc_attachment.prod.id
    staging          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    dev              = aws_ec2_transit_gateway_vpc_attachment.dev.id
    hub_to_us_west_2 = aws_ec2_transit_gateway_peering_attachment.hub_to_usw2.id
    hub_to_eu_west_1 = aws_ec2_transit_gateway_peering_attachment.hub_to_euw1.id
  }
}
