# EBS CSI Driver Addon
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn

  tags = {
    Name = "eks-ebs-csi-driver-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
    aws_iam_role_policy_attachment.ebs_csi_driver,
  ]
}

# VPC CNI Addon
resource "aws_eks_addon" "vpc_cni" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = "v1.15.1-eksbuild.1"

  tags = {
    Name = "eks-vpc-cni-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
}

# CoreDNS Addon
resource "aws_eks_addon" "coredns" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "coredns"
  addon_version = "v1.10.1-eksbuild.6"

  tags = {
    Name = "eks-coredns-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
}

# Kube Proxy Addon
resource "aws_eks_addon" "kube_proxy" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "kube-proxy"
  addon_version = "v1.28.2-eksbuild.2"

  tags = {
    Name = "eks-kube-proxy-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
}
