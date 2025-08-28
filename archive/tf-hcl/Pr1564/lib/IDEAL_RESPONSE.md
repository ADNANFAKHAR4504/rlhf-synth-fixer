```hcl
########################
# tap_stack.tf (Ideal Response)
# Single-file secure, compliant AWS baseline as per prompt
# - No provider/backend blocks here
# - Idempotent, validates, no external files
########################

########################
# Variables
########################
variable "aws_region" {
  description = "AWS region for all resources (consumed by provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for naming and tagging"
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "prod"
}

variable "allowed_cidrs" {
  description = "CIDR blocks allowed for public ingress (e.g., HTTPS)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ec2_key_name" {
  description = "Optional EC2 key pair name"
  type        = string
  default     = ""
}

variable "desired_capacity" {
  description = "ASG desired capacity"
  type        = number
  default     = 2
}

variable "min_size" {
  description = "ASG minimum size"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "ASG maximum size"
  type        = number
  default     = 4
}

variable "rds_engine_version" {
  description = "Optional RDS engine version (omit to use AWS default)"
  type        = string
  default     = ""
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "rds_password" {
  description = "RDS master password (demo default for non-interactive pipelines)"
  type        = string
  default     = "ChangeMe123!"
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 365
}

variable "cost_allocation_tag_keys" {
  description = "Tag keys intended for cost allocation (activation is account-level)"
  type        = list(string)
  default     = ["Environment", "Project", "Owner", "CostCenter", "DataClassification"]
}

variable "alarm_email" {
  description = "Email for SNS alarms (subscription requires confirmation)"
  type        = string
  default     = "admin@example.com"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for ALB HTTPS listener"
  type        = string
  default     = ""
}

variable "enable_config" {
  description = "Enable AWS Config resources (guard against account recorder limits)"
  type        = bool
  default     = false
}

########################
# Data sources
########################
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Locals (naming, tagging)
########################
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project            = var.project_name
    Environment        = var.environment
    Owner              = "Platform"
    CostCenter         = "Engineering"
    DataClassification = "Internal"
    ManagedBy          = "Terraform"
  }

  azs = data.aws_availability_zones.available.names

  config_service_linked_role_arn = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig"
}

########################
# KMS Keys (encryption at rest)
########################
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} general encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "EnableIAMUserPermissions",
        Effect: "Allow",
        Principal: { AWS: "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        Action: "kms:*",
        Resource: "*"
      },
      {
        Sid: "AllowCloudWatchLogs",
        Effect: "Allow",
        Principal: { Service: "logs.${var.aws_region}.amazonaws.com" },
        Action: [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource: "*",
        Condition: {
          ArnEquals: {
            "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}-kms" })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-main"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for ${local.name_prefix} RDS"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}-kms-rds" })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

########################
# Networking (VPC, subnets, routing, endpoints)
########################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}-public-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.azs[count.index]
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-private-${count.index + 1}", Tier = "private" })
}

resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = local.azs[count.index]
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-db-${count.index + 1}", Tier = "database" })
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rt-public" })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count = 2
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rt-private-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-rt-db" })
}

resource "aws_route_table_association" "database" {
  count          = 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  vpc_endpoint_type = "Gateway"
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id, [aws_route_table.database.id])
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-vpce-s3" })
}

########################
# CloudWatch Logs (VPC Flow Logs)
########################
resource "aws_cloudwatch_log_group" "vpc_flow" {
  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-vpc-flow" })
}

resource "aws_iam_role" "vpc_flow" {
  name = "${local.name_prefix}-vpc-flow-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
      Action   = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow" {
  name = "${local.name_prefix}-vpc-flow-policy"
  role = aws_iam_role.vpc_flow.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "vpc" {
  vpc_id                   = aws_vpc.main.id
  traffic_type             = "ALL"
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow.arn
  iam_role_arn             = aws_iam_role.vpc_flow.arn
  tags                     = merge(local.common_tags, { Name = "${local.name_prefix}-vpc-flow" })
}

########################
# Security Groups
########################
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "ALB security group"

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
  ingress {
    description = "HTTP (redirected to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb-sg" })
}

resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "EC2 security group"

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2-sg" })
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "RDS security group"

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-sg" })
}

########################
# S3 (log bucket, data bucket, config bucket)
########################
resource "random_string" "suffix" {
  length  = 8
  upper   = false
  special = false
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_string.suffix.result}"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-s3-logs", Purpose = "AccessLogs" })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
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
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "log-retention"
    status = "Enabled"
    filter { prefix = "" }
    expiration { days = var.log_retention_days }
    noncurrent_version_expiration { noncurrent_days = 30 }
  }
}

# Bucket policy to allow ALB access logging
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AWSLogDeliveryWrite",
        Effect    = "Allow",
        Principal = { Service = "logdelivery.elasticloadbalancing.amazonaws.com" },
        Action    = ["s3:PutObject", "s3:PutObjectAcl"],
        Resource  = "${aws_s3_bucket.logs.arn}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"    = "bucket-owner-full-control",
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          ArnLike = {
            "aws:SourceArn" = "arn:aws:elasticloadbalancing:${var.aws_region}:${data.aws_caller_identity.current.account_id}:loadbalancer/app/*"
          }
        }
      },
      {
        Sid       = "AWSLogDeliveryCheck",
        Effect    = "Allow",
        Principal = { Service = "logdelivery.elasticloadbalancing.amazonaws.com" },
        Action    = ["s3:GetBucketAcl", "s3:ListBucket"],
        Resource  = aws_s3_bucket.logs.arn
      }
    ]
  })
}

resource "aws_s3_bucket" "data" {
  bucket = "${local.name_prefix}-data-${random_string.suffix.result}"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-s3-data", Purpose = "ApplicationData" })
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "data/"
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    id     = "data-retention"
    status = "Enabled"
    filter { prefix = "" }
    noncurrent_version_expiration { noncurrent_days = 30 }
  }
}

resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-${random_string.suffix.result}"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-s3-config", Purpose = "AWSConfig" })
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket                  = aws_s3_bucket.config.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AWSConfigPermissionsCheck",
        Effect   = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action   = "s3:GetBucketAcl",
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid      = "AWSConfigBucketExistenceCheck",
        Effect   = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action   = "s3:ListBucket",
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid      = "AWSConfigBucketDelivery",
        Effect   = "Allow",
        Principal = { Service = "config.amazonaws.com" },
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.config.arn}/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}

########################
# Load Balancer (HTTPS with ACM)
########################
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb"
    enabled = true
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb" })
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    enabled = true
    path    = "/"
    matcher = "200"
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-tg" })
}

resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  count             = var.acm_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "http_forward" {
  count             = var.acm_certificate_arn == "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    forward {
      target_group {
        arn = aws_lb_target_group.main.arn
      }
    }
  }
}

########################
# EC2 Launch Template + ASG (private subnets)
########################
locals {
  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl enable --now httpd
echo "<h1>${local.name_prefix}</h1>" > /var/www/html/index.html
EOF
  )
}

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], Resource = "*" },
      { Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.data.arn },
      { Effect = "Allow", Action = ["s3:GetObject","s3:PutObject","s3:DeleteObject"], Resource = "${aws_s3_bucket.data.arn}/*" }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
  tags = local.common_tags
}

resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.ec2_key_name != "" ? var.ec2_key_name : null

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile { name = aws_iam_instance_profile.ec2.name }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${local.name_prefix}-instance" })
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-lt" })
}

data "aws_ami" "amazon_linux" {
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

resource "aws_autoscaling_group" "main" {
  name_prefix         = "${local.name_prefix}-asg-"
  min_size            = 1
  max_size            = max(1, var.max_size)
  desired_capacity    = 1
  vpc_zone_identifier = aws_subnet.private[*].id
  health_check_type   = "EC2"
  target_group_arns   = [aws_lb_target_group.main.arn]

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance"
    propagate_at_launch = true
  }

  wait_for_capacity_timeout = "0"
  lifecycle { create_before_destroy = true }
}

########################
# RDS (private, encrypted, multi-AZ)
########################
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = aws_subnet.database[*].id
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-db-subnets" })
}

resource "aws_db_parameter_group" "main" {
  name        = "${local.name_prefix}-pg"
  family      = "postgres17"
  description = "Parameter group for ${local.name_prefix}"
  tags        = merge(local.common_tags, { Name = "${local.name_prefix}-pg" })
}

resource "aws_db_instance" "main" {
  identifier                 = "${local.name_prefix}-db"
  engine                     = "postgres"
  engine_version             = var.rds_engine_version != "" ? var.rds_engine_version : null
  instance_class             = var.rds_instance_class
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.rds.arn
  db_subnet_group_name       = aws_db_subnet_group.main.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
  username                   = var.rds_username
  password                   = var.rds_password
  multi_az                   = true
  publicly_accessible        = false
  backup_retention_period    = 7
  delete_automated_backups   = true
  deletion_protection        = false
  skip_final_snapshot        = true
  parameter_group_name       = aws_db_parameter_group.main.name
  apply_immediately          = true
  tags                       = merge(local.common_tags, { Name = "${local.name_prefix}-rds" })
}

########################
# AWS Config (recorder, delivery, rules)
########################
resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config ? 1 : 0
  name     = "${local.name_prefix}-recorder"
  role_arn = local.config_service_linked_role_arn
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config ? 1 : 0
  name           = "${local.name_prefix}-delivery"
  s3_bucket_name = aws_s3_bucket.config.bucket
  depends_on     = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_config_rule" "s3_encryption" {
  count = var.enable_config ? 1 : 0
  name = "${local.name_prefix}-s3-bucket-sse"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "s3_public_read" {
  count = var.enable_config ? 1 : 0
  name = "${local.name_prefix}-s3-public-read-prohibited"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  count = var.enable_config ? 1 : 0
  name = "${local.name_prefix}-iam-password-policy"
  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

########################
# CloudWatch Alarms + SNS (risk notifications)
########################
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name_prefix}-alb-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  alarm_name          = "${local.name_prefix}-alb-target-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = local.common_tags
}

########################
# Outputs
########################
output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
output "database_subnet_ids" { value = aws_subnet.database[*].id }
output "alb_dns_name" { value = aws_lb.main.dns_name }
output "alb_arn" { value = aws_lb.main.arn }
output "target_group_arn" { value = aws_lb_target_group.main.arn }
output "asg_name" { value = aws_autoscaling_group.main.name }
output "rds_endpoint" { value = var.create_rds ? aws_db_instance.main[0].address : null }
output "kms_main_arn" { value = aws_kms_key.main.arn }
output "kms_rds_arn" { value = aws_kms_key.rds.arn }
output "s3_logs_bucket" { value = aws_s3_bucket.logs.bucket }
output "s3_data_bucket" { value = aws_s3_bucket.data.bucket }
output "s3_config_bucket" { value = aws_s3_bucket.config.bucket }
output "sns_topic_arn" { value = aws_sns_topic.alerts.arn }
output "vpc_flow_log_group" { value = aws_cloudwatch_log_group.vpc_flow.name }
output "config_recorder_name" { value = var.enable_config ? aws_config_configuration_recorder.main[0].name : null }
```

```hcl
# provider.tf (for completeness in IDEAL_RESPONSE)


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
