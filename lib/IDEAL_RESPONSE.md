# Ideal Response - Lib Source Reference

This document reproduces every human-readable file under the `lib/` directory (excluding compiled artifacts inside `.terraform/`). Each section embeds the full file content inside a markdown code block for easy review.

## Table of Contents
1. [.terraform.lock.hcl](#terraform-lock-hcl)
2. [AWS_REGION](#aws-region)
3. [IDEAL_RESPONSE.md](#ideal-response-md)
4. [MODEL_FAILURES.md](#model-failures-md)
5. [MODEL_RESPONSE.md](#model-response-md)
6. [PROMPT.md](#prompt-md)
7. [eks.tf](#eks-tf)
8. [iam.tf](#iam-tf)
9. [nodes.tf](#nodes-tf)
10. [outputs.tf](#outputs-tf)
11. [provider.tf](#provider-tf)
12. [security.tf](#security-tf)
13. [terraform.tfvars](#terraform-tfvars)
14. [tfplan](#tfplan)
15. [variables.tf](#variables-tf)
16. [vpc.tf](#vpc-tf)

---

## <a id="terraform-lock-hcl"></a>.terraform.lock.hcl
**Path:** `lib/.terraform.lock.hcl`

```hcl
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "6.19.0"
  constraints = ">= 5.0.0"
  hashes = [
    "h1:5qq2jk+G9fymBqnOmtHR30L6TLMlMoZ7TsSXOAYl0qU=",
    "zh:221061660f519f09e9fcd3bbe1fc5c63e81d997e8e9e759984c80095403d7fd6",
    "zh:2436e7f7de4492998d7badfae37f88b042ce993f3fdb411ba7f7a47ff4cc66a2",
    "zh:49e78e889bf5f9378dfacb08040553bf1529171222eda931e31fcdeac223e802",
    "zh:5a07c255ac8694aebe3e166cc3d0ae5f64e0502d47610fd42be22fd907cb81fa",
    "zh:68180e2839faba80b64a5e9eb03cfcc50c75dcf0adb24c6763f97dade8311835",
    "zh:6c7ae7fb8d51fecdd000bdcfec60222c1f0aeac41dacf1c33aa16609e6ccaf43",
    "zh:6ebea9b2eb48fc44ee5674797a5f3b093640b054803495c10a1e558ccd8fee2b",
    "zh:8010d1ca1ab0f89732da3c56351779b6728707270c935bf5fd7d99fdf69bc1da",
    "zh:8ca7544dbe3b2499d0179fd289e536aedac25115855434d76a4dc342409d335a",
    "zh:9b12af85486a96aedd8d7984b0ff811a4b42e3d88dad1a3fb4c0b580d04fa425",
    "zh:c6ed10fb06f561d6785c10ff0f0134b7bfcb9964f1bc38ed8b263480bc3cebc0",
    "zh:d011d703a3b22f7e296baa8ddfd4d550875daa3f551a133988f843d6c8e6ec38",
    "zh:eceb5a8e929b4b0f26e437d1181aeebfb81f376902e0677ead9b886bb41e7c08",
    "zh:eda96ae2f993df469cf5dfeecd842e922de97b8a8600e7d197d884ca5179ad2f",
    "zh:fb229392236c0c76214d157bb1c7734ded4fa1221e9ef7831d67258950246ff3",
  ]
}

```

---

## <a id="aws-region"></a>AWS_REGION
**Path:** `lib/AWS_REGION`

```
us-east-1

```

---

## <a id="ideal-response-md"></a>IDEAL_RESPONSE.md
**Path:** `lib/IDEAL_RESPONSE.md`

```md

```

---

## <a id="model-failures-md"></a>MODEL_FAILURES.md
**Path:** `lib/MODEL_FAILURES.md`

```md

```

---

## <a id="model-response-md"></a>MODEL_RESPONSE.md
**Path:** `lib/MODEL_RESPONSE.md`

```md

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

```

---

## <a id="prompt-md"></a>PROMPT.md
**Path:** `lib/PROMPT.md`

```md
Hey team,

We need to build a production-ready Amazon EKS cluster for our fintech startup's microservices deployment. I've been asked to create this infrastructure using Terraform with HCL. The business needs a secure, cost-optimized Kubernetes platform that can handle auto-scaling workloads while meeting strict security requirements.

The architecture needs to support our microservices with advanced features like IRSA for fine-grained permissions, encryption for all secrets, and mixed instance types for cost savings. We're deploying across multiple availability zones in us-east-1 for high availability.

## What we need to build

Create a production-grade EKS cluster infrastructure using **Terraform with HCL** for deploying microservices on AWS.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public and 3 private subnets across different availability zones
   - NAT gateways for outbound connectivity from private subnets
   - Internet gateway for public subnet access
   - Route tables configured appropriately for each subnet type

2. **EKS Cluster Configuration**
   - EKS cluster with private API endpoint accessible only from within the VPC
   - Kubernetes version 1.28 or higher
   - OIDC provider configuration for IAM Roles for Service Accounts (IRSA)
   - CloudWatch log groups for all control plane logs (api, audit, authenticator, controllerManager, scheduler)

3. **Node Groups with Cost Optimization**
   - Managed node groups using mixed instance types (t3.medium and t3.large)
   - Spot instances with on-demand fallback for cost optimization
   - Nodes deployed across at least 3 availability zones in private subnets
   - Auto-scaling capabilities with appropriate min/max settings

4. **Security Features**
   - KMS key for envelope encryption of Kubernetes secrets
   - Proper key policies for KMS access control
   - Security groups allowing inter-node communication
   - Security groups allowing ingress from load balancers
   - IRSA implementation with sample IAM role for pods

5. **IAM and Permissions**
   - EKS cluster IAM role with required policies
   - Node group IAM role with EC2, ECR, and CNI policies
   - Cluster autoscaler IAM role with appropriate permissions
   - OIDC provider for pod-level IAM permissions

6. **Monitoring and Logging**
   - CloudWatch log groups for EKS control plane logs
   - All log types enabled (api, audit, authenticator, controllerManager, scheduler)
   - Appropriate retention policies for cost management

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **EC2** for worker nodes in managed node groups
- Use **AWS KMS** for secrets encryption
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control and OIDC integration
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher required
- AWS provider version 5.x required

### Constraints

- EKS cluster API endpoint must be private (accessible only from VPC)
- Node groups must use Spot instances for cost optimization
- Enable all EKS cluster logging types to CloudWatch
- Use AWS KMS customer-managed key for secrets encryption
- Configure OIDC provider for the EKS cluster
- Node groups must span at least 3 availability zones
- Implement cluster autoscaler with appropriate IAM permissions
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Use variables for cluster name, Kubernetes version, and node group sizes
- Create modular configuration with separate files for organization

### File Structure

The configuration should be organized into:
- vpc.tf - Network infrastructure (VPC, subnets, gateways, routes)
- eks.tf - EKS cluster configuration and logging
- nodes.tf - Node group configuration with mixed instances
- iam.tf - IAM roles and policies for cluster, nodes, and IRSA
- security.tf - Security groups and KMS keys
- outputs.tf - Cluster endpoint, certificate authority, OIDC provider URL
- variables.tf - Input variables for customization
- provider.tf already exists with AWS provider configuration

## Success Criteria

- **Functionality**: EKS cluster deployed successfully with private API endpoint
- **Performance**: Node groups auto-scale based on workload demands
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: KMS encryption enabled, IRSA configured, security groups properly restricted
- **Cost Optimization**: Mixed instance types with Spot instances reduce infrastructure costs
- **Monitoring**: All control plane logs flowing to CloudWatch
- **Resource Naming**: All resources include environment_suffix variable
- **Code Quality**: HCL, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation
- VPC with public and private subnets across 3 AZs
- EKS cluster with private API endpoint
- Managed node groups with Spot instances
- IAM roles for cluster, nodes, autoscaler, and IRSA
- KMS key for secrets encryption
- Security groups for cluster and nodes
- CloudWatch log groups for control plane logs
- OIDC provider configuration
- Output values for cluster endpoint, certificate authority, and OIDC URL
- Variables for customization (cluster name, K8s version, node sizes)

```

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

## <a id="terraform-tfvars"></a>terraform.tfvars
**Path:** `lib/terraform.tfvars`

```
aws_region         = "us-east-1"
environment_suffix = "synth9686q"
cluster_name       = "microservices"
kubernetes_version = "1.31"

# Optimized settings for testing
node_group_min_size     = 1
node_group_max_size     = 2
node_group_desired_size = 1

```

---

## <a id="tfplan"></a>tfplan
**Path:** `lib/tfplan`

```
PK   6`f[             	 tfplanUT �@i�}{l�}�I���~���C9�qY?~~𨻣LKD
D��u$���"��pwx���zf��Q ����-A_�(֓��aɲ��"9M�Mh�?��Q��E�� m��}��.I�L��7;�3��~>���w^�ni HȘ��4��`
-ML�}�:p���2eyy��
6�ih��s��`���(CD1`I���r�.b���)�"*=>m�R��,YJ�S(�A�`-�(���j�a#,[\zH��8"b�*S�Pl��T�Hv �Qz����(&H��C �i�������\���,�M�Ӛ����9�5D��<7e�<�!p�$�l���t�&���i*����{q�'=�ZύاCb,�b��xق�*��c���Z0KL�p���N"�p��Z��,*TV(3	R�Vy�NDD)B!~��B��]�ܾ}��([�}u�׿����tİi(����i�˴句�J�ş-nyf��T�S&Im{fW��k�J�i_�)�T�M!C%e�Ȁ�:u!&�<��X[���1U���c��H���(̣��vl������m��SŒΰ���X�-!����k�[�b!�M�m�B,v��<}��6��;���T�}n;4`i_)��vwd,��@Ӆb���ws/R���Ai���W����"p�%F+��
T�%W��~Y1д��1:������~��'Ɵ̤�
a:�EC�7�7
��O�Ԍ<�_V	����\������Oq����T���n��Jĥ�������8�
8��y�����7 ���G�>
w�`�����	�/�	b��p��0 ���k���9�
i��7��vQ�zY#��cv�g�fU�,iӐ���'���ZW�\o".�?�[�ڳ��
%�D C����!E�Qƹu�����f��g�.kh�t��M���@U�m����%�&,�xr�}B�Z"��D��g�I�RLa���t�1O�A�I�2 z�B ��,�$���N�WM#�R�V)E�V���sؠ*R2����;5;���
�`Q�L�7�rQ$�!-(:2�lR$)�RSŶ)��P#<.�kҼ*��DC��B,v^�+z���"�F�lO��"��u��y�U4�7e�
A�8�w�y"-�1:		�<����E�r-g唥p%$?�m��p��/{�Ozn��tXxRZ*"��:r<��o�w1��<�g��Y�D�)�Û�#���~y��R�<,o�usZ�wl�؂:�9v٭��eT��gLN��,ʳ�c��7lOL�s�l.�ͤ�Oʳ'�G� C�X����9a)bP��+��fs�46tl��X��.m-�>$g�%�O"��V�4���;E�ReH�X:��G�X�M�`�%�"_�ʸY24Hʕt5���.����J~���~���\�(yX�?�cj��j�Aը<<Z��Q��A�x*�%=t�����v�D�:��
����|��ʳ���޻9�0,��8�H�U�z�����2�K��.�z�C��>zfE�iZ�X�J�T-����]U��H�����}|����C�s�q`�h�j�V������L�B��-0����A���l�Ggd�aW6��{d�s��o�G�K��e�=�}.*�7����&Fe�,��Ә�y�dQY�/�*Na�#?���#��$����}f�`7*Z:dȁ��B��f�c��<�%�]�m�#.[�U��55��́�W���Z��6��^͟B��A_%f�MAϕ0
����SC�Un�m�vwα�6
۲`��D���tCKӾI�ْG^Zj֚2e{Fq�攰fͲ*2s�"3�1+2'�xɮ�����Ǣ,��D���('Z��VW�&�V�$�7/�Y��/�q���6욾�vM6�\�O���e����D\*�«U!,��\�:�"Fݷ�
��0H�����Ӂ�O�%��F�D�"`��m��ӕ�K/u��~��Q���-�1����F�}��Bn�ؔ�:�~)�%�� j�_���䒥�瞝���]������Mòx��u
;�}щ��>��$�0����������+��]�ع����`��uD�pwo�!e$f�Fo4��zK�.?�m0'�j�Ja�]��"����F���*7��=��z�;��v�7���aw��N�.'F��n�G�e��th�c(O��Ǳ�&�?�wW�"�^Ұ\&h�, ��tD>��i3*��
�&�B�v���B�O�C�g(��l�62I���y�
+Cq� z���kK�Sb����g
��Z�(;�h_m@41�۸�ۙlC;��&) ����i����L����&���Vk���-�!��o�jeˎ���j�Ɩ(/�mL��AO".��^�	�����T��)^	��F�M"���hR/y��=myF�_~c���Qގ����H*��V���-�n���/r ��'{n��w&3+����j`���Uw")ӘM*�S��*g��(�UH���޲!F;�ĩ
bR�rL3��{x�R���;����
N^.�b��f:�t�HO@��I�Қ`��m�QRMb۰Ҹ�U'��Kd<��pjܹ!�m� K#l�¸}���\�|�&��
�6�NԪ��9p� �րٞ��*�?���6�Ȏ@���V(�3c��1$��š�Nv�v�_0B��T94_q�G��ԥ��R�b�d`2���5��;�N�Bd
��	br��A�w]L�ZZ9k�7��)S�F+',b2S5��L���p���\��='O�>q�-;��*�W�qf��=��r��v�)�L������5
�T߿��x��>J@�$cM�C��?�X�~8X��9
�j��F��e�yMAU��0S@��[������7����zL��q�G�F*Og;���iܮ
�t�=�ǰ��5�u��k����eǒ���P�
���p�绑S�,bZ06��T~�����Xy�{\�;1yk�+W}�yN5I`�(1��!ʰ�H��{�.;7
�\�i��e���q����_��O��4(��y��g��Y&6D���!�墚��T���n�6�҄5�ś}+�����D�`�]V�2�f���bˉ�w�nS������~�ϻ��T����	�w�L��:x����Eu�"F�zwn�o{v�m���1���]��R����#�z�4��IS��<�"<�h��?�y�&����F�������@"��m�� ����w��c6�0u�T'S&�r������Ѹ��6�\ޞ�ߵ���s;���� �᠎���C�ձ[[���K*70p[��;���g�e���>���k���q�`x���;���u��
��73
ET�Ƶ�p
b�c�Wn�4м�x��;r�}J������m������
m����K7���!�J+��о����C�,�{��F:茼yt�����@tnC^x#t0T�Q���h�I{�dx
]{�-���~1�+<���,1ˤ���*���������P��_�"���0�=1̱KL�Ҹ�X��V�=��j�U�EL��;���>���7^��2�;4��]�w��7B�`�d�V�Ioڤ�VM����4��B&vҤ,kCV�IɎ%�nä��M���_�vȤ�M�{rrpբ4eQ����@,��a�&m��roҎ���/���;h=�8��V�?Ҍ����U�9뱢��[ƿf��v�ȊkȲ[�0$�B��f�8�?�[�(MY���ܲq�G�,G���z��#+e0�L��6�U�q��[��h��rT%��X�|[w%�ҳ`�+�uZ�,���қ��P;׵"�=T��(H�U��/��X�pKx��;�~�
~��Zݺ��U����zS���v�C��-��Z
[���(RMqB�RU*/�����Q�4�-��Ze�������`����-�A��NA6��m�l0���0�fT�1��a��H�f�V��<�n<�� ��)�v`�j��L(m�hw ��r;�43�<��n��$��[=����ǡ��zD1k�v{��x��|�v	�NY+t�G�nχ_��ǌ�x��D3e�n�Ȯr�cǉf|�Nq���n7Ndƒ�|�uN\�Kĥ�}�Lߍ��O���~'p����q�d�h��*�{(<�4Ӡ��TaxBl>P`�M�����p�ɋ�j-^q���@4r���w/�ELf�k!��\�m��ͼ\���>
Kf�y��`�&9�z'Fڐ sT�DZIG�=�S�/�p�v������s�4	=pܹ��K	N&� }[O�}cwG��+#�p5p+��?O���Q1�3������s�פ[\�qz����PMY��'��-;Fd%n��Pf��=6�#��|�4�[,��𙒕'P�kp���n�S��«W]���L��Dw�h3��e��=|u�/V�����B���y޸S�:��0cP��f�ȋ�2F5����{�k�qbJ�M��Y�V����^2��[�U��*���ZZn,�ZK�|2��ˉ.��+ғ���O:|n��������b�SS�����NBlT���� �L�J�}q|����K�DW".����3�Ϩ:F�]�������M����}��55�ִ��ݎ���β�Rq�"����yz��驦���~��)t�aw�қ�K����Ys#v�	X��a��Ӫs�H?�k系O���ќ�iA\���;�_��]Ńslp��4\*�`�:$ytL��H�/D�f��!q�q��"$����9�5�~6p���-"i�z_����pA<!Ȃ��^�i;5�՚���RpO;���l�����ѳotp��Oｍ�po��:�^����jǤ=�D˦��i���b���������Y.���,��Q���BDE�yT��,;w��`x��&9�M��u�|ڞ�m�����>���m��s��P�n۾y��[��>Û&�y��PZz��8T
)�(��w{���V��)u����� �b \Q%���S�~ѝ�K?��w/y�B,�����A�	�i
��G|��w�-U}%�o���z#��nܔˤ�m�
���m���[��tfc&��d�l�<4$���]�W�)vՒ�l���Y<�ޏ��_v�xû�/����j/b�3,���w��G��G���)�JI- &���O!��8m3��͊+��������EiU�d��ѻ����+U���I�2wH��D\��q���L�F^^���σ^;���	�9�C���
p=�,�Ld�.�p�����Hn����M���<���{dV�t$��q���cl�b1��p����w���7pSJD�h˗��+4l��4w]\k�^��X".=�t��G���ɶN�4��u͉�~?�;�G׉
Ͻ���E������܈}a�	�P�r�z�ݠ�s��^0D+!�[�J}��*��Y��W�bϹ�)�׀V��J/>���f���g��=s�z:��f2����y�l����{���D�rܙ��M]TN�}��@k�sv��>����*�8߽̇����]�kr�o�ل�ؼ�~�UN�� F0���1'��*u.�7Q��'W�N��8GW劽�@Q	�)P����;�����)�cM��rE<,"9�haE�Dj�rY<�+|���ߠbW�Q_G�Y@F�8yۂ*M���J�Ϲ۟��<1��"{>��.��$���s�_�P�J}`
�Ę��1�'�fR 4�.%@/��2�y0"�Z @�m��:;W�
,)63 ��
���\}S H�^
3��Wj� ���Γ�A��'^�/G��p�'�΁5R7��xM8Lf�F|���͝���
��3z1�%Df��AN�qpX����K�N:	��6���g���	�%��>�ߊ���쪝2{�zZ�H�nw����;�8�BD�N,�*/S<$��s�mƣ�pM��kx�t�^��g���j�=��'���)�I�W-���w�2�'��l:3�;34<�ސ���
  ��PK"v��x  J�  PK   6`f[             	 tfstateUT �@i��ݒ�0��y
��	[�]��*�NF84ulj�l�ûwl���d�|G�}d��)�O���k�<O�`��.[�����w�9c �z��9����D7���^�T^)mld�P:������9�&<c8�A.����s�c�;��R9��%�����:S�;d���s�Yӣ�UN�@��r��%��,lɒ�ˋwȭ�~b}�Xl�1�U��޼�{b	�E�����@Ƈ���~kːc�=z��Y��5t��e�� h���������Ek�}-�16V���$U)�Q��J����M�M*�#,Ų�싥��A)���M���{� �˶�L�j���M�5����ޗd��B5��b>�Lg�,�e�aϖ|%ϣd5J�����M���[
F�$t²��6�:��HQ6]��_e@���jv��  ��PK�����  *  PK   6`f[             	 tfstate-prevUT �@iD�=
B1���"d���"�*"�R�c+I���ݥqp�~� �-�b��nr'�tk�Z��i9�w%)�1�ޑK�t�9�z����a.���d��ru������Y�9��
  ��PK�m   �   PK   6`f[             	 tfconfig/m-/iam.tfUT �@i�V�n�8��)L�"v�a>x�40�M;hE!L���F"U�r����(YvlG��؞$p~8��|�9��Ocę��a��F*��&�2�	>�P`j�MO- �	A=����^���u��Lh%�64�d"�^�V ���=����C~%Irѱs
�J:����������,�-Zrn��
m��Ʉ�;a�8V��_k!�H1��� c�3���;��?J��p�����s��0��<xR����X���,N
� !=�c WI�d��O��W{@��_���C�����La?O����W�:�-�W��<7�2�GL����m��p�{8{P���o��84�׃�7(i����^��fO�J�`˕��U���9O����H»�I�C��e��*�@�� �<s���\ �0d5�pp5��n���;�:⡐�G4����0�"�}���y*G���Ϭ2c��lH5�hW�
+�ݫ�WF�Ruw;Gd�i�)7u�X��p����ቼ���YQ������q	9
>��ߑ�t\�]j������d(�Eɩ��g�$�(9�L��������3V4���kZĻ����f��;����P��h��,�^�����o��=}�Z��~ #4EL�;ߎ�
�DH�U�C�^��$8݄�%��>j��#��	���僩<��;�/oa�T��U��炁M^�#��}8.W��׶Ϲʤ5'І1&iL/�BM��|�p�v!�����FKQmb����B��$n�T���Hw�]˕zn_Cn�����aDҺ��%#�-j{��BN/~f� {��)���q� 3���65��;�N���X��XJS��M0�m���m/fof�xm����v��͸��ߎ�%�9�׏UFT���ф��:��H����m����a�3�{�Y�g��֦�\��r��x�8�`�0��.Z�  ��PK�X�i�    PK   6`f[             	 tfconfig/m-/nodes.tfUT �@i�T�j�@��+���Ă4gBbJ	�C\�!�e�+���bw��	��2++v�)��K���޼}���G0����i��޵M�)�֗9>E���iR��9�
���u"y�h	 `}�)�[�lE��!�)Ry��y�� ^��G���<��ݻ�z~9̠M�B�=g ��1Eet ���E��#�~�+�� ��q�7�hg�"�!d"\bm�R�㹩�/ ��'��y�M��Mw�D���Q����{���u�f k1�6#��&r-�M��Z���#�2���p��%A\5�ko=F�)&�ôq�d��`i�JI��qz=���h�R�؎�׈pk�Q-���h;u���N����,뙶3����Ƣ_��m"V"e�W�Q-����ԏ7'�X��'Q����n�����զ\)��{���|f����r���y��ub�_B�����Ͽ�;�h��
U&D��!����]�β#����,��9���E�Toy���߅^�ͳ�G��}������_�9������bHo�xZXҦ���G�en��wo���֟  ��PK�I(/  �  PK   6`f[             	 tfconfig/m-/outputs.tfUT �@i��Oo=���)F9���{@�zMQiA��RU�kO�(��񌷊�y�����V�K����y���IBX�*�`T�l��d�
 �l"!��
7}v>����w}��@����}�@?���~xYkr�@(��9�`ڑтJ'��HrTV��y�߾t�[�p�����_E� �����3�d��sg���=��XfX�蘄lGHLx�FO֨}C�J�]ҧ�{�V��zu
C����k����&�Nz�,���9a���э�-7��G�V>�#��w��PK<p��;N�8jt�k���؛<v�hR{��D��";���]�v�zZD�}w�f�
*9��V�[��Jy �ʝg6M0S��j�+>���3�ӡ!R���'�����B��.1���X���=�c�SE�5�60ڶ^25��ܱۻ-��Ѿ<��&�p~��M�k����*�ĳ�F|Ef�T��aX/�0}�zy�>���Z��C�*�
�8u���l��3��Z� z��   ��PKS�&�    PK   6`f[             	 tfconfig/m-/provider.tfUT �@iTPAJ�@��+��{Tԋ�,x��&�lk2��Ld��eL�z������la�Z�H
Q3n���`�1�I}Ţ���MqW\;�{�c�u O��b�d���I�`�+��[�����<�3�G�{���ᕫw�5��m0r7H�@��TIjp��zMG$텰�]�u��4��7��>��򼍁&Z�b��d)i�]N�n�.�G���xX ��+  ��PK��߼�   [  PK   6`f[             	 tfconfig/m-/security.tfUT �@i�VϏ�:��e��=�ط��êZU�Ǫ��3�ǎl��߫IBHX�R�j�p <�������Lqc�q:�
����v�yit`љ�
��oKR�܆b�Bx	 bt��b34�	��>i�*w-����6��1�S�
�5�ki�NQ{���B>��U���*��l#ul6Lj�	� P�B�ʬ�7os ϗ�9E�Ŀ8&M�f��o�O����
��uc$@��]p�.�$wM�(�MŎ!]r���}��a
="L\T�M�������J�����BWْ�!��*�,����{*{7�Ax�k�-��A��Q�)����3A1V�u&��K��-��Q�e�1�+<�Ĥ^Zt�m�M\�il�}�Y�2h� o�"ȵ�#l�_�_a����0C�F[d�6C8.�
�֤,3�7���wtҴ���o�Q-�^d�O�ز�2"q���H:��k pDS����}�Ge��aK��R���V.}ySp*�G��w2�g�u�8�"qp��a8���p��²؟L�=+]�;˜�W�8W
ȑ����cK���&���t�4�*�a��ҝf�1��tb�q���|(�R�S]�X���r�t����N�Gm�<����zKU0%�Dt�H�s��j�gνE�֨���{�0������2�X(�ؐ��ͭ1�jP^�������U���f�>�d;?����텺jJ�~�6]3�hï.L��^�1�+�h�]fzOގ�>�$�%v�fs�M�[   ��PK=��P
  /  PK   6`f[             	 tfconfig/m-/variables.tfUT �@i��Ko�<������O����.�����*�e�P�8�0ԗ0��9��w;�4M��&��\���+�L�T���
Ɔ���{P��L�'k� ��/ ���ǧ Up*l��i4>� ��E�p��4q\-���r�
��Vyv�e7h:bk�a�uM�I�����T��
,��d�Dg�iM�Hz7w`�Ta��I�WB#��'��+��$[�ܑD7��e(�
ztE����������g�X?Qt�,$U<�}xr�Je�e�|w~� ��"���g#�6��d�Bi�Gq�u�S���#V��	��;<�j��_?͟|���&�G�L��������#�Q�YNB[aѰ
m����M[����]"�f�;�����c�ҧ�;��y��
��>2�j9KR�#�j��(<"�f����H,�	Ӟ:J�H���-V��Ak�݃��7��[�oJp�cI��5�͌�c�|dJ]_��ע� :���o~��s�U��R��l?���`�n߭��0����.U�AfQ[�}�*��~  ��PK� �&    PK   6`f[             	 tfconfig/m-/vpc.tfUT �@i�V�N�:��S��� ��j�
�v�� d���Z8vd;��W��MB��aҫz<�|3���,�j�#�+
lŸ`s.�}�_J�I
w��GC�B�H<H�%0�Y��y����~��O4FW�ܪ�	��qTs^h:*�����tU�ԉ ��(-��Ke�d%����RSW����������\�^�?�p��RI����A \���_�dU���	�k%K������?���G�9j�M��4����A+��.���%��,���]�̯������Ȟ;�QLAܪ����A,U�D)/��1����(�<����K����H�oEҨZZ�@�\إ&��uOs�l3�)U7�\�б�í$�����M�l�~J��)�4M�y�5Z��F߼�JR�j�/?��!�I�br�҈���!���_+�Ss��}�ˀ\��n�i�r�m;õ���C�y3#'{��'�;��)lI�Y��1���`�}ݾ
f,��jf�j���y��]�!��l�tE�B9f� �6>���$��	���Z�=��P�*�m�R�Կ�@ Y�;b?0!T�,Wr���W�d���ЇQ=6l�΢�7:#��`����j�p�:��vj�;�����	^+�՘[�����硍bH[C����c��kJ۽صF}�.�:����L�Q��	ԁ�� [��Co������sX������1*�Цl{m�c�ݾ�o,H�b�q�0j�˻h42ɱo��4�Ҩ<w����  ��PK-����  S  PK   6`f[             	 tfconfig/m-/eks.tfUT �@i�T�n�:��+�]$�|�+-
7(��4@�0�&�2!������b(ɑ���c���3gxKm��΃��G[�{gc[�����:��.s�mt!��]9��m�*��C����10�A8�+!_��_`��<�+D��(�8���앳�A��ۭ�q\qy�0�	�����P,���]��	�6�5��g)#�ϔS����sm+�gj�<�d�,���X�}��7\�
J�_Tq��jd�(�8om�w&أ��� �:n���pB��[��5[U
B��1����E���51�AE�Ԟ\��.����$n���M�E#[�L`�%ƅ@O}	.�EH�=FLC<��T�zS=eY�*����PrM͢z�׵�%ge���D7,j�&׍g5v�~P�����n�d�{��'||�Q�H��O 9oU>>�T�ivdh��u㦰&8�5�O��
O^�PFݏ�%�h�g֜��na��Jt���Ŏ,v��ۆ�����a��}���
����� ������
Ry,⵳�����������Z&y���@Ԗ���+:=�b2��v�$u,t��օURЯ�>�#��T�-%Ɋ�F�˔MhE�+ɴ�z�_�0?x�$.�b�iMP
-aE��$O֞��;�?�*S�K���'�5����0uxF  ��PK-��ƣ  �  PK   6`f[             	 tfconfig/modules.jsonUT �@i��RP��RPPPP�N�T�RPRҁp]2�@\=%.�Z�X@   ��PK��k)   )   PK   6`f[             	 .terraform.lock.hclUT �@i��Ϗd�
���W��#�`W��6���P$�����̦�g���:H�7Ry�*��W_���}p��������:�?���lǇʃ=���1�����/��s�N֏�Ǉ���������l�����R�r�:�?>�ǇC?��Oux~�v��������wǬ���T;>�O/w�"���7�x<���~z�=���pxW�������:��;�;��9����|����e㷯�~ٺ`����K���x=~z�=?����>�����_۟�O�7�/���ڎ��믿{����o~)����c l�z�6hiGN�{�`�rIi�R
�E0�;�5��.n�"ҡ*�n�V�[āF��������F�M{۸B�K���j�,�kMo\C�q�Qi:�&vdY�1K��8�Z����f��3�j���#�7B'
�1:8\��
�j��67�d��ftĂ���`�b󞭜�%Q�F[q��®� ��
c��+´h�9�.M���4�Q�e꣜���jm&V���A�&pX$0IW �Z��UïP�ah-�s��X{.dV�<��C�\��$�jgo����J�x���A�	��9Dk�m�c!.Y�&%o��I�@s�u�R�a-�d�^JS�Uȡ[��F�IK��N����u�+�a�ژ��H74�$g�p�M�S*�Ǟ$�1�<�
���Ӧ��\C��If'�Z ��l�Zh8�����R�b���|���˩�.����V�}�����(��e�.��	��C�"�:�ik�ʮ��cd)��l��D��������P�c��1��)q�;󤬤6K�Y�%αD�ݿ\ѿ������������pKw�?�������{|���ξ���������|���1�ç�>{������Ο=]K)�J�	�"!s��؍.3�k�^�%��m�( � Q�k��v�b_��9KaZ�f���5{�ns�ĆF4mý��ws	Ҩ��!Sgl�L�*G�(Ld�b���x�+C��������K,��.�aȴ�.�F�!���lplۡ�隭�	�(B�8�	x�`�9��mVh�5ja� �i�D�8\�]�9Ɛ�ȦOkM*Z{:p���}W�(R�)):��ܔ�i�Q59b�,�����m��F^�<���c#� cm%���[�'b�mHp��޼$�����.O��{%z���e�`��{�N�e�0����-��P��˔$`�f�S�(_V؂Ǵ�c�v��Yh��?{m��Tul2%ܲ����a�S)�2���Q5
�!��i���� �Rs�޸z�@�
TY@�����0�Ƌ���BM��W'�;  ��PK�Su1  �	  PK    6`f["v��x  J�   	               tfplanUT �@iPK    6`f[�����  *   	           �  tfstateUT �@iPK    6`f[�m   �    	           �  tfstate-prevUT �@iPK    6`f[�X�i�     	           K  tfconfig/m-/iam.tfUT �@iPK    6`f[�I(/  �   	           V  tfconfig/m-/nodes.tfUT �@iPK    6`f[S�&�     	           �   tfconfig/m-/outputs.tfUT �@iPK    6`f[��߼�   [   	           #  tfconfig/m-/provider.tfUT �@iPK    6`f[=��P
  /   	           D$  tfconfig/m-/security.tfUT �@iPK    6`f[� �&     	           �'  tfconfig/m-/variables.tfUT �@iPK    6`f[-����  S   	           
*  tfconfig/m-/vpc.tfUT �@iPK    6`f[-��ƣ  �   	           A-  tfconfig/m-/eks.tfUT �@iPK    6`f[��k)   )    	           -0  tfconfig/modules.jsonUT �@iPK    6`f[�Su1  �	   	           �0  .terraform.lock.hclUT �@iPK    
 
 �  6    
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

_Note: Binary provider artifacts inside `lib/.terraform/` are intentionally omitted because they are not human-readable source files._
