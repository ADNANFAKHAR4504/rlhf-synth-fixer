# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.resource_prefix}-vpc-endpoints-${local.suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = local.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to AWS services"
  }

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-endpoints-sg-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_vpc" "selected" {
  id = local.vpc_id
}

# VPC endpoint for Secrets Manager
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.primary_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = data.aws_iam_policy_document.secretsmanager_endpoint_policy.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-secretsmanager-endpoint-${local.suffix}"
    DataClassification = "Confidential"
    Service            = "SecretsManager"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "secretsmanager_endpoint_policy" {
  statement {
    sid    = "AllowSecretsManagerAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = ["*"]
  }
}

# VPC endpoint for KMS
resource "aws_vpc_endpoint" "kms" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.primary_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = data.aws_iam_policy_document.kms_endpoint_policy.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-kms-endpoint-${local.suffix}"
    DataClassification = "Confidential"
    Service            = "KMS"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "kms_endpoint_policy" {
  statement {
    sid    = "AllowKMSAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }
}

# VPC endpoint for EC2
resource "aws_vpc_endpoint" "ec2" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.primary_region}.ec2"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-ec2-endpoint-${local.suffix}"
    DataClassification = "Confidential"
    Service            = "EC2"
  })

  lifecycle {
    prevent_destroy = false
  }
}
