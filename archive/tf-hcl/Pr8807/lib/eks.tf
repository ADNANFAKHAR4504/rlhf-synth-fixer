# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private_control_plane[*].id, aws_subnet.private_system[*].id)
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
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

  tags = {
    Name = "eks-cluster-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]
}

# OIDC Provider removed due to LocalStack limitation
# LocalStack does not properly emulate the TLS certificate endpoint for EKS OIDC issuers
# This causes data.tls_certificate.eks to fail during terraform apply
# For production AWS deployments, OIDC provider should be included for IRSA (IAM Roles for Service Accounts)
