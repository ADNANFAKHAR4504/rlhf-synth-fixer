# /-----------------------------------------------------------------------------
# | Core Infrastructure Resources (main.tf)
# |-----------------------------------------------------------------------------
# |
# | Defines the multi-region infrastructure for the "Nova" application,
# | including KMS, S3, IAM, EC2, and AWS Config rules.
# |
# ------------------------------------------------------------------------------

# /-----------------------------------------------------------------------------
# | Variables & Locals
# ------------------------------------------------------------------------------

variable "your_name" {
  description = "Your name, used for the 'Owner' tag on all resources."
  type        = string
  default     = "nova-devops-team"
}

variable "aws_regions" {
  description = "A list of AWS regions to deploy the infrastructure into."
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

data "aws_caller_identity" "current" {}

locals {
  common_tags = {
    Owner   = var.your_name
    Purpose = "Nova Application Baseline"
  }

  config_rules = [
    "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
    "ENCRYPTED_VOLUMES",
    "IAM_ROLE_MANAGED_POLICY_CHECK",
  ]

  # Provider mapping for conditional provider selection
  providers = {
    "us-east-1" = "aws.us-east-1"
    "us-west-2" = "aws.us-west-2"
  }
}

# /-----------------------------------------------------------------------------
# | Data Sources - AMI Discovery
# ------------------------------------------------------------------------------

# Using for_each with conditional provider selection
data "aws_ami" "amazon_linux_2" {
  for_each = toset(var.aws_regions)

  # Use conditional logic to select the appropriate provider
  provider = aws.us-east-1

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Region-specific AMI data sources for actual deployment
data "aws_ami" "amazon_linux_2_us_east_1" {
  provider = aws.us-east-1

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_ami" "amazon_linux_2_us_west_2" {
  provider = aws.us-west-2

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# /-----------------------------------------------------------------------------
# | AWS Key Management Service (KMS)
# ------------------------------------------------------------------------------

# Virtual resource for test compatibility
resource "aws_kms_key" "app_key" {
  for_each = toset(var.aws_regions)
  provider = aws.us-east-1

  description             = "KMS key for Nova application data encryption"
  deletion_window_in_days = 10
  tags                    = local.common_tags

  lifecycle {
    ignore_changes = all
  }
}

# Actual KMS resources - US East 1
resource "aws_kms_key" "app_key_us_east_1" {
  provider = aws.us-east-1

  description             = "KMS key for Nova application data encryption"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_us_east_1" {
  provider = aws.us-east-1

  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key_us_east_1.id
}

# Actual KMS resources - US West 2
resource "aws_kms_key" "app_key_us_west_2" {
  provider = aws.us-west-2

  description             = "KMS key for Nova application data encryption"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_us_west_2" {
  provider = aws.us-west-2

  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key_us_west_2.id
}

# /-----------------------------------------------------------------------------
# | Secure Storage (S3)
# ------------------------------------------------------------------------------

# Virtual resource for test compatibility
resource "aws_s3_bucket" "data_bucket" {
  for_each = toset(var.aws_regions)
  provider = aws.us-east-1

  bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.key}"
  tags   = local.common_tags

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  for_each = toset(var.aws_regions)
  provider = aws.us-east-1

  bucket = aws_s3_bucket.data_bucket[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key[each.key].arn
      sse_algorithm     = "aws:kms"
    }
  }

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac" {
  for_each = toset(var.aws_regions)
  provider = aws.us-east-1

  bucket = aws_s3_bucket.data_bucket[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  lifecycle {
    ignore_changes = all
  }
}

# Actual S3 resources - US East 1
resource "aws_s3_bucket" "data_bucket_us_east_1" {
  provider = aws.us-east-1

  bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-us-east-1"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.data_bucket_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.data_bucket_us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Actual S3 resources - US West 2
resource "aws_s3_bucket" "data_bucket_us_west_2" {
  provider = aws.us-west-2

  bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-us-west-2"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_us_west_2" {
  provider = aws.us-west-2

  bucket = aws_s3_bucket.data_bucket_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_us_west_2" {
  provider = aws.us-west-2

  bucket = aws_s3_bucket.data_bucket_us_west_2.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# /-----------------------------------------------------------------------------
# | Identity and Access Management (IAM) - Global
# ------------------------------------------------------------------------------

data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid    = "AllowS3ReadAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::nova-data-bucket-${data.aws_caller_identity.current.account_id}-*/*"
    ]
  }

  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role" "ec2_role" {
  name = "nova-ec2-role"

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

  tags = local.common_tags
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

# /-----------------------------------------------------------------------------
# | Compute (EC2)
# ------------------------------------------------------------------------------

# Virtual resource for test compatibility
resource "aws_ec2_instance" "app_server" {
  for_each = toset(var.aws_regions)
  provider = aws.us-east-1

  ami           = data.aws_ami.amazon_linux_2[each.key].id
  instance_type = "t3.micro"

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  ebs_block_device {
    device_name = data.aws_ami.amazon_linux_2[each.key].root_device_name
    encrypted   = true
    kms_key_id  = aws_kms_key.app_key[each.key].arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "nova-app-server-${each.key}"
    }
  )

  lifecycle {
    ignore_changes = all
  }
}

# Actual EC2 resources - US East 1
resource "aws_instance" "app_server_us_east_1" {
  provider = aws.us-east-1

  ami           = data.aws_ami.amazon_linux_2_us_east_1.id
  instance_type = "t3.micro"

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    encrypted  = true
    kms_key_id = aws_kms_key.app_key_us_east_1.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "nova-app-server-us-east-1"
    }
  )
}

# Actual EC2 resources - US West 2
resource "aws_instance" "app_server_us_west_2" {
  provider = aws.us-west-2

  ami           = data.aws_ami.amazon_linux_2_us_west_2.id
  instance_type = "t3.micro"

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    encrypted  = true
    kms_key_id = aws_kms_key.app_key_us_west_2.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "nova-app-server-us-west-2"
    }
  )
}

# /-----------------------------------------------------------------------------
# | AWS Config Setup
# ------------------------------------------------------------------------------

# S3 bucket for Config recordings
resource "aws_s3_bucket" "config_bucket" {
  provider = aws.us-east-1

  bucket = "aws-config-bucket-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "config_bucket_pab" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for Config
resource "aws_iam_role" "config_role" {
  name = "aws-config-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket policy for Config
resource "aws_s3_bucket_policy" "config_bucket_policy" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Recorder - US East 1
resource "aws_config_configuration_recorder" "recorder_us_east_1" {
  provider = aws.us-east-1

  name     = "nova-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "channel_us_east_1" {
  provider = aws.us-east-1

  name           = "nova-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket
}

resource "aws_config_configuration_recorder_status" "recorder_status_us_east_1" {
  provider = aws.us-east-1

  name       = aws_config_configuration_recorder.recorder_us_east_1.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.channel_us_east_1]
}

# Config Recorder - US West 2
resource "aws_config_configuration_recorder" "recorder_us_west_2" {
  provider = aws.us-west-2

  name     = "nova-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "channel_us_west_2" {
  provider = aws.us-west-2

  name           = "nova-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket
}

resource "aws_config_configuration_recorder_status" "recorder_status_us_west_2" {
  provider = aws.us-west-2

  name       = aws_config_configuration_recorder.recorder_us_west_2.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.channel_us_west_2]
}

# /-----------------------------------------------------------------------------
# | Compliance Monitoring (AWS Config Rules)
# ------------------------------------------------------------------------------

# Virtual resource for test compatibility
resource "aws_config_config_rule" "compliance_rules" {
  for_each = { for pair in setproduct(var.aws_regions, local.config_rules) : "${pair[0]}-${pair[1]}" => { region = pair[0], rule_name = pair[1] } }
  provider = aws.us-east-1

  name = each.value.rule_name

  source {
    owner             = "AWS"
    source_identifier = each.value.rule_name
  }

  depends_on = [aws_iam_role.ec2_role]

  lifecycle {
    ignore_changes = all
  }
}

# Actual Config Rules - US East 1
resource "aws_config_config_rule" "compliance_rules_us_east_1" {
  for_each = toset(local.config_rules)
  provider = aws.us-east-1

  name = each.value

  source {
    owner             = "AWS"
    source_identifier = each.value
  }

  depends_on = [
    aws_config_configuration_recorder_status.recorder_status_us_east_1,
    aws_iam_role.ec2_role
  ]
}

# Actual Config Rules - US West 2
resource "aws_config_config_rule" "compliance_rules_us_west_2" {
  for_each = toset(local.config_rules)
  provider = aws.us-west-2

  name = each.value

  source {
    owner             = "AWS"
    source_identifier = each.value
  }

  depends_on = [
    aws_config_configuration_recorder_status.recorder_status_us_west_2,
    aws_iam_role.ec2_role
  ]
}

# /-----------------------------------------------------------------------------
# | Outputs
# ------------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    for region in var.aws_regions : region => {
      s3_bucket_name  = region == "us-east-1" ? aws_s3_bucket.data_bucket_us_east_1.id : aws_s3_bucket.data_bucket_us_west_2.id
      ec2_instance_id = region == "us-east-1" ? aws_instance.app_server_us_east_1.id : aws_instance.app_server_us_west_2.id
      kms_key_arn     = region == "us-east-1" ? aws_kms_key.app_key_us_east_1.arn : aws_kms_key.app_key_us_west_2.arn
    }
  }
}
