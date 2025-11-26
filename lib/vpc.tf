# vpc.tf - VPC and networking configuration

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name       = "payment-vpc-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Public subnets for ALB
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name       = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type       = "public"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Private subnets for ECS tasks
resource "aws_subnet" "private_app" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name       = "payment-private-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Type       = "private-app"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Private subnets for database
resource "aws_subnet" "private_db" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name       = "payment-private-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Type       = "private-db"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name       = "payment-igw-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# NAT Gateways for private subnets
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name       = "payment-nat-eip-${count.index + 1}-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name       = "payment-nat-${count.index + 1}-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name       = "payment-public-rt-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_route_table" "private_app" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name       = "payment-private-app-rt-${count.index + 1}-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name       = "payment-private-db-rt-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Route table associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count          = 3
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

resource "aws_route_table_association" "private_db" {
  count          = 3
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}

# VPC Endpoints for S3 and ECR
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private_app[*].id,
    [aws_route_table.private_db.id]
  )

  tags = {
    Name       = "payment-s3-endpoint-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name       = "payment-ecr-api-endpoint-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name       = "payment-ecr-dkr-endpoint-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "payment-vpc-endpoints-${var.environment_suffix}-"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name       = "payment-vpc-endpoints-sg-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}
