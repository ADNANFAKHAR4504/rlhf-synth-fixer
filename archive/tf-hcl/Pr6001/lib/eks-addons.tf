resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  addon_version               = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-vpc-cni-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  addon_version               = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-kube-proxy-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  addon_version               = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-coredns-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "aws-ebs-csi-driver"
  addon_version               = "v1.25.0-eksbuild.1"
  service_account_role_arn    = var.enable_ebs_csi_driver ? aws_iam_role.ebs_csi_driver[0].arn : null
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-ebs-csi-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
    aws_iam_role.ebs_csi_driver
  ]
}
