# -----------------------------------------------------------------------------
# LOCAL & VARIABLE DEFINITIONS
# -----------------------------------------------------------------------------

locals {
  project_name = "nova"
  environment  = "prod"
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

variable "vpc_cidrs" {
  description = "CIDR blocks for the VPCs in each region."
  type        = map(string)
  default = {
    us-east-1 = "10.10.0.0/16"
    us-west-2 = "10.20.0.0/16"
  }
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com"
}

# -----------------------------------------------------------------------------
# GLOBAL & CENTRALIZED RESOURCES
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "logs_useast1" {
  bucket = "${local.project_name}-${local.environment}-central-logs-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_useast1" {
  bucket = aws_s3_bucket.logs_useast1.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_useast1" {
  bucket = aws_s3_bucket.logs_useast1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs_useast1" {
  bucket = aws_s3_bucket.logs_useast1.id
  policy = data.aws_iam_policy_document.logs_bucket_policy_useast1.json
}

data "aws_iam_policy_document" "logs_bucket_policy_useast1" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.logs_useast1.arn]
  }
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs_useast1.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
  statement {
    sid    = "AWSVPCFlowLogsWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs_useast1.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# Example S3 buckets for demonstration
resource "aws_s3_bucket" "east_bucket_useast1" {
  bucket = "my-east-bucket"
}

resource "aws_s3_bucket" "west_bucket_uswest2" {
  bucket = "my-west-bucket"
}

resource "aws_s3_bucket" "new_data_bucket_useast1" {
  bucket = "${local.project_name}-${local.environment}-new-data-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

# -----------------------------------------------------------------------------
# IAM ROLES & POLICIES
# -----------------------------------------------------------------------------

resource "aws_iam_role" "ec2_role_global" {
  name = "${local.project_name}-${local.environment}-ec2-role"
  path = "/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy_global" {
  name        = "${local.project_name}-${local.environment}-ec2-policy"
  description = "Least-privilege policy for EC2 instances"
  policy      = data.aws_iam_policy_document.ec2_policy_global.json
}

data "aws_iam_policy_document" "ec2_policy_global" {
  statement {
    sid    = "AllowSSMSessionManager"
    effect = "Allow"
    actions = [
      "ssm:UpdateInstanceInformation",
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    sid    = "AllowS3ReadOnly"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.primary_data.arn,
      "${aws_s3_bucket.primary_data.arn}/*"
    ]
  }
  statement {
    sid    = "AllowSecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [aws_secretsmanager_secret.rds_password.arn]
  }
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attach_global" {
  role       = aws_iam_role.ec2_role_global.name
  policy_arn = aws_iam_policy.ec2_policy_global.arn
}

resource "aws_iam_instance_profile" "ec2_profile_global" {
  name = "${local.project_name}-${local.environment}-ec2-profile"
  role = aws_iam_role.ec2_role_global.name
}

resource "aws_iam_role" "s3_replication_global" {
  name = "${local.project_name}-${local.environment}-s3-replication-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "s3.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "s3_replication_policy_global" {
  name = "${local.project_name}-${local.environment}-s3-replication-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["s3:GetReplicationConfiguration", "s3:ListBucket"],
      Resource = [aws_s3_bucket.primary_data.arn]
      }, {
      Effect   = "Allow",
      Action   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging"],
      Resource = ["${aws_s3_bucket.primary_data.arn}/*"]
      }, {
      Effect   = "Allow",
      Action   = ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"],
      Resource = ["${aws_s3_bucket.backup_data.arn}/*"]
      }, {
      Effect   = "Allow",
      Action   = ["kms:Decrypt"],
      Resource = [aws_kms_key.useast1.arn]
      }, {
      Effect   = "Allow",
      Action   = ["kms:Encrypt"],
      Resource = [aws_kms_key.uswest2.arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication_attach_global" {
  role       = aws_iam_role.s3_replication_global.name
  policy_arn = aws_iam_policy.s3_replication_policy_global.arn
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# OUTPUTS
# -----------------------------------------------------------------------------

output "primary_region_details" {
  description = "Details for the primary region (us-east-1)"
  value = {
    vpc_id                  = aws_vpc.vpc_useast1.id
    ec2_instance_id         = aws_instance.app_useast1.id
    ec2_security_group_id   = aws_security_group.ec2_useast1.id
    rds_instance_identifier = aws_db_instance.rds_useast1.identifier
    rds_security_group_id   = aws_security_group.rds_useast1.id
    primary_data_bucket     = aws_s3_bucket.primary_data.bucket
  }
}

output "secondary_region_details" {
  description = "Details for the secondary region (us-west-2)"
  value = {
    vpc_id             = aws_vpc.vpc_uswest2.id
    ec2_instance_id    = aws_instance.app_uswest2.id
    ec2_private_ip     = aws_instance.app_uswest2.private_ip
    rds_endpoint       = aws_db_instance.rds_uswest2.endpoint
    backup_data_bucket = aws_s3_bucket.backup_data.bucket
  }
}

output "central_logging_bucket" {
  description = "The name of the central S3 bucket for all logs."
  value       = aws_s3_bucket.logs_useast1.bucket
}

output "vpc_peering_connection_id" {
  description = "The ID of the VPC peering connection between regions."
  value       = aws_vpc_peering_connection.nova_peering.id
}

output "primary_region_vpc_id" {
  description = "The ID of the VPC in the primary region (us-east-1)."
  value       = aws_vpc.vpc_useast1.id
}

output "primary_data_bucket_name" {
  description = "The name of the primary S3 data bucket."
  value       = aws_s3_bucket.primary_data.bucket
}

output "primary_rds_instance_identifier" {
  description = "The identifier for the RDS instance in the primary region."
  value       = aws_db_instance.rds_useast1.id
}

output "primary_ec2_instance_id" {
  description = "The ID of the EC2 instance in the primary region."
  value       = aws_instance.app_useast1.id
}

output "primary_ec2_security_group_id" {
  description = "The ID of the security group for EC2 instances in the primary region."
  value       = aws_security_group.ec2_useast1.id
}

output "primary_rds_security_group_id" {
  description = "The ID of the security group for the RDS instance in the primary region."
  value       = aws_security_group.rds_useast1.id
}

terraform {
  backend "s3" {
    bucket = "my-s3-bucket"      # <-- Replace with your actual bucket name
    key    = "state/terraform.tfstate"
    region = "us-west-2"
    encrypt = true
  }
}