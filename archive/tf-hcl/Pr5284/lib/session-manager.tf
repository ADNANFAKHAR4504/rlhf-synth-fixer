# session-manager.tf - Systems Manager Session Manager configuration

# S3 bucket for session logs
resource "aws_s3_bucket" "session_logs" {
  bucket = "${local.name_prefix}-session-logs-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch log group for session logs
resource "aws_cloudwatch_log_group" "session_logs" {
  name              = "/aws/ssm/${local.name_prefix}-sessions"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  depends_on = [aws_kms_key.s3]

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Session Manager preferences document
resource "aws_ssm_document" "session_manager_prefs" {
  name            = "${local.name_prefix}-SessionManagerRunShell"
  document_type   = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Session Manager preferences for ${local.name_prefix}"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName                = aws_s3_bucket.session_logs.id
      s3KeyPrefix                 = "session-logs/"
      s3EncryptionEnabled         = true
      cloudWatchLogGroupName      = aws_cloudwatch_log_group.session_logs.name
      cloudWatchEncryptionEnabled = true
      idleSessionTimeout          = "20"
      maxSessionDuration          = "60"
      runAsEnabled                = false
      runAsDefaultUser            = ""
      kmsKeyId                    = aws_kms_key.s3.arn
      shellProfile = {
        linux = "#!/bin/bash\necho 'Session started at:' $(date)\necho 'User:' $(whoami)\necho 'Instance:' $(ec2-metadata --instance-id | cut -d ' ' -f 2)\nexport HISTTIMEFORMAT='%F %T '"
      }
    }
  })

  tags = local.mandatory_tags
}

# IAM role for EC2 instances to use Session Manager
resource "aws_iam_role" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-role"

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

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Attach SSM managed instance core policy
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Additional policy for session logging
resource "aws_iam_policy" "ssm_logging" {
  name        = "${local.name_prefix}-ssm-logging-policy"
  description = "Policy for SSM session logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.session_logs.arn,
          "${aws_s3_bucket.session_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.session_logs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3.arn
      }
    ]
  })
}

# Attach logging policy to instance role
resource "aws_iam_role_policy_attachment" "ssm_logging" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = aws_iam_policy.ssm_logging.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-profile"
  role = aws_iam_role.ssm_instance.name
}

# SSM activation for hybrid/on-premises servers (if needed)
resource "aws_ssm_activation" "hybrid" {
  count              = var.enable_hybrid_activation ? 1 : 0
  name               = "${local.name_prefix}-hybrid-activation"
  iam_role           = aws_iam_role.ssm_instance.id
  registration_limit = var.hybrid_activation_limit
  description        = "Activation for hybrid/on-premises servers"

  tags = local.mandatory_tags
}