# Security Audit Role
resource "aws_iam_role" "security_audit" {
  name = "security-audit-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "security-audit-role-${var.environment_suffix}"
  }
}

# Security Audit Policy - Read-only access
resource "aws_iam_policy" "security_audit" {
  name        = "security-audit-policy-${var.environment_suffix}"
  description = "Read-only security audit policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:Get*",
          "s3:List*",
          "ec2:Describe*",
          "rds:Describe*",
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "organizations:Describe*",
          "organizations:List*",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.security_audit.name
  policy_arn = aws_iam_policy.security_audit.arn
}

# Cross-Account Access Role
resource "aws_iam_role" "cross_account_access" {
  name = "cross-account-access-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cross-account-access-${var.environment_suffix}"
  }
}

# AWS Config IAM Role
resource "aws_iam_role" "config" {
  name = "aws-config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "aws-config-role-${var.environment_suffix}"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Additional policy for Config to write to S3
resource "aws_iam_role_policy" "config_s3" {
  name = "config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}
