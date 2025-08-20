variable "environment_suffix" {
  type        = string
  default     = "dev"
  description = "Environment suffix for resource naming"
}

variable "aws_region" {
  type        = string
  default     = "us-west-1"
  description = "AWS region (provider uses this in provider.tf)"
}

variable "allowed_https_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "CIDRs allowed to reach the app tier on HTTPS"
}

variable "bastion_ingress_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "CIDRs allowed to SSH to the bastion"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.20.0.0/16"
  description = "VPC CIDR block"
}

variable "app_instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 instance type for app tier"
}

variable "bastion_instance_type" {
  type        = string
  default     = "t3.micro"
  description = "EC2 instance type for bastion"
}

variable "asg_min_size" {
  type        = number
  default     = 2
  description = "ASG minimum size"
}

variable "asg_max_size" {
  type        = number
  default     = 10
  description = "ASG maximum size"
}

variable "asg_desired_capacity" {
  type        = number
  default     = 3
  description = "ASG desired capacity"
}

variable "rds_instance_class" {
  type        = string
  default     = "db.t3.micro"
  description = "RDS instance class"
}

variable "rds_allocated_storage" {
  type        = number
  default     = 20
  description = "RDS allocated storage in GB"
}

variable "rds_username" {
  type        = string
  default     = "dbadmin"
  description = "RDS master username"
}

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev"

  common_tags = {
    Environment = "prod"
    Project     = "secure-stack"
    ManagedBy   = "terraform"
    Suffix      = local.env_suffix
  }

  azs = data.aws_availability_zones.available.names

  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 1),
    cidrsubnet(var.vpc_cidr, 8, 2)
  ]

  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 11),
    cidrsubnet(var.vpc_cidr, 8, 12)
  ]

  db_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 21),
    cidrsubnet(var.vpc_cidr, 8, 22)
  ]

  sg_change_events = [
    "CreateSecurityGroup",
    "AuthorizeSecurityGroupIngress",
    "AuthorizeSecurityGroupEgress",
    "RevokeSecurityGroupIngress",
    "RevokeSecurityGroupEgress",
    "DeleteSecurityGroup"
  ]
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_caller_identity" "current" {}

resource "random_password" "rds" {
  length           = 16
  special          = true
  override_special = "!#$%&*+-=?^_{|}~"
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "prod-terraform-state-lock-${local.env_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  stream_enabled = false

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = merge(local.common_tags, {
    Name = "prod-terraform-state-lock-${local.env_suffix}"
  })
}

resource "aws_kms_key" "general" {
  description             = "General purpose KMS key for prod environment ${local.env_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "EnableIAMUserPermissions",
        Effect    = "Allow",
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        Action    = "kms:*",
        Resource  = "*"
      },
      {
        Sid       = "AllowCloudWatchLogs",
        Effect    = "Allow",
        Principal = { Service = "logs.${var.aws_region}.amazonaws.com" },
        Action    = ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:CreateGrant", "kms:DescribeKey"],
        Resource  = "*",
        Condition = {
          ArnLike = { "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*" }
        }
      },
      {
        Sid       = "AllowRDS",
        Effect    = "Allow",
        Principal = { Service = "rds.amazonaws.com" },
        Action    = ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant", "kms:DescribeKey"],
        Resource  = "*"
      },
      {
        Sid       = "AllowSNS",
        Effect    = "Allow",
        Principal = { Service = "sns.amazonaws.com" },
        Action    = ["kms:Decrypt", "kms:GenerateDataKey*", "kms:CreateGrant", "kms:DescribeKey"],
        Resource  = "*",
        Condition = { StringEquals = { "aws:SourceAccount" = "${data.aws_caller_identity.current.account_id}" } }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "prod-general-kms-key-${local.env_suffix}"
  })
}

resource "aws_kms_alias" "general" {
  name          = "alias/prod-general-${local.env_suffix}"
  target_key_id = aws_kms_key.general.key_id
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "prod-vpc-${local.env_suffix}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "prod-igw-${local.env_suffix}"
  })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "prod-public-subnet-${count.index + 1}-${local.env_suffix}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "prod-private-subnet-${count.index + 1}-${local.env_suffix}"
    Type = "private"
  })
}

resource "aws_subnet" "db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "prod-db-subnet-${count.index + 1}-${local.env_suffix}"
    Type = "database"
  })
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "prod-nat-eip-${count.index + 1}-${local.env_suffix}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "prod-nat-gateway-${count.index + 1}-${local.env_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "prod-public-rt-${local.env_suffix}"
  })
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "prod-private-rt-${count.index + 1}-${local.env_suffix}"
  })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "db" {
  count          = 2
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
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
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 22
    to_port    = 22
  }
  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  egress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = merge(local.common_tags, { Name = "prod-public-nacl-${local.env_suffix}" })
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = concat(aws_subnet.private[*].id, aws_subnet.db[*].id)

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 22
    to_port    = 22
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }
  egress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = merge(local.common_tags, { Name = "prod-private-nacl-${local.env_suffix}" })
}

resource "aws_security_group" "bastion" {
  name        = "prod-bastion-sg-${local.env_suffix}"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.bastion_ingress_cidrs
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "prod-bastion-sg-${local.env_suffix}" })
}

resource "aws_security_group" "app" {
  name        = "prod-app-sg-${local.env_suffix}"
  description = "Security group for app tier"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.allowed_https_cidrs
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(local.common_tags, { Name = "prod-app-sg-${local.env_suffix}" })
}

resource "aws_security_group" "rds" {
  name        = "prod-rds-sg-${local.env_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, { Name = "prod-rds-sg-${local.env_suffix}" })
}

resource "aws_security_group" "lambda" {
  name        = "prod-lambda-sg-${local.env_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "prod-lambda-sg-${local.env_suffix}" })
}

resource "aws_s3_bucket" "logs" {
  bucket        = "prod-logs-${local.env_suffix}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(local.common_tags, { Name = "prod-logs-bucket-${local.env_suffix}" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.general.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  bucket     = aws_s3_bucket.logs.id
  acl        = "log-delivery-write"
  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "DenyInsecureConnections",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:*",
        Resource  = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"],
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid          = "DenyUnencryptedPutsExceptServerAccessLogs",
        Effect       = "Deny",
        NotPrincipal = { Service = "logging.s3.amazonaws.com" },
        Action       = "s3:PutObject",
        Resource     = "${aws_s3_bucket.logs.arn}/*",
        Condition    = { StringNotEquals = { "s3:x-amz-server-side-encryption" = "aws:kms" } }
      },
      {
        Sid          = "RequireSpecificKMSKeyForNonLoggingPuts",
        Effect       = "Deny",
        NotPrincipal = { Service = "logging.s3.amazonaws.com" },
        Action       = "s3:PutObject",
        Resource     = "${aws_s3_bucket.logs.arn}/*",
        Condition    = { StringNotEquals = { "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.general.arn } }
      },
      {
        Sid       = "AllowS3ServerAccessLogging",
        Effect    = "Allow",
        Principal = { Service = "logging.s3.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.logs.arn}/access-logs/*"
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "logs" {
  bucket        = aws_s3_bucket.logs.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}

resource "aws_iam_role" "ec2_app" {
  name = "prod-ec2-app-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  ]

  tags = merge(local.common_tags, { Name = "prod-ec2-app-role-${local.env_suffix}" })
}

resource "aws_iam_role_policy" "ec2_app_inline" {
  name = "prod-ec2-app-inline-${local.env_suffix}"
  role = aws_iam_role.ec2_app.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/prod/*"
      },
      {
        Effect   = "Allow",
        Action   = ["secretsmanager:GetSecretValue"],
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:prod/*"
      },
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/prod/*"
      },
      {
        Effect   = "Allow",
        Action   = ["s3:PutObject", "s3:GetObject"],
        Resource = "${aws_s3_bucket.logs.arn}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"],
        Resource = aws_kms_key.general.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "prod-ec2-app-profile-${local.env_suffix}"
  role = aws_iam_role.ec2_app.name

  tags = merge(local.common_tags, { Name = "prod-ec2-app-profile-${local.env_suffix}" })
}

resource "aws_iam_role" "bastion" {
  name = "prod-bastion-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ]

  tags = merge(local.common_tags, { Name = "prod-bastion-role-${local.env_suffix}" })
}

resource "aws_iam_instance_profile" "bastion" {
  name = "prod-bastion-profile-${local.env_suffix}"
  role = aws_iam_role.bastion.name

  tags = merge(local.common_tags, { Name = "prod-bastion-profile-${local.env_suffix}" })
}

resource "aws_iam_role" "lambda_security" {
  name = "prod-lambda-security-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]

  tags = merge(local.common_tags, { Name = "prod-lambda-security-role-${local.env_suffix}" })
}

resource "aws_iam_role_policy" "lambda_security_inline" {
  name = "prod-lambda-security-inline-${local.env_suffix}"
  role = aws_iam_role.lambda_security.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/prod-*"
      },
      {
        Effect   = "Allow",
        Action   = ["sns:Publish"],
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect   = "Allow",
        Action   = ["ec2:DescribeSecurityGroups", "ec2:DescribeNetworkAcls"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_sns_topic" "security_alerts" {
  name              = "prod-security-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.general.id

  tags = merge(local.common_tags, { Name = "prod-security-alerts-${local.env_suffix}" })
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.bastion_instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  iam_instance_profile        = aws_iam_instance_profile.bastion.name
  associate_public_ip_address = true

  root_block_device {
    encrypted   = true
    kms_key_id  = aws_kms_key.general.arn
    volume_type = "gp3"
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -xe
    yum update -y
    amazon-linux-extras enable nginx1
    yum clean metadata
    yum install -y nginx amazon-cloudwatch-agent
    systemctl enable nginx
    systemctl start nginx
    systemctl enable amazon-cloudwatch-agent
    systemctl start amazon-cloudwatch-agent
  EOF

  tags = merge(local.common_tags, { Name = "prod-bastion-${local.env_suffix}" })
}

resource "aws_launch_template" "app" {
  name_prefix   = "prod-app-${local.env_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.app_instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_app.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      encrypted   = true
      kms_key_id  = aws_kms_key.general.arn
      volume_size = 20
      volume_type = "gp3"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -xe
    yum update -y
    amazon-linux-extras enable nginx1
    yum clean metadata
    yum install -y nginx amazon-cloudwatch-agent openssl

    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/server.key \
      -out /etc/nginx/ssl/server.crt \
      -subj "/C=US/ST=CA/L=SF/O=Prod/CN=localhost"

    cat > /etc/nginx/conf.d/https.conf <<'EOCONF'
    server {
        listen 443 ssl;
        ssl_certificate /etc/nginx/ssl/server.crt;
        ssl_certificate_key /etc/nginx/ssl/server.key;

        location / {
            return 200 'Secure App Server\n';
            add_header Content-Type text/plain;
        }

        location /health {
            return 200 'OK\n';
            add_header Content-Type text/plain;
        }
    }
    EOCONF

    systemctl enable nginx
    systemctl start nginx
    systemctl enable amazon-cloudwatch-agent
    systemctl start amazon-cloudwatch-agent
  EOF
  )

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "prod-app-instance-${local.env_suffix}" })
  }

  tags = merge(local.common_tags, { Name = "prod-app-launch-template-${local.env_suffix}" })
}

resource "aws_lb" "app" {
  name               = "prod-app-nlb-${local.env_suffix}"
  internal           = false
  load_balancer_type = "network"
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, { Name = "prod-app-nlb-${local.env_suffix}" })
}

resource "aws_lb_target_group" "app" {
  name     = "prod-app-tg-${local.env_suffix}"
  port     = 443
  protocol = "TCP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    port                = "443"
    protocol            = "TCP"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, { Name = "prod-app-tg-${local.env_suffix}" })
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "prod-app-asg-${local.env_suffix}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  wait_for_capacity_timeout = "0"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "prod-app-asg-${local.env_suffix}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "prod-app-scale-out-${local.env_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "prod-app-scale-in-${local.env_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "prod-app-cpu-high-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions    = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  alarm_actions = [aws_autoscaling_policy.scale_out.arn]

  tags = merge(local.common_tags, { Name = "prod-app-cpu-high-${local.env_suffix}" })
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "prod-app-cpu-low-${local.env_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions    = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  alarm_actions = [aws_autoscaling_policy.scale_in.arn]

  tags = merge(local.common_tags, { Name = "prod-app-cpu-low-${local.env_suffix}" })
}

resource "aws_cloudwatch_metric_alarm" "cpu_critical" {
  alarm_name          = "prod-app-cpu-critical-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Critical CPU utilization alarm"

  dimensions    = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  alarm_actions = [aws_sns_topic.security_alerts.arn]

  tags = merge(local.common_tags, { Name = "prod-app-cpu-critical-${local.env_suffix}" })
}

resource "aws_db_subnet_group" "main" {
  name       = "prod-db-subnet-group-${local.env_suffix}"
  subnet_ids = aws_subnet.db[*].id

  tags = merge(local.common_tags, { Name = "prod-db-subnet-group-${local.env_suffix}" })
}

resource "aws_db_instance" "main" {
  identifier          = "prod-db-${local.env_suffix}"
  engine              = "postgres"
  instance_class      = var.rds_instance_class
  allocated_storage   = var.rds_allocated_storage
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.general.arn
  publicly_accessible = false

  db_name  = "proddb"
  username = var.rds_username
  password = random_password.rds.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(local.common_tags, { Name = "prod-db-${local.env_suffix}" })
}

resource "aws_cloudwatch_log_group" "security_events" {
  name              = "/prod/security-events-${local.env_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.general.arn

  tags = merge(local.common_tags, { Name = "prod-security-events-log-group-${local.env_suffix}" })
}

resource "aws_cloudwatch_log_resource_policy" "events_to_logs" {
  policy_name = "prod-events-to-logs-${local.env_suffix}"
  policy_document = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowEventBridgeToPutLogs",
        Effect    = "Allow",
        Principal = { Service = "events.amazonaws.com" },
        Action    = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource  = "*"
      }
    ]
  })
}

data "archive_file" "lambda_security" {
  type        = "zip"
  output_path = "/tmp/lambda-security-${local.env_suffix}.zip"

  source {
    filename = "lambda_function.py"
    content  = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    print(f"Security event received: {json.dumps(event)}")
    sns = boto3.client('sns')
    detail = event.get('detail', {})
    event_name = detail.get('eventName', 'Unknown')
    message = {
        'EventName': event_name,
        'EventTime': detail.get('eventTime', ''),
        'UserIdentity': detail.get('userIdentity', {}),
        'RequestParameters': detail.get('requestParameters', {})
    }
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Subject=f'Security Alert: {event_name}',
        Message=json.dumps(message, indent=2)
    )
    return {'statusCode': 200, 'body': json.dumps('Security event processed')}
EOF
  }
}

resource "aws_lambda_function" "security_automation" {
  filename         = data.archive_file.lambda_security.output_path
  function_name    = "prod-security-automation-${local.env_suffix}"
  role             = aws_iam_role.lambda_security.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_security.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
    }
  }

  tags = merge(local.common_tags, { Name = "prod-security-automation-${local.env_suffix}" })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_changes.arn
}

resource "aws_cloudwatch_event_rule" "security_changes" {
  name        = "prod-security-changes-${local.env_suffix}"
  description = "Capture security group changes"

  event_pattern = jsonencode({
    source        = ["aws.ec2"],
    "detail-type" = ["AWS API Call via CloudTrail"],
    detail = {
      eventSource = ["ec2.amazonaws.com"],
      eventName   = local.sg_change_events
    }
  })

  tags = merge(local.common_tags, { Name = "prod-security-changes-rule-${local.env_suffix}" })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.security_changes.name
  target_id = "SecurityLambdaTarget"
  arn       = aws_lambda_function.security_automation.arn
}

resource "aws_cloudwatch_event_target" "log_group" {
  rule      = aws_cloudwatch_event_rule.security_changes.name
  target_id = "SecurityLogGroupTarget"
  arn       = aws_cloudwatch_log_group.security_events.arn
}

resource "aws_cloudwatch_event_rule" "periodic_compliance" {
  name                = "prod-periodic-compliance-${local.env_suffix}"
  description         = "Periodic compliance check"
  schedule_expression = "rate(1 hour)"

  tags = merge(local.common_tags, { Name = "prod-periodic-compliance-rule-${local.env_suffix}" })
}

resource "aws_cloudwatch_event_target" "periodic_lambda" {
  rule      = aws_cloudwatch_event_rule.periodic_compliance.name
  target_id = "PeriodicLambdaTarget"
  arn       = aws_lambda_function.security_automation.arn
}

resource "aws_lambda_permission" "allow_periodic" {
  statement_id  = "AllowExecutionFromPeriodicRule"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.periodic_compliance.arn
}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "db_subnet_ids" {
  value       = aws_subnet.db[*].id
  description = "Database subnet IDs"
}

output "bastion_sg_id" {
  value       = aws_security_group.bastion.id
  description = "Bastion security group ID"
}

output "app_sg_id" {
  value       = aws_security_group.app.id
  description = "App tier security group ID"
}

output "rds_sg_id" {
  value       = aws_security_group.rds.id
  description = "RDS security group ID"
}

output "nlb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "NLB DNS name"
}

output "bastion_public_dns" {
  value       = aws_instance.bastion.public_dns
  description = "Bastion public DNS"
}

output "asg_name" {
  value       = aws_autoscaling_group.app.name
  description = "Auto Scaling Group name"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS endpoint"
}

output "logs_bucket_name" {
  value       = aws_s3_bucket.logs.id
  description = "Logs bucket name"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.security_alerts.arn
  description = "SNS topic ARN for security alerts"
}

output "lambda_function_name" {
  value       = aws_lambda_function.security_automation.function_name
  description = "Lambda function name for security automation"
}
