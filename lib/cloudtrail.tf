########################
# CloudTrail (API Auditing)
########################

data "aws_caller_identity" "current" {}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  provider          = aws.primary
  name              = "/aws/cloudtrail/${var.name_prefix}-${var.environment}"
  retention_in_days = 90
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_iam_role" "cloudtrail_logs" {
  name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-role"
  }
}

resource "aws_iam_role_policy" "cloudtrail_logs" {
  name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.this.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.this.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.this.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key_policy" "cloudtrail_s3" {
  provider = aws.primary
  key_id   = aws_kms_key.s3.id
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
        Sid    = "Allow CloudTrail to use KMS key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.s3.arn
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  provider                      = aws.primary
  name                          = "${var.name_prefix}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.this.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_logs.arn
  kms_key_id                    = aws_kms_key.s3.arn
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-cloudtrail"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
  depends_on = [
    aws_iam_role_policy.cloudtrail_logs,
    aws_cloudwatch_log_group.cloudtrail,
    aws_s3_bucket_policy.cloudtrail,
    aws_s3_bucket_server_side_encryption_configuration.this
  ]
  }

output "cloudtrail_arn" {
  value = aws_cloudtrail.main.arn
}
