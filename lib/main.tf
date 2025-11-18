# main.tf
# Production-ready EKS cluster for payment processing workloads

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "payment-eks-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/payment-eks-${var.environment_suffix}"
  target_key_id = aws_kms_key.eks.key_id
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                                          = "payment-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/payment-eks-${var.environment_suffix}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "payment-igw-${var.environment_suffix}"
  }
}

# Public Subnets (2 AZs)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                          = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/payment-eks-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/elb"                                      = "1"
  }
}

# Private Subnets (2 AZs)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                          = "payment-private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/payment-eks-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                             = "1"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "payment-nat-eip-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (single for cost optimization)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "payment-nat-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "payment-public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Association
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "payment-private-rt-${var.environment_suffix}"
  }
}

# Private Route Table Association
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "payment-vpc-flow-log-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/payment-flow-logs-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "payment-vpc-flow-logs-${var.environment_suffix}"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log" {
  name = "payment-vpc-flow-log-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "payment-vpc-flow-log-role-${var.environment_suffix}"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "payment-vpc-flow-log-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Security Group for EKS Cluster
resource "aws_security_group" "eks_cluster" {
  name        = "payment-eks-cluster-sg-${var.environment_suffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "payment-eks-cluster-sg-${var.environment_suffix}"
  }
}

# Security Group for EKS Nodes
resource "aws_security_group" "eks_nodes" {
  name        = "payment-eks-nodes-sg-${var.environment_suffix}"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow nodes to communicate with each other"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description     = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    description     = "Allow pods running extension API servers to receive communication from cluster control plane"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name                                                          = "payment-eks-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/payment-eks-${var.environment_suffix}" = "owned"
  }
}

# Security Group Rule: Allow cluster to communicate with nodes
resource "aws_security_group_rule" "cluster_to_node" {
  description              = "Allow cluster to communicate with worker nodes"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
}

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster" {
  name = "payment-eks-cluster-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "payment-eks-cluster-role-${var.environment_suffix}"
  }
}

# Attach AmazonEKSClusterPolicy
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# Attach AmazonEKSVPCResourceController
resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/payment-eks-${var.environment_suffix}/cluster"
  retention_in_days = 7

  tags = {
    Name = "payment-eks-logs-${var.environment_suffix}"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "payment-eks-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.31"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name = "payment-eks-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks
  ]
}

# IAM Role for EKS Node Group
resource "aws_iam_role" "eks_node_group" {
  name = "payment-eks-node-group-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "payment-eks-node-group-role-${var.environment_suffix}"
  }
}

# Attach AmazonEKSWorkerNodePolicy
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

# Attach AmazonEKS_CNI_Policy
resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

# Attach AmazonEC2ContainerRegistryReadOnly
resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "payment-eks-node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 2
  }

  instance_types = ["t3.medium"]
  capacity_type  = "ON_DEMAND"
  disk_size      = 20

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name = "payment-eks-node-group-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}
