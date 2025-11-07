## main.tf 

```hcl
# Data sources for availability zones and EKS AMIs
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local variables for configuration
locals {
  cluster_name = "platform-migration-eks"
  cluster_version = "1.28"
  
  # Company CIDR blocks for public access (example - replace with actual)
  public_access_cidrs = [
    "203.0.113.0/24",  # Replace with your company's public IP range
    "198.51.100.0/24"  # Replace with additional allowed ranges
  ]
  
  # Common tags for all resources
  common_tags = {
    Environment = "production"
    Project     = "platform-migration"
    Owner       = "devops-team"
  }
  
  # VPC configuration
  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Subnet CIDR calculations
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
}

# ============================================================================
# VPC AND NETWORKING RESOURCES
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-vpc"
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-igw"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.azs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-public-subnet-${local.azs[count.index]}"
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
      "kubernetes.io/role/elb" = "1"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.azs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-private-subnet-${local.azs[count.index]}"
      "kubernetes.io/cluster/${local.cluster_name}" = "owned"
      "kubernetes.io/role/internal-elb" = "1"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-nat-eip-${local.azs[count.index]}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(local.azs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-nat-gateway-${local.azs[count.index]}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-public-rt"
    }
  )
}

# Route to Internet Gateway for Public Subnets
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = length(local.azs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(local.azs)
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-private-rt-${local.azs[count.index]}"
    }
  )
}

# Routes to NAT Gateway for Private Subnets
resource "aws_route" "private_nat" {
  count = length(local.azs)
  
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = length(local.azs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# EKS Cluster Security Group
resource "aws_security_group" "eks_cluster" {
  name        = "${local.cluster_name}-cluster-sg"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-cluster-sg"
    }
  )
}

# Allow ingress from worker nodes to cluster
resource "aws_security_group_rule" "cluster_ingress_workstation_https" {
  description       = "Allow pods to communicate with the cluster API"
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.eks_cluster.id
  cidr_blocks       = local.public_access_cidrs
}

# Allow all egress from cluster
resource "aws_security_group_rule" "cluster_egress_all" {
  description       = "Allow all outbound traffic"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks_cluster.id
}

# Worker Node Security Group
resource "aws_security_group" "eks_nodes" {
  name        = "${local.cluster_name}-node-sg"
  description = "Security group for all nodes in the cluster"
  vpc_id      = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-node-sg"
      "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    }
  )
}

# Allow nodes to communicate with each other
resource "aws_security_group_rule" "nodes_internal" {
  description              = "Allow nodes to communicate with each other"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_nodes.id
}

# Allow worker Kubelets and pods to receive communication from the cluster control plane
resource "aws_security_group_rule" "nodes_cluster_ingress" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
}

# Allow pods running extension API servers on port 443 to receive communication from cluster control plane
resource "aws_security_group_rule" "nodes_cluster_443" {
  description              = "Allow pods running extension API servers on port 443 to receive communication from cluster control plane"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
}

# Allow all egress from nodes
resource "aws_security_group_rule" "nodes_egress_all" {
  description       = "Allow all outbound traffic"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.eks_nodes.id
}

# Allow cluster to communicate with worker nodes
resource "aws_security_group_rule" "cluster_nodes_ingress" {
  description              = "Allow cluster to communicate with worker nodes"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "${local.cluster_name}-cluster-role"
  
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
  
  tags = local.common_tags
}

# Attach required AWS managed policy to cluster role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# IAM Role for Node Groups
resource "aws_iam_role" "eks_nodes" {
  name = "${local.cluster_name}-node-role"
  
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
  
  tags = local.common_tags
}

# Attach required AWS managed policies to node role
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_ssm_managed_instance" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_nodes.name
}

# OIDC Provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-oidc-provider"
    }
  )
}

# ============================================================================
# EKS CLUSTER
# ============================================================================

# KMS key for envelope encryption of Kubernetes secrets
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${local.cluster_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-kms-key"
    }
  )
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${local.cluster_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  version  = local.cluster_version
  role_arn = aws_iam_role.eks_cluster.arn
  
  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = local.public_access_cidrs
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }
  
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
  
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]
  
  tags = local.common_tags
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]
}

# CloudWatch Log Group for EKS Cluster Logging
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.eks.arn
  
  tags = local.common_tags
}

# ============================================================================
# EKS NODE GROUPS
# ============================================================================

# x86 Node Group
resource "aws_eks_node_group" "x86" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-x86-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = local.cluster_version
  
  instance_types = ["t3.medium"]
  ami_type       = "AL2_x86_64"
  capacity_type  = "ON_DEMAND"
  disk_size      = 50
  
  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }
  
  update_config {
    max_unavailable_percentage = 33
  }
  
  labels = {
    architecture = "x86"
    node-type    = "general-purpose"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name         = "${local.cluster_name}-x86-node"
      Architecture = "x86_64"
    }
  )
  
  # Ensure proper order of resource creation and deletion
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_ssm_managed_instance
  ]
  
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

# ARM64 Node Group
resource "aws_eks_node_group" "arm64" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-arm64-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = local.cluster_version
  
  instance_types = ["t4g.medium"]
  ami_type       = "AL2_ARM_64"
  capacity_type  = "ON_DEMAND"
  disk_size      = 50
  
  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }
  
  update_config {
    max_unavailable_percentage = 33
  }
  
  labels = {
    architecture = "arm64"
    node-type    = "general-purpose"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name         = "${local.cluster_name}-arm64-node"
      Architecture = "arm64"
    }
  )
  
  # Ensure proper order of resource creation and deletion
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_ssm_managed_instance
  ]
  
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER SECURITY GROUP
# ============================================================================

# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${local.cluster_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "Allow HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-alb-sg"
    }
  )
}

# Allow ALB to communicate with nodes
resource "aws_security_group_rule" "nodes_alb_ingress" {
  description              = "Allow ALB to communicate with nodes"
  type                     = "ingress"
  from_port                = 30000
  to_port                  = 32767
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.alb.id
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "alb_security_group_id" {
  description = "Security group ID for Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "node_iam_role_arn" {
  description = "IAM role ARN of the EKS nodes"
  value       = aws_iam_role.eks_nodes.arn
}
```
## provider.tf
```hcl

# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```