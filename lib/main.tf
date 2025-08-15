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
  default     = "nova-devops-team" # Default value for demonstration
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
  # A list of AWS managed Config Rules to deploy in each region.
  config_rules = [
    "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
    "ENCRYPTED_VOLUMES",
    "IAM_ROLE_MANAGED_POLICY_CHECK",
  ]
}

# /-----------------------------------------------------------------------------
# | Data Sources
# ------------------------------------------------------------------------------

# Dynamically finds the latest Amazon Linux 2 AMI in each target region.
data "aws_ami" "amazon_linux_2" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

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

resource "aws_kms_key" "app_key" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  description             = "KMS key for Nova application data encryption"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.app_key[each.key].id
}

# /-----------------------------------------------------------------------------
# | Secure Storage (S3)
# ------------------------------------------------------------------------------

resource "aws_s3_bucket" "data_bucket" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  # Creates a globally unique bucket name.
  bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.key}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  bucket = aws_s3_bucket.data_bucket[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key[each.key].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  bucket = aws_s3_bucket.data_bucket[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# /-----------------------------------------------------------------------------
# | Identity and Access Management (IAM)
# ------------------------------------------------------------------------------

# Define the permissions for the EC2 role.
data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid    = "AllowS3ReadAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    # Grant access to all regional buckets created by this configuration.
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

# Create a single, global IAM Role for EC2 instances.
resource "aws_iam_role" "ec2_role" {
  name               = "nova-ec2-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
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

resource "aws_ec2_instance" "app_server" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.key}

  ami           = data.aws_ami.amazon_linux_2[each.key].id
  instance_type = "t3.micro"

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  # CORRECT IMPLEMENTATION: To use a custom KMS key for the root volume,
  # you must define a full ebs_block_device block and specify the
  # root device name from the AMI data source.
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

  # Note: The incorrect 'root_block_device' block has been removed.
}

# /-----------------------------------------------------------------------------
# | Compliance Monitoring (AWS Config)
# ------------------------------------------------------------------------------

resource "aws_config_config_rule" "compliance_rules" {
  # Use setproduct to create a rule for each region in the list of rules.
  for_each = { for pair in setproduct(var.aws_regions, local.config_rules) : "${pair[0]}-${pair[1]}" => { region = pair[0], rule_name = pair[1] } }
  provider = aws.${each.value.region}

  name = each.value.rule_name

  source {
    owner             = "AWS"
    source_identifier = each.value.rule_name
  }

  # Depends on the role to ensure it exists before rules are created.
  depends_on = [aws_iam_role.ec2_role]
}


# /-----------------------------------------------------------------------------
# | Outputs
# ------------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    for region in var.aws_regions : region => {
      s3_bucket_name  = aws_s3_bucket.data_bucket[region].id
      ec2_instance_id = aws_ec2_instance.app_server[region].id
      kms_key_arn     = aws_kms_key.app_key[region].arn
    }
  }
}
