# Data source for current AWS account
data "aws_caller_identity" "current" {}

# KMS key for EKS cluster encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster ${var.cluster_name}-${local.environment_suffix} encryption"
  deletion_window_in_days = var.kms_key_deletion_window
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name        = "eks-kms-${local.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${local.environment_suffix}"
  target_key_id = aws_kms_key.eks.key_id
}

# VPC for EKS cluster
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name                                                 = "eks-vpc-${local.environment_suffix}"
      Environment                                          = var.environment
      "kubernetes.io/cluster/${local.cluster_name_unique}" = "shared"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-igw-${local.environment_suffix}"
      Environment = var.environment
    }
  )
}

# Private subnets for system node group
resource "aws_subnet" "system_private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name                                                 = "eks-system-private-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment                                          = var.environment
      Type                                                 = "private"
      NodeGroup                                            = "system"
      "kubernetes.io/cluster/${local.cluster_name_unique}" = "shared"
      "kubernetes.io/role/internal-elb"                    = "1"
    }
  )
}

# Private subnets for application node group
resource "aws_subnet" "application_private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name                                                 = "eks-app-private-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment                                          = var.environment
      Type                                                 = "private"
      NodeGroup                                            = "application"
      "kubernetes.io/cluster/${local.cluster_name_unique}" = "shared"
      "kubernetes.io/role/internal-elb"                    = "1"
    }
  )
}

# Private subnets for spot node group
resource "aws_subnet" "spot_private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name                                                 = "eks-spot-private-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment                                          = var.environment
      Type                                                 = "private"
      NodeGroup                                            = "spot"
      "kubernetes.io/cluster/${local.cluster_name_unique}" = "shared"
      "kubernetes.io/role/internal-elb"                    = "1"
    }
  )
}

# Public subnets for NAT gateways and load balancers
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index + 9)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name                                                 = "eks-public-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment                                          = var.environment
      Type                                                 = "public"
      "kubernetes.io/cluster/${local.cluster_name_unique}" = "shared"
      "kubernetes.io/role/elb"                             = "1"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name        = "eks-nat-eip-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name        = "eks-nat-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.tags,
    {
      Name        = "eks-public-rt-${local.environment_suffix}"
      Environment = var.environment
      Type        = "public"
    }
  )
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route tables for system node group subnets
resource "aws_route_table" "system_private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.tags,
    {
      Name        = "eks-system-private-rt-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment = var.environment
      Type        = "private"
      NodeGroup   = "system"
    }
  )
}

resource "aws_route_table_association" "system_private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.system_private[count.index].id
  route_table_id = aws_route_table.system_private[count.index].id
}

# Private route tables for application node group subnets
resource "aws_route_table" "application_private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.tags,
    {
      Name        = "eks-app-private-rt-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment = var.environment
      Type        = "private"
      NodeGroup   = "application"
    }
  )
}

resource "aws_route_table_association" "application_private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.application_private[count.index].id
  route_table_id = aws_route_table.application_private[count.index].id
}

# Private route tables for spot node group subnets
resource "aws_route_table" "spot_private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.tags,
    {
      Name        = "eks-spot-private-rt-${var.availability_zones[count.index]}-${local.environment_suffix}"
      Environment = var.environment
      Type        = "private"
      NodeGroup   = "spot"
    }
  )
}

resource "aws_route_table_association" "spot_private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.spot_private[count.index].id
  route_table_id = aws_route_table.spot_private[count.index].id
}

# Security group for EKS cluster
resource "aws_security_group" "eks_cluster" {
  name        = "eks-cluster-sg-${local.environment_suffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-sg-${local.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_security_group_rule" "cluster_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks_cluster.id
  description       = "Allow all outbound traffic"
}

# Security group for EKS nodes
resource "aws_security_group" "eks_nodes" {
  name        = "eks-nodes-sg-${local.environment_suffix}"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-nodes-sg-${local.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_security_group_rule" "nodes_internal" {
  type              = "ingress"
  from_port         = 0
  to_port           = 65535
  protocol          = "-1"
  self              = true
  security_group_id = aws_security_group.eks_nodes.id
  description       = "Allow nodes to communicate with each other"
}

resource "aws_security_group_rule" "nodes_cluster_inbound" {
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_cluster.id
  security_group_id        = aws_security_group.eks_nodes.id
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
}

resource "aws_security_group_rule" "cluster_nodes_inbound" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_cluster.id
  description              = "Allow pods to communicate with the cluster API Server"
}

resource "aws_security_group_rule" "nodes_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks_nodes.id
  description       = "Allow all outbound traffic"
}
