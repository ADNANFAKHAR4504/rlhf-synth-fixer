# IAM role for Secrets Manager rotation
resource "aws_iam_role" "secrets_rotation" {
  name                 = "${local.resource_prefix}-secrets-rotation-${local.suffix}"
  description          = "Role for Lambda function to rotate secrets"
  max_session_duration = var.iam_session_duration_seconds
  assume_role_policy   = data.aws_iam_policy_document.secrets_rotation_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-secrets-rotation-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "secrets-rotation"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "secrets_rotation_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Attach basic Lambda execution policy for VPC access
resource "aws_iam_role_policy_attachment" "secrets_rotation_vpc" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "secrets_rotation" {
  name   = "${local.resource_prefix}-secrets-rotation-policy-${local.suffix}"
  role   = aws_iam_role.secrets_rotation.id
  policy = data.aws_iam_policy_document.secrets_rotation_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "secrets_rotation_policy" {
  # Secrets Manager permissions
  statement {
    sid    = "SecretsManagerAccess"
    effect = "Allow"

    actions = [
      "secretsmanager:DescribeSecret",
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:UpdateSecretVersionStage"
    ]

    resources = [
      aws_secretsmanager_secret.database_credentials.arn
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceVpce"
      values   = [aws_vpc_endpoint.secretsmanager.id]
    }
  }

  # KMS permissions
  statement {
    sid    = "KMSAccess"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]

    resources = [
      aws_kms_key.primary.arn
    ]
  }

  # CloudWatch Logs permissions
  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.resource_prefix}-*"
    ]
  }

  # VPC permissions for Lambda
  statement {
    sid    = "VPCAccess"
    effect = "Allow"

    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]

    resources = ["*"]
  }
}

# IAM role with MFA enforcement
resource "aws_iam_role" "admin_with_mfa" {
  name                 = "${local.resource_prefix}-admin-mfa-${local.suffix}"
  description          = "Admin role requiring MFA"
  max_session_duration = var.iam_session_duration_seconds
  assume_role_policy   = data.aws_iam_policy_document.admin_mfa_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-admin-mfa-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "admin-access"
    RequiresMFA        = "true"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "admin_mfa_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"]
    }
  }
}

resource "aws_iam_role_policy" "admin_with_mfa" {
  name   = "${local.resource_prefix}-admin-policy-${local.suffix}"
  role   = aws_iam_role.admin_with_mfa.id
  policy = data.aws_iam_policy_document.admin_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "admin_policy" {
  # Scoped admin permissions - no Resource: '*'
  statement {
    sid    = "EC2Management"
    effect = "Allow"

    actions = [
      "ec2:Describe*",
      "ec2:Start*",
      "ec2:Stop*",
      "ec2:Reboot*"
    ]

    resources = [
      "arn:aws:ec2:${var.primary_region}:${data.aws_caller_identity.current.account_id}:instance/*"
    ]
  }

  statement {
    sid    = "S3Management"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${local.resource_prefix}-*",
      "arn:aws:s3:::${local.resource_prefix}-*/*"
    ]
  }

  statement {
    sid    = "IAMReadOnly"
    effect = "Allow"

    actions = [
      "iam:Get*",
      "iam:List*"
    ]

    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"
    ]
  }
}

# AWS Config IAM role
resource "aws_iam_role" "config_role" {
  name               = "${local.resource_prefix}-config-${local.suffix}"
  description        = "Role for AWS Config"
  assume_role_policy = data.aws_iam_policy_document.config_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-config-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "compliance-monitoring"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name   = "${local.resource_prefix}-config-s3-policy-${local.suffix}"
  role   = aws_iam_role.config_role.id
  policy = data.aws_iam_policy_document.config_s3_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_s3_policy" {
  statement {
    sid    = "ConfigS3Access"
    effect = "Allow"

    actions = [
      "s3:GetBucketVersioning",
      "s3:PutObject",
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.config_bucket.arn,
      "${aws_s3_bucket.config_bucket.arn}/*"
    ]
  }
}
