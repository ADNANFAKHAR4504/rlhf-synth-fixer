resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/eks-cluster-${var.environment_suffix}/cluster"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "eks-cluster-logs-${var.environment_suffix}"
  }
}

resource "aws_security_group" "eks_cluster" {
  name_prefix = "eks-cluster-sg-${var.environment_suffix}"
  description = "Security group for EKS cluster"
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
}

resource "aws_security_group_rule" "cluster_ingress_node" {
  description              = "Allow worker nodes to communicate with cluster API"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  type                     = "ingress"
}

resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = {
    Name = "eks-cluster-${var.environment_suffix}"
  }
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  addon_version               = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_create = "OVERWRITE"

  configuration_values = jsonencode({
    env = {
      ENABLE_POD_ENI                    = "true"
      ENABLE_PREFIX_DELEGATION          = "true"
      POD_SECURITY_GROUP_ENFORCING_MODE = "standard"
      AWS_VPC_K8S_CNI_EXTERNALSNAT      = "false"
      ENABLE_NETWORK_POLICY             = "true"
    }
  })

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "aws-ebs-csi-driver"
  addon_version               = "v1.25.0-eksbuild.1"
  service_account_role_arn    = aws_iam_role.ebs_csi.arn
  resolve_conflicts_on_create = "OVERWRITE"

  configuration_values = jsonencode({
    controller = {
      extraVolumeTags = {
        Environment = var.environment_suffix
      }
      defaultFsType = "ext4"
    }
    storageClasses = [
      {
        name = "ebs-gp3-encrypted"
        parameters = {
          type      = "gp3"
          encrypted = "true"
        }
        volumeBindingMode = "WaitForFirstConsumer"
      }
    ]
  })

  tags = {
    Name = "ebs-csi-addon-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  addon_version               = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  addon_version               = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }
}