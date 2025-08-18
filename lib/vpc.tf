########################
# VPC and Networking (Primary and Secondary Regions)
########################

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# Primary VPC
resource "aws_vpc" "primary" {
  provider              = aws.primary
  cidr_block            = var.vpc_cidr_primary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-primary"
  }
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider              = aws.secondary
  cidr_block            = var.vpc_cidr_secondary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-secondary"
  }
}

resource "aws_subnet" "private_primary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  cidr_block  = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-primary"
  }
}

resource "aws_subnet" "private_secondary" {
  provider    = aws.secondary
  vpc_id      = aws_vpc.secondary.id
  cidr_block  = "10.1.1.0/24"
  availability_zone = "us-west-2a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-secondary"
  }
}


# Private Subnets for Primary Region
resource "aws_subnet" "private_primary_1" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 1)
  availability_zone   = "us-east-1a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-primary-1"
  }
}

resource "aws_subnet" "private_primary_2" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 2)
  availability_zone   = "us-east-1b"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-primary-2"
  }
}

# Private Subnets for Secondary Region
resource "aws_subnet" "private_secondary_1" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 1)
  availability_zone   = "us-west-2a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-secondary-1"
  }
}

resource "aws_subnet" "private_secondary_2" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 2)
  availability_zone   = "us-west-2b"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-secondary-2"
  }
}

# Outputs for VPC IDs
output "vpc_id_primary" {
  value = aws_vpc.primary.id
}

output "vpc_id_secondary" {
  value = aws_vpc.secondary.id
}
