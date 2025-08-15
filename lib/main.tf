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
  default     = "ops@example.com" # Change this default
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instances"
  type        = bool
  default     = false # Set to false for testing
}

# -----------------------------------------------------------------------------
# GLOBAL & CENTRALIZED RESOURCES (IAM, S3 Logging, CloudTrail)
# -----------------------------------------------------------------------------

# Data source for current AWS Account ID
data "aws_caller_identity" "current" {}

# Central S3 bucket in us-east-1 for storing all logs
resource "aws_s3_bucket" "logs" {
  provider = aws.useast1
  bucket   = "${local.project_name}-${local.environment}-central-logs-${data.aws_caller_identity.current.account_id}"

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy to allow CloudTrail and VPC Flow Logs services to write to it
data "aws_iam_policy_document" "logs_bucket_policy" {
  provider = aws.useast1
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.logs.arn]
  }
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
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
    resources = ["${aws_s3_bucket.logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.logs.id
  policy   = data.aws_iam_policy_document.logs_bucket_policy.json

  depends_on = [aws_s3_bucket.logs]
}

# Random password for RDS
resource "random_password" "db" {
  length           = 20
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>?"
}

# Multi-region CloudTrail for auditing API calls
resource "aws_cloudtrail" "main" {
  provider                      = aws.useast1
  name                          = "${local.project_name}-${local.environment}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  is_multi_region_trail         = true
  include_global_service_events = true

  tags = local.common_tags

  depends_on = [aws_s3_bucket_policy.logs]
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
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

# Least-privilege IAM Policy document
data "aws_iam_policy_document" "ec2_policy" {
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
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "${local.project_name}-${local.environment}-ec2-policy"
  description = "Least-privilege policy for EC2 instances"
  policy      = data.aws_iam_policy_document.ec2_policy.json
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.project_name}-${local.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# IAM Role for S3 Replication
resource "aws_iam_role" "s3_replication" {
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

resource "aws_iam_policy" "s3_replication_policy" {
  name = "${local.project_name}-${local.environment}-s3-replication-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ],
        Resource = [aws_s3_bucket.primary_data.arn]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ],
        Resource = ["${aws_s3_bucket.primary_data.arn}/*"]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ],
        Resource = ["${aws_s3_bucket.backup_data.arn}/*"]
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt"],
        Resource = [aws_kms_key.useast1.arn]
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Encrypt"],
        Resource = [aws_kms_key.uswest2.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication_attach" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication_policy.arn
}

# -----------------------------------------------------------------------------
# AWS REGION: us-east-1 (Primary)
# -----------------------------------------------------------------------------

# --- KMS ---
resource "aws_kms_key" "useast1" {
  provider                = aws.useast1
  description             = "KMS key for nova-prod in us-east-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-kms-key-us-east-1" })
}

resource "aws_kms_key_policy" "useast1" {
  provider = aws.useast1
  key_id   = aws_kms_key.useast1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-east-1.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

# --- Networking ---
resource "aws_vpc" "useast1" {
  provider             = aws.useast1
  cidr_block           = var.vpc_cidrs["us-east-1"]
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-us-east-1" })
}

resource "aws_subnet" "public_useast1" {
  provider                = aws.useast1
  vpc_id                  = aws_vpc.useast1.id
  cidr_block              = "10.10.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-subnet-us-east-1" })
}

resource "aws_subnet" "private_useast1_a" {
  provider          = aws.useast1
  vpc_id            = aws_vpc.useast1.id
  cidr_block        = "10.10.10.0/24"
  availability_zone = "us-east-1a"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-east-1a" })
}

resource "aws_subnet" "private_useast1_b" {
  provider          = aws.useast1
  vpc_id            = aws_vpc.useast1.id
  cidr_block        = "10.10.11.0/24"
  availability_zone = "us-east-1b"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-east-1b" })
}

resource "aws_internet_gateway" "useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-igw-us-east-1" })
}

resource "aws_eip" "nat_useast1" {
  provider = aws.useast1
  domain   = "vpc"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-eip-us-east-1" })
}

resource "aws_nat_gateway" "useast1" {
  provider      = aws.useast1
  allocation_id = aws_eip.nat_useast1.id
  subnet_id     = aws_subnet.public_useast1.id
  depends_on    = [aws_internet_gateway.useast1]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-gw-us-east-1" })
}

resource "aws_route_table" "public_useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.useast1.id
  }
  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-rt-us-east-1" })
}

resource "aws_route_table" "private_useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.useast1.id
  }
  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-rt-us-east-1" })
}

resource "aws_route_table_association" "public_useast1" {
  provider       = aws.useast1
  subnet_id      = aws_subnet.public_useast1.id
  route_table_id = aws_route_table.public_useast1.id
}

resource "aws_route_table_association" "private_useast1_a" {
  provider       = aws.useast1
  subnet_id      = aws_subnet.private_useast1_a.id
  route_table_id = aws_route_table.private_useast1.id
}

resource "aws_route_table_association" "private_useast1_b" {
  provider       = aws.useast1
  subnet_id      = aws_subnet.private_useast1_b.id
  route_table_id = aws_route_table.private_useast1.id
}

# --- Security Groups ---
resource "aws_security_group" "ec2_useast1" {
  provider    = aws.useast1
  name        = "${local.project_name}-${local.environment}-ec2-sg"
  description = "Controls access to EC2 instances"
  vpc_id      = aws_vpc.useast1.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-ec2-sg-us-east-1" })
}

resource "aws_security_group" "rds_useast1" {
  provider    = aws.useast1
  name        = "${local.project_name}-${local.environment}-rds-sg"
  description = "Controls access to the RDS instance"
  vpc_id      = aws_vpc.useast1.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_useast1.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sg-us-east-1" })
}

# --- Compute ---
data "aws_ami" "amazon_linux" {
  provider    = aws.useast1
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

# Launch Template for us-east-1
resource "aws_launch_template" "app_useast1" {
  provider      = aws.useast1
  name_prefix   = "${local.project_name}-${local.environment}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_useast1.id]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      encrypted   = true
      kms_key_id  = aws_kms_key.useast1.arn
      volume_size = 20
      volume_type = "gp3"
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-${local.environment}-app-instance"
    })
  }
}

# Auto Scaling Group for us-east-1
resource "aws_autoscaling_group" "app_useast1" {
  provider                  = aws.useast1
  name                      = "${local.project_name}-${local.environment}-asg-us-east-1"
  vpc_zone_identifier       = [aws_subnet.private_useast1_a.id, aws_subnet.private_useast1_b.id]
  min_size                  = 0
  max_size                  = 3
  desired_capacity          = 0
  health_check_type         = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app_useast1.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.project_name}-${local.environment}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# --- Database ---
resource "aws_db_subnet_group" "rds_useast1" {
  provider   = aws.useast1
  name       = "${local.project_name}-${local.environment}-rds-sng-us-east-1"
  subnet_ids = [aws_subnet.private_useast1_a.id, aws_subnet.private_useast1_b.id]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sng-us-east-1" })
}

resource "aws_db_instance" "rds_useast1" {
  provider                = aws.useast1
  identifier              = "${local.project_name}-${local.environment}-rds-pg-us-east-1"
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "14.13"
  instance_class          = "db.t3.micro"
  db_name                 = "novadb"
  username                = "novaadmin"
  password                = random_password.db.result
  db_subnet_group_name    = aws_db_subnet_group.rds_useast1.name
  vpc_security_group_ids  = [aws_security_group.rds_useast1.id]
  skip_final_snapshot     = true
  multi_az                = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.useast1.arn
  publicly_accessible     = false
  backup_retention_period = 7
  deletion_protection     = var.enable_deletion_protection

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-pg-us-east-1" })
}

# --- S3 Data Buckets ---
resource "aws_s3_bucket" "primary_data" {
  provider = aws.useast1
  bucket   = "${local.project_name}-${local.environment}-primary-data-${data.aws_caller_identity.current.account_id}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.useast1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "delete-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

data "aws_iam_policy_document" "primary_data_bucket_policy" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.primary_data.arn,
      "${aws_s3_bucket.primary_data.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "DenyUnencryptedObjectUploads"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.primary_data.arn}/*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}

resource "aws_s3_bucket_policy" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id
  policy   = data.aws_iam_policy_document.primary_data_bucket_policy.json
}

# --- Monitoring & Logging ---
resource "aws_flow_log" "vpc_useast1" {
  provider             = aws.useast1
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.useast1.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-east-1" })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_useast1" {
  provider          = aws.useast1
  name              = "/aws/vpc/flowlogs/${local.project_name}-${local.environment}-us-east-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.useast1.arn

  tags = local.common_tags

  depends_on = [aws_kms_key_policy.useast1]
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_useast1" {
  provider            = aws.useast1
  alarm_name          = "${local.project_name}-${local.environment}-rds-low-storage-us-east-1"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000000000"
  alarm_description   = "This metric monitors RDS free storage space in us-east-1"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.rds_useast1.id
  }
}

# -----------------------------------------------------------------------------
# AWS REGION: us-west-2 (Secondary/DR)
# -----------------------------------------------------------------------------

# --- KMS ---
resource "aws_kms_key" "uswest2" {
  provider                = aws.uswest2
  description             = "KMS key for nova-prod in us-west-2"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-kms-key-us-west-2" })
}

resource "aws_kms_key_policy" "uswest2" {
  provider = aws.uswest2
  key_id   = aws_kms_key.uswest2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-west-2.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

# --- Networking ---
resource "aws_vpc" "uswest2" {
  provider             = aws.uswest2
  cidr_block           = var.vpc_cidrs["us-west-2"]
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-us-west-2" })
}

resource "aws_subnet" "public_uswest2" {
  provider                = aws.uswest2
  vpc_id                  = aws_vpc.uswest2.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-subnet-us-west-2" })
}

resource "aws_subnet" "private_uswest2_a" {
  provider          = aws.uswest2
  vpc_id            = aws_vpc.uswest2.id
  cidr_block        = "10.20.10.0/24"
  availability_zone = "us-west-2a"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-west-2a" })
}

resource "aws_subnet" "private_uswest2_b" {
  provider          = aws.uswest2
  vpc_id            = aws_vpc.uswest2.id
  cidr_block        = "10.20.11.0/24"
  availability_zone = "us-west-2b"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-west-2b" })
}

resource "aws_internet_gateway" "uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-igw-us-west-2" })
}

resource "aws_eip" "nat_uswest2" {
  provider = aws.uswest2
  domain   = "vpc"

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-eip-us-west-2" })
}

resource "aws_nat_gateway" "uswest2" {
  provider      = aws.uswest2
  allocation_id = aws_eip.nat_uswest2.id
  subnet_id     = aws_subnet.public_uswest2.id
  depends_on    = [aws_internet_gateway.uswest2]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-gw-us-west-2" })
}

resource "aws_route_table" "public_uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.uswest2.id
  }
  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-rt-us-west-2" })
}

resource "aws_route_table" "private_uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.uswest2.id
  }
  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-rt-us-west-2" })
}

resource "aws_route_table_association" "public_uswest2" {
  provider       = aws.uswest2
  subnet_id      = aws_subnet.public_uswest2.id
  route_table_id = aws_route_table.public_uswest2.id
}

resource "aws_route_table_association" "private_uswest2_a" {
  provider       = aws.uswest2
  subnet_id      = aws_subnet.private_uswest2_a.id
  route_table_id = aws_route_table.private_uswest2.id
}

resource "aws_route_table_association" "private_uswest2_b" {
  provider       = aws.uswest2
  subnet_id      = aws_subnet.private_uswest2_b.id
  route_table_id = aws_route_table.private_uswest2.id
}

# --- Security Groups ---
resource "aws_security_group" "ec2_uswest2" {
  provider    = aws.uswest2
  name        = "${local.project_name}-${local.environment}-ec2-sg"
  description = "Controls access to EC2 instances"
  vpc_id      = aws_vpc.uswest2.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-ec2-sg-us-west-2" })
}

resource "aws_security_group" "rds_uswest2" {
  provider    = aws.uswest2
  name        = "${local.project_name}-${local.environment}-rds-sg"
  description = "Controls access to the RDS instance"
  vpc_id      = aws_vpc.uswest2.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_uswest2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sg-us-west-2" })
}

# --- Compute ---
data "aws_ami" "amazon_linux_uswest2" {
  provider    = aws.uswest2
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

# --- Database ---
resource "aws_db_subnet_group" "rds_uswest2" {
  provider   = aws.uswest2
  name       = "${local.project_name}-${local.environment}-rds-sng-us-west-2"
  subnet_ids = [aws_subnet.private_uswest2_a.id, aws_subnet.private_uswest2_b.id]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sng-us-west-2" })
}

resource "aws_db_instance" "rds_uswest2" {
  provider                = aws.uswest2
  identifier              = "${local.project_name}-${local.environment}-rds-pg-us-west-2"
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "14.13"
  instance_class          = "db.t3.micro"
  db_name                 = "novadb"
  username                = "novaadmin"
  password                = random_password.db.result
  db_subnet_group_name    = aws_db_subnet_group.rds_uswest2.name
  vpc_security_group_ids  = [aws_security_group.rds_uswest2.id]
  skip_final_snapshot     = true
  multi_az                = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.uswest2.arn
  publicly_accessible     = false
  backup_retention_period = 7
  deletion_protection     = var.enable_deletion_protection

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-pg-us-west-2" })
}

# --- S3 Data Buckets ---
resource "aws_s3_bucket" "backup_data" {
  provider = aws.uswest2
  bucket   = "${local.project_name}-${local.environment}-backup-data-${data.aws_caller_identity.current.account_id}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "backup_data" {
  provider = aws.uswest2
  bucket   = aws_s3_bucket.backup_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_data" {
  provider = aws.uswest2
  bucket   = aws_s3_bucket.backup_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.uswest2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup_data" {
  provider = aws.uswest2
  bucket   = aws_s3_bucket.backup_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Cross-Region Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_data_replication" {
  provider = aws.useast1
  depends_on = [
    aws_s3_bucket_versioning.primary_data,
    aws_s3_bucket_versioning.backup_data
  ]
  bucket = aws_s3_bucket.primary_data.id
  role   = aws_iam_role.s3_replication.arn

  rule {
    id     = "crr-rule"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.backup_data.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.uswest2.arn
      }
    }
  }
}

# --- Monitoring & Logging ---
resource "aws_flow_log" "vpc_uswest2" {
  provider             = aws.uswest2
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.uswest2.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-west-2" })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_uswest2" {
  provider          = aws.uswest2
  name              = "/aws/vpc/flowlogs/${local.project_name}-${local.environment}-us-west-2"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.uswest2.arn

  tags = local.common_tags

  depends_on = [aws_kms_key_policy.uswest2]
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_uswest2" {
  provider            = aws.uswest2
  alarm_name          = "${local.project_name}-${local.environment}-rds-low-storage-us-west-2"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000000000"
  alarm_description   = "This metric monitors RDS free storage space in us-west-2"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.rds_uswest2.id
  }
}

# -----------------------------------------------------------------------------
# VPC PEERING CONNECTION
# -----------------------------------------------------------------------------

resource "aws_vpc_peering_connection" "nova_peering" {
  provider      = aws.useast1
  peer_owner_id = data.aws_caller_identity.current.account_id
  peer_vpc_id   = aws_vpc.uswest2.id
  vpc_id        = aws_vpc.useast1.id
  peer_region   = "us-west-2"
  auto_accept   = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering" })
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.uswest2
  vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id
  auto_accept               = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering-accepter" })
}

# Route Table Updates for Peering
resource "aws_route" "useast1_to_uswest2_private" {
  provider                  = aws.useast1
  route_table_id            = aws_route_table.private_useast1.id
  destination_cidr_block    = aws_vpc.uswest2.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id
}

resource "aws_route" "uswest2_to_useast1_private" {
  provider                  = aws.uswest2
  route_table_id            = aws_route_table.private_uswest2.id
  destination_cidr_block    = aws_vpc.useast1.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id
}

# -----------------------------------------------------------------------------
# NETWORK ACCESS CONTROL LISTS (NACLs)
# -----------------------------------------------------------------------------

# NACL for public subnets in us-east-1
resource "aws_network_acl" "public_useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-nacl-us-east-1" })
}

# NACL for private subnets in us-east-1
resource "aws_network_acl" "private_useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-east-1"]
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "-1"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-west-2"]
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-nacl-us-east-1" })
}

resource "aws_network_acl_association" "public_useast1" {
  provider       = aws.useast1
  network_acl_id = aws_network_acl.public_useast1.id
  subnet_id      = aws_subnet.public_useast1.id
}

resource "aws_network_acl_association" "private_useast1_a" {
  provider       = aws.useast1
  network_acl_id = aws_network_acl.private_useast1.id
  subnet_id      = aws_subnet.private_useast1_a.id
}

resource "aws_network_acl_association" "private_useast1_b" {
  provider       = aws.useast1
  network_acl_id = aws_network_acl.private_useast1.id
  subnet_id      = aws_subnet.private_useast1_b.id
}

# NACL for public subnets in us-west-2
resource "aws_network_acl" "public_uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-nacl-us-west-2" })
}

# NACL for private subnets in us-west-2
resource "aws_network_acl" "private_uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-west-2"]
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "-1"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-east-1"]
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-nacl-us-west-2" })
}

resource "aws_network_acl_association" "public_uswest2" {
  provider       = aws.uswest2
  network_acl_id = aws_network_acl.public_uswest2.id
  subnet_id      = aws_subnet.public_uswest2.id
}

resource "aws_network_acl_association" "private_uswest2_a" {
  provider       = aws.uswest2
  network_acl_id = aws_network_acl.private_uswest2.id
  subnet_id      = aws_subnet.private_uswest2_a.id
}

resource "aws_network_acl_association" "private_uswest2_b" {
  provider       = aws.uswest2
  network_acl_id = aws_network_acl.private_uswest2.id
  subnet_id      = aws_subnet.private_uswest2_b.id
}

# -----------------------------------------------------------------------------
# SECRETS MANAGER FOR RDS PASSWORD
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "rds_password" {
  provider                = aws.useast1
  name                    = "${local.project_name}-${local.environment}-rds-password"
  description             = "Password for RDS PostgreSQL instances"
  recovery_window_in_days = 7

  replica {
    region = "us-west-2"
  }

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  provider      = aws.useast1
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = random_password.db.result
}

# -----------------------------------------------------------------------------
# MONITORING AND ALARMS
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alarms" {
  provider = aws.useast1
  name     = "${local.project_name}-${local.environment}-alarms"

  kms_master_key_id = aws_kms_key.useast1.id

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.useast1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high_useast1" {
  provider            = aws.useast1
  alarm_name          = "${local.project_name}-${local.environment}-ec2-cpu-high-us-east-1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "EC2 CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_useast1.name
  }
}

resource "aws_autoscaling_policy" "cpu_target_useast1" {
  provider               = aws.useast1
  name                   = "${local.project_name}-${local.environment}-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.app_useast1.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_db_instance_automated_backups_replication" "rds_backup_replication" {
  provider               = aws.useast1
  source_db_instance_arn = aws_db_instance.rds_useast1.arn
  kms_key_id             = aws_kms_key.uswest2.arn
  retention_period       = 7
}

resource "aws_cloudwatch_dashboard" "main" {
  provider       = aws.useast1
  dashboard_name = "${local.project_name}-${local.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization"],
            ["AWS/RDS", "CPUUtilization"],
            ["AWS/RDS", "DatabaseConnections"],
            ["AWS/RDS", "FreeStorageSpace"]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Resource Utilization - US East 1"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", {
              BucketName  = aws_s3_bucket.primary_data.id
              StorageType = "StandardStorage"
            }],
            ["AWS/S3", "NumberOfObjects", {
              BucketName  = aws_s3_bucket.primary_data.id
              StorageType = "AllStorageTypes"
            }]
          ]
          period = 86400
          stat   = "Average"
          region = "us-east-1"
          title  = "S3 Storage Metrics"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# OUTPUTS
# -----------------------------------------------------------------------------

output "primary_region_details" {
  description = "Details for the primary region (us-east-1)"
  value = {
    vpc_id              = aws_vpc.useast1.id
    ec2_asg_name        = aws_autoscaling_group.app_useast1.name
    rds_endpoint        = aws_db_instance.rds_useast1.endpoint
    primary_data_bucket = aws_s3_bucket.primary_data.bucket
  }
}

output "secondary_region_details" {
  description = "Details for the secondary region (us-west-2)"
  value = {
    vpc_id             = aws_vpc.uswest2.id
    rds_endpoint       = aws_db_instance.rds_uswest2.endpoint
    backup_data_bucket = aws_s3_bucket.backup_data.bucket
  }
}

output "central_logging_bucket" {
  description = "The name of the central S3 bucket for all logs."
  value       = aws_s3_bucket.logs.bucket
}

output "vpc_peering_connection_id" {
  description = "The ID of the VPC peering connection between regions."
  value       = aws_vpc_peering_connection.nova_peering.id
}
