
```hcl
## provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```
```hcl
## lib/terraform.auto.tfvars
aws_region = "eu-central-1"
```

```hcl
#############################################
# Variables
#############################################

variable "aws_region" {
  description = "AWS region for the deployment. Supplied by CI. No default; validated to be a valid region pattern."
  type        = string
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d$", var.aws_region))
    error_message = "aws_region must look like 'us-east-1', 'us-west-2', 'eu-central-1', etc."
  }
}

variable "project_name" {
  description = "Logical project name used for naming and tagging."
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment identifier (e.g., dev, stage, prod)."
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner or team responsible for the stack."
  type        = string
  default     = "platform"
}

variable "cost_center" {
  description = "Cost center code for chargeback/showback."
  type        = string
  default     = "cc-0000"
}

variable "ip_allowlist" {
  description = "List of IPv4 CIDR blocks allowed for selected, IP-restricted access (e.g., corporate egress ranges). If empty, IP-based deny is skipped."
  type        = list(string)
  default     = []
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "Two private subnet CIDRs (distinct AZs)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Two public subnet CIDRs (distinct AZs)."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "enable_cloudfront" {
  description = "Whether to create a basic CloudFront distribution (WAF can be associated)."
  type        = bool
  default     = false
}

variable "enable_shield_advanced" {
  description = "Whether to enable AWS Shield Advanced on the CloudFront distribution (requires enterprise subscription)."
  type        = bool
  default     = false
}

variable "waf_firehose_arn" {
  description = "Optional Kinesis Firehose Delivery Stream ARN for WAF logging. If empty, WAF logging is not configured."
  type        = string
  default     = ""
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrency setting for Lambda."
  type        = number
  default     = 10 # AWS minimum for unreserved concurrency
}

variable "allowed_ssh_cidrs" {
  description = "CIDR ranges allowed to SSH to the example EC2 (keep empty to deny SSH from public Internet)."
  type        = list(string)
  default     = []
}

variable "rds_instance_class" {
  description = "RDS instance class for PostgreSQL."
  type        = string
  default     = "db.t4g.micro"
}

variable "lambda_heartbeat_rate" {
  description = "EventBridge schedule expression for the heartbeat lambda."
  type        = string
  default     = "rate(5 minutes)"
}

variable "tags" {
  description = "Additional free-form tags to merge with mandatory tags."
  type        = map(string)
  default     = {}
}

#############################################
# Randomized suffix for names (avoid CI collisions)
#############################################

resource "random_id" "suffix" {
  byte_length = 4
}

#############################################
# Locals
#############################################

locals {
  base_tags = merge(
    {
      "Environment"     = var.environment
      "Owner"           = var.owner
      "CostCenter"      = var.cost_center
      "project"         = var.project_name
      "iac-rlhf-amazon" = "true"
    },
    var.tags
  )

  name_prefix         = "${var.project_name}-${var.environment}"
  unique_suffix       = lower(random_id.suffix.hex)
  unique_prefix       = "${local.name_prefix}-${local.unique_suffix}"
  waf_logging_enabled = length(var.waf_firehose_arn) > 0
}

#############################################
# Data Sources
#############################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Latest AL2023 AMI
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

locals {
  arn_lambda_basic = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  arn_lambda_vpc   = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

#############################################
# KMS Key for cross-service encryption
#############################################

resource "aws_kms_key" "platform" {
  description             = "KMS CMK for ${local.unique_prefix} platform resources (S3, CloudWatch Logs, etc.)."
  enable_key_rotation     = true
  deletion_window_in_days = 10
  tags                    = local.base_tags

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Id": "key-default-1",
  "Statement": [
    {
      "Sid": "Allow account root full access",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudTrail to use the key",
      "Effect": "Allow",
      "Principal": { "Service": "cloudtrail.amazonaws.com" },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs use of the key",
      "Effect": "Allow",
      "Principal": { "Service": "logs.${data.aws_region.current.id}.amazonaws.com" },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowCloudWatchLogsWithContextForTrailGroup",
      "Effect": "Allow",
      "Principal": { "Service": "logs.${data.aws_region.current.id}.amazonaws.com" },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey",
        "kms:CreateGrant",
        "kms:ListGrants"
      ],
      "Resource": "*",
      "Condition": {
        "Bool": { "kms:GrantIsForAWSResource": "true" },
        "ArnEquals": {
          "kms:EncryptionContext:aws:logs:arn": "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${local.unique_prefix}"
        }
      }
    }
  ]
}
EOF
}

resource "aws_kms_alias" "platform" {
  name          = "alias/${local.unique_prefix}-platform"
  target_key_id = aws_kms_key.platform.key_id
}

#############################################
# VPC & Networking (2x public + 2x private)
#############################################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.base_tags, { "Name" = "${local.unique_prefix}-igw" })
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[0]
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-public-a", "Tier" = "public" })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[1]
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-public-b", "Tier" = "public" })
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[0]
  availability_zone = data.aws_availability_zones.available.names[0]
  tags              = merge(local.base_tags, { "Name" = "${local.unique_prefix}-private-a", "Tier" = "private" })
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[1]
  availability_zone = data.aws_availability_zones.available.names[1]
  tags              = merge(local.base_tags, { "Name" = "${local.unique_prefix}-private-b", "Tier" = "private" })
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(local.base_tags, { "Name" = "${local.unique_prefix}-nat-eip" })
}

resource "aws_nat_gateway" "nat_a" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id
  tags          = merge(local.base_tags, { "Name" = "${local.unique_prefix}-nat-a" })
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.base_tags, { "Name" = "${local.unique_prefix}-public-rt" })
}

resource "aws_route" "public_igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.base_tags, { "Name" = "${local.unique_prefix}-private-rt" })
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_a.id
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

#############################################
# S3: CloudTrail bucket (secure posture)
#############################################

resource "aws_s3_bucket" "trail" {
  bucket        = "${local.unique_prefix}-trail-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = merge(local.base_tags, { "Name" = "${local.unique_prefix}-trail" })
}

resource "aws_s3_bucket_versioning" "trail" {
  bucket = aws_s3_bucket.trail.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "trail" {
  bucket                  = aws_s3_bucket.trail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "trail" {
  bucket = aws_s3_bucket.trail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.platform.arn
    }
    bucket_key_enabled = true
  }
}

# Combine IP restriction into a single policy document using a conditional block
data "aws_iam_policy_document" "trail_bucket_policy" {
  statement {
    sid     = "AWSCloudTrailAclCheck"
    effect  = "Allow"
    actions = ["s3:GetBucketAcl"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    resources = [aws_s3_bucket.trail.arn]
  }
  statement {
    sid     = "AWSCloudTrailWrite"
    effect  = "Allow"
    actions = ["s3:PutObject"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    resources = ["${aws_s3_bucket.trail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [aws_s3_bucket.trail.arn, "${aws_s3_bucket.trail.arn}/*"]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
  dynamic "statement" {
    for_each = length(var.ip_allowlist) > 0 ? [1] : []
    content {
      sid     = "DenyNonAllowlistedIPs"
      effect  = "Deny"
      actions = ["s3:*"]
      principals {
        type        = "*"
        identifiers = ["*"]
      }
      resources = [aws_s3_bucket.trail.arn, "${aws_s3_bucket.trail.arn}/*"]
      condition {
        test     = "NotIpAddress"
        variable = "aws:SourceIp"
        values   = var.ip_allowlist
      }
      condition {
        test     = "StringNotEquals"
        variable = "aws:PrincipalService"
        values   = ["cloudtrail.amazonaws.com"]
      }
    }
  }
}

locals {
  trail_bucket_policy_json = data.aws_iam_policy_document.trail_bucket_policy.json
}

resource "aws_s3_bucket_policy" "trail" {
  bucket = aws_s3_bucket.trail.id
  policy = local.trail_bucket_policy_json
  depends_on = [
    aws_kms_key.platform,
    aws_s3_bucket_server_side_encryption_configuration.trail
  ]
}

#############################################
# CloudTrail + CloudWatch Logs
#############################################

resource "aws_cloudwatch_log_group" "trail" {
  name              = "/aws/cloudtrail/${local.unique_prefix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.platform.arn
  tags              = local.base_tags
}

resource "aws_iam_role" "cloudtrail_to_cwl" {
  name = "${local.unique_prefix}-cloudtrail-cwl-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "cloudtrail.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = local.base_tags
}

resource "aws_iam_role_policy" "cloudtrail_to_cwl" {
  name = "${local.unique_prefix}-cloudtrail-cwl"
  role = aws_iam_role.cloudtrail_to_cwl.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { "Effect": "Allow", "Action": ["logs:CreateLogGroup","logs:DescribeLogGroups"], "Resource": "*" },
      {
        "Effect": "Allow",
        "Action": ["logs:CreateLogStream","logs:PutLogEvents"],
        "Resource": [
          "${aws_cloudwatch_log_group.trail.arn}:*",
          "${aws_cloudwatch_log_group.trail.arn}:log-stream:*"
        ]
      }
    ]
  })
}

resource "aws_cloudtrail" "org" {
  name                          = "${local.unique_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  cloud_watch_logs_group_arn    = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${local.unique_prefix}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_to_cwl.arn
  kms_key_id                    = aws_kms_key.platform.arn
  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
  tags = local.base_tags
  depends_on = [
    aws_cloudwatch_log_group.trail,
    aws_kms_key.platform,
    aws_iam_role_policy.cloudtrail_to_cwl,
    aws_s3_bucket_policy.trail
  ]
}

resource "aws_cloudwatch_log_metric_filter" "console_login_failures" {
  name           = "${local.unique_prefix}-console-login-failures"
  log_group_name = aws_cloudwatch_log_group.trail.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.responseElements.ConsoleLogin = Failure) }"
  metric_transformation {
    name      = "${local.unique_prefix}-ConsoleLoginFailureCount"
    namespace = "Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "console_login_failures" {
  alarm_name          = "${local.unique_prefix}-ConsoleLoginFailuresAlarm"
  alarm_description   = "Alerts when there are failed AWS Console logins."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.console_login_failures.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.console_login_failures.metric_transformation[0].namespace
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  tags                = local.base_tags
}

#############################################
# IAM (example): role with IP-based restriction
#############################################

resource "aws_iam_role" "ip_restricted_role" {
  name = "${local.unique_prefix}-ip-restricted-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root" },
      Action = "sts:AssumeRole",
      Condition = { IpAddress = { "aws:SourceIp" : var.ip_allowlist } }
    }]
  })
  tags = local.base_tags
}

resource "aws_iam_role_policy" "ip_restricted_policy" {
  name = "${local.unique_prefix}-ip-restricted-policy"
  role = aws_iam_role.ip_restricted_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:GetObject","s3:ListBucket"],
      Resource = [aws_s3_bucket.trail.arn, "${aws_s3_bucket.trail.arn}/*"],
      Condition = { IpAddress = { "aws:SourceIp" : var.ip_allowlist } }
    }]
  })
}

#############################################
# Security Groups
#############################################

resource "aws_security_group" "web" {
  name        = "${local.unique_prefix}-web-sg"
  description = "Security group for public web instance"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      description = "SSH from allowed corporate ranges"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-web-sg" })
}

resource "aws_security_group" "db" {
  name        = "${local.unique_prefix}-db-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-db-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "db_from_lambda" {
  security_group_id            = aws_security_group.db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.lambda.id
  description                  = "PostgreSQL from Lambda"
}

resource "aws_vpc_security_group_ingress_rule" "db_from_web" {
  security_group_id            = aws_security_group.db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.web.id
  description                  = "PostgreSQL from Web (optional)"
}

resource "aws_security_group" "lambda" {
  name        = "${local.unique_prefix}-lambda-sg"
  description = "Security group for Lambda functions in VPC"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-lambda-sg" })
}

#############################################
# EC2: Public instance (AL2023, IMDSv2, nginx) — SSM-managed
#############################################

resource "aws_iam_role" "ec2_ssm_role" {
  name = "${local.unique_prefix}-ec2-ssm-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = local.base_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "web" {
  name = "${local.unique_prefix}-web-instance-profile"
  role = aws_iam_role.ec2_ssm_role.name
  tags = local.base_tags
}
# --- API GW -> EC2 (public HTTP proxy) *add-on* ---
resource "aws_apigatewayv2_integration" "ec2_proxy" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "http://${aws_instance.web.public_ip}/" # Nginx on 80
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "ec2_proxy" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /ec2"
  target    = "integrations/${aws_apigatewayv2_integration.ec2_proxy.id}"
}
resource "aws_instance" "web" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.web.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail
              dnf -y install nginx
              systemctl enable nginx
              echo "<h1>${local.unique_prefix}: hello from EC2</h1>" > /usr/share/nginx/html/index.html
              systemctl restart nginx
              EOF

  tags = merge(local.base_tags, { "Name" = "${local.unique_prefix}-web" })
}



#############################################
# RDS PostgreSQL: private, encrypted, SSL enforced
#############################################

resource "random_password" "db_master_password" {
  length  = 24
  special = true
}

resource "aws_ssm_parameter" "db_master_password" {
  name   = "/${local.unique_prefix}/rds/master_password"
  type   = "SecureString"
  value  = random_password.db_master_password.result
  key_id = aws_kms_key.platform.key_id
  tags   = local.base_tags
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.unique_prefix}-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = local.base_tags
}

resource "aws_db_parameter_group" "pg" {
  name        = "${local.unique_prefix}-pg-params"
  family      = "postgres16"
  description = "Force SSL for ${local.unique_prefix} RDS"
  tags        = local.base_tags

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_db_instance" "pg" {
  identifier             = "${local.unique_prefix}-pg"
  engine                 = "postgres"
  engine_version         = "16.4"
  instance_class         = var.rds_instance_class
  allocated_storage      = 20
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  username               = "masteruser"
  password               = random_password.db_master_password.result
  multi_az               = false
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.platform.arn
  skip_final_snapshot    = true
  deletion_protection    = false
  publicly_accessible    = false
  parameter_group_name   = aws_db_parameter_group.pg.name
  apply_immediately      = true
  tags                   = merge(local.base_tags, { "Name" = "${local.unique_prefix}-pg" })
}

#############################################
# App S3 bucket for Lambda heartbeats
#############################################

resource "aws_s3_bucket" "app" {
  bucket        = "${local.unique_prefix}-app-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = merge(local.base_tags, { "Name" = "${local.unique_prefix}-app" })
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket                  = aws_s3_bucket.app.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#############################################
# Lambda (VPC-enabled) + EventBridge + API Gateway (IAM)
#############################################

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_heartbeat.zip"
  source {
    filename = "app.py"
    content  = <<EOF
import os, json, time
import urllib.request
import boto3

S3_BUCKET   = os.environ["APP_BUCKET"]
RDS_HOST    = os.environ.get("RDS_HOST", "")
RDS_USER    = os.environ.get("RDS_USER", "masteruser")
SSM_PARAM   = os.environ.get("RDS_PASSWORD_PARAM", "")
ENABLE_DB   = os.environ.get("ENABLE_DB_TESTS", "0") == "1"

def _ip():
    with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=10) as r:
        return json.loads(r.read())["ip"]

def _db_ping():
    import psycopg2
    ssm = boto3.client("ssm")
    pw  = ssm.get_parameter(Name=SSM_PARAM, WithDecryption=True)["Parameter"]["Value"]
    conn = psycopg2.connect(
        host=RDS_HOST, user=RDS_USER, password=pw, dbname="postgres",
        sslmode="require", connect_timeout=10,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("CREATE TABLE IF NOT EXISTS tap_smoke(x int);")
            cur.execute("INSERT INTO tap_smoke(x) VALUES (1);")
            cur.execute("SELECT COUNT(*) FROM tap_smoke;")
            return cur.fetchone()[0]
    finally:
        conn.commit()
        conn.close()

def handler(event, context):
    now  = int(time.time())
    ip   = _ip()
    result = {"ts": now, "public_ip": ip}
    if ENABLE_DB and RDS_HOST and SSM_PARAM:
        try:
            cnt = _db_ping()
            result["db_rows"] = cnt
        except Exception as e:
            result["db_error"] = str(e)[:200]
    s3 = boto3.client("s3")
    key = f"heartbeats/{now}.json"
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(result).encode("utf-8"))
    return {"statusCode": 200, "body": json.dumps(result)}
EOF
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "${local.unique_prefix}-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = local.base_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = local.arn_lambda_basic
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = local.arn_lambda_vpc
}

data "aws_iam_policy_document" "lambda_extra" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.db_master_password.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.app.arn}/*"]
  }
  statement {
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.platform.arn]
  }
}

resource "aws_iam_policy" "lambda_extra" {
  name   = "${local.unique_prefix}-lambda-extra"
  policy = data.aws_iam_policy_document.lambda_extra.json
  tags   = local.base_tags
}

resource "aws_iam_role_policy_attachment" "lambda_extra_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_extra.arn
}

resource "aws_lambda_function" "heartbeat" {
  function_name                  = "${local.unique_prefix}-heartbeat"
  role                           = aws_iam_role.lambda_exec.arn
  handler                        = "app.handler"
  runtime                        = "python3.12"
  filename                       = data.archive_file.lambda_zip.output_path
  timeout                        = 20

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT        = var.environment
      APP_BUCKET         = aws_s3_bucket.app.id
      RDS_HOST           = aws_db_instance.pg.address
      RDS_USER           = "masteruser"
      RDS_PASSWORD_PARAM = aws_ssm_parameter.db_master_password.name
      ENABLE_DB_TESTS    = "0"
    }
  }

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  tags = local.base_tags
}

resource "aws_cloudwatch_event_rule" "heartbeat" {
  name                = "${local.unique_prefix}-heartbeat"
  schedule_expression = var.lambda_heartbeat_rate
  tags                = local.base_tags
}

resource "aws_cloudwatch_event_target" "heartbeat" {
  rule      = aws_cloudwatch_event_rule.heartbeat.name
  target_id = "lambda"
  arn       = aws_lambda_function.heartbeat.arn
}

resource "aws_lambda_permission" "events_invoke_heartbeat" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.heartbeat.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.heartbeat.arn
}

# API Gateway (IAM auth) → heartbeat lambda
resource "aws_apigatewayv2_api" "http" {
  name          = "${local.unique_prefix}-http-api"
  protocol_type = "HTTP"
  tags          = local.base_tags
}

resource "aws_apigatewayv2_integration" "heartbeat" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.heartbeat.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "root" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "$default"
  target             = "integrations/${aws_apigatewayv2_integration.heartbeat.id}"
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
  tags        = local.base_tags
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowInvokeFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.heartbeat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

#############################################
# WAFv2 Web ACL (regional) + association + optional logging
#############################################

resource "aws_wafv2_web_acl" "api" {
  name        = "${local.unique_prefix}-waf"
  description = "Basic WAFv2 for the API regional"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action {
      none {}
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.unique_prefix}-waf-common"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.unique_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.base_tags
}

# HTTP API stages can't be associated directly with WAFv2 — keep disabled
resource "aws_wafv2_web_acl_association" "api_stage" {
  count        = 0
  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

resource "aws_wafv2_web_acl_logging_configuration" "api" {
  count = local.waf_logging_enabled ? 1 : 0
  resource_arn            = aws_wafv2_web_acl.api.arn
  log_destination_configs = [var.waf_firehose_arn]
  redacted_fields {
    single_header {
      name = "authorization"
    }
  }
}

#############################################
# (Optional) CloudFront + (Optional) Shield Advanced
#############################################

resource "aws_cloudfront_origin_access_control" "oac" {
  count                              = var.enable_cloudfront ? 1 : 0
  name                               = "${local.unique_prefix}-oac"
  description                        = "OAC for ${local.unique_prefix}"
  origin_access_control_origin_type  = "s3"
  signing_behavior                   = "always"
  signing_protocol                   = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  count = var.enable_cloudfront ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.unique_prefix} distribution"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.trail.bucket_regional_domain_name
    origin_id                = "trail-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac[0].id
  }

  default_cache_behavior {
    target_origin_id       = "trail-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.base_tags
}

##############################################
# Outputs
#############################################

output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  description = "IDs of the private subnets."
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "subnet_azs" {
  description = "AZs used for the subnets."
  value       = [
    aws_subnet.public_a.availability_zone,
    aws_subnet.public_b.availability_zone
  ]
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway."
  value       = aws_internet_gateway.igw.id
}

output "public_route_table_id" {
  description = "ID of the public route table."
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table."
  value       = aws_route_table.private.id
}

output "security_group_web_id" {
  description = "Security Group ID for the web instance."
  value       = aws_security_group.web.id
}

output "security_group_db_id" {
  description = "Security Group ID for the RDS database."
  value       = aws_security_group.db.id
}

output "security_group_lambda_id" {
  description = "Security Group ID for VPC Lambda."
  value       = aws_security_group.lambda.id
}

output "ec2_instance_id" {
  description = "EC2 instance ID for the public web node."
  value       = aws_instance.web.id
}

output "ec2_public_ip" {
  description = "Public IP of the web instance."
  value       = aws_instance.web.public_ip
}

output "api_invoke_url" {
  description = "Invoke URL for the HTTP API ($default stage)."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the heartbeat Lambda function."
  value       = aws_lambda_function.heartbeat.function_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint."
  value       = aws_db_instance.pg.address
}

output "trail_bucket_name" {
  description = "S3 bucket name used for CloudTrail."
  value       = aws_s3_bucket.trail.id
}

output "cloudtrail_name" {
  description = "Name of the multi-region CloudTrail."
  value       = aws_cloudtrail.org.name
}

output "app_bucket_name" {
  description = "S3 bucket for heartbeat outputs."
  value       = aws_s3_bucket.app.id
}
output "cloudtrail_log_group_name" {
  description = "CloudTrail log group name"
  value       = aws_cloudwatch_log_group.trail.name
}

output "platform_kms_key_arn" {
  description = "CMK ARN used across the stack"
  value       = aws_kms_key.platform.arn
}