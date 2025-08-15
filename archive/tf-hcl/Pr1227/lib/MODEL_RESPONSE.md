```hcl
# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myproject"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "regions" {
  description = "List of AWS regions"
  type        = list(string)
  default     = ["us-east-2", "us-west-2"]
}

variable "vpc_cidr_blocks" {
  description = "CIDR blocks for VPCs in each region"
  type        = map(string)
  default = {
    "us-east-2" = "10.0.0.0/16"
    "us-west-2" = "10.1.0.0/16"
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = map(list(string))
  default = {
    "us-east-2" = ["10.0.1.0/24", "10.0.2.0/24"]
    "us-west-2" = ["10.1.1.0/24", "10.1.2.0/24"]
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = map(list(string))
  default = {
    "us-east-2" = ["10.0.10.0/24", "10.0.20.0/24"]
    "us-west-2" = ["10.1.10.0/24", "10.1.20.0/24"]
  }
}

# Data sources for availability zones
data "aws_availability_zones" "us_east_2" {
  provider = aws.us_east_2
  state    = "available"
}

data "aws_availability_zones" "us_west_2" {
  provider = aws.us_west_2
  state    = "available"
}

# VPC for us-east-2
resource "aws_vpc" "us_east_2" {
  provider             = aws.us_east_2
  cidr_block           = var.vpc_cidr_blocks["us-east-2"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# VPC for us-west-2
resource "aws_vpc" "us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = var.vpc_cidr_blocks["us-west-2"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# Internet Gateway for us-east-2
resource "aws_internet_gateway" "us_east_2" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.us_east_2.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

# Internet Gateway for us-west-2
resource "aws_internet_gateway" "us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

# Public subnets for us-east-2
resource "aws_subnet" "public_us_east_2" {
  provider                = aws.us_east_2
  count                   = length(var.public_subnet_cidrs["us-east-2"])
  vpc_id                  = aws_vpc.us_east_2.id
  cidr_block              = var.public_subnet_cidrs["us-east-2"][count.index]
  availability_zone       = data.aws_availability_zones.us_east_2.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
  }
}

# Public subnets for us-west-2
resource "aws_subnet" "public_us_west_2" {
  provider                = aws.us_west_2
  count                   = length(var.public_subnet_cidrs["us-west-2"])
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = var.public_subnet_cidrs["us-west-2"][count.index]
  availability_zone       = data.aws_availability_zones.us_west_2.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
  }
}

# Private subnets for us-east-2
resource "aws_subnet" "private_us_east_2" {
  provider          = aws.us_east_2
  count             = length(var.private_subnet_cidrs["us-east-2"])
  vpc_id            = aws_vpc.us_east_2.id
  cidr_block        = var.private_subnet_cidrs["us-east-2"][count.index]
  availability_zone = data.aws_availability_zones.us_east_2.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
  }
}

# Private subnets for us-west-2
resource "aws_subnet" "private_us_west_2" {
  provider          = aws.us_west_2
  count             = length(var.private_subnet_cidrs["us-west-2"])
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = var.private_subnet_cidrs["us-west-2"][count.index]
  availability_zone = data.aws_availability_zones.us_west_2.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
  }
}

# Public route table for us-east-2
resource "aws_route_table" "public_us_east_2" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.us_east_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_2.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

# Public route table for us-west-2
resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_west_2.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

# Private route table for us-east-2
resource "aws_route_table" "private_us_east_2" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.us_east_2.id

  tags = {
    Name = "${var.project_name}-private-rt-${var.environment}"
  }
}

# Private route table for us-west-2
resource "aws_route_table" "private_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  tags = {
    Name = "${var.project_name}-private-rt-${var.environment}"
  }
}

# Public subnet route table associations for us-east-2
resource "aws_route_table_association" "public_us_east_2" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.public_us_east_2)
  subnet_id      = aws_subnet.public_us_east_2[count.index].id
  route_table_id = aws_route_table.public_us_east_2.id
}

# Public subnet route table associations for us-west-2
resource "aws_route_table_association" "public_us_west_2" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.public_us_west_2)
  subnet_id      = aws_subnet.public_us_west_2[count.index].id
  route_table_id = aws_route_table.public_us_west_2.id
}

# Private subnet route table associations for us-east-2
resource "aws_route_table_association" "private_us_east_2" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.private_us_east_2)
  subnet_id      = aws_subnet.private_us_east_2[count.index].id
  route_table_id = aws_route_table.private_us_east_2.id
}

# Private subnet route table associations for us-west-2
resource "aws_route_table_association" "private_us_west_2" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.private_us_west_2)
  subnet_id      = aws_subnet.private_us_west_2[count.index].id
  route_table_id = aws_route_table.private_us_west_2.id
}

# NAT Gateway Elastic IPs for us-east-2
resource "aws_eip" "nat_us_east_2" {
  provider = aws.us_east_2
  count    = length(var.public_subnet_cidrs["us-east-2"])
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.us_east_2]
}

# NAT Gateway Elastic IPs for us-west-2
resource "aws_eip" "nat_us_west_2" {
  provider = aws.us_west_2
  count    = length(var.public_subnet_cidrs["us-west-2"])
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.us_west_2]
}

# NAT Gateways for us-east-2
resource "aws_nat_gateway" "us_east_2" {
  provider      = aws.us_east_2
  count         = length(var.public_subnet_cidrs["us-east-2"])
  allocation_id = aws_eip.nat_us_east_2[count.index].id
  subnet_id     = aws_subnet.public_us_east_2[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gw-${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.us_east_2]
}

# NAT Gateways for us-west-2
resource "aws_nat_gateway" "us_west_2" {
  provider      = aws.us_west_2
  count         = length(var.public_subnet_cidrs["us-west-2"])
  allocation_id = aws_eip.nat_us_west_2[count.index].id
  subnet_id     = aws_subnet.public_us_west_2[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gw-${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.us_west_2]
}

# Private route table routes for NAT Gateway us-east-2
resource "aws_route" "private_nat_us_east_2" {
  provider           = aws.us_east_2
  route_table_id     = aws_route_table.private_us_east_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id     = aws_nat_gateway.us_east_2[0].id
}

# Private route table routes for NAT Gateway us-west-2
resource "aws_route" "private_nat_us_west_2" {
  provider           = aws.us_west_2
  route_table_id     = aws_route_table.private_us_west_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id     = aws_nat_gateway.us_west_2[0].id
}
```