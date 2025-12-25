############################################################
# tap_stack.tf - AWS VPC Networking Infrastructure
# Foundational cloud environment with secure network connectivity
############################################################

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = length(trimspace(var.aws_region)) > 0
    error_message = "aws_region must be a non-empty string."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2 && alltrue([for c in var.public_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "public_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2 && alltrue([for c in var.private_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "private_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "Production"

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must be a non-empty string."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = ""
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

########################
# Locals
########################

locals {
  # Availability zones - use first two available
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # Common tags for all resources
  common_tags = {
    Environment = var.environment
  }
}

########################
# VPC
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "main-vpc"
  })
}

########################
# Internet Gateway
########################

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "main-igw"
  })
}

########################
# Public Subnets
########################

resource "aws_subnet" "public" {
  for_each = {
    "0" = { cidr = var.public_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.public_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  depends_on = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "public-subnet-${each.key}"
    Tier = "public"
  })
}

########################
# Private Subnets
########################

resource "aws_subnet" "private" {
  for_each = {
    "0" = { cidr = var.private_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.private_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  depends_on = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${each.key}"
    Tier = "private"
  })
}

########################
# Public Route Table
########################

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  depends_on = [aws_vpc.main, aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "public-rt"
  })
}

########################
# Public Route Table Associations
########################

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

########################
# Private Route Table
########################

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "private-rt"
  })
}

########################
# Private Route Table Associations
########################

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

########################
# Outputs
########################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]
}

output "public_route_table_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "Private route table ID"
  value       = aws_route_table.private.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}
