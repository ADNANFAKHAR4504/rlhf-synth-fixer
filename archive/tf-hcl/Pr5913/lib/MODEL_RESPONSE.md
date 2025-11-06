
# Model Response - Terraform Source Listing

This document includes every Terraform (`*.tf`) file found under the `lib/` directory (provider binaries in `.terraform/` are ignored). Each section embeds the file contents in HCL-formatted code blocks for quick review.

## Table of Contents
1. [eks.tf](#eks-tf)
2. [iam.tf](#iam-tf)
3. [nodes.tf](#nodes-tf)
4. [outputs.tf](#outputs-tf)
5. [provider.tf](#provider-tf)
6. [security.tf](#security-tf)
7. [variables.tf](#variables-tf)
8. [vpc.tf](#vpc-tf)

---

## <a id="eks-tf"></a>eks.tf
**Path:** `lib/eks.tf`

```hcl
# CloudWatch Log Group for EKS Cluster
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.cluster_name}-${var.environment_suffix}/cluster"
  retention_in_days = 7

  tags = merge(var.common_tags, {
    Name = "eks-cluster-logs-${var.environment_suffix}"
  })
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${var.cluster_name}-${var.environment_suffix}"
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.cluster.id]
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

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
    aws_cloudwatch_log_group.eks
  ]

  tags = merge(var.common_tags, {
    Name = "eks-cluster-${var.environment_suffix}"
  })
}

# OIDC Provider for EKS
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = merge(var.common_tags, {
    Name = "eks-oidc-provider-${var.environment_suffix}"
  })
}

```

---

## <a id="iam-tf"></a>iam.tf
**Path:** `lib/iam.tf`

```hcl
# EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "eks-cluster-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.common_tags, {
    Name = "eks-cluster-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSVPCResourceController" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

# EKS Node IAM Role
resource "aws_iam_role" "node" {
  name = "eks-node-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.common_tags, {
    Name = "eks-node-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node.name
}

# Cluster Autoscaler IAM Policy
resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "eks-cluster-autoscaler-${var.environment_suffix}"
  description = "EKS cluster autoscaler policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "eks-cluster-autoscaler-policy-${var.environment_suffix}"
  })
}

# IRSA (IAM Roles for Service Accounts) - Sample Role
resource "aws_iam_role" "irsa_sample" {
  name = "eks-irsa-sample-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:default:sample-service-account"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "eks-irsa-sample-${var.environment_suffix}"
  })
}

# Sample policy for IRSA
resource "aws_iam_role_policy" "irsa_sample_policy" {
  name = "eks-irsa-sample-policy-${var.environment_suffix}"
  role = aws_iam_role.irsa_sample.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:ListBucket",
        "s3:GetObject"
      ]
      Resource = "*"
    }]
  })
}

```

---

## <a id="nodes-tf"></a>nodes.tf
**Path:** `lib/nodes.tf`

```hcl
# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "eks-node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.kubernetes_version

  scaling_config {
    desired_size = var.node_group_desired_size
    max_size     = var.node_group_max_size
    min_size     = var.node_group_min_size
  }

  update_config {
    max_unavailable = 1
  }

  # Mixed instance types configuration with Spot instances
  capacity_type = "SPOT"

  instance_types = var.node_instance_types

  labels = {
    Environment = "Production"
    NodeGroup   = "primary"
  }

  tags = merge(var.common_tags, {
    Name = "eks-node-group-${var.environment_suffix}"
  })

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# On-Demand fallback node group
resource "aws_eks_node_group" "ondemand" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "eks-ondemand-node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.kubernetes_version

  scaling_config {
    desired_size = 1
    max_size     = 3
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  capacity_type = "ON_DEMAND"

  instance_types = ["t3.medium"]

  labels = {
    Environment = "Production"
    NodeGroup   = "ondemand-fallback"
  }

  tags = merge(var.common_tags, {
    Name = "eks-ondemand-node-group-${var.environment_suffix}"
  })

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

```

---

## <a id="outputs-tf"></a>outputs.tf
**Path:** `lib/outputs.tf`

```hcl
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "oidc_provider_url" {
  description = "URL of the OIDC provider for the EKS cluster"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster.id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.node.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for EKS secrets encryption"
  value       = aws_kms_key.eks.arn
}

output "cluster_autoscaler_policy_arn" {
  description = "ARN of the cluster autoscaler IAM policy"
  value       = aws_iam_policy.cluster_autoscaler.arn
}

output "irsa_sample_role_arn" {
  description = "ARN of the sample IRSA role"
  value       = aws_iam_role.irsa_sample.arn
}

```

---

## <a id="provider-tf"></a>provider.tf
**Path:** `lib/provider.tf`

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

---

## <a id="security-tf"></a>security.tf
**Path:** `lib/security.tf`

```hcl
# KMS Key for EKS Secrets Encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster ${var.cluster_name}-${var.environment_suffix} secrets encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "eks-kms-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${var.environment_suffix}"
  target_key_id = aws_kms_key.eks.key_id
}

# EKS Cluster Security Group
resource "aws_security_group" "cluster" {
  name_prefix = "eks-cluster-${var.environment_suffix}-"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "eks-cluster-sg-${var.environment_suffix}"
  })
}

resource "aws_security_group_rule" "cluster_ingress_workstation_https" {
  description       = "Allow workstation to communicate with the cluster API Server"
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr]
  security_group_id = aws_security_group.cluster.id
}

resource "aws_security_group_rule" "cluster_egress_all" {
  description       = "Allow cluster egress access to the internet"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
}

# EKS Node Security Group
resource "aws_security_group" "node" {
  name_prefix = "eks-node-${var.environment_suffix}-"
  description = "Security group for all nodes in the cluster"
  vpc_id      = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name                                                                  = "eks-node-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "owned"
  })
}

resource "aws_security_group_rule" "node_ingress_self" {
  description              = "Allow nodes to communicate with each other"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_ingress_cluster" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.cluster.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_ingress_cluster_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.cluster.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_egress_all" {
  description       = "Allow nodes all egress to the internet"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.node.id
}

resource "aws_security_group_rule" "cluster_ingress_node_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.cluster.id
}

```

---

## <a id="variables-tf"></a>variables.tf
**Path:** `lib/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for EKS cluster deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "microservices"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.31"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the node group"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_instance_types" {
  description = "Instance types for mixed instances policy"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "Microservices"
    ManagedBy   = "Terraform"
  }
}

```

---

## <a id="vpc-tf"></a>vpc.tf
**Path:** `lib/vpc.tf`

```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name                                                                  = "eks-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "eks-igw-${var.environment_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name                                                                  = "eks-public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/role/elb"                                              = "1"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name                                                                  = "eks-private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/role/internal-elb"                                     = "1"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "eks-nat-eip-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "eks-nat-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "eks-public-rt-${var.environment_suffix}"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "eks-private-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

```

---

_Note: Non-Terraform files are intentionally omitted to keep this reference focused on infrastructure code._
