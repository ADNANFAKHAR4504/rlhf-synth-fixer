# IAM configuration for the EKS cluster, managed node groups, and IRSA integrations

locals {
  use_existing_db_secret = var.existing_database_secret_arn != ""
}

resource "aws_secretsmanager_secret" "database" {
  count = local.use_existing_db_secret ? 0 : 1

  name                    = local.database_secret_name
  recovery_window_in_days = 0
  description             = "Credentials for the payments application datastore"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database" {
  count = local.use_existing_db_secret ? 0 : 1

  secret_id     = aws_secretsmanager_secret.database[0].id
  secret_string = var.database_secret_string
}

locals {
  database_secret_arn = local.use_existing_db_secret ? var.existing_database_secret_arn : aws_secretsmanager_secret.database[0].arn
}

data "aws_iam_policy_document" "eks_cluster_trust" {
  statement {
    sid     = "EKSTrust"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  name               = local.eks_cluster_role_name
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_trust.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

data "aws_iam_policy_document" "eks_node_trust" {
  statement {
    sid     = "EC2Trust"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "frontend_nodes" {
  name               = "${local.cluster_name}-frontend-role${local.resource_suffix}"
  assume_role_policy = data.aws_iam_policy_document.eks_node_trust.json
  description        = "Managed node group role for frontend workloads"

  tags = local.common_tags
}

resource "aws_iam_role" "backend_nodes" {
  name               = "${local.cluster_name}-backend-role${local.resource_suffix}"
  assume_role_policy = data.aws_iam_policy_document.eks_node_trust.json
  description        = "Managed node group role for backend workloads"

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "frontend_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.backend_nodes.name
}

resource "aws_iam_role_policy_attachment" "frontend_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.backend_nodes.name
}

resource "aws_iam_role_policy_attachment" "frontend_ecr_ro" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_ecr_ro" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.backend_nodes.name
}

data "aws_iam_policy_document" "eks_node_ecr_access" {
  statement {
    sid       = "ECRAuthorization"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRRead"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:DescribeRepositories",
      "ecr:ListImages"
    ]
    resources = [
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.cluster_name}-frontend",
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.cluster_name}-backend"
    ]
  }
}

resource "aws_iam_policy" "eks_node_ecr_access" {
  name        = "${local.cluster_name}-node-ecr${local.resource_suffix}"
  description = "ECR access for EKS managed node groups"
  policy      = data.aws_iam_policy_document.eks_node_ecr_access.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "frontend_node_ecr_access" {
  policy_arn = aws_iam_policy.eks_node_ecr_access.arn
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_node_ecr_access" {
  policy_arn = aws_iam_policy.eks_node_ecr_access.arn
  role       = aws_iam_role.backend_nodes.name
}

data "aws_iam_policy_document" "app_irsa_trust" {
  statement {
    sid     = "IRSA"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${local.namespace_name}:payments-app-sa-${var.environment_suffix}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
  }
}

resource "aws_iam_role" "app_irsa" {
  name               = "${local.cluster_name}-app-irsa${local.resource_suffix}"
  assume_role_policy = data.aws_iam_policy_document.app_irsa_trust.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "app_irsa" {
  statement {
    sid    = "ReadDatabaseSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [local.database_secret_arn]
  }
}

resource "aws_iam_policy" "app_irsa_policy" {
  name        = "${local.cluster_name}-app-irsa${local.resource_suffix}"
  description = "Permissions for application pods accessing shared services"
  policy      = data.aws_iam_policy_document.app_irsa.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "app_irsa_policy" {
  policy_arn = aws_iam_policy.app_irsa_policy.arn
  role       = aws_iam_role.app_irsa.name
}

data "aws_iam_policy_document" "cluster_autoscaler_trust" {
  statement {
    sid     = "ClusterAutoscalerIRSA"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:cluster-autoscaler-${var.environment_suffix}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
  }
}

resource "aws_iam_role" "cluster_autoscaler" {
  name               = "${local.cluster_name}-cluster-autoscaler${local.resource_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cluster_autoscaler_trust.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "cluster_autoscaler" {
  statement {
    sid    = "DescribeScaling"
    effect = "Allow"
    actions = [
      "autoscaling:DescribeAutoScalingGroups",
      "autoscaling:DescribeAutoScalingInstances",
      "autoscaling:DescribeLaunchConfigurations",
      "autoscaling:DescribeScalingActivities",
      "autoscaling:DescribeTags",
      "ec2:DescribeImages",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeLaunchTemplateVersions",
      "eks:DescribeNodegroup"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ScaleNodeGroups"
    effect = "Allow"
    actions = [
      "autoscaling:SetDesiredCapacity",
      "autoscaling:TerminateInstanceInAutoScalingGroup"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/enabled"
      values   = ["true"]
    }
    condition {
      test     = "StringEquals"
      variable = "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${local.cluster_name}"
      values   = ["owned"]
    }
  }
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "${local.cluster_name}-cluster-autoscaler${local.resource_suffix}"
  description = "Permissions for the Kubernetes cluster-autoscaler"
  policy      = data.aws_iam_policy_document.cluster_autoscaler.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}
