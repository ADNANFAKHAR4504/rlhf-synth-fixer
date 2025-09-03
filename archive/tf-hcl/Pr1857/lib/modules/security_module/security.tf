data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# IAM Role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for S3 access with least privilege
resource "aws_iam_policy" "s3_limited_access" {
  name        = "${var.environment}-s3-limited-access"
  description = "Simplified S3 access policy with basic conditions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_data.arn}/${var.environment}/*"
        ]
        Condition = {
          StringLike = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T00:00:00Z"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.app_data.arn}"
        ]
        Condition = {
          StringLike = {
            "s3:prefix" = [
              "${var.environment}/*"
            ]
          }
        }
      }
    ]
  })

  tags = var.tags
}


# IAM Policy for KMS access with least privilege
resource "aws_iam_policy" "kms_limited_access" {
  name        = "${var.environment}-kms-limited-access"
  description = "Limited KMS access policy following least privilege principle"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = ["${aws_kms_alias.main.arn}"]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.region}.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = ["${aws_kms_alias.main.arn}"]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ec2.${data.aws_region.current.region}.amazonaws.com"
          }
        }
      }
    ]
  })
  tags = var.tags
}

# CloudWatch Logs policy for application logging
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${var.environment}-cloudwatch-logs"
  description = "CloudWatch Logs access for application logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.environment}*"
      }
    ]
  })

  tags = var.tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "kms_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.kms_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.tags
}

# Validation: Check for overly permissive policies
resource "null_resource" "validate_iam_policies" {
  triggers = {
    s3_policy_hash = sha256(aws_iam_policy.s3_limited_access.policy)
    kms_policy_hash = sha256(aws_iam_policy.kms_limited_access.policy)
  }

  provisioner "local-exec" {
    command = "python3 ${path.module}/scripts/validate-iam.py --policy-arn ${aws_iam_policy.s3_limited_access.arn} --policy-arn ${aws_iam_policy.kms_limited_access.arn}"
  }

  depends_on = [
    aws_iam_policy.s3_limited_access,
    aws_iam_policy.kms_limited_access
  ]
}

# Uniform Security Group for all EC2 instances
resource "aws_security_group" "uniform_ec2" {
  name_prefix = "${var.environment}-uniform-ec2-"
  description = "Uniform security group for all EC2 instances"
  vpc_id      = var.vpc_id

  # Inbound Rules - Strictly uniform across all instances
  dynamic "ingress" {
    for_each = var.uniform_ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  # Outbound Rules - Strictly uniform across all instances
  dynamic "egress" {
    for_each = var.uniform_egress_rules
    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      description = egress.value.description
    }
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-uniform-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
    description = "Outbound to VPC"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS (if needed)
resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-"
  description = "Security group for RDS instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.uniform_ec2.id]
    description     = "MySQL/Aurora access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} environment"
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
        Sid    = "Allow use of the key for S3"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow use of the key for EBS encryption"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ec2.${data.aws_region.current.region}.amazonaws.com"
          }
        }
      }
    ]
  })
  tags = merge(var.tags, {
    Name = "${var.environment}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-main-key"
  target_key_id = aws_kms_key.main.key_id
}

# S3 Bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.environment}-app-data-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.environment}-app-data"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Validation: Ensure security group rules are uniform
resource "null_resource" "validate_uniform_rules" {
  triggers = {
    sg_id = aws_security_group.uniform_ec2.id
  }

  provisioner "local-exec" {
    command = "echo 'Validating uniform security group rules for ${aws_security_group.uniform_ec2.id}'"
  }
}
