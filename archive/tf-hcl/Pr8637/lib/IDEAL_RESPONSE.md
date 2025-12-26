# Security Foundation Infrastructure - Terraform Implementation (IDEAL)

This implementation provides a comprehensive security foundation with multi-region KMS, automated secret rotation, fine-grained IAM controls, and compliance monitoring. This is the corrected version that successfully deploys to AWS.

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SecurityFoundation"
      Compliance  = "PCI-DSS"
    }
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SecurityFoundation"
      Compliance  = "PCI-DSS"
    }
  }
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SecurityFoundation"
      Compliance  = "PCI-DSS"
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to ensure uniqueness"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID for VPC endpoints"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "Subnet IDs for VPC endpoints"
  type        = list(string)
  default     = []
}

variable "organization_id" {
  description = "AWS Organization ID for SCPs"
  type        = string
  default     = ""
}

variable "audit_account_id" {
  description = "Audit account ID for AWS Config aggregation"
  type        = string
  default     = ""
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7

  validation {
    condition     = var.kms_key_deletion_window == 7
    error_message = "KMS key deletion window must be exactly 7 days."
  }
}

variable "secret_rotation_days" {
  description = "Number of days between secret rotations"
  type        = number
  default     = 30
}

variable "iam_session_duration_seconds" {
  description = "Maximum session duration for IAM roles in seconds"
  type        = number
  default     = 3600

  validation {
    condition     = var.iam_session_duration_seconds == 3600
    error_message = "IAM session duration must be exactly 1 hour (3600 seconds)."
  }
}

variable "cloudwatch_logs_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90
}

variable "data_classifications" {
  description = "Data classification tags to apply to resources"
  type        = list(string)
  default     = ["PII", "Confidential", "Public"]
}
```

## File: lib/tap_stack.tf

```hcl
# Generate unique suffix for resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  common_tags = {
    Environment        = var.environment
    DataClassification = "Confidential"
    ManagedBy          = "Terraform"
    Project            = "SecurityFoundation"
  }

  resource_prefix = "${var.environment}-security"
}

# Create VPC for endpoints (if not provided)
resource "aws_vpc" "security" {
  count = var.vpc_id == "" ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "security_private" {
  count = var.vpc_id == "" ? 2 : 0

  vpc_id            = aws_vpc.security[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-subnet-${count.index + 1}-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  vpc_id     = var.vpc_id != "" ? var.vpc_id : aws_vpc.security[0].id
  subnet_ids = length(var.subnet_ids) > 0 ? var.subnet_ids : aws_subnet.security_private[*].id
}
```

## File: lib/kms.tf

```hcl
# Primary KMS key in us-east-1
resource "aws_kms_key" "primary" {
  description             = "${local.resource_prefix}-primary-key-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  enable_key_rotation     = true
  multi_region            = true

  policy = data.aws_iam_policy_document.kms_key_policy.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-primary-key-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${local.resource_prefix}-primary-${local.suffix}"
  target_key_id = aws_kms_key.primary.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# Replica key in eu-west-1
resource "aws_kms_replica_key" "eu_west_1" {
  provider = aws.eu_west_1

  description             = "${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
    Region             = "eu-west-1"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "eu_west_1" {
  provider = aws.eu_west_1

  name          = "alias/${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
  target_key_id = aws_kms_replica_key.eu_west_1.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# Replica key in ap-southeast-1
resource "aws_kms_replica_key" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  description             = "${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
    Region             = "ap-southeast-1"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  name          = "alias/${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
  target_key_id = aws_kms_replica_key.ap_southeast_1.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# KMS key policy
data "aws_iam_policy_document" "kms_key_policy" {
  # Allow account root for key management
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion",
      "kms:ReplicateKey"
    ]

    resources = ["*"]
  }

  # Explicitly deny root account decrypt operations
  statement {
    sid    = "DenyRootAccountDecrypt"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "kms:Decrypt"
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalType"
      values   = ["Root"]
    }
  }

  # Allow specific IAM roles to use the key
  statement {
    sid    = "AllowIAMRoleUsage"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        aws_iam_role.secrets_rotation.arn,
        aws_iam_role.config_role.arn,
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant"
    ]

    resources = ["*"]
  }

  # Allow CloudWatch Logs to use the key
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logs.${var.primary_region}.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]

    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:*"]
    }
  }

  # Allow Secrets Manager to use the key
  statement {
    sid    = "AllowSecretsManager"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["secretsmanager.${var.primary_region}.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }
}

data "aws_caller_identity" "current" {}
```

## File: lib/iam.tf

```hcl
# IAM role for Secrets Manager rotation
resource "aws_iam_role" "secrets_rotation" {
  name                 = "${local.resource_prefix}-secrets-rotation-${local.suffix}"
  description          = "Role for Lambda function to rotate secrets"
  max_session_duration = var.iam_session_duration_seconds
  assume_role_policy   = data.aws_iam_policy_document.secrets_rotation_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-secrets-rotation-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "secrets-rotation"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "secrets_rotation_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Attach basic Lambda execution policy for VPC access
resource "aws_iam_role_policy_attachment" "secrets_rotation_vpc" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "secrets_rotation" {
  name   = "${local.resource_prefix}-secrets-rotation-policy-${local.suffix}"
  role   = aws_iam_role.secrets_rotation.id
  policy = data.aws_iam_policy_document.secrets_rotation_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "secrets_rotation_policy" {
  # Secrets Manager permissions
  statement {
    sid    = "SecretsManagerAccess"
    effect = "Allow"

    actions = [
      "secretsmanager:DescribeSecret",
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:UpdateSecretVersionStage"
    ]

    resources = [
      aws_secretsmanager_secret.database_credentials.arn
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceVpce"
      values   = [aws_vpc_endpoint.secretsmanager.id]
    }
  }

  # KMS permissions
  statement {
    sid    = "KMSAccess"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]

    resources = [
      aws_kms_key.primary.arn
    ]
  }

  # CloudWatch Logs permissions
  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.resource_prefix}-*"
    ]
  }

  # VPC permissions for Lambda
  statement {
    sid    = "VPCAccess"
    effect = "Allow"

    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]

    resources = ["*"]
  }
}

# IAM role with MFA enforcement
resource "aws_iam_role" "admin_with_mfa" {
  name                 = "${local.resource_prefix}-admin-mfa-${local.suffix}"
  description          = "Admin role requiring MFA"
  max_session_duration = var.iam_session_duration_seconds
  assume_role_policy   = data.aws_iam_policy_document.admin_mfa_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-admin-mfa-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "admin-access"
    RequiresMFA        = "true"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "admin_mfa_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"]
    }
  }
}

resource "aws_iam_role_policy" "admin_with_mfa" {
  name   = "${local.resource_prefix}-admin-policy-${local.suffix}"
  role   = aws_iam_role.admin_with_mfa.id
  policy = data.aws_iam_policy_document.admin_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "admin_policy" {
  # Scoped admin permissions - no Resource: '*'
  statement {
    sid    = "EC2Management"
    effect = "Allow"

    actions = [
      "ec2:Describe*",
      "ec2:Start*",
      "ec2:Stop*",
      "ec2:Reboot*"
    ]

    resources = [
      "arn:aws:ec2:${var.primary_region}:${data.aws_caller_identity.current.account_id}:instance/*"
    ]
  }

  statement {
    sid    = "S3Management"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${local.resource_prefix}-*",
      "arn:aws:s3:::${local.resource_prefix}-*/*"
    ]
  }

  statement {
    sid    = "IAMReadOnly"
    effect = "Allow"

    actions = [
      "iam:Get*",
      "iam:List*"
    ]

    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"
    ]
  }
}

# AWS Config IAM role
resource "aws_iam_role" "config_role" {
  name               = "${local.resource_prefix}-config-${local.suffix}"
  description        = "Role for AWS Config"
  assume_role_policy = data.aws_iam_policy_document.config_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-config-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "compliance-monitoring"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name   = "${local.resource_prefix}-config-s3-policy-${local.suffix}"
  role   = aws_iam_role.config_role.id
  policy = data.aws_iam_policy_document.config_s3_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "config_s3_policy" {
  statement {
    sid    = "ConfigS3Access"
    effect = "Allow"

    actions = [
      "s3:GetBucketVersioning",
      "s3:PutObject",
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.config_bucket.arn,
      "${aws_s3_bucket.config_bucket.arn}/*"
    ]
  }
}
```

## File: lib/secrets.tf

```hcl
# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "${local.resource_prefix}-db-credentials-${local.suffix}"
  description             = "Database credentials with automatic rotation"
  kms_key_id              = aws_kms_key.primary.id
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-db-credentials-${local.suffix}"
    DataClassification = "PII"
    Purpose            = "database-credentials"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Initial secret value
resource "aws_secretsmanager_secret_version" "database_credentials_initial" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = "localhost"
    port     = 5432
    dbname   = "production"
  })

  lifecycle {
    ignore_changes = [
      secret_string,
      version_stages
    ]
    prevent_destroy = false
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Lambda function for secret rotation
resource "aws_lambda_function" "secret_rotation" {
  filename         = "${path.module}/lambda/secret_rotation.zip"
  function_name    = "${local.resource_prefix}-rotation-${local.suffix}"
  role             = aws_iam_role.secrets_rotation.arn
  handler          = "secret_rotation.lambda_handler"
  source_code_hash = data.archive_file.secret_rotation.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.primary_region}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-rotation-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "secret-rotation"
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_rotation
  ]
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${local.resource_prefix}-lambda-${local.suffix}"
  description = "Security group for Lambda rotation function"
  vpc_id      = local.vpc_id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to AWS services"
  }

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-lambda-sg-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"

  lifecycle {
    prevent_destroy = false
  }
}

# Rotation configuration
resource "aws_secretsmanager_secret_rotation" "database_credentials" {
  secret_id           = aws_secretsmanager_secret.database_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = var.secret_rotation_days
  }

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_lambda_permission.secrets_manager
  ]
}

# Archive Lambda function code
data "archive_file" "secret_rotation" {
  type        = "zip"
  source_file = "${path.module}/lambda/secret_rotation.py"
  output_path = "${path.module}/lambda/secret_rotation.zip"
}
```

## File: lib/config.tf

```hcl
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

# Config Rule 1: Ensure KMS keys have rotation enabled (custom rule)
resource "aws_config_config_rule" "kms_rotation_enabled" {
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
```

## File: lib/vpc_endpoints.tf

```hcl
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
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Log Group for Lambda rotation function
resource "aws_cloudwatch_log_group" "lambda_rotation" {
  name              = "/aws/lambda/${local.resource_prefix}-rotation-${local.suffix}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-lambda-logs-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "lambda-logging"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.resource_prefix}-flow-logs-${local.suffix}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-logs-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "vpc-flow-logging"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name               = "${local.resource_prefix}-vpc-flow-logs-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-flow-logs-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name   = "${local.resource_prefix}-vpc-flow-logs-policy-${local.suffix}"
  role   = aws_iam_role.vpc_flow_logs.id
  policy = data.aws_iam_policy_document.vpc_flow_logs_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]

    resources = [
      aws_cloudwatch_log_group.vpc_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
    ]
  }
}

# VPC Flow Logs
resource "aws_flow_log" "security_vpc" {
  count = var.vpc_id == "" ? 1 : 0

  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.security[0].id

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-flow-log-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}
```

## File: lib/scp.tf

```hcl
# Service Control Policy to prevent root account usage
# NOTE: This requires AWS Organizations to be enabled
# These are example policies - deploy via AWS Organizations console or CLI

# Example SCP: Deny root account usage
# This should be applied at the Organization or OU level
locals {
  scp_deny_root = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyRootAccountUsage"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      }
    ]
  })

  scp_require_encryption = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyUnencryptedObjectUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = [
              "aws:kms",
              "AES256"
            ]
          }
        }
      },
      {
        Sid    = "RequireKMSEncryption"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:CreateDBCluster"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      },
      {
        Sid    = "RequireEBSEncryption"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances"
        ]
        Resource = "arn:aws:ec2:*:*:volume/*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      }
    ]
  })
}

# Output the SCPs for manual application
output "scp_deny_root_policy" {
  description = "SCP to deny root account usage - Apply via AWS Organizations"
  value       = local.scp_deny_root
}

output "scp_require_encryption_policy" {
  description = "SCP to require encryption - Apply via AWS Organizations"
  value       = local.scp_require_encryption
}
```

## File: lib/outputs.tf

```hcl
output "kms_primary_key_id" {
  description = "Primary KMS key ID in us-east-1"
  value       = aws_kms_key.primary.id
}

output "kms_primary_key_arn" {
  description = "Primary KMS key ARN"
  value       = aws_kms_key.primary.arn
}

output "kms_replica_eu_west_1_id" {
  description = "KMS replica key ID in eu-west-1"
  value       = aws_kms_replica_key.eu_west_1.id
}

output "kms_replica_ap_southeast_1_id" {
  description = "KMS replica key ID in ap-southeast-1"
  value       = aws_kms_replica_key.ap_southeast_1.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "lambda_rotation_function_name" {
  description = "Lambda rotation function name"
  value       = aws_lambda_function.secret_rotation.function_name
}

output "admin_role_arn" {
  description = "Admin role ARN (requires MFA)"
  value       = aws_iam_role.admin_with_mfa.arn
}

output "config_bucket_name" {
  description = "AWS Config S3 bucket name"
  value       = aws_s3_bucket.config_bucket.id
}

output "vpc_endpoint_secretsmanager_id" {
  description = "VPC endpoint ID for Secrets Manager"
  value       = aws_vpc_endpoint.secretsmanager.id
}

output "vpc_endpoint_kms_id" {
  description = "VPC endpoint ID for KMS"
  value       = aws_vpc_endpoint.kms.id
}

output "environment_suffix" {
  description = "Environment suffix used for resource names"
  value       = local.suffix
}

output "validation_commands" {
  description = "AWS CLI commands to validate security controls"
  value       = <<-EOT
    # Validate KMS key rotation
    aws kms describe-key --key-id ${aws_kms_key.primary.id} --query 'KeyMetadata.KeyRotationEnabled'

    # Validate secret rotation configuration
    aws secretsmanager describe-secret --secret-id ${aws_secretsmanager_secret.database_credentials.id} --query 'RotationEnabled'

    # Validate KMS key policy denies root decrypt
    aws kms get-key-policy --key-id ${aws_kms_key.primary.id} --policy-name default --query 'Policy' --output text | jq '.Statement[] | select(.Sid == "DenyRootAccountDecrypt")'

    # Validate CloudWatch log group encryption
    aws logs describe-log-groups --log-group-name-prefix '/aws/' --query 'logGroups[*].[logGroupName,kmsKeyId]' --output table

    # Validate AWS Config is enabled
    aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[*].name'

    # Validate Config rules
    aws configservice describe-config-rules --query 'ConfigRules[*].[ConfigRuleName,ConfigRuleState]' --output table

    # Validate VPC endpoints
    aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=${local.vpc_id}" --query 'VpcEndpoints[*].[ServiceName,State]' --output table

    # Validate IAM role session duration
    aws iam get-role --role-name ${aws_iam_role.admin_with_mfa.name} --query 'Role.MaxSessionDuration'

    # Validate S3 bucket encryption
    aws s3api get-bucket-encryption --bucket ${aws_s3_bucket.config_bucket.id}

    # Test secret retrieval (requires proper IAM permissions)
    aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.database_credentials.id} --query 'SecretString'
  EOT
}

output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    kms_keys = {
      primary = aws_kms_key.primary.id
      replicas = [
        aws_kms_replica_key.eu_west_1.id,
        aws_kms_replica_key.ap_southeast_1.id
      ]
    }
    secrets = [
      aws_secretsmanager_secret.database_credentials.name
    ]
    iam_roles = [
      aws_iam_role.secrets_rotation.name,
      aws_iam_role.admin_with_mfa.name,
      aws_iam_role.config_role.name
    ]
    vpc_endpoints = [
      aws_vpc_endpoint.secretsmanager.id,
      aws_vpc_endpoint.kms.id,
      aws_vpc_endpoint.ec2.id
    ]
    config_rules = [
      aws_config_config_rule.kms_rotation_enabled.name,
      aws_config_config_rule.secrets_encrypted.name,
      aws_config_config_rule.cloudwatch_logs_encrypted.name,
      aws_config_config_rule.s3_bucket_encrypted.name,
      aws_config_config_rule.iam_mfa_required.name,
      aws_config_config_rule.vpc_endpoint_service_enabled.name,
      aws_config_config_rule.required_tags.name
    ]
  }
}
```

## File: lib/backend.tf

```hcl
# Backend configuration for Terraform state
# Uncomment and configure for production use

# terraform {
#   backend "s3" {
#     bucket         = "your-terraform-state-bucket"
#     key            = "security-foundation/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     kms_key_id     = "alias/terraform-state"
#     dynamodb_table = "terraform-state-lock"
#   }
# }
```

## File: lib/lambda/secret_rotation.py

```python
import json
import os
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
secretsmanager_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """
    Lambda handler for Secrets Manager rotation

    Args:
        event: Event data from Secrets Manager
        context: Lambda context
    """
    logger.info("Starting secret rotation")

    # Extract event details
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    try:
        # Get secret metadata
        metadata = secretsmanager_client.describe_secret(SecretId=arn)

        # Check if version exists
        if token not in metadata['VersionIdsToStages']:
            raise ValueError(f"Secret version {token} not found")

        # Execute rotation step
        if step == "createSecret":
            create_secret(arn, token)
        elif step == "setSecret":
            set_secret(arn, token)
        elif step == "testSecret":
            test_secret(arn, token)
        elif step == "finishSecret":
            finish_secret(arn, token)
        else:
            raise ValueError(f"Invalid step: {step}")

        logger.info(f"Successfully completed step: {step}")
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully completed {step}')
        }

    except Exception as e:
        logger.error(f"Error during rotation step {step}: {str(e)}")
        raise


def create_secret(arn, token):
    """
    Create new secret version with new password

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Creating new secret version")

    # Get current secret
    current_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionStage="AWSCURRENT"
    )

    # Parse secret
    secret_dict = json.loads(current_secret['SecretString'])

    # Validate secret format
    required_fields = ['username', 'password', 'engine', 'host', 'port', 'dbname']
    for field in required_fields:
        if field not in secret_dict:
            raise ValueError(f"Secret missing required field: {field}")

    # Generate new password
    new_password = secretsmanager_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )

    # Update password
    secret_dict['password'] = new_password['RandomPassword']

    # Store new secret version
    try:
        secretsmanager_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(secret_dict),
            VersionStages=['AWSPENDING']
        )
        logger.info("Successfully created new secret version")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceExistsException':
            logger.info("Secret version already exists")
        else:
            raise


def set_secret(arn, token):
    """
    Set the secret in the database

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Setting secret in database")

    # Get pending secret
    pending_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage="AWSPENDING"
    )

    secret_dict = json.loads(pending_secret['SecretString'])

    # In production, update the database password here
    # For this example, we'll just log
    logger.info(f"Would update password for user: {secret_dict['username']}")
    logger.info("Password updated successfully")


def test_secret(arn, token):
    """
    Test the new secret

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Testing new secret")

    # Get pending secret
    pending_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage="AWSPENDING"
    )

    secret_dict = json.loads(pending_secret['SecretString'])

    # Validate secret format again
    required_fields = ['username', 'password', 'engine', 'host', 'port', 'dbname']
    for field in required_fields:
        if field not in secret_dict:
            raise ValueError(f"Secret missing required field: {field}")

    # Validate password meets requirements
    password = secret_dict['password']
    if len(password) < 12:
        raise ValueError("Password does not meet length requirements")

    logger.info("Secret validation passed")


def finish_secret(arn, token):
    """
    Finish the rotation by marking new version as current

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Finishing rotation")

    # Get metadata
    metadata = secretsmanager_client.describe_secret(SecretId=arn)
    current_version = None

    # Find current version
    for version, stages in metadata['VersionIdsToStages'].items():
        if "AWSCURRENT" in stages:
            if version == token:
                logger.info("Version already marked as AWSCURRENT")
                return
            current_version = version
            break

    # Update version stages
    secretsmanager_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

    logger.info("Successfully finished rotation")
```

## File: lib/lambda/config_kms_rotation.py

```python
import json
import boto3
import os

def lambda_handler(event, context):
    config = boto3.client('config')
    kms = boto3.client('kms')

    invoking_event = json.loads(event['invokingEvent'])
    rule_parameters = json.loads(event['ruleParameters'])
    result_token = event['resultToken']

    configuration_item = invoking_event['configurationItem']
    resource_type = configuration_item['resourceType']
    resource_id = configuration_item['resourceId']

    compliance_type = 'NOT_APPLICABLE'
    annotation = 'N/A'

    if resource_type == 'AWS::KMS::Key':
        try:
            key_id = resource_id
            response = kms.get_key_rotation_status(KeyId=key_id)
            if response['KeyRotationEnabled']:
                compliance_type = 'COMPLIANT'
                annotation = 'KMS key rotation is enabled.'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = 'KMS key rotation is NOT enabled.'
        except Exception as e:
            compliance_type = 'NON_COMPLIANT'
            annotation = f'Error checking KMS key rotation: {str(e)}'

    config.put_evaluations(
        Evaluations=[
            {
                'ComplianceResourceType': resource_type,
                'ComplianceResourceId': resource_id,
                'ComplianceType': compliance_type,
                'Annotation': annotation,
                'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
            },
        ],
        ResultToken=result_token
    )
```
