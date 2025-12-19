# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================
# NETWORKING FOUNDATION
# ============================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-security-baseline-${var.environmentSuffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-security-baseline-${var.environmentSuffix}"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = ["10.0.101.0/24", "10.0.102.0/24"][count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${count.index + 1}-${var.environmentSuffix}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = ["10.0.1.0/24", "10.0.2.0/24"][count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-private-${count.index + 1}-${var.environmentSuffix}"
    Type = "Private"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.environmentSuffix}"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "rt-private-${count.index + 1}-${var.environmentSuffix}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = {
    Name = "vpce-s3-${var.environmentSuffix}"
  }
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-kms-${var.environmentSuffix}"
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "sg-vpc-endpoints-${var.environmentSuffix}"
  }
}

# ============================================
# KMS ENCRYPTION
# ============================================

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
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
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Deny deletion by non-admin users"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "kms:ScheduleKeyDeletion",
          "kms:Delete*"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalArn" = aws_iam_role.admin.arn
          }
        }
      }
    ]
  })

  tags = {
    Name = "kms-new-s3-${var.environmentSuffix}"
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-encryption-${var.environmentSuffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 30
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "kms-cloudwatch-${var.environmentSuffix}"
  }
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-logs-${var.environmentSuffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# ============================================
# IAM ROLES AND POLICIES
# ============================================

# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
  hard_expiry                    = false
}

# Developer Role
resource "aws_iam_role" "developer" {
  name = "role-developer-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "role-developer-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "developer" {
  name = "policy-developer-${var.environmentSuffix}"
  role = aws_iam_role.developer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBasicEC2Actions"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Environment" = var.environmentSuffix
          }
        }
      },
      {
        Sid    = "AllowS3ReadWrite"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.deployment_artifacts.arn,
          "${aws_s3_bucket.deployment_artifacts.arn}/*"
        ]
      },
      {
        Sid    = "DenyHighRiskActions"
        Effect = "Deny"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutUserPolicy",
          "iam:PutRolePolicy",
          "kms:ScheduleKeyDeletion",
          "kms:Delete*",
          "s3:DeleteBucket",
          "s3:PutBucketPolicy",
          "s3:PutBucketPublicAccessBlock"
        ]
        Resource = "*"
      }
    ]
  })
}

# Administrator Role
resource "aws_iam_role" "admin" {
  name = "role-administrator-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          IpAddress = {
            "aws:SourceIp" = ["10.0.0.0/8", "172.16.0.0/12"]
          }
        }
      }
    ]
  })

  tags = {
    Name = "role-administrator-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy_attachment" "admin" {
  role       = aws_iam_role.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role_policy" "admin_restrictions" {
  name = "policy-admin-restrictions-${var.environmentSuffix}"
  role = aws_iam_role.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyRootAccountActions"
        Effect = "Deny"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
    ]
  })
}

# CI/CD Pipeline Role
resource "aws_iam_role" "cicd" {
  name = "role-cicd-pipeline-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "role-cicd-pipeline-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "cicd" {
  name = "policy-cicd-${var.environmentSuffix}"
  role = aws_iam_role.cicd.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ArtifactAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.deployment_artifacts.arn,
          "${aws_s3_bucket.deployment_artifacts.arn}/*"
        ]
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Sid    = "AllowECRAccess"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyHighRiskActions"
        Effect = "Deny"
        Action = [
          "iam:*",
          "kms:Delete*",
          "kms:ScheduleKeyDeletion",
          "s3:DeleteBucket",
          "s3:PutBucketPublicAccessBlock"
        ]
        Resource = "*"
      }
    ]
  })
}

# Cross-Account Security Auditing Role
resource "aws_iam_role" "security_audit" {
  name = "role-security-audit-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.trusted_account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.external_id
          }
        }
      }
    ]
  })

  tags = {
    Name = "role-security-audit-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy_attachment" "security_audit_readonly" {
  role       = aws_iam_role.security_audit.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

resource "aws_iam_role_policy" "security_audit_additional" {
  name = "policy-security-audit-additional-${var.environmentSuffix}"
  role = aws_iam_role.security_audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketPolicy",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetEncryptionConfiguration",
          "s3:ListAllMyBuckets",
          "kms:DescribeKey",
          "kms:ListKeys",
          "kms:ListAliases",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:LookupEvents",
          "config:DescribeConfigRules",
          "config:DescribeComplianceByConfigRule",
          "guardduty:GetDetector",
          "guardduty:ListDetectors",
          "guardduty:ListFindings"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================
# S3 BUCKETS
# ============================================

# Security Logs Bucket
resource "aws_s3_bucket" "security_logs" {
  bucket = "security-logs-${data.aws_caller_identity.current.account_id}-${var.environmentSuffix}"

  tags = {
    Name       = "security-logs-${var.environmentSuffix}"
    Purpose    = "Security and Compliance Logs"
    Encryption = "KMS"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "security_logs" {
  bucket = aws_s3_bucket.security_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "security_logs" {
  bucket = aws_s3_bucket.security_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "security_logs" {
  bucket = aws_s3_bucket.security_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "security_logs" {
  bucket = aws_s3_bucket.security_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.security_logs.arn,
          "${aws_s3_bucket.security_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.security_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowS3BucketLogging"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.security_logs.arn}/*"
        Condition = {
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.deployment_artifacts.arn
          }
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Deployment Artifacts Bucket
resource "aws_s3_bucket" "deployment_artifacts" {
  bucket = "deployment-artifacts-${data.aws_caller_identity.current.account_id}-${var.environmentSuffix}"

  tags = {
    Name       = "deployment-artifacts-${var.environmentSuffix}"
    Purpose    = "CI/CD Deployment Artifacts"
    Encryption = "KMS"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployment_artifacts" {
  bucket = aws_s3_bucket.deployment_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "deployment_artifacts" {
  bucket = aws_s3_bucket.deployment_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "deployment_artifacts" {
  bucket = aws_s3_bucket.deployment_artifacts.id

  target_bucket = aws_s3_bucket.security_logs.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_public_access_block" "deployment_artifacts" {
  bucket = aws_s3_bucket.deployment_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "deployment_artifacts" {
  bucket = aws_s3_bucket.deployment_artifacts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.deployment_artifacts.arn,
          "${aws_s3_bucket.deployment_artifacts.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.deployment_artifacts.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# ============================================
# CLOUDWATCH MONITORING
# ============================================

# CloudWatch Log Group for Security Audit Trail
resource "aws_cloudwatch_log_group" "security_audit" {
  name              = "/aws/security/audit-trail-${var.environmentSuffix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name    = "security-audit-logs-${var.environmentSuffix}"
    Purpose = "Security Audit Trail"
  }
}

# CloudWatch Log Group for Lambda Functions
resource "aws_cloudwatch_log_group" "lambda_remediation" {
  name              = "/aws/lambda/security-remediation-${var.environmentSuffix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name    = "lambda-remediation-logs-${var.environmentSuffix}"
    Purpose = "Lambda Remediation Logs"
  }
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "security-alerts-${var.environmentSuffix}"
  kms_master_key_id = aws_kms_key.s3.id

  tags = {
    Name = "security-alerts-${var.environmentSuffix}"
  }
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "root-account-usage-${var.environmentSuffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "root-account-usage-alarm-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "unauthorized-api-calls-${var.environmentSuffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "unauthorized-api-calls-alarm-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "no_mfa_console_signin" {
  alarm_name          = "no-mfa-console-signin-${var.environmentSuffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "NoMFAConsoleSignin"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors console sign-in without MFA"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "no-mfa-console-signin-alarm-${var.environmentSuffix}"
  }
}

# ============================================
# LAMBDA FUNCTIONS FOR AUTO-REMEDIATION
# ============================================

# Lambda Execution Role
resource "aws_iam_role" "lambda_remediation" {
  name = "role-lambda-remediation-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "role-lambda-remediation-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "lambda_remediation" {
  name = "policy-lambda-remediation-${var.environmentSuffix}"
  role = aws_iam_role.lambda_remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_remediation.arn}:*"
      },
      {
        Sid    = "AllowS3Remediation"
        Effect = "Allow"
        Action = [
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketPolicy",
          "s3:DeleteBucketPolicy"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Sid    = "AllowSecurityGroupRemediation"
        Effect = "Allow"
        Action = [
          "ec2:DescribeSecurityGroups",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowSNSNotification"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# Package Lambda function code
data "archive_file" "lambda_remediation" {
  type        = "zip"
  source_file = "lambda_function.py"
  output_path = "lambda_function.zip"
}

# Lambda Function
resource "aws_lambda_function" "remediation" {
  filename         = data.archive_file.lambda_remediation.output_path
  function_name    = "security-remediation-${var.environmentSuffix}"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_remediation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
      ENVIRONMENT   = var.environmentSuffix
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_remediation
  ]

  tags = {
    Name = "lambda-security-remediation-${var.environmentSuffix}"
  }
}

# EventBridge Rules
resource "aws_cloudwatch_event_rule" "s3_public_access" {
  name        = "s3-public-access-detection-${var.environmentSuffix}"
  description = "Trigger when S3 bucket becomes public"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutBucketAcl",
        "PutBucketPolicy",
        "PutBucketPublicAccessBlock",
        "DeleteBucketPublicAccessBlock"
      ]
    }
  })

  tags = {
    Name = "rule-s3-public-access-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_event_target" "s3_lambda" {
  rule      = aws_cloudwatch_event_rule.s3_public_access.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge_s3" {
  statement_id  = "AllowExecutionFromEventBridge-S3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_public_access.arn
}

resource "aws_cloudwatch_event_rule" "security_group_changes" {
  name        = "security-group-changes-${var.environmentSuffix}"
  description = "Trigger when security group rules are modified"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName = [
        "AuthorizeSecurityGroupIngress",
        "AuthorizeSecurityGroupEgress",
        "RevokeSecurityGroupIngress",
        "RevokeSecurityGroupEgress"
      ]
    }
  })

  tags = {
    Name = "rule-security-group-changes-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_event_target" "sg_lambda" {
  rule      = aws_cloudwatch_event_rule.security_group_changes.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge_sg" {
  statement_id  = "AllowExecutionFromEventBridge-SG"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_group_changes.arn
}

# ============================================
# OUTPUTS
# ============================================

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "The IDs of the private subnets"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "The IDs of the public subnets"
}

output "kms_key_s3_arn" {
  value       = aws_kms_key.s3.arn
  description = "ARN of the KMS key for S3 encryption"
  sensitive   = true
}

output "kms_key_cloudwatch_arn" {
  value       = aws_kms_key.cloudwatch.arn
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  sensitive   = true
}

output "deployment_artifacts_bucket" {
  value       = aws_s3_bucket.deployment_artifacts.id
  description = "Name of the deployment artifacts bucket"
}

output "security_logs_bucket" {
  value       = aws_s3_bucket.security_logs.id
  description = "Name of the security logs bucket"
}

output "developer_role_arn" {
  value       = aws_iam_role.developer.arn
  description = "ARN of the developer IAM role"
}

output "admin_role_arn" {
  value       = aws_iam_role.admin.arn
  description = "ARN of the administrator IAM role"
}

output "cicd_role_arn" {
  value       = aws_iam_role.cicd.arn
  description = "ARN of the CI/CD pipeline IAM role"
}

output "security_audit_role_arn" {
  value       = aws_iam_role.security_audit.arn
  description = "ARN of the security audit IAM role"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.security_alerts.arn
  description = "ARN of the SNS topic for security alerts"
}

output "lambda_function_name" {
  value       = aws_lambda_function.remediation.function_name
  description = "Name of the remediation Lambda function"
}