Of course. Here is the comprehensive, secure, and production-ready Terraform configuration to provision the specified multi-region AWS infrastructure.

This single `main.tf` file creates all the required resources, adhering strictly to security best practices like the principle of least privilege, data encryption, and network segmentation.

-----

### `main.tf`

```terraform
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

# -----------------------------------------------------------------------------
# GLOBAL & CENTRALIZED RESOURCES
# -----------------------------------------------------------------------------

resource "random_password" "db" {
  length           = 20
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>?"
}

# Central S3 bucket in us-east-1 for storing all logs
resource "aws_s3_bucket" "logs" {
  provider = aws.useast1
  bucket   = "${local.project_name}-${local.environment}-central-logs-${data.aws_caller_identity.current.account_id}"
  tags     = local.common_tags
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

resource "aws_s3_bucket_policy" "logs" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.logs.id
  policy   = data.aws_iam_policy_document.logs_bucket_policy.json
}

# S3 Bucket Policy to allow CloudTrail and VPC Flow Logs services to write to it.
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

resource "aws_iam_policy" "ec2_policy" {
  name        = "${local.project_name}-${local.environment}-ec2-policy"
  description = "Least-privilege policy for EC2 instances"
  policy      = data.aws_iam_policy_document.ec2_policy.json
}

# Least-privilege IAM Policy document for EC2
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

resource "aws_iam_role_policy_attachment" "s3_replication_attach" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication_policy.arn
}

# Data source for current AWS Account ID
data "aws_caller_identity" "current" {}

resource "aws_cloudtrail" "main" {
  provider                      = aws.uswest2
  name                          = "${local.project_name}-${local.environment}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  is_multi_region_trail         = true
  include_global_service_events = true
  tags                          = local.common_tags

  depends_on = [aws_s3_bucket_policy.logs]
}

# RDS Password Management with Secrets Manager
resource "aws_secretsmanager_secret" "rds_password" {
  provider                = aws.useast1
  name                    = "${local.project_name}-${local.environment}-rds-password"
  description             = "Password for RDS PostgreSQL instances"
  recovery_window_in_days = 7
  tags                    = local.common_tags

  replica {
    region = "us-west-2"
  }
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  provider      = aws.useast1
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = random_password.db.result
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
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-kms-key-us-east-1" })
}

# --- Networking ---
resource "aws_vpc" "useast1" {
  provider             = aws.useast1
  cidr_block           = var.vpc_cidrs["us-east-1"]
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-us-east-1" })
}

resource "aws_subnet" "public_useast1" {
  provider                = aws.useast1
  vpc_id                  = aws_vpc.useast1.id
  cidr_block              = "10.10.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-subnet-us-east-1" })
}

resource "aws_subnet" "private_useast1_a" {
  provider          = aws.useast1
  vpc_id            = aws_vpc.useast1.id
  cidr_block        = "10.10.10.0/24"
  availability_zone = "us-east-1a"
  tags              = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-east-1a" })
}

resource "aws_subnet" "private_useast1_b" {
  provider          = aws.useast1
  vpc_id            = aws_vpc.useast1.id
  cidr_block        = "10.10.11.0/24"
  availability_zone = "us-east-1b"
  tags              = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-east-1b" })
}

resource "aws_internet_gateway" "useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id
  tags     = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-igw-us-east-1" })
}

resource "aws_eip" "nat_useast1" {
  provider = aws.useast1
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-eip-us-east-1" })
}

resource "aws_nat_gateway" "useast1" {
  provider      = aws.useast1
  allocation_id = aws_eip.nat_useast1.id
  subnet_id     = aws_subnet.public_useast1.id
  depends_on    = [aws_internet_gateway.useast1]
  tags          = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-gw-us-east-1" })
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

resource "aws_vpc_endpoint" "s3_useast1" {
  provider        = aws.useast1
  vpc_id          = aws_vpc.useast1.id
  service_name    = "com.amazonaws.us-east-1.s3"
  route_table_ids = [aws_route_table.private_useast1.id]
  tags            = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-s3-endpoint-us-east-1" })
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

resource "aws_instance" "app_useast1" {
  provider               = aws.useast1
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_useast1_a.id
  vpc_security_group_ids = [aws_security_group.ec2_useast1.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    encrypted  = true
    kms_key_id = aws_kms_key.useast1.arn
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # Enforce IMDSv2
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-ec2-app-us-east-1" })
}

# --- Database ---
resource "aws_db_subnet_group" "rds_useast1" {
  provider   = aws.useast1
  name       = "${local.project_name}-${local.environment}-rds-sng-us-east-1"
  subnet_ids = [aws_subnet.private_useast1_a.id, aws_subnet.private_useast1_b.id]
  tags       = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sng-us-east-1" })
}

resource "aws_db_instance" "rds_useast1" {
  provider                = aws.useast1
  identifier              = "${local.project_name}-${local.environment}-rds-pg-us-east-1"
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "16.10"
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
  deletion_protection     = false
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-pg-us-east-1" })
}

# --- S3 Data Buckets ---
resource "aws_s3_bucket" "primary_data" {
  provider = aws.useast1
  bucket   = "${local.project_name}-${local.environment}-primary-data-${data.aws_caller_identity.current.account_id}"
  tags     = local.common_tags
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

resource "aws_s3_bucket_replication_configuration" "primary_data_replication" {
  provider   = aws.useast1
  depends_on = [aws_s3_bucket_versioning.primary_data]
  bucket     = aws_s3_bucket.primary_data.id
  role       = aws_iam_role.s3_replication.arn

  rule {
    id     = "crr-rule"
    status = "Enabled"

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

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
resource "aws_sns_topic" "alarms" {
  provider          = aws.useast1
  name              = "${local.project_name}-${local.environment}-alarms"
  kms_master_key_id = aws_kms_key.useast1.id
  tags              = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.useast1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_flow_log" "vpc_useast1" {
  provider             = aws.useast1
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.useast1.id
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-east-1" })
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_useast1" {
  provider            = aws.useast1
  alarm_name          = "${local.project_name}-${local.environment}-ec2-high-cpu-us-east-1"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization in us-east-1"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    InstanceId = aws_instance.app_useast1.id
  }
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
  threshold           = "10000000000" # 10 GB in bytes
  alarm_description   = "This metric monitors RDS free storage space in us-east-1"
  alarm_actions       = [aws_sns_topic.alarms.arn]

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
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-kms-key-us-west-2" })
}

# --- Networking ---
resource "aws_vpc" "uswest2" {
  provider             = aws.uswest2
  cidr_block           = var.vpc_cidrs["us-west-2"]
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-us-west-2" })
}

resource "aws_subnet" "public_uswest2" {
  provider                = aws.uswest2
  vpc_id                  = aws_vpc.uswest2.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-public-subnet-us-west-2" })
}

resource "aws_subnet" "private_uswest2_a" {
  provider          = aws.uswest2
  vpc_id            = aws_vpc.uswest2.id
  cidr_block        = "10.20.10.0/24"
  availability_zone = "us-west-2a"
  tags              = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-west-2a" })
}

resource "aws_subnet" "private_uswest2_b" {
  provider          = aws.uswest2
  vpc_id            = aws_vpc.uswest2.id
  cidr_block        = "10.20.11.0/24"
  availability_zone = "us-west-2b"
  tags              = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-private-subnet-us-west-2b" })
}

resource "aws_internet_gateway" "uswest2" {
  provider = aws.uswest2
  vpc_id   = aws_vpc.uswest2.id
  tags     = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-igw-us-west-2" })
}

resource "aws_eip" "nat_uswest2" {
  provider = aws.uswest2
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-eip-us-west-2" })
}

resource "aws_nat_gateway" "uswest2" {
  provider      = aws.uswest2
  allocation_id = aws_eip.nat_uswest2.id
  subnet_id     = aws_subnet.public_uswest2.id
  depends_on    = [aws_internet_gateway.uswest2]
  tags          = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-nat-gw-us-west-2" })
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

resource "aws_vpc_endpoint" "s3_uswest2" {
  provider        = aws.uswest2
  vpc_id          = aws_vpc.uswest2.id
  service_name    = "com.amazonaws.us-west-2.s3"
  route_table_ids = [aws_route_table.private_uswest2.id]
  tags            = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-s3-endpoint-us-west-2" })
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

resource "aws_instance" "app_uswest2" {
  provider               = aws.uswest2
  ami                    = data.aws_ami.amazon_linux_uswest2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_uswest2_a.id
  vpc_security_group_ids = [aws_security_group.ec2_uswest2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    encrypted  = true
    kms_key_id = aws_kms_key.uswest2.arn
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # Enforce IMDSv2
  }

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-ec2-app-us-west-2" })
}

# --- Database ---
resource "aws_db_subnet_group" "rds_uswest2" {
  provider   = aws.uswest2
  name       = "${local.project_name}-${local.environment}-rds-sng-us-west-2"
  subnet_ids = [aws_subnet.private_uswest2_a.id, aws_subnet.private_uswest2_b.id]
  tags       = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-sng-us-west-2" })
}

resource "aws_db_instance" "rds_uswest2" {
  provider                = aws.uswest2
  identifier              = "${local.project_name}-${local.environment}-rds-pg-us-west-2"
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "16.10"
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
  deletion_protection     = false
  tags                    = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-pg-us-west-2" })
}

# --- S3 Data Buckets ---
resource "aws_s3_bucket" "backup_data" {
  provider = aws.uswest2
  bucket   = "${local.project_name}-${local.environment}-backup-data-${data.aws_caller_identity.current.account_id}"
  tags     = local.common_tags
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

# --- Monitoring & Logging ---
resource "aws_flow_log" "vpc_uswest2" {
  provider             = aws.uswest2
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.uswest2.id
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-west-2" })
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_uswest2" {
  provider            = aws.uswest2
  alarm_name          = "${local.project_name}-${local.environment}-ec2-high-cpu-us-west-2"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization in us-west-2"

  dimensions = {
    InstanceId = aws_instance.app_uswest2.id
  }
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
  threshold           = "10000000000" # 10 GB
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
  tags          = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering" })
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.uswest2
  vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id
  auto_accept               = true
  tags                      = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering-accepter" })
}

# --- Route Table Updates for Peering ---
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
# OUTPUTS
# -----------------------------------------------------------------------------

output "primary_region_details" {
  description = "Details for the primary region (us-east-1)"
  value = {
    vpc_id                  = aws_vpc.useast1.id
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
    vpc_id             = aws_vpc.uswest2.id
    ec2_instance_id    = aws_instance.app_uswest2.id
    ec2_private_ip     = aws_instance.app_uswest2.private_ip
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

output "primary_region_vpc_id" {
  description = "The ID of the VPC in the primary region (us-east-1)."
  value       = aws_vpc.useast1.id
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
```

This file should be placed in the same directory as the `main.tf` file. When you run `terraform init`, Terraform will recognize these provider configurations and use them for the resources that specify the `provider` meta-argument (e.g., `provider = aws.useast1`).

-----

### `provider.tf`

```terraform
# /-----------------------------------------------------------------------------
# | Terraform & Provider Configuration
# |-----------------------------------------------------------------------------
terraform {
  # This backend block is required by your CI/CD pipeline.
  # The configuration is passed in dynamically during initialization.
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variable for the default AWS region.
variable "aws_region" {
  description = "The default AWS region for provider configuration."
  type        = string
  default     = "us-west-2"
}

# Default provider configuration for non-regional resources like IAM.
provider "aws" {
  region = var.aws_region
}

# Provider alias for the US East (N. Virginia) region.
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# Provider alias for the US West (Oregon) region.
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
```
