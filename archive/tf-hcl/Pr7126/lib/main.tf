terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration will be provided via command-line arguments
  backend "s3" {}
}

provider "aws" {
  region = var.region
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Hub VPC Module
module "hub_vpc" {
  source = "./modules/vpc"

  vpc_name              = "hub-vpc-${var.environment_suffix}"
  vpc_cidr              = var.hub_vpc_cidr
  availability_zones    = var.availability_zones
  environment           = "hub"
  environment_suffix    = var.environment_suffix
  enable_nat_gateway    = true
  enable_public_subnets = true

  tags = merge(
    var.tags,
    {
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

# Production VPC Module
module "prod_vpc" {
  source = "./modules/vpc"

  vpc_name              = "prod-vpc-${var.environment_suffix}"
  vpc_cidr              = var.prod_vpc_cidr
  availability_zones    = var.availability_zones
  environment           = "production"
  environment_suffix    = var.environment_suffix
  enable_nat_gateway    = false
  enable_public_subnets = false

  tags = merge(
    var.tags,
    {
      Environment = "production"
      Project     = var.project_name
    }
  )
}

# Development VPC Module
module "dev_vpc" {
  source = "./modules/vpc"

  vpc_name              = "dev-vpc-${var.environment_suffix}"
  vpc_cidr              = var.dev_vpc_cidr
  availability_zones    = var.availability_zones
  environment           = "development"
  environment_suffix    = var.environment_suffix
  enable_nat_gateway    = false
  enable_public_subnets = false

  tags = merge(
    var.tags,
    {
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for hub-and-spoke architecture"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "main-tgw-${var.environment_suffix}"
      Environment = "shared"
      Project     = var.project_name
    }
  )
}

# Transit Gateway Route Tables
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "hub-tgw-rt-${var.environment_suffix}"
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_route_table" "prod" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "prod-tgw-rt-${var.environment_suffix}"
      Environment = "production"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_route_table" "dev" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "dev-tgw-rt-${var.environment_suffix}"
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway VPC Attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  subnet_ids         = module.hub_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.hub_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "hub-tgw-attachment-${var.environment_suffix}"
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_vpc_attachment" "prod" {
  subnet_ids         = module.prod_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.prod_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "prod-tgw-attachment-${var.environment_suffix}"
      Environment = "production"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_vpc_attachment" "dev" {
  subnet_ids         = module.dev_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.dev_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "dev-tgw-attachment-${var.environment_suffix}"
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway Route Table Associations
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route_table_association" "prod" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_association" "dev" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# Transit Gateway Routes - Hub route table
resource "aws_ec2_transit_gateway_route" "hub_to_prod" {
  destination_cidr_block         = var.prod_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route" "hub_to_dev" {
  destination_cidr_block         = var.dev_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Transit Gateway Routes - Production route table (only to hub)
resource "aws_ec2_transit_gateway_route" "prod_to_hub" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

# Transit Gateway Routes - Development route table (only to hub)
resource "aws_ec2_transit_gateway_route" "dev_to_hub" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# VPC Route Table Routes - Hub private subnets to Transit Gateway
resource "aws_route" "hub_private_to_prod" {
  count                  = length(module.hub_vpc.private_route_table_ids)
  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.prod_vpc_cidr
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "hub_private_to_dev" {
  count                  = length(module.hub_vpc.private_route_table_ids)
  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.dev_vpc_cidr
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

# VPC Route Table Routes - Production private subnets to Transit Gateway for internet
resource "aws_route" "prod_private_to_internet" {
  count                  = length(module.prod_vpc.private_route_table_ids)
  route_table_id         = module.prod_vpc.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.prod]
}

# VPC Route Table Routes - Development private subnets to Transit Gateway for internet
resource "aws_route" "dev_private_to_internet" {
  count                  = length(module.dev_vpc.private_route_table_ids)
  route_table_id         = module.dev_vpc.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.dev]
}

# VPC Flow Logs
module "flow_logs" {
  source = "./modules/flow-logs"
  count  = var.enable_flow_logs ? 1 : 0

  environment_suffix = var.environment_suffix
  retention_days     = var.flow_logs_retention_days
  vpc_configurations = [
    {
      vpc_id      = module.hub_vpc.vpc_id
      vpc_name    = "hub"
      environment = "hub"
    },
    {
      vpc_id      = module.prod_vpc.vpc_id
      vpc_name    = "production"
      environment = "production"
    },
    {
      vpc_id      = module.dev_vpc.vpc_id
      vpc_name    = "development"
      environment = "development"
    }
  ]

  tags = merge(
    var.tags,
    {
      Project = var.project_name
    }
  )
}

# Route53 Private Hosted Zones
resource "aws_route53_zone" "internal" {
  name = "internal.${var.environment_suffix}.local"

  vpc {
    vpc_id = module.hub_vpc.vpc_id
  }

  tags = merge(
    var.tags,
    {
      Name        = "internal-zone-${var.environment_suffix}"
      Environment = "shared"
      Project     = var.project_name
    }
  )
}

resource "aws_route53_zone_association" "prod" {
  zone_id = aws_route53_zone.internal.zone_id
  vpc_id  = module.prod_vpc.vpc_id
}

resource "aws_route53_zone_association" "dev" {
  zone_id = aws_route53_zone.internal.zone_id
  vpc_id  = module.dev_vpc.vpc_id
}
