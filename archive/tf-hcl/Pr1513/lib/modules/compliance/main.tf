

# AWS Config Recorder (only create if not using existing)
resource "aws_config_configuration_recorder" "main" {
  count    = var.use_existing_config_recorder ? 0 : 1
  name     = "${var.project_name}-config-recorder-${var.environment}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

# Local value to reference the recorder name
locals {
  config_recorder_name = var.use_existing_config_recorder ? "prod-sec-config-recorder-main" : aws_config_configuration_recorder.main[0].name
}

# AWS Config Delivery Channel (only create if not using existing)
resource "aws_config_delivery_channel" "main" {
  count          = var.use_existing_config_delivery_channel ? 0 : 1
  name           = "${var.project_name}-config-delivery-${var.environment}"
  s3_bucket_name = var.config_s3_bucket
  sns_topic_arn  = var.sns_topic_arn

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Configuration Recorder Status (only manage if creating new recorder)
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.use_existing_config_recorder ? 0 : 1
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-role-${var.environment}"
    Type = "iam-role"
  })
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_managed_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Additional IAM Policy for AWS Config (for SNS and CloudWatch)
resource "aws_iam_role_policy" "config_additional_policy" {
  name = "${var.project_name}-config-additional-policy-${var.environment}"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# GuardDuty Detector (only create if not using existing)
resource "aws_guardduty_detector" "main" {
  count  = var.use_existing_guardduty_detector ? 0 : 1
  enable = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-guardduty-${var.environment}"
    Type = "security"
  })
}

# GuardDuty Finding Publishing Frequency (only create if not using existing detector)
resource "aws_guardduty_detector_feature" "main" {
  count       = var.use_existing_guardduty_detector ? 0 : 1
  detector_id = aws_guardduty_detector.main[0].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# Security Hub (only create if not using existing)
resource "aws_securityhub_account" "main" {
  count                    = var.use_existing_securityhub ? 0 : 1
  enable_default_standards = true
  auto_enable_controls     = true
}

# Security Hub Standards (only create if not using existing Security Hub)
resource "aws_securityhub_standards_subscription" "cis_aws_foundations" {
  count         = var.use_existing_securityhub ? 0 : 1
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0"
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count         = var.use_existing_securityhub ? 0 : 1
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
}

# CloudWatch Log Group for Config
resource "aws_cloudwatch_log_group" "config" {
  name              = "/aws/config/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-logs-${var.environment}"
    Type = "compliance"
  })
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${var.project_name}-s3-bucket-encryption-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "${var.project_name}-rds-encryption-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "${var.project_name}-iam-password-policy-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "root_account_mfa" {
  name = "${var.project_name}-root-account-mfa-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

# Config Aggregator (for multi-account setup)
resource "aws_config_configuration_aggregator" "organization" {
  count = var.enable_organization_aggregator ? 1 : 0
  name  = "${var.project_name}-config-aggregator-${var.environment}"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator_role[0].arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-aggregator-${var.environment}"
    Type = "compliance"
  })
}

# IAM Role for Config Aggregator
resource "aws_iam_role" "config_aggregator_role" {
  count = var.enable_organization_aggregator ? 1 : 0
  name  = "${var.project_name}-config-aggregator-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-aggregator-role-${var.environment}"
    Type = "iam-role"
  })
}

# IAM Policy for Config Aggregator
resource "aws_iam_role_policy_attachment" "config_aggregator_policy" {
  count      = var.enable_organization_aggregator ? 1 : 0
  role       = aws_iam_role.config_aggregator_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRoleForOrganizations"
}

# Data sources
data "aws_region" "current" {}
