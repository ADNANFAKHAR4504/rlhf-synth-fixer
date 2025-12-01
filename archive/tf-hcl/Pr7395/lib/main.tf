# main.tf - EKS Cluster Configuration

# Data sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Random suffix to avoid name collisions for resources that may already exist
resource "random_id" "suffix" {
  byte_length = 2
}

# KMS key for EKS node EBS encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.cluster_name}-${var.pr_number}-tester EBS encryption"
  deletion_window_in_days = var.environment_suffix == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name      = "${var.cluster_name}-${var.pr_number}-tester-kms-key"
      PRNumber  = var.pr_number
      ManagedBy = "Terraform"
    }
  )
}

# KMS key alias
resource "aws_kms_alias" "main" {
  name          = "alias/${var.cluster_name}-${var.pr_number}-tester-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.main.key_id
}

# KMS key policy
# CRITICAL: Must include Auto Scaling service principal for EKS node groups
resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  # Policy depends on node role being created first to avoid circular dependency
  depends_on = [aws_iam_role.eks_nodes]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EKS nodes to use the key for EBS"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.eks_nodes.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow EKS nodes to use the key without ViaService condition"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.eks_nodes.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 service to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auto Scaling service to use the key"
        Effect = "Allow"
        Principal = {
          Service = "autoscaling.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:RetireGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow Auto Scaling service to create grants for AWS resources"
        Effect = "Allow"
        Principal = {
          Service = "autoscaling.amazonaws.com"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:RetireGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      },
      {
        Sid    = "Allow Auto Scaling service-linked role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auto Scaling service-linked role to manage grants"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:RetireGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      },
      {
        Sid    = "Allow EBS service to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ebs.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-vpc-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-igw-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.private_subnet_cidrs)
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-nat-eip-${count.index + 1}-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets (for NAT Gateways)
resource "aws_subnet" "public" {
  count = length(var.private_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name                                        = "${var.cluster_name}-public-subnet-${count.index + 1}-${var.pr_number}-tester"
      PRNumber                                    = var.pr_number
      "kubernetes.io/role/elb"                    = "1"
      "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    }
  )
}

# Private Subnets (for EKS nodes)
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name                                        = "${var.cluster_name}-private-subnet-${count.index + 1}-${var.pr_number}-tester"
      PRNumber                                    = var.pr_number
      "kubernetes.io/role/internal-elb"           = "1"
      "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.private_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-nat-${count.index + 1}-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-public-rt-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-private-rt-${count.index + 1}-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role-${var.pr_number}-tester-${random_id.suffix.hex}"

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
    var.common_tags,
    {
      Name     = "${var.cluster_name}-cluster-role-${var.pr_number}-tester-${random_id.suffix.hex}"
      PRNumber = var.pr_number
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

# Security Group for EKS Cluster
resource "aws_security_group" "eks_cluster" {
  name_prefix = "${var.cluster_name}-cluster-${var.pr_number}-tester-"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-cluster-sg-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Security Group for Node Groups
resource "aws_security_group" "eks_nodes" {
  name_prefix = "${var.cluster_name}-nodes-${var.pr_number}-tester-"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-nodes-sg-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Allow node-to-node communication
resource "aws_security_group_rule" "nodes_internal" {
  description              = "Allow nodes to communicate with each other"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_nodes.id
  type                     = "ingress"
}

# Allow control plane to communicate with nodes
resource "aws_security_group_rule" "cluster_to_nodes" {
  description              = "Allow control plane to communicate with nodes"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
  type                     = "ingress"
}

# Allow nodes to communicate with control plane
resource "aws_security_group_rule" "nodes_to_cluster" {
  description              = "Allow nodes to communicate with control plane"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  type                     = "ingress"
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${var.cluster_name}-${var.pr_number}-tester"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  enabled_cluster_log_types = var.cluster_log_types

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_security_group_rule.nodes_to_cluster
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes = [
      version
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-${var.pr_number}-tester"
      PRNumber = var.pr_number
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
    var.common_tags,
    {
      Name     = "${var.cluster_name}-oidc-provider-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# IAM Role for Node Groups
resource "aws_iam_role" "eks_nodes" {
  name = "${var.cluster_name}-node-role-${var.pr_number}-tester-${random_id.suffix.hex}"

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
    var.common_tags,
    {
      Name     = "${var.cluster_name}-node-role-${var.pr_number}-tester-${random_id.suffix.hex}"
      PRNumber = var.pr_number
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

# Additional inline policy for EC2 operations required during node group creation
# This is needed for launch template operations and instance/volume descriptions
resource "aws_iam_role_policy" "eks_nodes_ec2" {
  name = "${var.cluster_name}-node-ec2-policy-${var.pr_number}-tester"
  role = aws_iam_role.eks_nodes.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeInstanceAttribute",
          "ec2:DescribeVolumes",
          "ec2:DescribeVolumeAttribute",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:DescribeImages",
          "ec2:DescribeSnapshots",
          "ec2:DescribeTags",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets"
        ]
        Resource = "*"
      }
    ]
  })

}

# Critical Node Group (Bottlerocket)
resource "aws_eks_node_group" "critical" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-critical-${var.pr_number}-tester"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id

  ami_type       = "BOTTLEROCKET_x86_64"
  instance_types = ["m5.large"]

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 10
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    nodegroup-type = "critical"
    PRNumber       = var.pr_number
  }

  taint {
    key    = "dedicated"
    value  = "critical"
    effect = "NO_SCHEDULE"
  }

  # EBS encryption with KMS
  launch_template {
    id      = aws_launch_template.critical.id
    version = "$Latest"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy.eks_nodes_ec2,
    aws_launch_template.critical,
    aws_kms_key_policy.main
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes = [
      scaling_config[0].desired_size
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-critical-nodegroup-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Launch template for critical node group with encrypted EBS
resource "aws_launch_template" "critical" {
  name_prefix = "${var.cluster_name}-critical-${var.pr_number}-tester-"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.id
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  depends_on = [
    aws_kms_key.main,
    aws_kms_key_policy.main
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-critical-lt-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# General Node Group (Bottlerocket, Mixed Instances)
resource "aws_eks_node_group" "general" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-general-${var.pr_number}-tester"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id

  ami_type       = "BOTTLEROCKET_x86_64"
  instance_types = ["m5.large", "m5.xlarge"]
  capacity_type  = "ON_DEMAND"

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 20
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    nodegroup-type = "general"
    PRNumber       = var.pr_number
  }

  # EBS encryption with KMS
  launch_template {
    id      = aws_launch_template.general.id
    version = "$Latest"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy.eks_nodes_ec2,
    aws_launch_template.general,
    aws_kms_key_policy.main
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes = [
      scaling_config[0].desired_size
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-general-nodegroup-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# Launch template for general node group with encrypted EBS
resource "aws_launch_template" "general" {
  name_prefix = "${var.cluster_name}-general-${var.pr_number}-tester-"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.id
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  depends_on = [
    aws_kms_key.main,
    aws_kms_key_policy.main
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-general-lt-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# VPC CNI Add-on
resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"

  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true"
      WARM_PREFIX_TARGET       = "1"
    }
  })

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      PRNumber = var.pr_number
    }
  )
}

# CoreDNS Add-on
resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  resolve_conflicts_on_create = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      PRNumber = var.pr_number
    }
  )
}

# Kube-proxy Add-on
resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_create = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      PRNumber = var.pr_number
    }
  )
}

# IAM Role for Cluster Autoscaler
resource "aws_iam_role" "cluster_autoscaler" {
  name = "${var.cluster_name}-cluster-autoscaler-${var.pr_number}-tester"

  lifecycle {
    create_before_destroy = true
  }

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

  depends_on = [
    aws_iam_openid_connect_provider.eks
  ]

  tags = merge(
    var.common_tags,
    {
      Name     = "${var.cluster_name}-cluster-autoscaler-role-${var.pr_number}-tester"
      PRNumber = var.pr_number
    }
  )
}

# IAM Policy for Cluster Autoscaler
resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "${var.cluster_name}-cluster-autoscaler-policy-${var.pr_number}-tester-${random_id.suffix.hex}"
  description = "Policy for EKS Cluster Autoscaler"

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

  tags = merge(
    var.common_tags,
    {
      PRNumber = var.pr_number
    }
  )
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}

# Kubernetes Namespace for hello-world application
resource "kubernetes_namespace" "hello_world" {
  metadata {
    name = "hello-world"
    labels = {
      PRNumber  = var.pr_number
      ManagedBy = "Terraform"
    }
  }

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]
}

# Kubernetes Deployment for hello-world application
resource "kubernetes_deployment" "hello_world" {
  metadata {
    name      = "hello-world"
    namespace = kubernetes_namespace.hello_world.metadata[0].name
    labels = {
      app       = "hello-world"
      PRNumber  = var.pr_number
      ManagedBy = "Terraform"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "hello-world"
      }
    }

    template {
      metadata {
        labels = {
          app       = "hello-world"
          PRNumber  = var.pr_number
          ManagedBy = "Terraform"
        }
      }

      spec {
        container {
          name  = "hello-world"
          image = "ghcr.io/infrastructure-as-code/hello-world"

          port {
            container_port = 8080
            name           = "http"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_namespace.hello_world,
    aws_eks_addon.vpc_cni,
    aws_eks_addon.coredns,
    aws_eks_addon.kube_proxy
  ]
}

# Kubernetes Service for hello-world application
resource "kubernetes_service" "hello_world" {
  metadata {
    name      = "hello-world"
    namespace = kubernetes_namespace.hello_world.metadata[0].name
    labels = {
      app       = "hello-world"
      PRNumber  = var.pr_number
      ManagedBy = "Terraform"
    }
  }

  spec {
    type = "ClusterIP"

    selector = {
      app = "hello-world"
    }

    port {
      name        = "http"
      port        = 80
      target_port = 8080
      protocol    = "TCP"
    }
  }

  depends_on = [
    kubernetes_deployment.hello_world
  ]
}
