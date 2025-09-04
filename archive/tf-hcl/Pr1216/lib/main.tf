locals {
  name_with_suffix = var.environment_suffix != "" ? "${var.name_prefix}-${var.environment_suffix}" : var.name_prefix
  common_tags      = merge(var.tags, { NamePrefix = local.name_with_suffix })
}

# -----------------------------
# Networking (VPC + Subnets) 
# -----------------------------
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${local.name_with_suffix}-vpc" })
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "${local.name_with_suffix}-igw" })
}

resource "aws_subnet" "public" {
  for_each = {
    az1 = { cidr = var.public_subnet_cidrs[0], az = data.aws_availability_zones.available.names[0] }
    az2 = { cidr = var.public_subnet_cidrs[1], az = data.aws_availability_zones.available.names[1] }
  }
  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.name_with_suffix}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  for_each = {
    az1 = { cidr = var.private_subnet_cidrs[0], az = data.aws_availability_zones.available.names[0] }
    az2 = { cidr = var.private_subnet_cidrs[1], az = data.aws_availability_zones.available.names[1] }
  }
  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags = merge(local.common_tags, {
    Name = "${local.name_with_suffix}-private-${each.key}"
    Tier = "private"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${local.name_with_suffix}-nat-eip" })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = values(aws_subnet.public)[0].id
  tags          = merge(local.common_tags, { Name = "${local.name_with_suffix}-nat" })
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "${local.name_with_suffix}-rt-public" })
}

resource "aws_route" "public_inet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "${local.name_with_suffix}-rt-private" })
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

# -----------------------------
# Security Groups
# -----------------------------
resource "aws_security_group" "public_sg" {
  name        = "${local.name_with_suffix}-public-sg"
  description = "Allow inbound HTTP/HTTPS, all egress"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_with_suffix}-public-sg" })
}

# -----------------------------
# KMS for S3 encryption
# -----------------------------
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${local.name_with_suffix}-s3-kms" })
}

# -----------------------------
# S3 Buckets (logs + data)
# -----------------------------
resource "aws_s3_bucket" "logs" {
  bucket        = "${local.name_with_suffix}-logs-${random_id.suffix.hex}"
  force_destroy = true
  tags          = merge(local.common_tags, { Name = "${local.name_with_suffix}-logs" })
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_id" "suffix" {
  byte_length = 3
}

resource "aws_s3_bucket" "data" {
  bucket        = "${local.name_with_suffix}-data-${random_id.suffix.hex}"
  force_destroy = true
  tags          = merge(local.common_tags, { Name = "${local.name_with_suffix}-data" })
}

resource "aws_s3_bucket_ownership_controls" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "data_to_logs" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access/"
}

data "aws_caller_identity" "current" {}

# Recommended: build the trail ARN once so we can scope the policy
# If you already have a local for this, reuse it.
locals {
  trail_name = "${local.name_with_suffix}-trail-${random_id.suffix.hex}"
  trail_arn  = "arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.trail_name}"
}

data "aws_partition" "current" {}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # Allow CloudTrail to check the bucket ACL
      {
        Sid       = "AWSCloudTrailAclCheck",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:GetBucketAcl",
        Resource  = "arn:${data.aws_partition.current.partition}:s3:::${aws_s3_bucket.logs.bucket}",
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          StringLike = {
            "aws:SourceArn" = local.trail_arn
          }
        }
      },
      # Allow CloudTrail to put log files with the required ACL
      {
        Sid       = "AWSCloudTrailWrite",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "arn:${data.aws_partition.current.partition}:s3:::${aws_s3_bucket.logs.bucket}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control",
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          StringLike = {
            "aws:SourceArn" = local.trail_arn
          }
        }
      }
    ]
  })
}

# Make sure the trail waits for the policy to exist
resource "aws_cloudtrail" "this" {
  name                          = "${local.name_with_suffix}-trail-${random_id.suffix.hex}"
  s3_bucket_name                = aws_s3_bucket.logs.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  tags                          = local.common_tags

  depends_on = [
    aws_s3_bucket_public_access_block.logs,
    aws_s3_bucket_policy.logs
  ]
}

# # -----------------------------
# # CloudTrail (management events)
# # -----------------------------
# resource "aws_cloudtrail" "this" {
#   name                          = "${var.name_prefix}-trail01"
#   s3_bucket_name                = aws_s3_bucket.logs.bucket
#   include_global_service_events = true
#   is_multi_region_trail         = true
#   enable_log_file_validation    = true
#   tags                          = local.common_tags
#   depends_on                    = [aws_s3_bucket_public_access_block.logs]
# }

# -----------------------------
# AWS Config (lightweight)
# -----------------------------

resource "aws_iam_policy" "aws_config_role_policy" {
  name        = "${local.name_with_suffix}_ConfigRole_${random_id.suffix.hex}"
  description = "Permissions required for AWS Config to record and deliver configuration changes."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "ConfigBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl"
        ]
        Resource = [
          "arn:aws:s3:::${aws_s3_bucket.logs.id}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
          "arn:aws:s3:::${aws_s3_bucket.logs.id}"
        ]
      },
      {
        Sid    = "ConfigPublishToSNS"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:your-config-topic"
      },
      {
        Sid    = "ConfigStreamToDeliveryChannel"
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

# data "aws_caller_identity" "current" {}

resource "aws_iam_role" "config" {
  name = "${local.name_with_suffix}-configrole1-trail-${random_id.suffix.hex}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "config.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_role_attach" {
  role       = aws_iam_role.config.name
  policy_arn = aws_iam_policy.aws_config_role_policy.arn
}

resource "aws_config_configuration_recorder" "this" {
  name     = "${local.name_with_suffix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types                = ["AWS::EC2::VPC", "AWS::EC2::Subnet"]
  }
}

resource "aws_config_delivery_channel" "this" {
  name           = "${local.name_with_suffix}-delivery"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  depends_on     = [aws_config_configuration_recorder.this]
}

resource "aws_config_configuration_recorder_status" "this" {
  name       = aws_config_configuration_recorder.this.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.this]
}

# A couple of lightweight managed rules
resource "aws_config_config_rule" "restricted_ssh" {
  name = "${local.name_with_suffix}-restricted-ssh"
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.this]
}

resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  name = "${local.name_with_suffix}-s3-sse"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.this]
}

# -----------------------------
# IAM secureuser: user + least-priv policy + MFA enforcement
# -----------------------------
resource "aws_iam_user" "secureuser" {
  name = "${var.iam_username}-${random_id.suffix.hex}"
  tags = local.common_tags
}

resource "aws_iam_user_policy" "least_priv" {
  name = "${local.name_with_suffix}-least-priv"
  user = aws_iam_user.secureuser.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "ReadOwnAccessKeys",
        Effect   = "Allow",
        Action   = ["iam:ListAccessKeys", "iam:GetUser"],
        Resource = "*"
      },
      {
        Sid      = "DenyWithoutMFA",
        Effect   = "Deny",
        Action   = "*",
        Resource = "*",
        Condition = {
          "BoolIfExists" = { "aws:MultiFactorAuthPresent" = "false" }
        }
      }
    ]
  })
}
