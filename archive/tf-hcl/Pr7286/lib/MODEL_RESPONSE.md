# EKS Cluster Terraform Implementation

This implementation provides a production-ready EKS cluster with advanced security, networking, and operational capabilities for a fintech microservices architecture.

## Architecture Overview

The solution deploys:
- EKS cluster version 1.28 with private API endpoint
- Three distinct managed node groups with network segmentation
- KMS encryption for secrets and EBS volumes
- IRSA (IAM Roles for Service Accounts) with OIDC provider
- AWS EBS CSI Driver for persistent storage
- IAM roles for AWS Load Balancer Controller and Cluster Autoscaler
- Comprehensive control plane logging
- Multi-AZ VPC with dedicated subnets per node group type

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Project     = "eks-cluster-${var.environment_suffix}"
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 8
    error_message = "Environment suffix must be between 1 and 8 characters."
  }
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "eks-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "system_node_group_config" {
  description = "Configuration for system node group"
  type = object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
  })
  default = {
    instance_types = ["t3.medium"]
    min_size       = 2
    max_size       = 4
    desired_size   = 2
  }
}

variable "application_node_group_config" {
  description = "Configuration for application node group"
  type = object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
  })
  default = {
    instance_types = ["m5.large"]
    min_size       = 2
    max_size       = 6
    desired_size   = 3
  }
}

variable "spot_node_group_config" {
  description = "Configuration for spot node group"
  type = object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
  })
  default = {
    instance_types = ["m5.large"]
    min_size       = 1
    max_size       = 10
    desired_size   = 2
  }
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler configuration"
  type        = bool
  default     = true
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 10

  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/main.tf

```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# KMS key for EKS cluster encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster ${var.cluster_name}-${var.environment_suffix} encryption"
  deletion_window_in_days = var.kms_key_deletion_window
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name        = "eks-kms-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${var.environment_suffix}"
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
      Name                                                  = "eks-vpc-${var.environment_suffix}"
      Environment                                           = var.environment
      "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-igw-${var.environment_suffix}"
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
      Name                                                  = "eks-system-private-${var.availability_zones[count.index]}-${var.environment_suffix}"
      Environment                                           = var.environment
      Type                                                  = "private"
      NodeGroup                                             = "system"
      "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
      "kubernetes.io/role/internal-elb"                     = "1"
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
      Name                                                  = "eks-app-private-${var.availability_zones[count.index]}-${var.environment_suffix}"
      Environment                                           = var.environment
      Type                                                  = "private"
      NodeGroup                                             = "application"
      "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
      "kubernetes.io/role/internal-elb"                     = "1"
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
      Name                                                  = "eks-spot-private-${var.availability_zones[count.index]}-${var.environment_suffix}"
      Environment                                           = var.environment
      Type                                                  = "private"
      NodeGroup                                             = "spot"
      "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
      "kubernetes.io/role/internal-elb"                     = "1"
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
      Name                                                  = "eks-public-${var.availability_zones[count.index]}-${var.environment_suffix}"
      Environment                                           = var.environment
      Type                                                  = "public"
      "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
      "kubernetes.io/role/elb"                              = "1"
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
      Name        = "eks-nat-eip-${var.availability_zones[count.index]}-${var.environment_suffix}"
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
      Name        = "eks-nat-${var.availability_zones[count.index]}-${var.environment_suffix}"
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
      Name        = "eks-public-rt-${var.environment_suffix}"
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
      Name        = "eks-system-private-rt-${var.availability_zones[count.index]}-${var.environment_suffix}"
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
      Name        = "eks-app-private-rt-${var.availability_zones[count.index]}-${var.environment_suffix}"
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
      Name        = "eks-spot-private-rt-${var.availability_zones[count.index]}-${var.environment_suffix}"
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
  name_prefix = "eks-cluster-sg-${var.environment_suffix}-"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-sg-${var.environment_suffix}"
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
  name_prefix = "eks-nodes-sg-${var.environment_suffix}-"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "eks-nodes-sg-${var.environment_suffix}"
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
```

## File: lib/eks-cluster.tf

```hcl
# IAM role for EKS cluster
resource "aws_iam_role" "eks_cluster" {
  name_prefix = "eks-cluster-role-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-role-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# CloudWatch log group for EKS cluster
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}-${var.environment_suffix}/cluster"
  retention_in_days = 7

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-logs-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${var.cluster_name}-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids = concat(
      aws_subnet.system_private[*].id,
      aws_subnet.application_private[*].id,
      aws_subnet.spot_private[*].id
    )
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = false
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
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = merge(
    var.tags,
    {
      Name        = "${var.cluster_name}-${var.environment_suffix}"
      Environment = var.environment
    }
  )
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
    var.tags,
    {
      Name        = "eks-oidc-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

# IAM role for EBS CSI driver
resource "aws_iam_role" "ebs_csi_driver" {
  name_prefix = "eks-ebs-csi-driver-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-ebs-csi-driver-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_driver.name
}

# Additional IAM policy for EBS CSI driver KMS encryption
resource "aws_iam_role_policy" "ebs_csi_driver_kms" {
  name_prefix = "ebs-csi-kms-${var.environment_suffix}-"
  role        = aws_iam_role.ebs_csi_driver.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.eks.arn
      }
    ]
  })
}

# EBS CSI Driver addon
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"

  tags = merge(
    var.tags,
    {
      Name        = "ebs-csi-driver-${var.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [
    aws_eks_node_group.system
  ]
}

# IAM role for AWS Load Balancer Controller
resource "aws_iam_role" "aws_load_balancer_controller" {
  name_prefix = "eks-lb-controller-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-lb-controller-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_policy" "aws_load_balancer_controller" {
  name_prefix = "eks-lb-controller-${var.environment_suffix}-"
  description = "IAM policy for AWS Load Balancer Controller"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "iam:AWSServiceName" = "elasticloadbalancing.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeCoipPools",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeSSLPolicies",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPoolClient",
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "iam:ListServerCertificates",
          "iam:GetServerCertificate",
          "waf-regional:GetWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSecurityGroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "CreateSecurityGroup"
          }
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DeleteSecurityGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:SetIpAddressType",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:DeleteTargetGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets"
        ]
        Resource = "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddListenerCertificates",
          "elasticloadbalancing:RemoveListenerCertificates",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-lb-controller-policy-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
  role       = aws_iam_role.aws_load_balancer_controller.name
}

# IAM role for cluster autoscaler
resource "aws_iam_role" "cluster_autoscaler" {
  name_prefix = "eks-cluster-autoscaler-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-autoscaler-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name_prefix = "eks-cluster-autoscaler-${var.environment_suffix}-"
  description = "IAM policy for cluster autoscaler"

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
          "ec2:DescribeImages",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = "owned"
          }
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-cluster-autoscaler-policy-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}
```

## File: lib/node-groups.tf

```hcl
# IAM role for EKS node groups
resource "aws_iam_role" "eks_nodes" {
  name_prefix = "eks-nodes-role-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(
    var.tags,
    {
      Name        = "eks-nodes-role-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

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

# System node group - for core cluster services
resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.system_private[*].id
  instance_types  = var.system_node_group_config.instance_types
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = var.system_node_group_config.desired_size
    max_size     = var.system_node_group_config.max_size
    min_size     = var.system_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "system"
    environment = var.environment
    nodegroup   = "system"
  }

  taint {
    key    = "dedicated"
    value  = "system"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                  = "eks-system-nodegroup-${var.environment_suffix}"
      Environment                                           = var.environment
      NodeGroup                                             = "system"
      "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                   = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Application node group - for application workloads
resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.application_private[*].id
  instance_types  = var.application_node_group_config.instance_types
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = var.application_node_group_config.desired_size
    max_size     = var.application_node_group_config.max_size
    min_size     = var.application_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "application"
    environment = var.environment
    nodegroup   = "application"
  }

  taint {
    key    = "dedicated"
    value  = "application"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                  = "eks-application-nodegroup-${var.environment_suffix}"
      Environment                                           = var.environment
      NodeGroup                                             = "application"
      "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                   = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Spot node group - for batch processing and cost optimization
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.spot_private[*].id
  instance_types  = var.spot_node_group_config.instance_types
  capacity_type   = "SPOT"

  scaling_config {
    desired_size = var.spot_node_group_config.desired_size
    max_size     = var.spot_node_group_config.max_size
    min_size     = var.spot_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "batch"
    environment = var.environment
    nodegroup   = "spot"
    capacity    = "spot"
  }

  taint {
    key    = "dedicated"
    value  = "spot"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                  = "eks-spot-nodegroup-${var.environment_suffix}"
      Environment                                           = var.environment
      NodeGroup                                             = "spot"
      "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                   = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}
```

## File: lib/outputs.tf

```hcl
output "cluster_id" {
  description = "The name/id of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the cluster"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "The Kubernetes server version for the cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = try(aws_eks_cluster.main.identity[0].oidc[0].issuer, "")
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "system_private_subnet_ids" {
  description = "List of IDs of system private subnets"
  value       = aws_subnet.system_private[*].id
}

output "application_private_subnet_ids" {
  description = "List of IDs of application private subnets"
  value       = aws_subnet.application_private[*].id
}

output "spot_private_subnet_ids" {
  description = "List of IDs of spot private subnets"
  value       = aws_subnet.spot_private[*].id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "system_node_group_id" {
  description = "System node group ID"
  value       = aws_eks_node_group.system.id
}

output "application_node_group_id" {
  description = "Application node group ID"
  value       = aws_eks_node_group.application.id
}

output "spot_node_group_id" {
  description = "Spot node group ID"
  value       = aws_eks_node_group.spot.id
}

output "kms_key_id" {
  description = "The ID of the KMS key used for EKS encryption"
  value       = aws_kms_key.eks.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for EKS encryption"
  value       = aws_kms_key.eks.arn
}

output "ebs_csi_driver_role_arn" {
  description = "ARN of IAM role for EBS CSI driver"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "ARN of IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of IAM role for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. kubectl installed (for cluster access)

### Deployment Steps

1. Initialize Terraform:
```bash
terraform init
```

2. Create a terraform.tfvars file:
```hcl
environment        = "dev"
environment_suffix = "abc123"
aws_region         = "us-east-1"
cluster_name       = "eks-cluster"
```

3. Review the plan:
```bash
terraform plan
```

4. Apply the configuration:
```bash
terraform apply
```

5. Configure kubectl access:
```bash
aws eks update-kubeconfig --region us-east-1 --name eks-cluster-abc123
```

6. Verify cluster access:
```bash
kubectl get nodes
kubectl get pods -A
```

### Post-Deployment Configuration

#### Install Cluster Autoscaler

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-addon: cluster-autoscaler.addons.k8s.io
    k8s-app: cluster-autoscaler
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: $(terraform output -raw cluster_autoscaler_role_arn)
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
        name: cluster-autoscaler
        command:
          - ./cluster-autoscaler
          - --v=4
          - --stderrthreshold=info
          - --cloud-provider=aws
          - --skip-nodes-with-local-storage=false
          - --expander=least-waste
          - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-abc123
          - --balance-similar-node-groups
          - --skip-nodes-with-system-pods=false
EOF
```

#### Install AWS Load Balancer Controller

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

kubectl create serviceaccount aws-load-balancer-controller -n kube-system \
  --annotation eks.amazonaws.com/role-arn=$(terraform output -raw aws_load_balancer_controller_role_arn)

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-cluster-abc123 \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

#### Create Encrypted GP3 StorageClass

```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-encrypted
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: $(terraform output -raw kms_key_arn)
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF
```

## Security Considerations

1. Private API Endpoint: The EKS cluster API endpoint is only accessible from within the VPC
2. KMS Encryption: All EKS secrets and EBS volumes are encrypted using customer-managed KMS keys with automatic rotation
3. IRSA: Pod-level IAM permissions using OIDC provider for service accounts
4. Network Segmentation: Dedicated subnets for each node group type
5. Pod Security Standards: Baseline enforcement should be configured post-deployment
6. Node Group Taints: Prevents unauthorized workloads from scheduling on specific node groups

## Resource Naming Pattern

All resources follow the pattern: `{resource-type}-{environment-suffix}`
- Example: `eks-cluster-abc123`, `eks-vpc-abc123`
- Environment labels use `var.environment` (dev/staging/production)

## Cost Optimization

- NAT Gateways: 3 NAT gateways (one per AZ) provide high availability but add cost
- Spot Instances: Spot node group can reduce costs by up to 90% for fault-tolerant workloads
- Node Group Sizing: Review min/max/desired sizes based on actual workload requirements
- EBS Storage: GP3 volumes provide better price-performance than GP2

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

Note: Ensure all Kubernetes resources (LoadBalancers, PersistentVolumes) are deleted before destroying the infrastructure to avoid orphaned AWS resources.
