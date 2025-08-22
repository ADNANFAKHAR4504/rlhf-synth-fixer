```hcl
# tap_stack.tf
# Comprehensive Terraform configuration for multi-region AWS infrastructure
# with security best practices and compliance requirements

#==============================================================================
# VARIABLES
#==============================================================================

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access to EC2 instances"
  type        = string
  default     = "10.0.0.0/8"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

#==============================================================================
# LOCALS
#==============================================================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }

  # Region-specific configurations
  regions = {
    primary = {
      name = var.aws_region
      cidr = "10.0.0.0/16"
      azs  = ["eu-west-1a", "eu-west-1b"]
    }
    secondary = {
      name = "eu-west-2"
      cidr = "10.1.0.0/16"
      azs  = ["eu-west-2a", "eu-west-2b"]
    }
  }

  # Naming conventions
  naming = {
    vpc_primary   = "${var.project_name}-vpc-primary-${var.environment}"
    vpc_secondary = "${var.project_name}-vpc-secondary-${var.environment}"
    ec2_primary   = "${var.project_name}-ec2-primary-${var.environment}"
    ec2_secondary = "${var.project_name}-ec2-secondary-${var.environment}"
    s3_primary    = "${var.project_name}-s3-primary-${var.environment}-${random_id.bucket_suffix.hex}"
    s3_secondary  = "${var.project_name}-s3-secondary-${var.environment}-${random_id.bucket_suffix.hex}"
    rds_primary   = "${var.project_name}-rds-primary-${var.environment}"
    rds_secondary = "${var.project_name}-rds-secondary-${var.environment}"
  }
}

#==============================================================================
# RANDOM RESOURCES
#==============================================================================

# Random ID for unique S3 bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Random username for RDS instances
resource "random_string" "rds_username" {
  length  = 16
  special = false
  numeric = false
}

# Random password for RDS instances
resource "random_password" "rds_password" {
  length  = 16
  special = true
  override_special = "!#$%&()*+-=:?@^_"
}

#==============================================================================
# DATA SOURCES
#==============================================================================

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.eu_west_1
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.eu_west_2
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

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

#==============================================================================
# KMS KEYS
#==============================================================================

# KMS key for primary region
resource "aws_kms_key" "primary" {
  provider                = aws.eu_west_1
  description             = "KMS key for ${var.project_name} primary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch Logs use of the key"
        Effect    = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-kms-primary-tp-${var.environment}"
    Region = local.regions.primary.name
  })
}

# KMS key alias for primary region
resource "aws_kms_alias" "primary" {
  provider      = aws.eu_west_1
  name          = "alias/${var.project_name}-primary-tp-${var.environment}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for secondary region
resource "aws_kms_key" "secondary" {
  provider                = aws.eu_west_2
  description             = "KMS key for ${var.project_name} secondary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch Logs use of the key"
        Effect    = "Allow"
        Principal = {
          Service = "logs.eu-west-2.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-kms-secondary-tp-${var.environment}"
    Region = local.regions.secondary.name
  })
}

# KMS key alias for secondary region
resource "aws_kms_alias" "secondary" {
  provider      = aws.eu_west_2
  name          = "alias/${var.project_name}-secondary-tp-${var.environment}"
  target_key_id = aws_kms_key.secondary.key_id
}

#==============================================================================
# VPC RESOURCES - PRIMARY REGION
#==============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.eu_west_1
  cidr_block           = local.regions.primary.cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-tp"
    Region = local.regions.primary.name
  })
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-igw-tp"
    Region = local.regions.primary.name
  })
}

# Public subnets for primary VPC
resource "aws_subnet" "primary_public" {
  provider                = aws.eu_west_1
  count                   = length(local.regions.primary.azs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(local.regions.primary.cidr, 8, count.index)
  availability_zone       = local.regions.primary.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-public-tp-${count.index + 1}"
    Type   = "Public"
    Region = local.regions.primary.name
  })
}

# Private subnets for primary VPC
resource "aws_subnet" "primary_private" {
  provider          = aws.eu_west_1
  count             = length(local.regions.primary.azs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(local.regions.primary.cidr, 8, count.index + 10)
  availability_zone = local.regions.primary.azs[count.index]

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-private-tp-${count.index + 1}"
    Type   = "Private"
    Region = local.regions.primary.name
  })
}

# NAT Gateway for primary VPC
resource "aws_eip" "primary_nat" {
  provider = aws.eu_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-nat-eip-tp"
    Region = local.regions.primary.name
  })

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.eu_west_1
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-nat-tp"
    Region = local.regions.primary.name
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route tables for primary VPC
resource "aws_route_table" "primary_public" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-public-rt-tp"
    Region = local.regions.primary.name
  })
}

resource "aws_route_table" "primary_private" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-private-rt-tp"
    Region = local.regions.primary.name
  })
}

# Route table associations for primary VPC
resource "aws_route_table_association" "primary_public" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# VPC Flow Logs for primary VPC
resource "aws_flow_log" "primary" {
  provider        = aws.eu_west_1
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.primary_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-flow-logs-tp"
    Region = local.regions.primary.name
  })
}

# CloudWatch Log Group for primary VPC flow logs
resource "aws_cloudwatch_log_group" "primary_vpc_flow_logs" {
  provider          = aws.eu_west_1
  name              = "/aws/vpc/flowlogs/${local.naming.vpc_primary}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_primary}-flow-logs-tp"
    Region = local.regions.primary.name
  })

  depends_on = [aws_kms_key.primary]
}

#==============================================================================
# VPC RESOURCES - SECONDARY REGION
#==============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_2
  cidr_block           = local.regions.secondary.cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-tp"
    Region = local.regions.secondary.name
  })
}

# Internet Gateway for secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_2
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-igw-tp"
    Region = local.regions.secondary.name
  })
}

# Public subnets for secondary VPC
resource "aws_subnet" "secondary_public" {
  provider                = aws.eu_west_2
  count                   = length(local.regions.secondary.azs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(local.regions.secondary.cidr, 8, count.index)
  availability_zone       = local.regions.secondary.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-public-tp-${count.index + 1}"
    Type   = "Public"
    Region = local.regions.secondary.name
  })
}

# Private subnets for secondary VPC
resource "aws_subnet" "secondary_private" {
  provider          = aws.eu_west_2
  count             = length(local.regions.secondary.azs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(local.regions.secondary.cidr, 8, count.index + 10)
  availability_zone = local.regions.secondary.azs[count.index]

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-private-tp-${count.index + 1}"
    Type   = "Private"
    Region = local.regions.secondary.name
  })
}

# NAT Gateway for secondary VPC
resource "aws_eip" "secondary_nat" {
  provider = aws.eu_west_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-nat-eip-tp"
    Region = local.regions.secondary.name
  })

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.eu_west_2
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public[0].id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-nat-tp"
    Region = local.regions.secondary.name
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route tables for secondary VPC
resource "aws_route_table" "secondary_public" {
  provider = aws.eu_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-public-rt-tp"
    Region = local.regions.secondary.name
  })
}

resource "aws_route_table" "secondary_private" {
  provider = aws.eu_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-private-rt-tp"
    Region = local.regions.secondary.name
  })
}

# Route table associations for secondary VPC
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.eu_west_2
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.eu_west_2
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

# VPC Flow Logs for secondary VPC
resource "aws_flow_log" "secondary" {
  provider        = aws.eu_west_2
  iam_role_arn    = aws_iam_role.flow_logs_secondary.arn
  log_destination = aws_cloudwatch_log_group.secondary_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-flow-logs-tp"
    Region = local.regions.secondary.name
  })
}

# CloudWatch Log Group for secondary VPC flow logs
resource "aws_cloudwatch_log_group" "secondary_vpc_flow_logs" {
  provider          = aws.eu_west_2
  name              = "/aws/vpc/flowlogs/tp/${local.naming.vpc_secondary}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.secondary.arn

  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc_secondary}-flow-logs-tp"
    Region = local.regions.secondary.name
  })

  depends_on = [aws_kms_key.secondary]
}

#==============================================================================
# IAM ROLES AND POLICIES
#==============================================================================

# IAM role for VPC Flow Logs (Primary Region)
resource "aws_iam_role" "flow_logs" {
  provider = aws.eu_west_1
  name     = "${var.project_name}-flow-logs-role-primary-tp-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-flow-logs-role-primary-tp-${var.environment}"
    Region = local.regions.primary.name
  })
}

# IAM policy for VPC Flow Logs (Primary Region)
resource "aws_iam_role_policy" "flow_logs" {
  provider = aws.eu_west_1
  name     = "${var.project_name}-flow-logs-policy-primary-tp-${var.environment}"
  role     = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect = "Allow"
        Resource = [
          aws_cloudwatch_log_group.primary_vpc_flow_logs.arn,
          "${aws_cloudwatch_log_group.primary_vpc_flow_logs.arn}:*"
        ]
      }
    ]
  })
}

# IAM role for VPC Flow Logs (Secondary Region)
resource "aws_iam_role" "flow_logs_secondary" {
  provider = aws.eu_west_2
  name     = "${var.project_name}-flow-logs-role-secondary-tp-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-flow-logs-role-secondary-tp-${var.environment}"
    Region = local.regions.secondary.name
  })
}

# IAM policy for VPC Flow Logs (Secondary Region)
resource "aws_iam_role_policy" "flow_logs_secondary" {
  provider = aws.eu_west_2
  name     = "${var.project_name}-flow-logs-policy-secondary-tp-${var.environment}"
  role     = aws_iam_role.flow_logs_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect = "Allow"
        Resource = [
          aws_cloudwatch_log_group.secondary_vpc_flow_logs.arn,
          "${aws_cloudwatch_log_group.secondary_vpc_flow_logs.arn}:*"
        ]
      }
    ]
  })
}

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  provider = aws.eu_west_1
  name     = "${var.project_name}-ec2-role-tp-${var.environment}"

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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-role-tp-${var.environment}"
  })
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.eu_west_1
  name     = "${var.project_name}-ec2-profile-tp-${var.environment}"
  role     = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-profile-tp-${var.environment}"
  })
}

# IAM policy for EC2 role (minimal permissions)
resource "aws_iam_role_policy" "ec2_policy" {
  provider = aws.eu_west_1
  name     = "${var.project_name}-ec2-policy-tp-${var.environment}"
  role     = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

#==============================================================================
# SECURITY GROUPS
#==============================================================================

# Security group for EC2 instances in primary region
resource "aws_security_group" "ec2_primary" {
  provider    = aws.eu_west_1
  name        = "${local.naming.ec2_primary}-sg-tp"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.ec2_primary}-sg-tp"
    Region = local.regions.primary.name
  })
}

# Security group for EC2 instances in secondary region
resource "aws_security_group" "ec2_secondary" {
  provider    = aws.eu_west_2
  name        = "${local.naming.ec2_secondary}-sg-tp"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.ec2_secondary}-sg-tp"
    Region = local.regions.secondary.name
  })
}

# Security group for RDS in primary region
resource "aws_security_group" "rds_primary" {
  provider    = aws.eu_west_1
  name        = "${local.naming.rds_primary}-sg-tp"
  description = "Security group for RDS instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_primary}-sg-tp"
    Region = local.regions.primary.name
  })
}

# Security group for RDS in secondary region
resource "aws_security_group" "rds_secondary" {
  provider    = aws.eu_west_2
  name        = "${local.naming.rds_secondary}-sg"
  description = "Security group for RDS instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_secondary.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_secondary}-sg-tp"
    Region = local.regions.secondary.name
  })
}

#==============================================================================
# EC2 INSTANCES
#==============================================================================

# EC2 instance in primary region
resource "aws_instance" "primary" {
  provider                    = aws.eu_west_1
  ami                         = data.aws_ami.amazon_linux_primary.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.primary_public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_primary.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.primary.arn
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${local.naming.ec2_primary}-tp"
    Region = local.regions.primary.name
  })
}

# EC2 instance in secondary region
resource "aws_instance" "secondary" {
  provider                    = aws.eu_west_2
  ami                         = data.aws_ami.amazon_linux_secondary.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.secondary_public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_secondary.id]
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.secondary.arn
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${local.naming.ec2_secondary}-tp"
    Region = local.regions.secondary.name
  })
}

#==============================================================================
# S3 BUCKETS
#==============================================================================

# S3 bucket in primary region
resource "aws_s3_bucket" "primary" {
  provider = aws.eu_west_1
  bucket   = local.naming.s3_primary

  tags = merge(local.common_tags, {
    Name   = "${local.naming.s3_primary}-tp"
    Region = local.regions.primary.name
  })
}

# S3 bucket encryption for primary region
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket versioning for primary region
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block for primary region
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket in secondary region
resource "aws_s3_bucket" "secondary" {
  provider = aws.eu_west_2
  bucket   = local.naming.s3_secondary

  tags = merge(local.common_tags, {
    Name   = "${local.naming.s3_secondary}-tp"
    Region = local.regions.secondary.name
  })
}

# S3 bucket encryption for secondary region
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.eu_west_2
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket versioning for secondary region
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.eu_west_2
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block for secondary regioni
# S3 bucket public access block for secondary region
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.eu_west_2
  bucket   = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#==============================================================================
# RDS DATABASES
#==============================================================================

# RDS Subnet Groups
resource "aws_db_subnet_group" "primary" {
  provider = aws.eu_west_1
  name     = "${local.naming.rds_primary}-subnet-group-tp"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_primary}-subnet-group-tp"
    Region = local.regions.primary.name
  })
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.eu_west_2
  name     = "${local.naming.rds_secondary}-subnet-group-tp"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_secondary}-subnet-group-tp"
    Region = local.regions.secondary.name
  })
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider                = aws.eu_west_1
  identifier              = local.naming.rds_primary
  allocated_storage       = 20
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  username                = random_string.rds_username.result
  password                = random_password.rds_password.result
  db_subnet_group_name    = aws_db_subnet_group.primary.name
  vpc_security_group_ids  = [aws_security_group.rds_primary.id]
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.primary.arn
  deletion_protection     = false
  publicly_accessible     = false
  backup_retention_period = 7

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_primary}-tp"
    Region = local.regions.primary.name
  })
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary" {
  provider                = aws.eu_west_2
  identifier              = local.naming.rds_secondary
  allocated_storage       = 20
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  username                = random_string.rds_username.result
  password                = random_password.rds_password.result
  db_subnet_group_name    = aws_db_subnet_group.secondary.name
  vpc_security_group_ids  = [aws_security_group.rds_secondary.id]
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.secondary.arn
  deletion_protection     = false
  publicly_accessible     = false
  backup_retention_period = 7

  tags = merge(local.common_tags, {
    Name   = "${local.naming.rds_secondary}-tp"
    Region = local.regions.secondary.name
  })
}


#############
###OUTPUTS#######
##############
output "vpc_ids" {
  description = "The IDs of the primary and secondary VPCs"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "subnet_ids" {
  description = "Subnet IDs for public and private subnets in both regions"
  value = {
    primary_public    = aws_subnet.primary_public[*].id
    primary_private   = aws_subnet.primary_private[*].id
    secondary_public  = aws_subnet.secondary_public[*].id
    secondary_private = aws_subnet.secondary_private[*].id
  }
}

output "ec2_instance_ids" {
  description = "IDs of EC2 instances in primary and secondary regions"
  value = {
    primary   = aws_instance.primary.id
    secondary = aws_instance.secondary.id
  }
}

output "ec2_instance_public_ips" {
  description = "Public IP addresses of the EC2 instances"
  value = {
    primary   = aws_instance.primary.public_ip
    secondary = aws_instance.secondary.public_ip
  }
}

output "security_group_ids" {
  description = "Security Group IDs for EC2 and RDS in both regions"
  value = {
    ec2_primary_sg    = aws_security_group.ec2_primary.id
    ec2_secondary_sg  = aws_security_group.ec2_secondary.id
    rds_primary_sg    = aws_security_group.rds_primary.id
    rds_secondary_sg  = aws_security_group.rds_secondary.id
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names in primary, secondary regions and CloudTrail bucket"
  value = {
    primary    = aws_s3_bucket.primary.bucket
    secondary  = aws_s3_bucket.secondary.bucket
  }
}

output "rds_endpoints" {
  description = "Endpoints of RDS instances in primary and secondary regions"
  value = {
    primary   = aws_db_instance.primary.endpoint
    secondary = aws_db_instance.secondary.endpoint
  }
}

output "iam_roles" {
  description = "IAM roles created: EC2, flow logs (primary & secondary), and CloudTrail"
  value = {
    ec2_role          = aws_iam_role.ec2_role.name
    flow_logs_primary = aws_iam_role.flow_logs.name
    flow_logs_secondary = aws_iam_role.flow_logs_secondary.name
  }
}

output "iam_instance_profile" {
  description = "IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "kms_key_arns" {
  description = "ARNs of KMS keys for encryption in primary and secondary regions"
  value = {
    primary   = aws_kms_key.primary.arn
    secondary = aws_kms_key.secondary.arn
  }
}

output "ami_ids" {
  description = "AMI IDs used for EC2 instances in primary and secondary regions"
  value = {
    primary   = data.aws_ami.amazon_linux_primary.id
    secondary = data.aws_ami.amazon_linux_secondary.id
  }
}
```
