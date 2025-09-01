resource "aws_eip" "vpc1_nat" {
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "vpc1-nat-eip-${var.environment}"
  })
}

resource "aws_eip" "vpc2_nat" {
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "vpc2-nat-eip-${var.environment}"
  })
}

resource "aws_nat_gateway" "vpc1_nat" {
  allocation_id = aws_eip.vpc1_nat.id
  subnet_id     = aws_subnet.vpc1_public.id

  tags = merge(var.common_tags, {
    Name = "vpc1-nat-gateway-${var.environment}"
  })

  depends_on = [aws_internet_gateway.igw1]
}

resource "aws_nat_gateway" "vpc2_nat" {
  allocation_id = aws_eip.vpc2_nat.id
  subnet_id     = aws_subnet.vpc2_public.id

  tags = merge(var.common_tags, {
    Name = "vpc2-nat-gateway-${var.environment}"
  })

  depends_on = [aws_internet_gateway.igw2]
}