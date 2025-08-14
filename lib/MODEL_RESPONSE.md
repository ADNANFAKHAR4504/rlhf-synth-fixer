provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
}

module "iam" {
  source      = "./modules/iam"
  project     = var.project
  environment = var.environment
}

module "s3" {
  source      = "./modules/s3"
  project     = var.project
  environment = var.environment
}

module "cloudtrail" {
  source      = "./modules/cloudtrail"
  project     = var.project
  environment = var.environment
  s3_bucket_name = module.s3.bucket_name
}

module "config" {
  source      = "./modules/config"
  project     = var.project
  environment = var.environment
  s3_bucket_name = module.s3.bucket_name
}

module "sns" {
  source      = "./modules/sns"
  project     = var.project
  environment = var.environment
}


variable "project" {
  description = "The project name"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}


resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "${var.project}-vpc-${var.environment}"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project}-subnet-public-${var.environment}"
  }
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  tags = {
    Name = "${var.project}-subnet-private-${var.environment}"
  }
}


resource "aws_iam_group" "admin" {
  name = "${var.project}-admin-${var.environment}"
}

resource "aws_iam_policy" "admin" {
  name        = "${var.project}-admin-policy-${var.environment}"
  description = "Admin policy for ${var.project}"
  policy      = file("admin-policy.json")
}

resource "aws_iam_group_policy_attachment" "admin" {
  group      = aws_iam_group.admin.name
  policy_arn = aws_iam_policy.admin.arn
}

resource "aws_iam_role" "ec2" {
  name = "${var.project}-ec2-role-${var.environment}"
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
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket"
  deletion_window_in_days = 10
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.project}-s3-${var.environment}"
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
  tags = {
    Name = "${var.project}-s3-${var.environment}"
  }
}

resource "aws_cloudtrail" "default" {
  name                          = "${var.project}-cloudtrail-${var.environment}"
  s3_bucket_name                = var.s3_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
}

resource "aws_config_configuration_recorder" "default" {
  name     = "${var.project}-config-recorder-${var.environment}"
  role_arn = aws_iam_role.config.arn
}

resource "aws_config_delivery_channel" "default" {
  name     = "${var.project}-config-delivery-channel-${var.environment}"
  s3_bucket_name = var.s3_bucket_name
}

resource "aws_iam_role" "config" {
  name = "${var.project}-config-role-${var.environment}"
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
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "admin@example.com"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "sns_topic_arn" {
  value = module.sns.alerts_arn
}

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}