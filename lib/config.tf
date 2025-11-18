# S3 bucket for AWS Config
resource "aws_s3_bucket" "config_bucket" {
  bucket = "${local.resource_prefix}-config-${local.suffix}"

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-config-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "config-storage"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_policy" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id
  policy = data.aws_iam_policy_document.config_bucket_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_bucket_policy" {
  statement {
    sid    = "AWSConfigBucketPermissionsCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.config_bucket.arn
    ]
  }

  statement {
    sid    = "AWSConfigBucketExistenceCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions = [
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.config_bucket.arn
    ]
  }

  statement {
    sid    = "AWSConfigBucketPut"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.config_bucket.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.resource_prefix}-recorder-${local.suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${local.resource_prefix}-delivery-${local.suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.id

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 1: Ensure KMS keys have rotation enabled
resource "aws_config_config_rule" "kms_rotation_enabled" {
  name = "${local.resource_prefix}-kms-rotation-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "KMS_ROTATION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 2: Ensure secrets are encrypted with KMS
resource "aws_config_config_rule" "secrets_encrypted" {
  name = "${local.resource_prefix}-secrets-encrypted-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "SECRETSMANAGER_USING_CMK"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 3: Ensure CloudWatch logs are encrypted
resource "aws_config_config_rule" "cloudwatch_logs_encrypted" {
  name = "${local.resource_prefix}-cw-logs-encrypted-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDWATCH_LOG_GROUP_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 4: Ensure S3 buckets have encryption enabled
resource "aws_config_config_rule" "s3_bucket_encrypted" {
  name = "${local.resource_prefix}-s3-encrypted-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 5: Ensure IAM roles require MFA
resource "aws_config_config_rule" "iam_mfa_required" {
  name = "${local.resource_prefix}-iam-mfa-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 6: Custom rule for VPC endpoint usage
resource "aws_config_config_rule" "vpc_endpoint_service_enabled" {
  name = "${local.resource_prefix}-vpc-endpoint-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "SERVICE_VPC_ENDPOINT_ENABLED"
  }

  input_parameters = jsonencode({
    serviceName = "secretsmanager"
  })

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 7: Ensure resources are tagged
resource "aws_config_config_rule" "required_tags" {
  name = "${local.resource_prefix}-required-tags-${local.suffix}"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "DataClassification"
  })

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}
