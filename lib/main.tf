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
}

# /-----------------------------------------------------------------------------
# | Data Sources - US East 1
# ------------------------------------------------------------------------------

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

# /-----------------------------------------------------------------------------
# | Data Sources - US West 2
# ------------------------------------------------------------------------------

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

# Combined AMI data for use in resources
locals {
  ami_ids = {
    "us-east-1" = data.aws_ami.amazon_linux_2_us_east_1.id
    "us-west-2" = data.aws_ami.amazon_linux_2_us_west_2.id
  }

  ami_root_devices = {
    "us-east-1" = data.aws_ami.amazon_linux_2_us_east_1.root_device_name
    "us-west-2" = data.aws_ami.amazon_linux_2_us_west_2.root_device_name
  }
}

# /-----------------------------------------------------------------------------
# | AWS Key Management Service (KMS) - US East 1
# ------------------------------------------------------------------------------

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

# /-----------------------------------------------------------------------------
# | AWS Key Management Service (KMS) - US West 2
# ------------------------------------------------------------------------------

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

# Combined KMS data for use in other resources
locals {
  kms_key_ids = {
    "us-east-1" = aws_kms_key.app_key_us_east_1.id
    "us-west-2" = aws_kms_key.app_key_us_west_2.id
  }

  kms_key_arns = {
    "us-east-1" = aws_kms_key.app_key_us_east_1.arn
    "us-west-2" = aws_kms_key.app_key_us_west_2.arn
  }
}

# /-----------------------------------------------------------------------------
# | Secure Storage (S3) - US East 1
# ------------------------------------------------------------------------------

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

# /-----------------------------------------------------------------------------
# | Secure Storage (S3) - US West 2
# ------------------------------------------------------------------------------

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

# Combined S3 data for use in outputs
locals {
  s3_bucket_ids = {
    "us-east-1" = aws_s3_bucket.data_bucket_us_east_1.id
    "us-west-2" = aws_s3_bucket.data_bucket_us_west_2.id
  }
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
# | Compute (EC2) - US East 1
# ------------------------------------------------------------------------------

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

# /-----------------------------------------------------------------------------
# | Compute (EC2) - US West 2
# ------------------------------------------------------------------------------

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

# Combined EC2 data for use in outputs
locals {
  ec2_instance_ids = {
    "us-east-1" = aws_instance.app_server_us_east_1.id
    "us-west-2" = aws_instance.app_server_us_west_2.id
  }
}

# /-----------------------------------------------------------------------------
# | Compliance Monitoring (AWS Config) - US East 1
# ------------------------------------------------------------------------------

resource "aws_config_config_rule" "compliance_rules_us_east_1" {
  for_each = toset(local.config_rules)
  provider = aws.us-east-1

  name = each.value

  source {
    owner             = "AWS"
    source_identifier = each.value
  }

  depends_on = [aws_iam_role.ec2_role]
}

# /-----------------------------------------------------------------------------
# | Compliance Monitoring (AWS Config) - US West 2
# ------------------------------------------------------------------------------

resource "aws_config_config_rule" "compliance_rules_us_west_2" {
  for_each = toset(local.config_rules)
  provider = aws.us-west-2

  name = each.value

  source {
    owner             = "AWS"
    source_identifier = each.value
  }

  depends_on = [aws_iam_role.ec2_role]
}

# /-----------------------------------------------------------------------------
# | Outputs
# ------------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    for region in var.aws_regions : region => {
      s3_bucket_name  = local.s3_bucket_ids[region]
      ec2_instance_id = local.ec2_instance_ids[region]
      kms_key_arn     = local.kms_key_arns[region]
    }
  }
}
