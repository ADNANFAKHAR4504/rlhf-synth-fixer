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
}

# /-----------------------------------------------------------------------------
# | Global Resources (IAM)
# |-----------------------------------------------------------------------------

# This single IAM role will be used by EC2 instances in all regions.
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

# The policy document grants access to resources in BOTH regions.
data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid     = "AllowS3ReadAccess"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.data_bucket_us_east_1.arn}/*",
      "${aws_s3_bucket.data_bucket_us_west_2.arn}/*",
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

# /-----------------------------------------------------------------------------
# | US-EAST-1 Regional Resources
# |-----------------------------------------------------------------------------

data "aws_ami" "amazon_linux_2_us_east_1" {
  provider = aws.us-east-1

  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_kms_key" "app_key_us_east_1" {
  provider = aws.us-east-1

  description             = "KMS key for Nova (us-east-1)"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_us_east_1" {
  provider      = aws.us-east-1
  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key_us_east_1.id
}

resource "aws_s3_bucket" "data_bucket_us_east_1" {
  provider = aws.us-east-1
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-us-east-1"
  tags     = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_us_east_1" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.data_bucket_us_east_1.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_us_east_1" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.data_bucket_us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_instance" "app_server_us_east_1" {
  provider = aws.us-east-1

  ami                  = data.aws_ami.amazon_linux_2_us_east_1.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  ebs_block_device {
    device_name = data.aws_ami.amazon_linux_2_us_east_1.root_device_name
    encrypted   = true
    kms_key_id  = aws_kms_key.app_key_us_east_1.arn
  }

  tags = merge(local.common_tags, { Name = "nova-app-server-us-east-1" })
}

# AWS Config setup for us-east-1
resource "aws_config_configuration_recorder" "recorder_us_east_1" {
  provider = aws.us-east-1
  name     = "default" # AWS only allows one recorder per region, named 'default'.
  role_arn = aws_iam_role.config_role.arn
}

resource "aws_config_config_rule" "s3_encryption_us_east_1" {
  provider = aws.us-east-1
  name     = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_east_1]
}

resource "aws_config_config_rule" "ebs_encryption_us_east_1" {
  provider = aws.us-east-1
  name     = "ENCRYPTED_VOLUMES"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_east_1]
}

# /-----------------------------------------------------------------------------
# | US-WEST-2 Regional Resources
# |-----------------------------------------------------------------------------

data "aws_ami" "amazon_linux_2_us_west_2" {
  provider = aws.us-west-2

  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_kms_key" "app_key_us_west_2" {
  provider = aws.us-west-2

  description             = "KMS key for Nova (us-west-2)"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_us_west_2" {
  provider      = aws.us-west-2
  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key_us_west_2.id
}

resource "aws_s3_bucket" "data_bucket_us_west_2" {
  provider = aws.us-west-2
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-us-west-2"
  tags     = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.data_bucket_us_west_2.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.data_bucket_us_west_2.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_instance" "app_server_us_west_2" {
  provider = aws.us-west-2

  ami                  = data.aws_ami.amazon_linux_2_us_west_2.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  ebs_block_device {
    device_name = data.aws_ami.amazon_linux_2_us_west_2.root_device_name
    encrypted   = true
    kms_key_id  = aws_kms_key.app_key_us_west_2.arn
  }

  tags = merge(local.common_tags, { Name = "nova-app-server-us-west-2" })
}

# AWS Config setup for us-west-2
resource "aws_config_configuration_recorder" "recorder_us_west_2" {
  provider = aws.us-west-2
  name     = "default" # AWS only allows one recorder per region, named 'default'.
  role_arn = aws_iam_role.config_role.arn
}

resource "aws_config_config_rule" "s3_encryption_us_west_2" {
  provider = aws.us-west-2
  name     = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_west_2]
}

resource "aws_config_config_rule" "ebs_encryption_us_west_2" {
  provider = aws.us-west-2
  name     = "ENCRYPTED_VOLUMES"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_west_2]
}

# /-----------------------------------------------------------------------------
# | Global Resources for AWS Config
# |-----------------------------------------------------------------------------

# A single IAM role for the AWS Config service, used by recorders in all regions.
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
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# /-----------------------------------------------------------------------------
# | Outputs
# |-----------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    "us-east-1" = {
      s3_bucket_name  = aws_s3_bucket.data_bucket_us_east_1.id
      ec2_instance_id = aws_instance.app_server_us_east_1.id
      kms_key_arn     = aws_kms_key.app_key_us_east_1.arn
    }
    "us-west-2" = {
      s3_bucket_name  = aws_s3_bucket.data_bucket_us_west_2.id
      ec2_instance_id = aws_instance.app_server_us_west_2.id
      kms_key_arn     = aws_kms_key.app_key_us_west_2.arn
    }
  }
}
