# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                                          = "eks-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "eks-igw-${var.environment_suffix}"
  }
}

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Public Subnets for NAT Gateway
# Using /24 subnets in high range (count.index + 252) to avoid conflicts with /20 private subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 252)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                          = "eks-public-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/elb"                                      = "1"
    Tier                                                          = "public"
  }
}

# Private Subnets for EKS Control Plane
resource "aws_subnet" "private_control_plane" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                          = "eks-private-control-plane-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                             = "1"
    Tier                                                          = "control-plane"
  }
}

# Private Subnets for System Node Group
resource "aws_subnet" "private_system" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                          = "eks-private-system-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                             = "1"
    NodeGroup                                                     = "system"
  }
}

# Private Subnets for Application Node Group
resource "aws_subnet" "private_application" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                          = "eks-private-application-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                             = "1"
    NodeGroup                                                     = "application"
  }
}

# Private Subnets for Spot Node Group
resource "aws_subnet" "private_spot" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 9)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                          = "eks-private-spot-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                             = "1"
    NodeGroup                                                     = "spot"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "eks-public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway EIP (single for cost optimization)
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eks-nat-eip-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (single in public subnet for cost optimization)
# Placed in first public subnet for proper internet access via IGW
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "eks-nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Private Route Tables (all using single NAT Gateway for cost optimization)
resource "aws_route_table" "private_control_plane" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "eks-private-rt-control-plane-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_system" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "eks-private-rt-system-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_application" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "eks-private-rt-application-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_spot" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "eks-private-rt-spot-${count.index + 1}-${var.environment_suffix}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "private_control_plane" {
  count = 3

  subnet_id      = aws_subnet.private_control_plane[count.index].id
  route_table_id = aws_route_table.private_control_plane[count.index].id
}

resource "aws_route_table_association" "private_system" {
  count = 3

  subnet_id      = aws_subnet.private_system[count.index].id
  route_table_id = aws_route_table.private_system[count.index].id
}

resource "aws_route_table_association" "private_application" {
  count = 3

  subnet_id      = aws_subnet.private_application[count.index].id
  route_table_id = aws_route_table.private_application[count.index].id
}

resource "aws_route_table_association" "private_spot" {
  count = 3

  subnet_id      = aws_subnet.private_spot[count.index].id
  route_table_id = aws_route_table.private_spot[count.index].id
}
