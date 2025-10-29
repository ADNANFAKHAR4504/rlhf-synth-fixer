# Create VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-vpc-${var.purpose}-${var.name_suffix}"
  })
}

# Create public subnets (smaller for ALBs/bastion hosts)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 10, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-public-az${count.index + 1}-${var.name_suffix}"
    Type = "public"
  })
}

# Create private subnets (larger for workloads)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 6, count.index + 1)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Create Transit Gateway attachment subnets
resource "aws_subnet" "tgw_attachment" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 10, count.index + 240)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-tgw-attachment-az${count.index + 1}-${var.name_suffix}"
    Type = "tgw-attachment"
  })
}

# Create public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-public-${var.name_suffix}"
    Type = "public"
  })
}

# Create private route table (single table for spokes)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-private-${var.name_suffix}"
    Type = "private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Associate TGW attachment subnets with private route table
resource "aws_route_table_association" "tgw_attachment" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.tgw_attachment[count.index].id
  route_table_id = aws_route_table.private.id
}
