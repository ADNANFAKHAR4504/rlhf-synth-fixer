# data.tf
# Data sources for dynamic infrastructure values
# Security-focused data source definitions

# Get current AWS account information
data "aws_caller_identity" "current" {}

# Get current AWS region information
data "aws_region" "current" {}

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get latest Amazon Linux 2 AMI
# In LocalStack, use built-in AMI names
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = var.is_localstack ? ["self"] : ["amazon"]

  filter {
    name   = "name"
    values = var.is_localstack ? ["amazonlinux-2*"] : ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get latest Ubuntu LTS AMI
# In LocalStack, use built-in AMI names
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = var.is_localstack ? ["self"] : ["099720109477"]

  filter {
    name   = "name"
    values = var.is_localstack ? ["ubuntu-*"] : ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get current partition for ARN construction
data "aws_partition" "current" {}

# IAM policy document for EC2 instance role
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    effect = "Allow"
  }
}

# IAM policy document for Lambda execution role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    effect = "Allow"
  }
}

# IAM policy document for S3 access from EC2
data "aws_iam_policy_document" "ec2_s3_access" {
  statement {
    sid    = "AllowS3Access"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]

    resources = [
      var.app_data_s3_bucket_arn,
      "${var.app_data_s3_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "AllowKMSAccess"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [var.s3_kms_key_arn]
  }
}

data "aws_elb_service_account" "main" {}
