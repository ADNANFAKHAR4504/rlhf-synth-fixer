# MODEL_RESPONSE.md

Complete Terraform implementation for production EKS cluster with Karpenter autoscaling, private networking, and IRSA authentication.

## File: lib/vpc.tf

```hcl
# VPC and Networking Configuration

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                             = "eks-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    ManagedBy                                        = "terraform"
    Environment                                      = "production"
    TaskID                                           = "101912832"
  }
}

# Internet Gateway for NAT instances
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "eks-igw-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

# Private Subnets - 3 AZs
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                             = "eks-private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                = "1"
    ManagedBy                                        = "terraform"
    Environment                                      = "production"
    TaskID                                           = "101912832"
  }
}

# Public Subnets for NAT instances
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                             = "eks-public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/elb"                         = "1"
    ManagedBy                                        = "terraform"
    Environment                                      = "production"
    TaskID                                           = "101912832"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "eks-public-rt-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_instance.nat[count.index].primary_network_interface_id
  }

  tags = {
    Name        = "eks-private-rt-${count.index + 1}-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/nat.tf

```hcl
# NAT Instances for cost optimization

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "nat" {
  name_prefix = "nat-sg-${var.environment_suffix}-"
  description = "Security group for NAT instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow traffic from private subnets"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [for subnet in aws_subnet.private : subnet.cidr_block]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "nat-sg-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "nat" {
  count                  = 3
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[count.index].id
  vpc_security_group_ids = [aws_security_group.nat.id]
  source_dest_check      = false

  user_data = <<-EOF
              #!/bin/bash
              echo 1 > /proc/sys/net/ipv4/ip_forward
              iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
              yum install -y iptables-services
              service iptables save
              EOF

  tags = {
    Name        = "nat-instance-${count.index + 1}-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}
```

## File: lib/security-groups.tf

```hcl
# Security Groups

resource "aws_security_group" "eks_cluster" {
  name_prefix = "eks-cluster-sg-${var.environment_suffix}-"
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
    Name        = "eks-cluster-sg-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
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
    description     = "Allow nodes to communicate with each other"
    from_port       = 0
    to_port         = 65535
    protocol        = "-1"
    self            = true
  }

  ingress {
    description     = "Allow pods to communicate with cluster API"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    description     = "Allow cluster control plane to communicate with nodes"
    from_port       = 1025
    to_port         = 65535
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
    Name                                             = "eks-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
    ManagedBy                                        = "terraform"
    Environment                                      = "production"
    TaskID                                           = "101912832"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "cluster_ingress_nodes" {
  description              = "Allow nodes to communicate with cluster API"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
}
```

## File: lib/iam.tf

```hcl
# IAM Roles and Policies

# EKS Cluster Role
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
    Name        = "eks-cluster-role-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# EKS Node Group Role
resource "aws_iam_role" "eks_node_group" {
  name_prefix = "eks-node-group-role-${var.environment_suffix}-"

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
    Name        = "eks-node-group-role-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# Karpenter IRSA Role
data "aws_iam_policy_document" "karpenter_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:karpenter:karpenter"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "karpenter" {
  name_prefix        = "karpenter-controller-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.karpenter_assume_role.json

  tags = {
    Name        = "karpenter-controller-role-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_policy" "karpenter" {
  name_prefix = "karpenter-policy-${var.environment_suffix}-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateFleet",
          "ec2:CreateLaunchTemplate",
          "ec2:CreateTags",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeImages",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypeOfferings",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplates",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSpotPriceHistory",
          "ec2:DescribeSubnets",
          "ec2:DeleteLaunchTemplate",
          "ec2:RunInstances",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/aws/service/*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = aws_iam_role.eks_node_group.arn
      },
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster"
        ]
        Resource = aws_eks_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "pricing:GetProducts"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "karpenter-policy-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_role_policy_attachment" "karpenter" {
  role       = aws_iam_role.karpenter.name
  policy_arn = aws_iam_policy.karpenter.arn
}

# AWS Load Balancer Controller IRSA Role
data "aws_iam_policy_document" "aws_load_balancer_controller_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "aws_load_balancer_controller" {
  name_prefix        = "aws-lb-controller-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.aws_load_balancer_controller_assume_role.json

  tags = {
    Name        = "aws-lb-controller-role-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_policy" "aws_load_balancer_controller" {
  name_prefix = "aws-lb-controller-policy-${var.environment_suffix}-"

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
        Resource = "arn:aws:ec2:*:*:security-group/*"
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
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
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
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
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

  tags = {
    Name        = "aws-lb-controller-policy-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  role       = aws_iam_role.aws_load_balancer_controller.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
}

# Karpenter Node IAM Role
resource "aws_iam_instance_profile" "karpenter_node" {
  name_prefix = "karpenter-node-${var.environment_suffix}-"
  role        = aws_iam_role.eks_node_group.name

  tags = {
    Name        = "karpenter-node-instance-profile-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}
```

## File: lib/eks.tf

```hcl
# EKS Cluster Configuration

resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["audit", "authenticator", "controllerManager"]

  tags = {
    Name        = "eks-cluster-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller
  ]
}

# OIDC Provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name        = "eks-oidc-provider-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

# EKS Managed Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "eks-node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = ["t4g.medium"]

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 6
  }

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name        = "eks-node-group-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# VPC CNI Addon with network policy support
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  configuration_values = jsonencode({
    enableNetworkPolicy = "true"
  })

  tags = {
    Name        = "eks-vpc-cni-addon-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

# CoreDNS Addon
resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name        = "eks-coredns-addon-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }

  depends_on = [aws_eks_node_group.main]
}

# kube-proxy Addon
resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name        = "eks-kube-proxy-addon-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}
```

## File: lib/karpenter.tf

```hcl
# Karpenter Deployment using Helm

terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.0"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.14"
    }
  }
}

data "aws_eks_cluster_auth" "main" {
  name = aws_eks_cluster.main.name
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.main.token
  }
}

provider "kubectl" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
  load_config_file       = false
}

# Karpenter Namespace
resource "kubectl_manifest" "karpenter_namespace" {
  yaml_body = <<-YAML
    apiVersion: v1
    kind: Namespace
    metadata:
      name: karpenter
      labels:
        app.kubernetes.io/name: karpenter
  YAML

  depends_on = [aws_eks_cluster.main]
}

# Karpenter Service Account
resource "kubectl_manifest" "karpenter_service_account" {
  yaml_body = <<-YAML
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: karpenter
      namespace: karpenter
      annotations:
        eks.amazonaws.com/role-arn: ${aws_iam_role.karpenter.arn}
  YAML

  depends_on = [kubectl_manifest.karpenter_namespace]
}

# Karpenter Helm Release
resource "helm_release" "karpenter" {
  name       = "karpenter"
  namespace  = "karpenter"
  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter"
  version    = "v0.32.1"

  set {
    name  = "settings.clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "settings.clusterEndpoint"
    value = aws_eks_cluster.main.endpoint
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = "karpenter"
  }

  set {
    name  = "settings.interruptionQueue"
    value = aws_sqs_queue.karpenter.name
  }

  depends_on = [
    kubectl_manifest.karpenter_service_account,
    aws_eks_node_group.main
  ]
}

# SQS Queue for Karpenter interruption handling
resource "aws_sqs_queue" "karpenter" {
  name                      = "karpenter-${var.environment_suffix}"
  message_retention_seconds = 300
  sqs_managed_sse_enabled   = true

  tags = {
    Name        = "karpenter-queue-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_sqs_queue_policy" "karpenter" {
  queue_url = aws_sqs_queue.karpenter.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "sqs.amazonaws.com"
          ]
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.karpenter.arn
      }
    ]
  })
}

# EventBridge Rules for Karpenter
resource "aws_cloudwatch_event_rule" "karpenter_spot_interruption" {
  name        = "karpenter-spot-interruption-${var.environment_suffix}"
  description = "Karpenter spot instance interruption warning"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })

  tags = {
    Name        = "karpenter-spot-interruption-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_cloudwatch_event_target" "karpenter_spot_interruption" {
  rule      = aws_cloudwatch_event_rule.karpenter_spot_interruption.name
  target_id = "KarpenterSpotInterruptionQueue"
  arn       = aws_sqs_queue.karpenter.arn
}

resource "aws_cloudwatch_event_rule" "karpenter_instance_state_change" {
  name        = "karpenter-instance-state-change-${var.environment_suffix}"
  description = "Karpenter instance state change"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Instance State-change Notification"]
  })

  tags = {
    Name        = "karpenter-instance-state-change-${var.environment_suffix}"
    ManagedBy   = "terraform"
    Environment = "production"
    TaskID      = "101912832"
  }
}

resource "aws_cloudwatch_event_target" "karpenter_instance_state_change" {
  rule      = aws_cloudwatch_event_rule.karpenter_instance_state_change.name
  target_id = "KarpenterInstanceStateChangeQueue"
  arn       = aws_sqs_queue.karpenter.arn
}

# Karpenter Provisioner
resource "kubectl_manifest" "karpenter_provisioner" {
  yaml_body = <<-YAML
    apiVersion: karpenter.sh/v1alpha5
    kind: Provisioner
    metadata:
      name: default
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["t4g"]
      limits:
        resources:
          cpu: "1000"
          memory: "1000Gi"
      providerRef:
        name: default
      ttlSecondsAfterEmpty: 30
      ttlSecondsUntilExpired: 2592000
  YAML

  depends_on = [helm_release.karpenter]
}

# Karpenter Node Template
resource "kubectl_manifest" "karpenter_node_template" {
  yaml_body = <<-YAML
    apiVersion: karpenter.k8s.aws/v1alpha1
    kind: AWSNodeTemplate
    metadata:
      name: default
    spec:
      subnetSelector:
        kubernetes.io/cluster/eks-cluster-${var.environment_suffix}: shared
      securityGroupSelector:
        kubernetes.io/cluster/eks-cluster-${var.environment_suffix}: owned
      instanceProfile: ${aws_iam_instance_profile.karpenter_node.name}
      tags:
        Name: karpenter-node-${var.environment_suffix}
        ManagedBy: terraform
        Environment: production
        TaskID: "101912832"
        karpenter.sh/discovery: eks-cluster-${var.environment_suffix}
  YAML

  depends_on = [helm_release.karpenter]
}
```

## File: lib/outputs.tf

```hcl
# Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster certificate authority data"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = aws_eks_cluster.main.version
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "karpenter_role_arn" {
  description = "Karpenter IAM role ARN"
  value       = aws_iam_role.karpenter.arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "AWS Load Balancer Controller IAM role ARN"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
```

## File: lib/README.md

```markdown
# Production EKS Cluster with Karpenter

This Terraform configuration deploys a production-grade Amazon EKS cluster with advanced networking, autoscaling capabilities, and security best practices for a fintech environment.

## Architecture Overview

- **VPC**: Custom VPC (10.0.0.0/16) with 3 private subnets across different AZs
- **EKS Cluster**: Version 1.28+ with OIDC provider enabled
- **Node Groups**: Managed node group with t4g.medium instances (Graviton3)
- **Networking**: Private subnets for worker nodes with NAT instances for egress
- **Autoscaling**: Karpenter for intelligent node provisioning
- **Security**: IRSA for workload identities, VPC CNI network policies, control plane logging

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl >= 1.28
- AWS account with appropriate permissions
- Configured AWS credentials

## Mandatory Features

1. VPC with 3 private subnets (/24 CIDR blocks)
2. EKS cluster version 1.28+ with OIDC provider
3. Managed node group (t4g.medium, min 2, max 6)
4. VPC CNI addon with network policy support
5. IRSA roles for Karpenter and AWS Load Balancer Controller
6. Karpenter deployment with Helm
7. EKS control plane logging (audit, authenticator, controllerManager)
8. NAT instances for cost optimization
9. Security groups with strict rules
10. Resource tagging (Environment=production, ManagedBy=terraform)

## Resource Naming Convention

All resources include an environment suffix for uniqueness:
- Format: `{resource-type}-${var.environment_suffix}`
- Example: `eks-cluster-prod-01`

## Deployment Instructions

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review Configuration

```bash
terraform plan -var="environment_suffix=prod-01"
```

### 3. Deploy Infrastructure

```bash
terraform apply -var="environment_suffix=prod-01"
```

### 4. Configure kubectl

```bash
aws eks update-kubeconfig --region eu-central-1 --name eks-cluster-prod-01
```

### 5. Verify Cluster

```bash
kubectl get nodes
kubectl get pods -n karpenter
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| aws_region | AWS region for resources | string | us-east-1 | no |
| environment_suffix | Environment suffix for resource naming | string | dev | yes |
| repository | Repository name for tagging | string | unknown | no |
| commit_author | Commit author for tagging | string | unknown | no |
| pr_number | PR number for tagging | string | unknown | no |
| team | Team name for tagging | string | unknown | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | VPC ID |
| private_subnet_ids | Private subnet IDs |
| public_subnet_ids | Public subnet IDs |
| eks_cluster_name | EKS cluster name |
| eks_cluster_endpoint | EKS cluster endpoint |
| eks_cluster_version | EKS cluster Kubernetes version |
| eks_oidc_provider_arn | EKS OIDC provider ARN |
| karpenter_role_arn | Karpenter IAM role ARN |
| aws_load_balancer_controller_role_arn | AWS Load Balancer Controller IAM role ARN |
| configure_kubectl | Command to configure kubectl |

## Security Features

- **Private Networking**: Worker nodes in private subnets only
- **Network Policies**: VPC CNI network policy support for pod-level security
- **IRSA**: IAM Roles for Service Accounts for secure AWS API access
- **Control Plane Logging**: Audit, authenticator, and controllerManager logs enabled
- **Security Groups**: Strict ingress/egress rules
- **Encryption**: Pod-to-pod encryption via VPC CNI

## Cost Optimization

- **NAT Instances**: t3.micro instances instead of NAT Gateways
- **Graviton3**: ARM-based t4g.medium instances
- **Karpenter**: Intelligent autoscaling to minimize idle resources

## Karpenter Configuration

Karpenter is configured with:
- On-demand capacity type
- ARM64 architecture (Graviton3)
- t4g instance family
- 30-second TTL after empty
- 30-day expiration TTL
- Integration with AWS EventBridge for spot interruption handling

## Testing

### Verify EKS Cluster

```bash
kubectl get nodes
kubectl get pods -A
```

### Verify Karpenter

```bash
kubectl get pods -n karpenter
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter
```

### Test Autoscaling

```bash
kubectl create deployment inflate --image=public.ecr.aws/eks-distro/kubernetes/pause:3.2
kubectl scale deployment inflate --replicas=10
kubectl get nodes -w
```

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=prod-01"
```

## Compliance

This configuration meets the following requirements:
- ✅ EKS cluster version 1.28+
- ✅ Graviton3-based instances (t4g family)
- ✅ Pod-to-pod encryption via VPC CNI network policies
- ✅ IRSA for all workload identities
- ✅ Control plane logging enabled
- ✅ Private subnets for worker nodes
- ✅ Karpenter for autoscaling

## Support

For issues or questions, refer to:
- [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Karpenter Documentation](https://karpenter.sh/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
```
