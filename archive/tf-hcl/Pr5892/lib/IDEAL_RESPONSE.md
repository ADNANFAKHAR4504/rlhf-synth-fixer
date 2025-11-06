```hcl

# ============================================================================
# TAP_STACK.TF - Multi-Region, Multi-Environment Network Infrastructure
# ============================================================================
# This file contains the complete network stack for dev, staging, and prod
# environments across multiple AWS regions. It uses Terraform workspaces
# to switch between environments and dynamically configures resources.
# ============================================================================

# ----------------------------------------------------------------------------
# INPUT VARIABLES
# ----------------------------------------------------------------------------

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "third_region" {
  description = "Third AWS region for deployment"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Environment name (dev/staging/prod) - typically set via workspace"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "fintech-core-network"
}

variable "compliance_tag" {
  description = "Compliance tag for resources"
  type        = string
  default     = "SOC2"
}

variable "managed_by" {
  description = "Resource management identifier"
  type        = string
  default     = "terraform"
}

# ----------------------------------------------------------------------------
# DATA SOURCES
# ----------------------------------------------------------------------------

# Fetch available AZs for each region
data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "us_west_2" {
  provider = aws.us_west_2
  state    = "available"
}

data "aws_availability_zones" "ap_southeast_2" {
  provider = aws.ap_southeast_2
  state    = "available"
}

# ----------------------------------------------------------------------------
# LOCAL VARIABLES FOR CONFIGURATION
# ----------------------------------------------------------------------------

locals {
  # Determine current environment from workspace
  current_env = terraform.workspace == "default" ? var.environment : terraform.workspace

  # Resource suffix for uniqueness
  resource_suffix = "mult"

  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr          = "10.1.0.0/16"
      nat_gateway_count = 1
      port_range_start  = 8000
      port_range_end    = 8999
      enable_ha_nat     = false
    }
    staging = {
      vpc_cidr          = "10.2.0.0/16"
      nat_gateway_count = 3
      port_range_start  = 9000
      port_range_end    = 9999
      enable_ha_nat     = true
    }
    prod = {
      vpc_cidr          = "10.3.0.0/16"
      nat_gateway_count = 3
      port_range_start  = 443
      port_range_end    = 443
      enable_ha_nat     = true
    }
  }

  # Current environment configuration
  current_config = local.env_config[local.current_env]

  # Subnet calculations - 6 subnets total (3 public, 3 private)
  subnet_cidrs = {
    public = [
      cidrsubnet(local.current_config.vpc_cidr, 8, 0), # x.x.0.0/24
      cidrsubnet(local.current_config.vpc_cidr, 8, 1), # x.x.1.0/24
      cidrsubnet(local.current_config.vpc_cidr, 8, 2), # x.x.2.0/24
    ]
    private = [
      cidrsubnet(local.current_config.vpc_cidr, 8, 10), # x.x.10.0/24
      cidrsubnet(local.current_config.vpc_cidr, 8, 11), # x.x.11.0/24
      cidrsubnet(local.current_config.vpc_cidr, 8, 12), # x.x.12.0/24
    ]
  }

  # Region mapping for iteration
  regions = {
    us_east_1      = var.primary_region
    us_west_2      = var.secondary_region
    ap_southeast_2 = var.third_region
  }

  # AZ data mapping
  az_data = {
    us_east_1      = data.aws_availability_zones.us_east_1
    us_west_2      = data.aws_availability_zones.us_west_2
    ap_southeast_2 = data.aws_availability_zones.ap_southeast_2
  }

  # Common tags for all resources
  common_tags = {
    Environment = local.current_env
    Project     = var.project_name
    ManagedBy   = var.managed_by
    Compliance  = var.compliance_tag
    Workspace   = terraform.workspace
    Timestamp   = timestamp()
  }
}

# ============================================================================
# US-EAST-1 RESOURCES
# ============================================================================

# ----------------------------------------------------------------------------
# VPC - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-vpc-us-east-1-${local.resource_suffix}"
      Region = var.primary_region
    }
  )
}

# ----------------------------------------------------------------------------
# INTERNET GATEWAY - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-igw-us-east-1-${local.resource_suffix}"
      Region = var.primary_region
    }
  )
}

# ----------------------------------------------------------------------------
# PUBLIC SUBNETS - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_subnet" "public_us_east_1" {
  count                   = 3
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = local.subnet_cidrs.public[count.index]
  availability_zone       = local.az_data.us_east_1.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-subnet-az${count.index + 1}-us-east-1-${local.resource_suffix}"
      Type   = "Public"
      AZ     = local.az_data.us_east_1.names[count.index]
      Region = var.primary_region
    }
  )
}

# ----------------------------------------------------------------------------
# PRIVATE SUBNETS - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_subnet" "private_us_east_1" {
  count             = 3
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = local.subnet_cidrs.private[count.index]
  availability_zone = local.az_data.us_east_1.names[count.index]

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-subnet-az${count.index + 1}-us-east-1-${local.resource_suffix}"
      Type   = "Private"
      AZ     = local.az_data.us_east_1.names[count.index]
      Region = var.primary_region
    }
  )
}

# ----------------------------------------------------------------------------
# ELASTIC IPs FOR NAT - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_eip" "nat_us_east_1" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.us_east_1
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-eip-az${count.index + 1}-us-east-1-${local.resource_suffix}"
      Region = var.primary_region
    }
  )

  depends_on = [aws_internet_gateway.us_east_1]
}

# ----------------------------------------------------------------------------
# NAT GATEWAYS - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_nat_gateway" "us_east_1" {
  count         = local.current_config.enable_ha_nat ? 3 : 1
  provider      = aws.us_east_1
  allocation_id = aws_eip.nat_us_east_1[count.index].id
  subnet_id     = aws_subnet.public_us_east_1[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-gateway-az${count.index + 1}-us-east-1-${local.resource_suffix}"
      Region = var.primary_region
    }
  )

  depends_on = [aws_internet_gateway.us_east_1]
}

# ----------------------------------------------------------------------------
# ROUTE TABLES - US-EAST-1
# ----------------------------------------------------------------------------

# Public Route Table
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-rtb-us-east-1-${local.resource_suffix}"
      Type   = "Public"
      Region = var.primary_region
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private_us_east_1" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_east_1[local.current_config.enable_ha_nat ? count.index : 0].id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-rtb-az${count.index + 1}-us-east-1-${local.resource_suffix}"
      Type   = "Private"
      Region = var.primary_region
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public_us_east_1" {
  count          = 3
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.public_us_east_1[count.index].id
  route_table_id = aws_route_table.public_us_east_1.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_us_east_1" {
  count          = 3
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.private_us_east_1[count.index].id
  route_table_id = aws_route_table.private_us_east_1[local.current_config.enable_ha_nat ? count.index : 0].id
}

# ----------------------------------------------------------------------------
# SECURITY GROUPS - US-EAST-1
# ----------------------------------------------------------------------------

resource "aws_security_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.current_env}-app-sg-us-east-1-${local.resource_suffix}"
  description = "Security group for ${local.current_env} application tier"
  vpc_id      = aws_vpc.us_east_1.id

  # Ingress rules based on environment
  ingress {
    description = "Environment-specific application ports"
    from_port   = local.current_config.port_range_start
    to_port     = local.current_config.port_range_end
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS for all environments
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow SSH from VPC CIDR
  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.current_config.vpc_cidr]
  }

  # Default egress rule
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-app-sg-us-east-1-${local.resource_suffix}"
      Type   = "Application"
      Region = var.primary_region
    }
  )
}

resource "aws_security_group" "database_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.current_env}-db-sg-us-east-1-${local.resource_suffix}"
  description = "Security group for ${local.current_env} database tier"
  vpc_id      = aws_vpc.us_east_1.id

  # PostgreSQL
  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_east_1.id]
  }

  # MySQL
  ingress {
    description     = "MySQL from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_east_1.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-db-sg-us-east-1-${local.resource_suffix}"
      Type   = "Database"
      Region = var.primary_region
    }
  )
}

# ============================================================================
# EU-WEST-2 RESOURCES
# ============================================================================

# ----------------------------------------------------------------------------
# VPC - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_vpc" "us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-vpc-us-west-2-${local.resource_suffix}"
      Region = var.secondary_region
    }
  )
}

# ----------------------------------------------------------------------------
# INTERNET GATEWAY - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_internet_gateway" "us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-igw-us-west-2-${local.resource_suffix}"
      Region = var.secondary_region
    }
  )
}

# ----------------------------------------------------------------------------
# PUBLIC SUBNETS - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_subnet" "public_us_west_2" {
  count                   = 3
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = local.subnet_cidrs.public[count.index]
  availability_zone       = local.az_data.us_west_2.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-subnet-az${count.index + 1}-us-west-2-${local.resource_suffix}"
      Type   = "Public"
      AZ     = local.az_data.us_west_2.names[count.index]
      Region = var.secondary_region
    }
  )
}

# ----------------------------------------------------------------------------
# PRIVATE SUBNETS - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_subnet" "private_us_west_2" {
  count             = 3
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = local.subnet_cidrs.private[count.index]
  availability_zone = local.az_data.us_west_2.names[count.index]

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-subnet-az${count.index + 1}-us-west-2-${local.resource_suffix}"
      Type   = "Private"
      AZ     = local.az_data.us_west_2.names[count.index]
      Region = var.secondary_region
    }
  )
}

# ----------------------------------------------------------------------------
# ELASTIC IPs FOR NAT - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_eip" "nat_us_west_2" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.us_west_2
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-eip-az${count.index + 1}-us-west-2-${local.resource_suffix}"
      Region = var.secondary_region
    }
  )

  depends_on = [aws_internet_gateway.us_west_2]
}

# ----------------------------------------------------------------------------
# NAT GATEWAYS - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_nat_gateway" "us_west_2" {
  count         = local.current_config.enable_ha_nat ? 3 : 1
  provider      = aws.us_west_2
  allocation_id = aws_eip.nat_us_west_2[count.index].id
  subnet_id     = aws_subnet.public_us_west_2[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-gateway-az${count.index + 1}-us-west-2-${local.resource_suffix}"
      Region = var.secondary_region
    }
  )

  depends_on = [aws_internet_gateway.us_west_2]
}

# ----------------------------------------------------------------------------
# ROUTE TABLES - EU-WEST-2
# ----------------------------------------------------------------------------

# Public Route Table
resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_west_2.id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-rtb-us-west-2-${local.resource_suffix}"
      Type   = "Public"
      Region = var.secondary_region
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private_us_west_2" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_west_2[local.current_config.enable_ha_nat ? count.index : 0].id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-rtb-az${count.index + 1}-us-west-2-${local.resource_suffix}"
      Type   = "Private"
      Region = var.secondary_region
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public_us_west_2" {
  count          = 3
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.public_us_west_2[count.index].id
  route_table_id = aws_route_table.public_us_west_2.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_us_west_2" {
  count          = 3
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.private_us_west_2[count.index].id
  route_table_id = aws_route_table.private_us_west_2[local.current_config.enable_ha_nat ? count.index : 0].id
}

# ----------------------------------------------------------------------------
# SECURITY GROUPS - EU-WEST-2
# ----------------------------------------------------------------------------

resource "aws_security_group" "app_us_west_2" {
  provider    = aws.us_west_2
  name        = "${local.current_env}-app-sg-us-west-2-${local.resource_suffix}"
  description = "Security group for ${local.current_env} application tier"
  vpc_id      = aws_vpc.us_west_2.id

  ingress {
    description = "Environment-specific application ports"
    from_port   = local.current_config.port_range_start
    to_port     = local.current_config.port_range_end
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.current_config.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-app-sg-us-west-2-${local.resource_suffix}"
      Type   = "Application"
      Region = var.secondary_region
    }
  )
}

resource "aws_security_group" "database_us_west_2" {
  provider    = aws.us_west_2
  name        = "${local.current_env}-db-sg-us-west-2-${local.resource_suffix}"
  description = "Security group for ${local.current_env} database tier"
  vpc_id      = aws_vpc.us_west_2.id

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_west_2.id]
  }

  ingress {
    description     = "MySQL from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_west_2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-db-sg-us-west-2-${local.resource_suffix}"
      Type   = "Database"
      Region = var.secondary_region
    }
  )
}

# ============================================================================
# AP-SOUTHEAST-2 RESOURCES
# ============================================================================

# ----------------------------------------------------------------------------
# VPC - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_vpc" "ap_southeast_2" {
  provider             = aws.ap_southeast_2
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-vpc-ap-southeast-2-${local.resource_suffix}"
      Region = var.third_region
    }
  )
}

# ----------------------------------------------------------------------------
# INTERNET GATEWAY - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_internet_gateway" "ap_southeast_2" {
  provider = aws.ap_southeast_2
  vpc_id   = aws_vpc.ap_southeast_2.id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-igw-ap-southeast-2-${local.resource_suffix}"
      Region = var.third_region
    }
  )
}

# ----------------------------------------------------------------------------
# PUBLIC SUBNETS - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_subnet" "public_ap_southeast_2" {
  count                   = 3
  provider                = aws.ap_southeast_2
  vpc_id                  = aws_vpc.ap_southeast_2.id
  cidr_block              = local.subnet_cidrs.public[count.index]
  availability_zone       = local.az_data.ap_southeast_2.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-subnet-az${count.index + 1}-ap-southeast-2-${local.resource_suffix}"
      Type   = "Public"
      AZ     = local.az_data.ap_southeast_2.names[count.index]
      Region = var.third_region
    }
  )
}

# ----------------------------------------------------------------------------
# PRIVATE SUBNETS - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_subnet" "private_ap_southeast_2" {
  count             = 3
  provider          = aws.ap_southeast_2
  vpc_id            = aws_vpc.ap_southeast_2.id
  cidr_block        = local.subnet_cidrs.private[count.index]
  availability_zone = local.az_data.ap_southeast_2.names[count.index]

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-subnet-az${count.index + 1}-ap-southeast-2-${local.resource_suffix}"
      Type   = "Private"
      AZ     = local.az_data.ap_southeast_2.names[count.index]
      Region = var.third_region
    }
  )
}

# ----------------------------------------------------------------------------
# ELASTIC IPs FOR NAT - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_eip" "nat_ap_southeast_2" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.ap_southeast_2
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-eip-az${count.index + 1}-ap-southeast-2-${local.resource_suffix}"
      Region = var.third_region
    }
  )

  depends_on = [aws_internet_gateway.ap_southeast_2]
}

# ----------------------------------------------------------------------------
# NAT GATEWAYS - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_nat_gateway" "ap_southeast_2" {
  count         = local.current_config.enable_ha_nat ? 3 : 1
  provider      = aws.ap_southeast_2
  allocation_id = aws_eip.nat_ap_southeast_2[count.index].id
  subnet_id     = aws_subnet.public_ap_southeast_2[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-nat-gateway-az${count.index + 1}-ap-southeast-2-${local.resource_suffix}"
      Region = var.third_region
    }
  )

  depends_on = [aws_internet_gateway.ap_southeast_2]
}

# ----------------------------------------------------------------------------
# ROUTE TABLES - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

# Public Route Table
resource "aws_route_table" "public_ap_southeast_2" {
  provider = aws.ap_southeast_2
  vpc_id   = aws_vpc.ap_southeast_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ap_southeast_2.id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-public-rtb-ap-southeast-2-${local.resource_suffix}"
      Type   = "Public"
      Region = var.third_region
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private_ap_southeast_2" {
  count    = local.current_config.enable_ha_nat ? 3 : 1
  provider = aws.ap_southeast_2
  vpc_id   = aws_vpc.ap_southeast_2.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.ap_southeast_2[local.current_config.enable_ha_nat ? count.index : 0].id
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-private-rtb-az${count.index + 1}-ap-southeast-2-${local.resource_suffix}"
      Type   = "Private"
      Region = var.third_region
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public_ap_southeast_2" {
  count          = 3
  provider       = aws.ap_southeast_2
  subnet_id      = aws_subnet.public_ap_southeast_2[count.index].id
  route_table_id = aws_route_table.public_ap_southeast_2.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_ap_southeast_2" {
  count          = 3
  provider       = aws.ap_southeast_2
  subnet_id      = aws_subnet.private_ap_southeast_2[count.index].id
  route_table_id = aws_route_table.private_ap_southeast_2[local.current_config.enable_ha_nat ? count.index : 0].id
}

# ----------------------------------------------------------------------------
# SECURITY GROUPS - AP-SOUTHEAST-2
# ----------------------------------------------------------------------------

resource "aws_security_group" "app_ap_southeast_2" {
  provider    = aws.ap_southeast_2
  name        = "${local.current_env}-app-sg-ap-southeast-2-${local.resource_suffix}"
  description = "Security group for ${local.current_env} application tier"
  vpc_id      = aws_vpc.ap_southeast_2.id

  ingress {
    description = "Environment-specific application ports"
    from_port   = local.current_config.port_range_start
    to_port     = local.current_config.port_range_end
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.current_config.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-app-sg-ap-southeast-2-${local.resource_suffix}"
      Type   = "Application"
      Region = var.third_region
    }
  )
}

resource "aws_security_group" "database_ap_southeast_2" {
  provider    = aws.ap_southeast_2
  name        = "${local.current_env}-db-sg-ap-southeast-2-${local.resource_suffix}"
  description = "Security group for ${local.current_env} database tier"
  vpc_id      = aws_vpc.ap_southeast_2.id

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_ap_southeast_2.id]
  }

  ingress {
    description     = "MySQL from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_ap_southeast_2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.current_env}-db-sg-ap-southeast-2-${local.resource_suffix}"
      Type   = "Database"
      Region = var.third_region
    }
  )
}

# ============================================================================
# OUTPUTS
# ============================================================================

# ----------------------------------------------------------------------------
# US-EAST-1 OUTPUTS
# ----------------------------------------------------------------------------

output "us_east_1_vpc_id" {
  description = "VPC ID for US-EAST-1 region"
  value       = aws_vpc.us_east_1.id
}

output "us_east_1_vpc_cidr" {
  description = "VPC CIDR block for US-EAST-1 region"
  value       = aws_vpc.us_east_1.cidr_block
}

output "us_east_1_public_subnet_ids" {
  description = "Public subnet IDs for US-EAST-1 region"
  value       = aws_subnet.public_us_east_1[*].id
}

output "us_east_1_private_subnet_ids" {
  description = "Private subnet IDs for US-EAST-1 region"
  value       = aws_subnet.private_us_east_1[*].id
}

output "us_east_1_nat_gateway_ids" {
  description = "NAT Gateway IDs for US-EAST-1 region"
  value       = aws_nat_gateway.us_east_1[*].id
}

output "us_east_1_nat_eip_addresses" {
  description = "NAT Gateway Elastic IP addresses for US-EAST-1 region"
  value       = aws_eip.nat_us_east_1[*].public_ip
}

output "us_east_1_internet_gateway_id" {
  description = "Internet Gateway ID for US-EAST-1 region"
  value       = aws_internet_gateway.us_east_1.id
}

output "us_east_1_public_route_table_id" {
  description = "Public route table ID for US-EAST-1 region"
  value       = aws_route_table.public_us_east_1.id
}

output "us_east_1_private_route_table_ids" {
  description = "Private route table IDs for US-EAST-1 region"
  value       = aws_route_table.private_us_east_1[*].id
}

output "us_east_1_app_security_group_id" {
  description = "Application security group ID for US-EAST-1 region"
  value       = aws_security_group.app_us_east_1.id
}

output "us_east_1_database_security_group_id" {
  description = "Database security group ID for US-EAST-1 region"
  value       = aws_security_group.database_us_east_1.id
}

# ----------------------------------------------------------------------------
# EU-WEST-2 OUTPUTS
# ----------------------------------------------------------------------------

output "us_west_2_vpc_id" {
  description = "VPC ID for EU-WEST-2 region"
  value       = aws_vpc.us_west_2.id
}

output "us_west_2_vpc_cidr" {
  description = "VPC CIDR block for EU-WEST-2 region"
  value       = aws_vpc.us_west_2.cidr_block
}

output "us_west_2_public_subnet_ids" {
  description = "Public subnet IDs for EU-WEST-2 region"
  value       = aws_subnet.public_us_west_2[*].id
}

output "us_west_2_private_subnet_ids" {
  description = "Private subnet IDs for EU-WEST-2 region"
  value       = aws_subnet.private_us_west_2[*].id
}

output "us_west_2_nat_gateway_ids" {
  description = "NAT Gateway IDs for EU-WEST-2 region"
  value       = aws_nat_gateway.us_west_2[*].id
}

output "us_west_2_nat_eip_addresses" {
  description = "NAT Gateway Elastic IP addresses for EU-WEST-2 region"
  value       = aws_eip.nat_us_west_2[*].public_ip
}

output "us_west_2_internet_gateway_id" {
  description = "Internet Gateway ID for EU-WEST-2 region"
  value       = aws_internet_gateway.us_west_2.id
}

output "us_west_2_public_route_table_id" {
  description = "Public route table ID for EU-WEST-2 region"
  value       = aws_route_table.public_us_west_2.id
}

output "us_west_2_private_route_table_ids" {
  description = "Private route table IDs for EU-WEST-2 region"
  value       = aws_route_table.private_us_west_2[*].id
}

output "us_west_2_app_security_group_id" {
  description = "Application security group ID for EU-WEST-2 region"
  value       = aws_security_group.app_us_west_2.id
}

output "us_west_2_database_security_group_id" {
  description = "Database security group ID for EU-WEST-2 region"
  value       = aws_security_group.database_us_west_2.id
}

# ----------------------------------------------------------------------------
# AP-SOUTHEAST-2 OUTPUTS
# ----------------------------------------------------------------------------

output "ap_southeast_2_vpc_id" {
  description = "VPC ID for AP-SOUTHEAST-2 region"
  value       = aws_vpc.ap_southeast_2.id
}

output "ap_southeast_2_vpc_cidr" {
  description = "VPC CIDR block for AP-SOUTHEAST-2 region"
  value       = aws_vpc.ap_southeast_2.cidr_block
}

output "ap_southeast_2_public_subnet_ids" {
  description = "Public subnet IDs for AP-SOUTHEAST-2 region"
  value       = aws_subnet.public_ap_southeast_2[*].id
}

output "ap_southeast_2_private_subnet_ids" {
  description = "Private subnet IDs for AP-SOUTHEAST-2 region"
  value       = aws_subnet.private_ap_southeast_2[*].id
}

output "ap_southeast_2_nat_gateway_ids" {
  description = "NAT Gateway IDs for AP-SOUTHEAST-2 region"
  value       = aws_nat_gateway.ap_southeast_2[*].id
}

output "ap_southeast_2_nat_eip_addresses" {
  description = "NAT Gateway Elastic IP addresses for AP-SOUTHEAST-2 region"
  value       = aws_eip.nat_ap_southeast_2[*].public_ip
}

output "ap_southeast_2_internet_gateway_id" {
  description = "Internet Gateway ID for AP-SOUTHEAST-2 region"
  value       = aws_internet_gateway.ap_southeast_2.id
}

output "ap_southeast_2_public_route_table_id" {
  description = "Public route table ID for AP-SOUTHEAST-2 region"
  value       = aws_route_table.public_ap_southeast_2.id
}

output "ap_southeast_2_private_route_table_ids" {
  description = "Private route table IDs for AP-SOUTHEAST-2 region"
  value       = aws_route_table.private_ap_southeast_2[*].id
}

output "ap_southeast_2_app_security_group_id" {
  description = "Application security group ID for AP-SOUTHEAST-2 region"
  value       = aws_security_group.app_ap_southeast_2.id
}

output "ap_southeast_2_database_security_group_id" {
  description = "Database security group ID for AP-SOUTHEAST-2 region"
  value       = aws_security_group.database_ap_southeast_2.id
}

# ----------------------------------------------------------------------------
# GENERAL OUTPUTS
# ----------------------------------------------------------------------------

output "environment" {
  description = "Current environment name"
  value       = local.current_env
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "vpc_cidr_block" {
  description = "VPC CIDR block for current environment"
  value       = local.current_config.vpc_cidr
}

output "nat_gateway_strategy" {
  description = "NAT Gateway deployment strategy for current environment"
  value       = local.current_config.enable_ha_nat ? "High Availability (1 per AZ)" : "Single NAT Gateway"
}


output "allowed_port_range_start" {
  description = "Starting port for allowed inbound traffic in this environment"
  value       = local.current_config.port_range_start
}

output "allowed_port_range_end" {
  description = "Ending port for allowed inbound traffic in this environment"
  value       = local.current_config.port_range_end
}

output "resource_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

output "aws_primary_region" {
  description = "aws primary region"
  value       = var.primary_region
}

output "aws_secondary_region" {
  description = "aws secondary region"
  value       = var.secondary_region
}

output "aws_third_region" {
  description = "aws third region"
  value       = var.third_region
}

```

```

# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_east_1"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.secondary_region
}

provider "aws" {
  alias  = "ap_southeast_2"
  region = var.third_region
}

```
