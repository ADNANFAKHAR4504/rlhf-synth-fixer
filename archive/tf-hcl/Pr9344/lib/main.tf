# Data sources for existing resources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Look for existing VPCs that start with "vpc-"
data "aws_vpcs" "existing" {
  filter {
    name   = "tag:Name"
    values = ["vpc-*"]
  }
}

# Get default VPC as fallback
data "aws_vpc" "default" {
  default = true
}

# Use existing VPC or default VPC
locals {
  # Use first existing VPC with name starting with "vpc-" if available, otherwise use default VPC
  vpc_id = length(data.aws_vpcs.existing.ids) > 0 ? data.aws_vpcs.existing.ids[0] : data.aws_vpc.default.id
}

# Get the selected VPC details
data "aws_vpc" "selected_vpc" {
  id = local.vpc_id
}

# Get existing subnets from the selected VPC
data "aws_subnets" "existing_public" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }

  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

data "aws_subnets" "existing_private" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }

  filter {
    name   = "map-public-ip-on-launch"
    values = ["false"]
  }
}

# Note: Internet Gateway lookup removed for LocalStack compatibility
# If needed for production, uncomment and ensure IGW exists:
# data "aws_internet_gateway" "existing_igw" {
#   filter {
#     name   = "attachment.vpc-id"
#     values = [local.vpc_id]
#   }
# }

# Generate secure random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store the password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.full_prefix}db-password"
  description             = "Database password for RDS instance"
  recovery_window_in_days = 7

  tags = {
    Name = "${local.full_prefix}db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Note: Using existing VPC and subnets instead of creating new ones
# This avoids VPC limit exceeded errors

# Security Groups - Only HTTP and HTTPS allowed
resource "aws_security_group" "web_sg" {
  name_prefix = "${local.full_prefix}web-sg"
  description = "Security group for web servers - HTTP and HTTPS only"
  vpc_id      = local.vpc_id

  # HTTP ingress
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS ingress
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic allowed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.full_prefix}web-sg"
  }
}

# Database Security Group - Only internal access
resource "aws_security_group" "db_sg" {
  name_prefix = "${local.full_prefix}db-sg"
  description = "Security group for database servers"
  vpc_id      = local.vpc_id

  # MySQL/Aurora access from web servers only
  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  tags = {
    Name = "${local.full_prefix}db-sg"
  }
}

# IAM Policies (stored in version control)
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# Least privilege IAM role for EC2 instances
data "aws_iam_policy_document" "ec2_minimal_policy" {
  statement {
    sid    = "CloudWatchMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
      "logs:PutLogEvents",
      "logs:CreateLogGroup",
      "logs:CreateLogStream"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "S3ReadOnly"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = ["${aws_s3_bucket.corp_bucket.arn}/*"]
  }

  statement {
    sid    = "SecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [aws_secretsmanager_secret.db_password.arn]
  }
}

resource "aws_iam_role" "ec2_role" {
  name               = "${local.full_prefix}ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = {
    Name = "${local.full_prefix}ec2-role"
  }
}

resource "aws_iam_policy" "ec2_minimal_policy" {
  name        = "${local.full_prefix}ec2-minimal-policy"
  description = "Minimal policy for EC2 instances following least privilege"
  policy      = data.aws_iam_policy_document.ec2_minimal_policy.json
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_minimal_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.full_prefix}ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# IAM User with MFA requirement for console access
resource "aws_iam_user" "console_user" {
  name = "${local.full_prefix}console-user"
  path = "/"

  tags = {
    Name = "${local.full_prefix}console-user"
  }
}

# Policy requiring MFA for console access
data "aws_iam_policy_document" "mfa_policy" {
  statement {
    sid    = "AllowViewAccountInfo"
    effect = "Allow"
    actions = [
      "iam:GetAccountPasswordPolicy",
      "iam:ListVirtualMFADevices"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowManageOwnPasswords"
    effect = "Allow"
    actions = [
      "iam:ChangePassword",
      "iam:GetUser"
    ]
    resources = ["arn:aws:iam::*:user/$${aws:username}"]
  }

  statement {
    sid    = "AllowManageOwnMFA"
    effect = "Allow"
    actions = [
      "iam:CreateVirtualMFADevice",
      "iam:DeleteVirtualMFADevice",
      "iam:ListMFADevices",
      "iam:EnableMFADevice",
      "iam:ResyncMFADevice"
    ]
    resources = [
      "arn:aws:iam::*:mfa/$${aws:username}",
      "arn:aws:iam::*:user/$${aws:username}"
    ]
  }

  statement {
    sid    = "DenyAllExceptUnlessSignedInWithMFA"
    effect = "Deny"
    not_actions = [
      "iam:CreateVirtualMFADevice",
      "iam:EnableMFADevice",
      "iam:GetUser",
      "iam:ListMFADevices",
      "iam:ListVirtualMFADevices",
      "iam:ResyncMFADevice",
      "sts:GetSessionToken"
    ]
    resources = ["*"]

    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}

resource "aws_iam_policy" "mfa_policy" {
  name        = "${local.full_prefix}mfa-policy"
  description = "Policy requiring MFA for console access"
  policy      = data.aws_iam_policy_document.mfa_policy.json
}

resource "aws_iam_user_policy_attachment" "console_user_mfa" {
  user       = aws_iam_user.console_user.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "random_id" "cloudtrail_suffix" {
  byte_length = 4
}

# S3 Bucket with default encryption
resource "aws_s3_bucket" "corp_bucket" {
  bucket = "${local.full_prefix}secure-bucket-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${local.full_prefix}secure-bucket"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "corp_bucket_encryption" {
  bucket = aws_s3_bucket.corp_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "corp_bucket_pab" {
  bucket = aws_s3_bucket.corp_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "corp_bucket_versioning" {
  bucket = aws_s3_bucket.corp_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# CloudTrail for API logging
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = "${local.full_prefix}cloudtrail-logs-${random_id.cloudtrail_suffix.hex}"

  tags = {
    Name = "${local.full_prefix}cloudtrail-logs"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_encryption" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_pab" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail_bucket.arn]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.full_prefix}cloudtrail"]
    }
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail_bucket.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.full_prefix}cloudtrail"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

resource "aws_cloudtrail" "corp_cloudtrail" {
  name           = "${local.full_prefix}cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_bucket.id

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.corp_bucket.arn}/*",
        "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
      ]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]

  tags = {
    Name = "${local.full_prefix}cloudtrail"
  }
}

# CloudWatch Log Group for API requests
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${local.full_prefix}api-logs"
  retention_in_days = 30

  tags = {
    Name = "${local.full_prefix}api-logs"
  }
}

# Get approved AMI (Amazon Linux 2)
data "aws_ami" "approved_ami" {
  most_recent = true
  owners      = ["amazon"] # Trusted source - Amazon

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template with approved AMI
resource "aws_launch_template" "corp_template" {
  name_prefix   = "${local.full_prefix}template"
  image_id      = data.aws_ami.approved_ami.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region      = data.aws_region.current.name
    secret_name = aws_secretsmanager_secret.db_password.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${local.full_prefix}web-server"
    }
  }

  tags = {
    Name = "${local.full_prefix}launch-template"
  }
}

# Optional EC2 instance for testing
resource "aws_instance" "corp_web_server" {
  count = var.create_ec2_instance ? 1 : 0

  launch_template {
    id      = aws_launch_template.corp_template.id
    version = "$Latest"
  }

  subnet_id = length(data.aws_subnets.existing_public.ids) > 0 ? data.aws_subnets.existing_public.ids[0] : data.aws_subnets.existing_private.ids[0]

  tags = {
    Name = "${local.full_prefix}web-server-instance"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "corp_db_subnet_group" {
  name       = "${local.full_prefix}db-subnet-group"
  subnet_ids = length(data.aws_subnets.existing_private.ids) > 0 ? data.aws_subnets.existing_private.ids : data.aws_subnets.existing_public.ids

  tags = {
    Name = "${local.full_prefix}db-subnet-group"
  }
}

# RDS Instance with encryption at rest and auto-generated password
resource "aws_db_instance" "corp_database" {
  identifier     = "${local.full_prefix}database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true # Encryption at rest enabled

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result # Auto-generated secure password

  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.corp_db_subnet_group.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "${local.full_prefix}database"
  }
}

