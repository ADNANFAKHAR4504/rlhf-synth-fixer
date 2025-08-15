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

variable "db_password" {
  description = "Password for the RDS PostgreSQL database."
  type        = string
  sensitive   = true
  # In a real-world scenario, this would be sourced from a secure secrets manager.
}

variable "vpc_cidrs" {
  description = "CIDR blocks for the VPCs in each region."
  type        = map(string)
  default = {
    us-east-1 = "10.10.0.0/16"
    us-west-2 = "10.20.0.0/16"
  }
}

# -----------------------------------------------------------------------------
# GLOBAL & CENTRALIZED RESOURCES (IAM, S3 Logging, CloudTrail)
# -----------------------------------------------------------------------------

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

resource "aws_s3_bucket_policy" "logs" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.logs.id
  policy   = data.aws_iam_policy_document.logs_bucket_policy.json
}

resource "random_password" "db" {
  length           = 20
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>?" # Avoids characters that can break shell scripts or URIs
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

# Multi-region CloudTrail for auditing API calls
resource "aws_cloudtrail" "main" {
  provider                      = aws.useast1
  name                          = "${local.project_name}-${local.environment}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  is_multi_region_trail         = true
  include_global_service_events = true

  tags = local.common_tags
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

# Least-privilege IAM Policy document
data "aws_iam_policy_document" "ec2_policy" {
  # These permissions are required for AWS Systems Manager (SSM) Session Manager
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
    resources = ["*"] # Required by SSM documentation
  }

  # These permissions allow the CloudWatch agent to push logs
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["arn:aws:logs:*:*:*"] # Required for agent to create groups/streams
  }

  # Read-only access to the primary S3 data bucket
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
      Effect = "Allow",
      Action = [
        "s3:GetReplicationConfiguration",
        "s3:ListBucket"
      ],
      Resource = [aws_s3_bucket.primary_data.arn]
      }, {
      Effect = "Allow",
      Action = [
        "s3:GetObjectVersionForReplication",
        "s3:GetObjectVersionAcl",
        "s3:GetObjectVersionTagging"
      ],
      Resource = ["${aws_s3_bucket.primary_data.arn}/*"]
      }, {
      Effect = "Allow",
      Action = [
        "s3:ReplicateObject",
        "s3:ReplicateDelete",
        "s3:ReplicateTags"
      ],
      Resource = ["${aws_s3_bucket.backup_data.arn}/*"]
      }, {
      # KMS permissions for decrypting source and encrypting destination
      Effect = "Allow",
      Action = [
        "kms:Decrypt"
      ],
      Resource = [aws_kms_key.useast1.arn]
      }, {
      Effect = "Allow",
      Action = [
        "kms:Encrypt"
      ],
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

  # No ingress rules by default. Access is provided by SSM Session Manager.
  # If a bastion were used, we would add:
  # ingress {
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  #   cidr_blocks = ["<bastion_ip>/32"]
  # }

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

  # Allow PostgreSQL traffic only from the EC2 security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_useast1.id]
  }

  egress { # Not strictly necessary, but good practice
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
  engine_version          = "14.5"
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
  deletion_protection     = false # Set to true in a real production environment

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

resource "aws_s3_bucket_replication_configuration" "primary_data_replication" {
  provider   = aws.useast1
  depends_on = [aws_s3_bucket_versioning.primary_data]
  bucket     = aws_s3_bucket.primary_data.id
  role       = aws_iam_role.s3_replication.arn

  rule {
    id     = "crr-rule"
    status = "Enabled"

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
resource "aws_flow_log" "vpc_useast1" {
  provider             = aws.useast1
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.useast1.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-east-1" })
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
  engine_version          = "14.5"
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

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-rds-pg-us-west-2" })
}

# --- S3 Data Buckets ---
resource "aws_s3_bucket" "backup_data" {
  provider = aws.uswest2
  bucket   = "${local.project_name}-${local.environment}-backup-data-${data.aws_caller_identity.current.account_id}"

  tags = local.common_tags
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

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-flow-log-us-west-2" })
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
  auto_accept   = false # We will accept it manually with the accepter resource

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering" })
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.uswest2
  vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id
  auto_accept               = true

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-vpc-peering-accepter" })
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
# NETWORK ACCESS CONTROL LISTS (NACLs)
# -----------------------------------------------------------------------------

# NACL for public subnets in us-east-1
resource "aws_network_acl" "public_useast1" {
  provider = aws.useast1
  vpc_id   = aws_vpc.useast1.id

  # Allow inbound HTTPS (for ALB if needed in future)
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound HTTP (for ALB if needed in future)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
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

  # Allow inbound from VPC CIDR
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-east-1"]
    from_port  = 0
    to_port    = 0
  }

  # Allow inbound from peered VPC
  ingress {
    protocol   = "-1"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidrs["us-west-2"]
    from_port  = 0
    to_port    = 0
  }

  # Allow ephemeral ports for return traffic from internet
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
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

# Associate NACLs with subnets
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

# Repeat similar NACL configuration for us-west-2
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
# RDS PASSWORD MANAGEMENT - Use AWS Secrets Manager instead of random_password
# -----------------------------------------------------------------------------

# Create a secret in Secrets Manager for RDS password
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

# Update IAM policy to allow EC2 instances to read the secret
data "aws_iam_policy_document" "ec2_policy_enhanced" {
  # Include all existing statements from ec2_policy
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

  # New statement for Secrets Manager access
  statement {
    sid    = "AllowSecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [aws_secretsmanager_secret.rds_password.arn]
  }

  # Allow KMS decrypt for secrets
  statement {
    sid    = "AllowKMSDecryptForSecrets"
    effect = "Allow"
    actions = [
      "kms:Decrypt"
    ]
    resources = [
      aws_kms_key.useast1.arn,
      aws_kms_key.uswest2.arn
    ]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values = [
        "secretsmanager.us-east-1.amazonaws.com",
        "secretsmanager.us-west-2.amazonaws.com"
      ]
    }
  }
}

# -----------------------------------------------------------------------------
# ENHANCED S3 BUCKET POLICIES - Add bucket policies for defense in depth
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id
  policy   = data.aws_iam_policy_document.primary_data_bucket_policy.json
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

# -----------------------------------------------------------------------------
# VPC ENDPOINT FOR S3 - Reduce data transfer costs and improve security
# -----------------------------------------------------------------------------

resource "aws_vpc_endpoint" "s3_useast1" {
  provider        = aws.useast1
  vpc_id          = aws_vpc.useast1.id
  service_name    = "com.amazonaws.us-east-1.s3"
  route_table_ids = [aws_route_table.private_useast1.id]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-s3-endpoint-us-east-1" })
}

resource "aws_vpc_endpoint" "s3_uswest2" {
  provider        = aws.uswest2
  vpc_id          = aws_vpc.uswest2.id
  service_name    = "com.amazonaws.us-west-2.s3"
  route_table_ids = [aws_route_table.private_uswest2.id]

  tags = merge(local.common_tags, { Name = "${local.project_name}-${local.environment}-s3-endpoint-us-west-2" })
}

# -----------------------------------------------------------------------------
# CLOUDWATCH LOG GROUPS - Explicit log group creation for better control
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "vpc_flow_logs_useast1" {
  provider          = aws.useast1
  name              = "/aws/vpc/flowlogs/${local.project_name}-${local.environment}-us-east-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.useast1.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_uswest2" {
  provider          = aws.uswest2
  name              = "/aws/vpc/flowlogs/${local.project_name}-${local.environment}-us-west-2"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.uswest2.arn

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# AUTO SCALING FOR EC2 - Add resilience with Auto Scaling Groups
# -----------------------------------------------------------------------------

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
    http_tokens                 = "required" # IMDSv2 enforcement
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Install SSM agent
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent

    # Install CloudWatch agent
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
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 1
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

# Target Tracking Scaling Policy
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

# -----------------------------------------------------------------------------
# RDS AUTOMATED BACKUPS TO ANOTHER REGION
# -----------------------------------------------------------------------------

resource "aws_db_instance_automated_backups_replication" "rds_backup_replication" {
  provider               = aws.useast1
  source_db_instance_arn = aws_db_instance.rds_useast1.arn
  kms_key_id             = aws_kms_key.uswest2.arn
  retention_period       = 7
}

# -----------------------------------------------------------------------------
# CLOUDWATCH DASHBOARDS - Centralized monitoring
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  provider       = aws.useast1
  dashboard_name = "${local.project_name}-${local.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average" }],
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average" }]
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
              dimensions = {
                BucketName  = aws_s3_bucket.primary_data.id
                StorageType = "StandardStorage"
              }
            }],
            ["AWS/S3", "NumberOfObjects", {
              dimensions = {
                BucketName  = aws_s3_bucket.primary_data.id
                StorageType = "AllStorageTypes"
              }
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
# ENHANCED MONITORING - SNS Topic for Alarms
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
  endpoint  = var.alarm_email # Add this variable to your variables
}

# Update existing alarms to use SNS
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

# -----------------------------------------------------------------------------
# COST OPTIMIZATION - S3 Lifecycle Rules
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_lifecycle_configuration" "primary_data" {
  provider = aws.useast1
  bucket   = aws_s3_bucket.primary_data.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

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

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# -----------------------------------------------------------------------------
# ADDITIONAL VARIABLES
# -----------------------------------------------------------------------------

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com" # Change this default
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instances"
  type        = bool
  default     = true # Should be true in production
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
    vpc_id = aws_vpc.uswest2.id
    # FIX: Remove reference to deleted instance
    # ec2_instance_id  = aws_instance.app_uswest2.id
    # ec2_private_ip   = aws_instance.app_uswest2.private_ip
    rds_endpoint       = aws_db_instance.rds_uswest2.endpoint
    backup_data_bucket = aws_s3_bucket.backup_data.bucket
  }
}

# FIX: Add these missing output blocks back
output "central_logging_bucket" {
  description = "The name of the central S3 bucket for all logs."
  value       = aws_s3_bucket.logs.bucket
}

output "vpc_peering_connection_id" {
  description = "The ID of the VPC peering connection between regions."
  value       = aws_vpc_peering_connection.nova_peering.id
}
