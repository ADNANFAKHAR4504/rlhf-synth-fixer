# main.tf - Core VPC Peering Infrastructure

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# PRODUCTION VPC (Primary Region: us-east-1)
# -----------------------------------------------------------------------------

resource "aws_vpc" "production" {
  provider             = aws.primary
  cidr_block           = local.production_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "production-vpc-${var.environment_suffix}"
    Tier = "production"
  })
}

# Public subnets (no peering routes)
resource "aws_subnet" "production_public" {
  provider = aws.primary
  count    = length(local.production_public_subnet_cidrs)

  vpc_id                  = aws_vpc.production.id
  cidr_block              = local.production_public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "production-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Application subnets (will have peering routes)
resource "aws_subnet" "production_app" {
  provider = aws.primary
  count    = length(local.production_app_subnet_cidrs)

  vpc_id            = aws_vpc.production.id
  cidr_block        = local.production_app_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "production-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Database subnets (no peering routes)
resource "aws_subnet" "production_db" {
  provider = aws.primary
  count    = length(local.production_db_subnet_cidrs)

  vpc_id            = aws_vpc.production.id
  cidr_block        = local.production_db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "production-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "production" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-igw-${var.environment_suffix}"
  })
}

# -----------------------------------------------------------------------------
# PARTNER VPC (Secondary Region: us-east-2)
# -----------------------------------------------------------------------------

resource "aws_vpc" "partner" {
  provider             = aws.partner
  cidr_block           = local.partner_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "partner-vpc-${var.environment_suffix}"
    Tier = "partner"
  })
}

# Partner application subnets (will have peering routes)
resource "aws_subnet" "partner_app" {
  provider = aws.partner
  count    = length(local.partner_app_subnet_cidrs)

  vpc_id            = aws_vpc.partner.id
  cidr_block        = local.partner_app_subnet_cidrs[count.index]
  availability_zone = local.partner_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "partner-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Partner public subnets (no peering routes)
resource "aws_subnet" "partner_public" {
  provider = aws.partner
  count    = length(local.partner_public_subnet_cidrs)

  vpc_id                  = aws_vpc.partner.id
  cidr_block              = local.partner_public_subnet_cidrs[count.index]
  availability_zone       = local.partner_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "partner-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Partner database subnets (no peering routes)
resource "aws_subnet" "partner_db" {
  provider = aws.partner
  count    = length(local.partner_db_subnet_cidrs)

  vpc_id            = aws_vpc.partner.id
  cidr_block        = local.partner_db_subnet_cidrs[count.index]
  availability_zone = local.partner_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "partner-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# Internet Gateway for partner VPC
resource "aws_internet_gateway" "partner" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-igw-${var.environment_suffix}"
  })
}

# -----------------------------------------------------------------------------
# VPC PEERING CONNECTION
# -----------------------------------------------------------------------------

# Create VPC peering connection (requester side in us-east-1)
resource "aws_vpc_peering_connection" "production_to_partner" {
  provider      = aws.primary
  vpc_id        = aws_vpc.production.id
  peer_vpc_id   = aws_vpc.partner.id
  peer_region   = var.partner_region
  peer_owner_id = var.partner_account_id != "" ? var.partner_account_id : data.aws_caller_identity.current.account_id
  auto_accept   = false

  # Configure DNS resolution options for the requester
  requester {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  tags = merge(local.common_tags, {
    Name = "production-partner-peering-${var.environment_suffix}"
    Side = "requester"
  })
}

# Accept VPC peering connection (accepter side in us-east-2)
resource "aws_vpc_peering_connection_accepter" "partner_accept" {
  provider                  = aws.partner
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id
  auto_accept               = true

  # Configure DNS resolution options for the accepter
  accepter {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  tags = merge(local.common_tags, {
    Name = "partner-production-peering-accepter-${var.environment_suffix}"
    Side = "accepter"
  })
}