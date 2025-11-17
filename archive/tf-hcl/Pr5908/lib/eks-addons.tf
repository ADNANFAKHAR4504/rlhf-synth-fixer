# EKS Addon - CoreDNS
resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  addon_version               = "v1.10.1-eksbuild.2"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_fargate_profile.kube_system
  ]
}

# EKS Addon - kube-proxy
resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  addon_version               = "v1.28.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_fargate_profile.kube_system
  ]
}

# EKS Addon - VPC CNI
resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  addon_version               = "v1.14.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }
}
