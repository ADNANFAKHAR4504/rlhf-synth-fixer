# Terraform HCL Implementation for EC2 Auto Scaling Groups with EKS

This implementation provides a production-ready EKS cluster (version 1.28) with EC2 Auto Scaling groups, OIDC provider, managed node groups, ALB ingress controller, and supporting infrastructure.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across environments"
  type        = string
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

variable "eks_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "frontend_instance_type" {
  description = "Instance type for frontend node group"
  type        = string
  default     = "t3.large"
}

variable "backend_instance_type" {
  description = "Instance type for backend node group"
  type        = string
  default     = "m5.xlarge"
}

variable "data_processing_instance_type" {
  description = "Instance type for data processing node group"
  type        = string
  default     = "c5.2xlarge"
}

variable "min_nodes" {
  description = "Minimum number of nodes per node group"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes per node group"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "ECommercePlatform"
  }
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = merge(var.tags, {
      Environment = var.environment_suffix
    })
  }
}

provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.main.token
  }
}
```

## File: lib/data.tf

```hcl
data "aws_eks_cluster_auth" "main" {
  name = aws_eks_cluster.main.name
}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}
```

## File: lib/vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                                = "vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                                                = "private-subnet-${var.environment_suffix}-${count.index + 1}"
    "kubernetes.io/role/internal-elb"                   = "1"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                = "public-subnet-${var.environment_suffix}-${count.index + 1}"
    "kubernetes.io/role/elb"                            = "1"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "nat-eip-${var.environment_suffix}-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${var.environment_suffix}-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${var.environment_suffix}-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/security-groups.tf

```hcl
resource "aws_security_group" "eks_cluster" {
  name_prefix = "eks-cluster-sg-${var.environment_suffix}-"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "eks-cluster-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "eks-nodes-sg-${var.environment_suffix}-"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow all traffic from cluster control plane"
  }

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
    description = "Allow nodes to communicate with each other"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                                                = "eks-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "cluster_to_nodes" {
  type                     = "egress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  description              = "Allow cluster control plane to communicate with nodes"
}
```

## File: lib/iam-eks.tf

```hcl
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

  tags = {
    Name = "eks-cluster-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

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

  tags = {
    Name = "eks-nodes-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}
```

## File: lib/iam-oidc.tf

```hcl
resource "aws_iam_openid_connect_provider" "eks_oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "eks-oidc-provider-${var.environment_suffix}"
  }
}

resource "aws_iam_role" "irsa_alb_controller" {
  name_prefix = "irsa-alb-controller-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "irsa-alb-controller-${var.environment_suffix}"
  }
}

resource "aws_iam_policy" "alb_controller" {
  name_prefix = "alb-controller-policy-${var.environment_suffix}-"
  description = "IAM policy for ALB Ingress Controller"

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
          "ec2:RevokeSecurityGroupIngress",
          "ec2:CreateSecurityGroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:ec2:*:*:security-group/*"
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "CreateSecurityGroup"
          }
          Null = {
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
        Resource = "arn:${data.aws_partition.current.partition}:ec2:*:*:security-group/*"
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteSecurityGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
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
          Null = {
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
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          Null = {
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
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:listener/net/*/*/*",
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:listener/app/*/*/*",
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
          "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
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
          Null = {
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
        Resource = "arn:${data.aws_partition.current.partition}:elasticloadbalancing:*:*:targetgroup/*/*"
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

  tags = {
    Name = "alb-controller-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "irsa_alb_controller" {
  policy_arn = aws_iam_policy.alb_controller.arn
  role       = aws_iam_role.irsa_alb_controller.name
}

resource "aws_iam_role" "irsa_cluster_autoscaler" {
  name_prefix = "irsa-cluster-autoscaler-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "irsa-cluster-autoscaler-${var.environment_suffix}"
  }
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name_prefix = "cluster-autoscaler-policy-${var.environment_suffix}-"
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

  tags = {
    Name = "cluster-autoscaler-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "irsa_cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.irsa_cluster_autoscaler.name
}
```

## File: lib/eks-cluster.tf

```hcl
resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name = "eks-cluster-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]
}
```

## File: lib/eks-addons.tf

```hcl
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_update = "PRESERVE"

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing
  ]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_update = "PRESERVE"

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing
  ]
}

resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_update = "PRESERVE"

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing
  ]
}
```

## File: lib/eks-node-groups.tf

```hcl
resource "aws_eks_node_group" "frontend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "frontend-nodegroup-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.frontend_instance_type]

  scaling_config {
    desired_size = var.min_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "frontend"
    role     = "application"
  }

  tags = {
    Name                                                = "frontend-nodegroup-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/enabled"                 = "true"
    "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

resource "aws_eks_node_group" "backend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "backend-nodegroup-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.backend_instance_type]

  scaling_config {
    desired_size = var.min_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "backend"
    role     = "application"
  }

  tags = {
    Name                                                = "backend-nodegroup-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/enabled"                 = "true"
    "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

resource "aws_eks_node_group" "data_processing" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "data-processing-nodegroup-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.data_processing_instance_type]

  scaling_config {
    desired_size = var.min_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "data-processing"
    role     = "compute-intensive"
  }

  tags = {
    Name                                                = "data-processing-nodegroup-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/enabled"                 = "true"
    "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}
```

## File: lib/kubernetes-resources.tf

```hcl
resource "kubernetes_service_account" "alb_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_alb_controller.arn
    }
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_service_account" "cluster_autoscaler" {
  metadata {
    name      = "cluster-autoscaler"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_cluster_autoscaler.arn
    }
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_namespace" "istio_system" {
  metadata {
    name = "istio-system"

    labels = {
      name = "istio-system"
    }
  }

  depends_on = [aws_eks_cluster.main]
}
```

## File: lib/helm-alb-controller.tf

```hcl
resource "helm_release" "alb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.6.2"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.alb_controller.metadata[0].name
  }

  set {
    name  = "region"
    value = var.region
  }

  set {
    name  = "vpcId"
    value = aws_vpc.main.id
  }

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing,
    kubernetes_service_account.alb_controller
  ]
}
```

## File: lib/helm-cluster-autoscaler.tf

```hcl
resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = "9.29.3"

  set {
    name  = "autoDiscovery.clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "awsRegion"
    value = var.region
  }

  set {
    name  = "rbac.serviceAccount.create"
    value = "false"
  }

  set {
    name  = "rbac.serviceAccount.name"
    value = kubernetes_service_account.cluster_autoscaler.metadata[0].name
  }

  set {
    name  = "extraArgs.scale-down-delay-after-add"
    value = "90s"
  }

  set {
    name  = "extraArgs.scale-down-unneeded-time"
    value = "90s"
  }

  set {
    name  = "extraArgs.skip-nodes-with-local-storage"
    value = "false"
  }

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing,
    kubernetes_service_account.cluster_autoscaler
  ]
}
```

## File: lib/helm-istio.tf

```hcl
resource "helm_release" "istio_base" {
  name       = "istio-base"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "base"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = "1.20.0"

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend,
    aws_eks_node_group.data_processing,
    kubernetes_namespace.istio_system
  ]
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = "1.20.0"

  set {
    name  = "meshConfig.enableAutoMtls"
    value = "true"
  }

  set {
    name  = "meshConfig.accessLogFile"
    value = "/dev/stdout"
  }

  depends_on = [
    helm_release.istio_base
  ]
}

resource "helm_release" "istio_ingress" {
  name       = "istio-ingress"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = "1.20.0"

  depends_on = [
    helm_release.istiod
  ]
}
```

## File: lib/ecr.tf

```hcl
resource "aws_ecr_repository" "frontend" {
  name                 = "frontend-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "frontend-ecr-${var.environment_suffix}"
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "backend-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "backend-ecr-${var.environment_suffix}"
  }
}

resource "aws_ecr_repository" "data_processing" {
  name                 = "data-processing-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "data-processing-ecr-${var.environment_suffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 30 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 30
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 30 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 30
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "data_processing" {
  repository = aws_ecr_repository.data_processing.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 30 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 30
      }
      action = {
        type = "expire"
      }
    }]
  })
}
```

## File: lib/secrets-manager.tf

```hcl
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "app-secrets-${var.environment_suffix}-"
  description             = "Application secrets for microservices"
  recovery_window_in_days = 0

  tags = {
    Name = "app-secrets-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = "PLACEHOLDER_CHANGE_ME"
    api_key           = "PLACEHOLDER_CHANGE_ME"
    jwt_secret        = "PLACEHOLDER_CHANGE_ME"
  })
}

resource "aws_iam_role" "irsa_secrets_manager" {
  name_prefix = "irsa-secrets-manager-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:default:app-secrets-sa"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "irsa-secrets-manager-${var.environment_suffix}"
  }
}

resource "aws_iam_policy" "secrets_manager_read" {
  name_prefix = "secrets-manager-read-${var.environment_suffix}-"
  description = "IAM policy for reading secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      }
    ]
  })

  tags = {
    Name = "secrets-manager-read-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "irsa_secrets_manager" {
  policy_arn = aws_iam_policy.secrets_manager_read.arn
  role       = aws_iam_role.irsa_secrets_manager.name
}

resource "kubernetes_service_account" "app_secrets" {
  metadata {
    name      = "app-secrets-sa"
    namespace = "default"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_secrets_manager.arn
    }
  }

  depends_on = [aws_eks_cluster.main]
}
```

## File: lib/outputs.tf

```hcl
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "eks_cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster certificate authority data"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "frontend_node_group_id" {
  description = "Frontend node group ID"
  value       = aws_eks_node_group.frontend.id
}

output "backend_node_group_id" {
  description = "Backend node group ID"
  value       = aws_eks_node_group.backend.id
}

output "data_processing_node_group_id" {
  description = "Data processing node group ID"
  value       = aws_eks_node_group.data_processing.id
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value = {
    frontend        = aws_ecr_repository.frontend.repository_url
    backend         = aws_ecr_repository.backend.repository_url
    data_processing = aws_ecr_repository.data_processing.repository_url
  }
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "alb_controller_role_arn" {
  description = "ARN of IAM role for ALB controller"
  value       = aws_iam_role.irsa_alb_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of IAM role for cluster autoscaler"
  value       = aws_iam_role.irsa_cluster_autoscaler.arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${aws_eks_cluster.main.name}"
}
```

## File: lib/README.md

```markdown
# EKS Infrastructure for E-Commerce Microservices Platform

This Terraform configuration deploys a production-ready Amazon EKS cluster (version 1.28) with EC2 Auto Scaling groups, designed for containerized microservices deployment in the eu-central-1 region.

## Architecture Overview

The infrastructure includes:

1. EKS Cluster v1.28 with OIDC provider enabled
2. Three Managed Node Groups:
   - Frontend: t3.large instances
   - Backend: m5.xlarge instances
   - Data Processing: c5.2xlarge instances
3. VPC with High Availability: 10.0.0.0/16 CIDR across 3 availability zones
4. ALB Ingress Controller: Deployed via Helm for external traffic management
5. Cluster Autoscaler: Configured with min 2, max 10 nodes per group, 90-second response time
6. EKS Add-ons: vpc-cni, kube-proxy, coredns (latest versions)
7. Istio Service Mesh: For encrypted pod-to-pod communication
8. IRSA: IAM Roles for Service Accounts for secure AWS service access
9. Amazon ECR: Container registries with vulnerability scanning enabled
10. AWS Secrets Manager: For secure secrets storage and runtime injection

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2 configured with appropriate credentials
- kubectl (for cluster access post-deployment)
- helm (for managing Kubernetes applications)

## Deployment

### Step 1: Initialize Terraform

```bash
cd lib
terraform init
```

### Step 2: Create terraform.tfvars

Create a `terraform.tfvars` file with your environment suffix:

```hcl
environment_suffix = "prod-001"
region            = "eu-central-1"
```

### Step 3: Plan and Apply

```bash
terraform plan
terraform apply
```

The deployment typically takes 15-20 minutes to complete.

### Step 4: Configure kubectl

After deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region eu-central-1 --name eks-cluster-<environment-suffix>
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods -A
```

## Resource Details

### EKS Cluster

- Version: 1.28
- OIDC Provider: Enabled for IRSA
- Logging: All control plane logs enabled
- Networking: Private and public endpoint access enabled

### Node Groups

All node groups configured with min 2, max 10 nodes, auto-scaling enabled.

### Networking

VPC: 10.0.0.0/16
- Private Subnets: Worker nodes
- Public Subnets: Load balancers
- NAT Gateways: One per AZ
- Internet Gateway: For public subnet connectivity

### Security

- Security Groups for cluster and nodes
- IRSA Roles: ALB Controller, Cluster Autoscaler, Secrets Manager Reader
- Secrets Manager with IRSA-enabled service account

### Add-ons

- vpc-cni: v1.15.1
- kube-proxy: v1.28.2
- coredns: v1.10.1

### Helm Deployments

- AWS Load Balancer Controller: v1.6.2
- Cluster Autoscaler: v9.29.3 (90-second response time)
- Istio Service Mesh: v1.20.0

### Container Registries (ECR)

Three ECR repositories with vulnerability scanning and lifecycle policies.

## Verification

```bash
kubectl get nodes --show-labels
aws eks list-addons --cluster-name eks-cluster-<environment-suffix>
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get deployment -n kube-system cluster-autoscaler
kubectl get pods -n istio-system
```

## Cleanup

```bash
terraform destroy
```

## Security Best Practices

1. Update Secrets Manager placeholders
2. Implement Kubernetes network policies
3. Use Pod Security Standards
4. Only deploy scanned container images
5. Implement proper RBAC policies
6. Verify Istio mTLS enabled
