# /-----------------------------------------------------------------------------
# | Variables & Locals
# |-----------------------------------------------------------------------------

variable "your_name" {
  description = "Your name, used for the 'Owner' tag on all resources."
  type        = string
  default     = "nova-devops-team"
}

data "aws_caller_identity" "current" {}

locals {
  common_tags = {
    Owner   = var.your_name
    Purpose = "Nova Application Baseline"
  }

  # Map regions to their provider aliases
  region_providers = {
    "us-east-1"    = "aws.us-east-1"
    "us-west-2"    = "aws.us-west-2"
    "eu-north-1"   = "aws.eu-north-1"
    "eu-central-1" = "aws.eu-central-1"
  }
}

# /-----------------------------------------------------------------------------
# | Global Resources (IAM)
# |-----------------------------------------------------------------------------

resource "aws_iam_role" "ec2_role" {
  name = "nova-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid     = "AllowS3ReadAccess"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      for region in var.aws_regions :
      "arn:aws:s3:::nova-data-bucket-${data.aws_caller_identity.current.account_id}-${region}/*"
    ]
  }

  statement {
    sid       = "AllowCloudWatchLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name   = "nova-ec2-s3-cloudwatch-policy"
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.ec2_permissions.json
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "nova-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# AWS Config IAM Role
resource "aws_iam_role" "config_role" {
  name = "nova-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket for Config (required for Config to work)
resource "aws_s3_bucket" "config_bucket" {
  for_each = toset(var.aws_regions)

  provider = aws
  bucket   = "nova-config-bucket-${data.aws_caller_identity.current.account_id}-${each.value}"
  tags     = local.common_tags
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "nova-config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          for region in var.aws_regions :
          "arn:aws:s3:::nova-config-bucket-${data.aws_caller_identity.current.account_id}-${region}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          for region in var.aws_regions :
          "arn:aws:s3:::nova-config-bucket-${data.aws_caller_identity.current.account_id}-${region}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          for region in var.aws_regions :
          "arn:aws:s3:::nova-config-bucket-${data.aws_caller_identity.current.account_id}-${region}/*"
        ]
        Condition = {
          StringLike = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# /-----------------------------------------------------------------------------
# | Regional Resources - Using for_each for DRY approach
# |-----------------------------------------------------------------------------

# AMI Discovery for each region
data "aws_ami" "amazon_linux_2" {
  for_each = toset(var.aws_regions)

  provider    = aws
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# KMS Keys
resource "aws_kms_key" "app_key" {
  for_each = toset(var.aws_regions)

  provider                = aws
  description             = "KMS key for Nova (${each.value})"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias" {
  for_each = toset(var.aws_regions)

  provider      = aws
  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key[each.value].id
}

# S3 Buckets
resource "aws_s3_bucket" "data_bucket" {
  for_each = toset(var.aws_regions)

  provider = aws
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.value}"
  tags     = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  for_each = toset(var.aws_regions)

  provider = aws
  bucket   = aws_s3_bucket.data_bucket[each.value].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key[each.value].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pab" {
  for_each = toset(var.aws_regions)

  provider = aws
  bucket   = aws_s3_bucket.data_bucket[each.value].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# EC2 Instances
resource "aws_instance" "app_server" {
  for_each = toset(var.aws_regions)

  provider             = aws
  ami                  = data.aws_ami.amazon_linux_2[each.value].id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    encrypted  = true
    kms_key_id = aws_kms_key.app_key[each.value].arn
  }

  tags = merge(local.common_tags, {
    Name = "nova-app-server-${each.value}"
  })
}

# AWS Config Configuration
resource "aws_config_delivery_channel" "config_delivery" {
  for_each = toset(var.aws_regions)

  provider       = aws
  name           = "default"
  s3_bucket_name = aws_s3_bucket.config_bucket[each.value].id
}

resource "aws_config_configuration_recorder" "recorder" {
  for_each = toset(var.aws_regions)

  provider = aws
  name     = "default"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }

  depends_on = [aws_config_delivery_channel.config_delivery]
}

resource "aws_config_configuration_recorder_status" "recorder_status" {
  for_each = toset(var.aws_regions)

  provider   = aws
  name       = aws_config_configuration_recorder.recorder[each.value].name
  is_enabled = true

  depends_on = [aws_config_configuration_recorder.recorder]
}

# Config Rules
resource "aws_config_config_rule" "s3_encryption" {
  for_each = toset(var.aws_regions)

  provider = aws
  name     = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.recorder]
}

resource "aws_config_config_rule" "ebs_encryption" {
  for_each = toset(var.aws_regions)

  provider = aws
  name     = "ENCRYPTED_VOLUMES"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.recorder]
}

resource "aws_config_config_rule" "iam_role_policy" {
  for_each = toset(var.aws_regions)

  provider = aws
  name     = "IAM_ROLE_MANAGED_POLICY_CHECK"

  source {
    owner             = "AWS"
    source_identifier = "IAM_ROLE_MANAGED_POLICY_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.recorder]
}

# /-----------------------------------------------------------------------------
# | Outputs
# |-----------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    for region in var.aws_regions : region => {
      s3_bucket_name  = aws_s3_bucket.data_bucket[region].id
      ec2_instance_id = aws_instance.app_server[region].id
      kms_key_arn     = aws_kms_key.app_key[region].arn
    }
  }
}
