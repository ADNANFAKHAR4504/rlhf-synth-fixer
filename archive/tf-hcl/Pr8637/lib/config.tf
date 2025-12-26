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
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

  name           = "${local.resource_prefix}-delivery-${local.suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.id

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  count = var.enable_aws_config ? 1 : 0

  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config Rule 1: Ensure KMS keys have rotation enabled (custom rule)
resource "aws_config_config_rule" "kms_rotation_enabled" {
  count = var.enable_aws_config ? 1 : 0

  name = "${local.resource_prefix}-kms-rotation-${local.suffix}"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.config_kms_rotation.arn
  }

  depends_on = [aws_config_configuration_recorder.main, aws_lambda_permission.config_kms_rotation]

  lifecycle {
    prevent_destroy = false
  }
}

# IAM role for Config Lambda function
resource "aws_iam_role" "config_lambda" {
  name        = "${local.resource_prefix}-config-lambda-${local.suffix}"
  description = "Role for Config custom rule Lambda function"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-config-lambda-${local.suffix}"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "config_lambda_basic" {
  role       = aws_iam_role.config_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for Config Lambda to access KMS and Config
resource "aws_iam_role_policy" "config_lambda" {
  name   = "${local.resource_prefix}-config-lambda-policy-${local.suffix}"
  role   = aws_iam_role.config_lambda.id
  policy = data.aws_iam_policy_document.config_lambda_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_lambda_policy" {
  statement {
    sid    = "KMSAccess"
    effect = "Allow"

    actions = [
      "kms:DescribeKey",
      "kms:GetKeyRotationStatus"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "ConfigAccess"
    effect = "Allow"

    actions = [
      "config:PutEvaluations"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.resource_prefix}-config-*"
    ]
  }
}

# Lambda function for KMS rotation check
resource "aws_lambda_function" "config_kms_rotation" {
  filename         = "${path.module}/lambda/config_kms_rotation.zip"
  function_name    = "${local.resource_prefix}-config-kms-rotation-${local.suffix}"
  role             = aws_iam_role.config_lambda.arn
  handler          = "config_kms_rotation.lambda_handler"
  source_code_hash = data.archive_file.config_kms_rotation.output_base64sha256
  runtime          = "python3.9"
  timeout          = 60

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-config-kms-rotation-${local.suffix}"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Archive for config KMS rotation Lambda
data "archive_file" "config_kms_rotation" {
  type        = "zip"
  source_file = "${path.module}/lambda/config_kms_rotation.py"
  output_path = "${path.module}/lambda/config_kms_rotation.zip"
}

# Lambda permission for Config
resource "aws_lambda_permission" "config_kms_rotation" {
  statement_id  = "AllowConfigInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.config_kms_rotation.function_name
  principal     = "config.amazonaws.com"
}

# Config Rule 2: Ensure secrets are encrypted with KMS
resource "aws_config_config_rule" "secrets_encrypted" {
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

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
  count = var.enable_aws_config ? 1 : 0

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
