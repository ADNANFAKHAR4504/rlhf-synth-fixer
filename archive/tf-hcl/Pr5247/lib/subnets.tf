# subnets.tf - Public and private subnets across availability zones

# Public subnets (3 subnets with /26 CIDR blocks)
resource "aws_subnet" "public" {
  count = var.availability_zones_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.selected_azs[count.index]
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = merge(local.common_tags, {
    Name = local.public_subnet_names[count.index]
    Type = "public-subnet"
    Tier = "public"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}

# Private subnets (3 subnets with /24 CIDR blocks)
resource "aws_subnet" "private" {
  count = var.availability_zones_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.selected_azs[count.index]

  tags = merge(local.common_tags, {
    Name = local.private_subnet_names[count.index]
    Type = "private-subnet"
    Tier = "private"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}