# Create VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-vpc-${var.purpose}-${var.name_suffix}"
  })
}

# Create Internet Gateway (optional)
resource "aws_internet_gateway" "this" {
  count = var.create_igw ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-igw-${var.purpose}-${var.name_suffix}"
  })
}

# Create public subnets
resource "aws_subnet" "public" {
  count = var.create_public_subnets ? length(var.availability_zones) : 0

  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-public-az${count.index + 1}-${var.name_suffix}"
    Type = "public"
  })
}

# Create private subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Create Transit Gateway attachment subnets
resource "aws_subnet" "tgw_attachment" {
  count = var.create_tgw_attachment_subnets ? length(var.availability_zones) : 0

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-tgw-attachment-az${count.index + 1}-${var.name_suffix}"
    Type = "tgw-attachment"
  })
}

# Create public route table
resource "aws_route_table" "public" {
  count = var.create_public_subnets ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-public-${var.name_suffix}"
    Type = "public"
  })
}

# Create private route tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = var.create_public_subnets ? length(var.availability_zones) : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Associate TGW attachment subnets with private route tables
resource "aws_route_table_association" "tgw_attachment" {
  count = var.create_tgw_attachment_subnets ? length(var.availability_zones) : 0

  subnet_id      = aws_subnet.tgw_attachment[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Create default route to IGW for public route table
resource "aws_route" "public_igw" {
  count = var.create_igw && var.create_public_subnets ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}
