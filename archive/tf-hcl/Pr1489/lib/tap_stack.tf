############################################
# Variables
############################################
variable "aws_region" {
  description = "Default AWS region for the root provider in provider.tf"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment prefix (dev or prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "platform-team"
}

variable "designated_tag_key" {
  description = "IAM principal tag key used to allow EC2 actions"
  type        = string
  default     = "Department"
}

variable "designated_tag_value" {
  description = "IAM principal tag value used to allow EC2 actions"
  type        = string
  default     = "Engineering"
}

variable "allowed_ssh_cidrs" {
  description = "Optional CIDR blocks that are allowed for SSH (will not be removed)"
  type        = list(string)
  default     = []
}

# Optional: reuse an existing AWS Config IAM role by name to avoid EntityAlreadyExists
variable "config_role_name" {
  description = "Existing IAM role name for AWS Config. If set, the stack will not create a new role."
  type        = string
  default     = null
}

# Optional: enable AWS Config in eu-west-1 (default false to avoid account limits)
variable "enable_config_eu_west_1" {
  description = "Whether to enable AWS Config components in eu-west-1"
  type        = bool
  default     = false
}

############################################
# Providers (single file, multi-region)
# Assume a default provider is configured in provider.tf.
# We declare aliases for the two required regions here.
############################################
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

# Caller/account and partition (for constructing service-linked role ARN)
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

############################################
# Locals
############################################
locals {
  name_prefix = "${var.environment}-tap"
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
  }
}

locals {
  # Pre-existing AWS Config service-linked role ARN
  config_slr_arn = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig"
}

# Ensure the AWS Config service-linked role exists and use it for the recorder
resource "aws_iam_service_linked_role" "config" {
  count            = 0
  aws_service_name = "config.amazonaws.com"
}

############################################
# MFA enforcement (account-wide IAM policy)
# Documented AWS CLI steps (comments only, per prompt):
# 1) Create a virtual MFA device and enable it for a user:
#    aws iam create-virtual-mfa-device --virtual-mfa-device-name <user> --outfile QR.png --bootstrap-method QRCodePNG
#    aws iam enable-mfa-device --user-name <user> --serial-number arn:aws:iam::<account-id>:mfa/<user> --authentication-code-1 <code1> --authentication-code-2 <code2>
# 2) Obtain session credentials with MFA:
#    aws sts get-session-token --serial-number arn:aws:iam::<account-id>:mfa/<user> --token-code <mfa-code>
############################################
resource "aws_iam_policy" "enforce_mfa" {
  name = "${local.name_prefix}-enforce-mfa"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid      = "AllowManageOwnPasswords"
        Effect   = "Allow"
        Action   = ["iam:ChangePassword", "iam:GetUser"]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllUnlessMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource  = "*"
        Condition = { BoolIfExists = { "aws:MultiFactorAuthPresent" = "false" } }
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_group" "mfa_required" {
  name = "${local.name_prefix}-mfa-required"
}

resource "aws_iam_group_policy_attachment" "mfa_required_attach" {
  group      = aws_iam_group.mfa_required.name
  policy_arn = aws_iam_policy.enforce_mfa.arn
}

############################################
# Tag-based IAM policy enforcement for EC2
############################################
resource "aws_iam_policy" "tag_based_ec2" {
  name = "${local.name_prefix}-tag-based-ec2"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTaggedEC2Actions"
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances"
        ]
        Resource  = "*"
        Condition = { StringEquals = { "aws:PrincipalTag/${var.designated_tag_key}" = var.designated_tag_value } }
      },
      {
        Sid      = "AllowDescribe"
        Effect   = "Allow"
        Action   = ["ec2:Describe*", "ec2:List*"]
        Resource = "*"
      },
      {
        Sid    = "DenyUntaggedEC2Actions"
        Effect = "Deny"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances"
        ]
        Resource  = "*"
        Condition = { StringNotEquals = { "aws:PrincipalTag/${var.designated_tag_key}" = var.designated_tag_value } }
      }
    ]
  })
  tags = local.common_tags
}

############################################
# S3 buckets (both regions) with SSE-S3 and public access block
############################################
resource "random_id" "suffix" {
  byte_length = 4
}

# us-east-1 buckets
resource "aws_s3_bucket" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = "${local.name_prefix}-config-us-east-1-${random_id.suffix.hex}"
  tags     = local.common_tags
}

resource "aws_s3_bucket" "data_us_east_1" {
  provider = aws.us_east_1
  bucket   = "${local.name_prefix}-data-us-east-1-${random_id.suffix.hex}"
  tags     = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "config_pab_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.config_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "data_pab_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.data_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "config_ver_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_versioning" "data_ver_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.data_us_east_1.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_enc_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_enc_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.data_us_east_1.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# eu-west-1 buckets
resource "aws_s3_bucket" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = "${local.name_prefix}-config-eu-west-1-${random_id.suffix.hex}"
  tags     = local.common_tags
}

resource "aws_s3_bucket" "data_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = "${local.name_prefix}-data-eu-west-1-${random_id.suffix.hex}"
  tags     = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "config_pab_eu_west_1" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.config_eu_west_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "data_pab_eu_west_1" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.data_eu_west_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "config_ver_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_versioning" "data_ver_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.data_eu_west_1.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_enc_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_enc_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.data_eu_west_1.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bucket policies to allow AWS Config delivery
resource "aws_s3_bucket_policy" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AWSConfigBucketPermissionsCheck",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:GetBucketAcl",
        Resource  = aws_s3_bucket.config_us_east_1.arn
      },
      {
        Sid       = "AWSConfigBucketExistenceCheck",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:ListBucket",
        Resource  = aws_s3_bucket.config_us_east_1.arn
      },
      {
        Sid       = "AWSConfigBucketDelivery",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.config_us_east_1.arn}/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AWSConfigBucketPermissionsCheck",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:GetBucketAcl",
        Resource  = aws_s3_bucket.config_eu_west_1.arn
      },
      {
        Sid       = "AWSConfigBucketExistenceCheck",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:ListBucket",
        Resource  = aws_s3_bucket.config_eu_west_1.arn
      },
      {
        Sid       = "AWSConfigBucketDelivery",
        Effect    = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.config_eu_west_1.arn}/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}

############################################
# AWS Config: recorder + delivery + rule (both regions)
############################################
resource "aws_iam_role" "config_role" {
  count = var.config_role_name == null ? 1 : 0
  name  = "${local.name_prefix}-config-role-${random_id.suffix.hex}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_role_attach" {
  count      = 0
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSConfigServiceRolePolicy"
}

# us-east-1
resource "aws_config_configuration_recorder" "rec_us_east_1" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-recorder"
  role_arn = local.config_slr_arn
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "dc_us_east_1" {
  provider       = aws.us_east_1
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_us_east_1.bucket
  depends_on     = [aws_config_configuration_recorder.rec_us_east_1]
}

resource "aws_config_configuration_recorder_status" "enable_us_east_1" {
  provider   = aws.us_east_1
  is_enabled = true
  name       = aws_config_configuration_recorder.rec_us_east_1.name
  depends_on = [aws_config_delivery_channel.dc_us_east_1]
}

resource "aws_config_config_rule" "encrypted_volumes_us_east_1" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-encrypted-volumes"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder_status.enable_us_east_1]
  tags       = local.common_tags
}

# eu-west-1
resource "aws_config_configuration_recorder" "rec_eu_west_1" {
  count    = var.enable_config_eu_west_1 ? 1 : 0
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-recorder"
  role_arn = local.config_slr_arn
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "dc_eu_west_1" {
  count          = var.enable_config_eu_west_1 ? 1 : 0
  provider       = aws.eu_west_1
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_eu_west_1.bucket
  depends_on     = [aws_config_configuration_recorder.rec_eu_west_1]
}

resource "aws_config_configuration_recorder_status" "enable_eu_west_1" {
  count      = var.enable_config_eu_west_1 ? 1 : 0
  provider   = aws.eu_west_1
  is_enabled = true
  name       = aws_config_configuration_recorder.rec_eu_west_1[0].name
  depends_on = [aws_config_delivery_channel.dc_eu_west_1]
}

resource "aws_config_config_rule" "encrypted_volumes_eu_west_1" {
  count    = var.enable_config_eu_west_1 ? 1 : 0
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-encrypted-volumes"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder_status.enable_eu_west_1]
  tags       = local.common_tags
}

############################################
# Lambda auto-remediation for unrestricted SSH (both regions)
############################################
resource "aws_iam_role" "lambda_remediation_role" {
  name = "${local.name_prefix}-ssh-remediation-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_remediation_policy" {
  name = "${local.name_prefix}-ssh-remediation-policy"
  role = aws_iam_role.lambda_remediation_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:DescribeSecurityGroups",
          "ec2:RevokeSecurityGroupIngress"
        ],
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_pkg" {
  type        = "zip"
  output_path = "ssh_remediation.zip"
  source {
    content  = <<PY
import boto3
import os

ALLOWED = set(os.environ.get('ALLOWED_SSH_CIDRS', '').split(',')) if os.environ.get('ALLOWED_SSH_CIDRS') else set()

def handler(event, context):
    ec2 = boto3.client('ec2')
    # EventBridge rule will send CloudTrail events for SG changes; remediate broadly as fallback
    sgs = ec2.describe_security_groups()['SecurityGroups']
    for sg in sgs:
        perms_to_remove = []
        for p in sg.get('IpPermissions', []):
            if p.get('IpProtocol') == 'tcp' and p.get('FromPort') == 22 and p.get('ToPort') == 22:
                cidrs = [r.get('CidrIp') for r in p.get('IpRanges', []) if r.get('CidrIp')]
                for c in cidrs:
                    if c == '0.0.0.0/0' or (c not in ALLOWED):
                        perms_to_remove.append(p)
                        break
        if perms_to_remove:
            try:
                ec2.revoke_security_group_ingress(GroupId=sg['GroupId'], IpPermissions=perms_to_remove)
            except Exception as e:
                print(f"Remediation failed for {sg['GroupId']}: {e}")
    return {"statusCode": 200, "body": "Remediation complete"}
PY
    filename = "index.py"
  }
}

# us-east-1 Lambda + EventBridge
resource "aws_lambda_function" "remediate_us_east_1" {
  provider         = aws.us_east_1
  function_name    = "${local.name_prefix}-ssh-remediate-us-east-1"
  role             = aws_iam_role.lambda_remediation_role.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.lambda_pkg.output_path
  source_code_hash = data.archive_file.lambda_pkg.output_base64sha256
  environment {
    variables = { ALLOWED_SSH_CIDRS = join(",", var.allowed_ssh_cidrs) }
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_event_rule" "sg_changes_us_east_1" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-sg-changes"
  event_pattern = jsonencode({
    source      = ["aws.ec2"],
    detail-type = ["AWS API Call via CloudTrail"],
    detail      = { eventSource = ["ec2.amazonaws.com"], eventName = ["AuthorizeSecurityGroupIngress", "CreateSecurityGroup"] }
  })
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "lambda_target_us_east_1" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.sg_changes_us_east_1.name
  target_id = "Lambda"
  arn       = aws_lambda_function.remediate_us_east_1.arn
}

resource "aws_lambda_permission" "allow_events_us_east_1" {
  provider      = aws.us_east_1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediate_us_east_1.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sg_changes_us_east_1.arn
}

# eu-west-1 Lambda + EventBridge
resource "aws_lambda_function" "remediate_eu_west_1" {
  provider         = aws.eu_west_1
  function_name    = "${local.name_prefix}-ssh-remediate-eu-west-1"
  role             = aws_iam_role.lambda_remediation_role.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.lambda_pkg.output_path
  source_code_hash = data.archive_file.lambda_pkg.output_base64sha256
  environment {
    variables = { ALLOWED_SSH_CIDRS = join(",", var.allowed_ssh_cidrs) }
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_event_rule" "sg_changes_eu_west_1" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-sg-changes"
  event_pattern = jsonencode({
    source      = ["aws.ec2"],
    detail-type = ["AWS API Call via CloudTrail"],
    detail      = { eventSource = ["ec2.amazonaws.com"], eventName = ["AuthorizeSecurityGroupIngress", "CreateSecurityGroup"] }
  })
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "lambda_target_eu_west_1" {
  provider  = aws.eu_west_1
  rule      = aws_cloudwatch_event_rule.sg_changes_eu_west_1.name
  target_id = "Lambda"
  arn       = aws_lambda_function.remediate_eu_west_1.arn
}

resource "aws_lambda_permission" "allow_events_eu_west_1" {
  provider      = aws.eu_west_1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediate_eu_west_1.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sg_changes_eu_west_1.arn
}

############################################
# Secrets Manager (sensitive config) in both regions
############################################
resource "aws_secretsmanager_secret" "app_config_us_east_1" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-app-config-us-east-1"
  tags     = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_config_ver_us_east_1" {
  provider      = aws.us_east_1
  secret_id     = aws_secretsmanager_secret.app_config_us_east_1.id
  secret_string = jsonencode({ example = "set-real-values-in-CI-or-secrets" })
}

resource "aws_secretsmanager_secret" "app_config_eu_west_1" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-app-config-eu-west-1"
  tags     = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_config_ver_eu_west_1" {
  provider      = aws.eu_west_1
  secret_id     = aws_secretsmanager_secret.app_config_eu_west_1.id
  secret_string = jsonencode({ example = "set-real-values-in-CI-or-secrets" })
}

############################################
# Useful outputs
############################################
output "s3_config_buckets" {
  value = {
    us_east_1 = aws_s3_bucket.config_us_east_1.bucket
    eu_west_1 = aws_s3_bucket.config_eu_west_1.bucket
  }
}

output "s3_data_buckets" {
  value = {
    us_east_1 = aws_s3_bucket.data_us_east_1.bucket
    eu_west_1 = aws_s3_bucket.data_eu_west_1.bucket
  }
}

output "config_rules" {
  value = {
    us_east_1 = aws_config_config_rule.encrypted_volumes_us_east_1.name
    eu_west_1 = var.enable_config_eu_west_1 ? aws_config_config_rule.encrypted_volumes_eu_west_1[0].name : ""
  }
}

output "lambda_functions" {
  value = {
    us_east_1 = aws_lambda_function.remediate_us_east_1.arn
    eu_west_1 = aws_lambda_function.remediate_eu_west_1.arn
  }
}

output "iam_policies" {
  value = {
    mfa_policy        = aws_iam_policy.enforce_mfa.arn
    tag_based_ec2_arn = aws_iam_policy.tag_based_ec2.arn
  }
}
