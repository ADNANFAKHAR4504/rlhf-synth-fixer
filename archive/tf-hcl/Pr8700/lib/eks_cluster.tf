# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environmentSuffix}"
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name = "eks-cluster-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.cluster_vpc_resource_controller,
  ]
}

# Fargate Profile for kube-system namespace
resource "aws_eks_fargate_profile" "kube_system" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "fargate-profile-kube-system-${var.environmentSuffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "kube-system"
  }

  tags = {
    Name = "fargate-profile-kube-system-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}

# Fargate Profile for application namespace
resource "aws_eks_fargate_profile" "application" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "fargate-profile-app-${var.environmentSuffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = var.app_namespace
  }

  selector {
    namespace = "default"
  }

  tags = {
    Name = "fargate-profile-app-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}
