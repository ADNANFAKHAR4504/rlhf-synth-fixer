# EKS Module - EKS cluster with OIDC provider

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eks-${var.environment_suffix}"
  role_arn = var.cluster_role_arn
  version  = var.eks_version

  vpc_config {
    subnet_ids              = concat(var.private_subnet_ids, var.public_subnet_ids)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = merge(var.tags, {
    Name = "eks-${var.environment_suffix}"
  })
}

# Data source to get EKS cluster authentication token
data "aws_eks_cluster_auth" "main" {
  name = aws_eks_cluster.main.name
}

# Extract OIDC provider URL
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Create OIDC provider for IRSA
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = merge(var.tags, {
    Name = "eks-oidc-${var.environment_suffix}"
  })
}

# Security Group for EKS cluster additional rules
resource "aws_security_group" "cluster_additional" {
  name_prefix = "eks-cluster-additional-${var.environment_suffix}-"
  description = "Additional security group for EKS cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow nodes to communicate with the cluster API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "eks-cluster-additional-sg-${var.environment_suffix}"
  })
}

# EKS Add-ons
resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  addon_version               = var.vpc_cni_version
  resolve_conflicts_on_update = "PRESERVE"

  tags = merge(var.tags, {
    Name = "vpc-cni-${var.environment_suffix}"
  })

  depends_on = [aws_eks_cluster.main]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  addon_version               = var.kube_proxy_version
  resolve_conflicts_on_update = "PRESERVE"

  tags = merge(var.tags, {
    Name = "kube-proxy-${var.environment_suffix}"
  })

  depends_on = [aws_eks_cluster.main]
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  addon_version               = var.coredns_version
  resolve_conflicts_on_update = "PRESERVE"

  tags = merge(var.tags, {
    Name = "coredns-${var.environment_suffix}"
  })

  depends_on = [aws_eks_cluster.main]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "aws-ebs-csi-driver"
  addon_version = var.ebs_csi_driver_version
  # Only set service account role if provided (not empty string)
  service_account_role_arn    = var.ebs_csi_driver_role_arn != "" ? var.ebs_csi_driver_role_arn : null
  resolve_conflicts_on_update = "PRESERVE"

  tags = merge(var.tags, {
    Name = "ebs-csi-driver-${var.environment_suffix}"
  })

  depends_on = [aws_eks_cluster.main]
}
