# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.resource_prefix}-${var.environment_suffix} infrastructure encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.id}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.resource_prefix}-${var.environment_suffix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "${var.resource_prefix}-${var.environment_suffix}-web-sg"
  description = "Security group for web servers with restricted access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-web-sg"
  }
}

resource "aws_security_group" "ssh" {
  name        = "${var.resource_prefix}-${var.environment_suffix}-ssh-sg"
  description = "Security group for SSH access with IP restrictions"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-ssh-sg"
  }
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-guardduty"
  }
}

# Security Hub
resource "aws_securityhub_account" "main" {
  enable_default_standards = true
}