# Core EKS control plane resources

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "kms" {
  statement {
    sid    = "AccountAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logs.${var.aws_region}.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowEKS"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowEC2"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:CreateGrant"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowAutoScaling"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["autoscaling.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:CreateGrant"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowAutoScalingServiceLinkedRole"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:CreateGrant"
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }

}

# KMS key policy - node group roles don't need explicit permissions
# since we use AWS-managed EBS encryption and EKS handles secrets encryption

resource "aws_kms_key" "eks" {
  description             = "KMS key for ${local.cluster_name}${local.resource_suffix} secret encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms.json

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-kms"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "eks" {
  name          = local.kms_alias_name
  target_key_id = aws_kms_key.eks.key_id

  lifecycle {
    create_before_destroy = true
  }
}

# KMS key wait removed since we're not using KMS encryption
# resource "time_sleep" "wait_for_kms" {
#   create_duration = "60s"
#
#   depends_on = [aws_kms_key.eks]
# }

resource "aws_cloudwatch_log_group" "eks" {
  name              = local.log_group_name
  retention_in_days = var.cluster_log_retention_days
  # KMS encryption removed to avoid key state issues
  # kms_key_id        = aws_kms_key.eks.arn

  tags = local.common_tags
}

resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = local.private_subnet_ids
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = false
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  # KMS encryption removed to avoid key state issues
  # encryption_config {
  #   resources = ["secrets"]
  #
  #   provider {
  #     key_arn = aws_kms_key.eks.arn
  #   }
  # }

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller
  ]
}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer

  depends_on = [aws_eks_cluster.main]
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = local.common_tags

  depends_on = [aws_eks_cluster.main]
}
