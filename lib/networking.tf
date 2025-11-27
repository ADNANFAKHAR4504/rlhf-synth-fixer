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

# NAT Gateway EIP
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eks-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.private_control_plane[count.index].id

  tags = {
    Name = "eks-nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Private Route Tables
resource "aws_route_table" "private_control_plane" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
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
    nat_gateway_id = aws_nat_gateway.main[count.index].id
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
    nat_gateway_id = aws_nat_gateway.main[count.index].id
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
    nat_gateway_id = aws_nat_gateway.main[count.index].id
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
