# tap_stack.tf - Complete Terraform configuration for multi-region infrastructure
```hcl
# ===== VARIABLES =====
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "allowed_https_cidrs" {
  description = "CIDR blocks allowed for HTTPS access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "domain_name" {
  description = "Domain name for Route53 hosted zone"
  type        = string
  default     = "taskloadnew.com"
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = "admin@example.com"
}

# ===== LOCALS =====
locals {
  # Naming convention
  name_prefix = "tap"

  # Common tags
  common_tags = {
    Environment = "Production"
    Project     = "TAP-Stack"
    ManagedBy   = "Terraform"
  }

  # Network configuration
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Subnet CIDRs for primary region (us-east-2)
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]

  # Subnet CIDRs for secondary region (us-west-1)
  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnets = ["10.1.10.0/24", "10.1.20.0/24"]

  # Instance configuration
  instance_type = "t3.micro"
  min_size      = 2
  max_size      = 4
  desired_size  = 2
}

# ===== DATA SOURCES =====

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.us_east_2
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
  provider    = aws.us_west_1
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

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.us_east_2
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.us_west_1
  state    = "available"
}

# ===== RANDOM RESOURCES =====

# Random username for RDS
resource "random_string" "db_username" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true
}

# Random password for RDS (AWS compatible special characters)
resource "random_password" "db_password" {
  length  = 16
  special = true
  # AWS RDS compatible special characters only
  override_special = "!#$%&*+-=?^_`|~"
}

# ===== PRIMARY REGION RESOURCES (us-east-2) =====

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-primary"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-primary"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_2
  count                   = length(local.primary_public_subnets)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-primary-${count.index + 1}"
    Type = "Public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_2
  count             = length(local.primary_private_subnets)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-primary-${count.index + 1}"
    Type = "Private"
  })
}

# Primary NAT Gateway EIPs
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_2
  count    = length(local.primary_public_subnets)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-primary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary NAT Gateways
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_2
  count         = length(local.primary_public_subnets)
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-primary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-primary"
  })
}

# Primary Private Route Tables
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_2
  count    = length(local.primary_private_subnets)
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-primary-${count.index + 1}"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ===== SECONDARY REGION RESOURCES (us-west-1) =====

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-secondary"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-secondary"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_1
  count                   = length(local.secondary_public_subnets)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-secondary-${count.index + 1}"
    Type = "Public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_1
  count             = length(local.secondary_private_subnets)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-secondary-${count.index + 1}"
    Type = "Private"
  })
}

# Secondary NAT Gateway EIPs
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  count    = length(local.secondary_public_subnets)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-secondary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary NAT Gateways
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_1
  count         = length(local.secondary_public_subnets)
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-secondary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-secondary"
  })
}

# Secondary Private Route Tables
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  count    = length(local.secondary_private_subnets)
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-secondary-${count.index + 1}"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ===== SECURITY GROUPS =====

# Primary EC2 Security Group
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_2
  name        = "${local.name_prefix}-sg-ec2-primary"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-ec2-primary"
  })
}

# Secondary EC2 Security Group
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_1
  name        = "${local.name_prefix}-sg-ec2-secondary"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-ec2-secondary"
  })
}

# Primary ALB Security Group
resource "aws_security_group" "primary_alb" {
  provider    = aws.us_east_2
  name        = "${local.name_prefix}-sg-alb-primary"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-alb-primary"
  })
}

# Secondary ALB Security Group
resource "aws_security_group" "secondary_alb" {
  provider    = aws.us_west_1
  name        = "${local.name_prefix}-sg-alb-secondary"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-alb-secondary"
  })
}

# Primary RDS Security Group
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_2
  name        = "${local.name_prefix}-sg-rds-primary"
  description = "Security group for RDS in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-rds-primary"
  })
}

# Secondary RDS Security Group
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_1
  name        = "${local.name_prefix}-sg-rds-secondary"
  description = "Security group for RDS in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-rds-secondary"
  })
}


# ===== IAM ROLES AND POLICIES =====

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role-new2"

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

  tags = local.common_tags
}

# EC2 Instance Policy for CloudWatch and S3 access
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Lambda Policy for RDS backup operations
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts.arn,
          aws_sns_topic.alerts_secondary.arn
        ]
      }
    ]
  })
}

# ===== S3 BUCKETS =====

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_2
  bucket   = "${local.name_prefix}-static-content-primary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-primary"
  })
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_1
  bucket   = "${local.name_prefix}-static-content-secondary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-secondary"
  })
}

# Random suffix for S3 bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Cross-Region Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [aws_s3_bucket_versioning.primary,aws_s3_bucket_versioning.secondary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "ReplicateToSecondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

# S3 Replication Role
resource "aws_iam_role" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# S3 Replication Policy
resource "aws_iam_role_policy" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# ===== LAUNCH TEMPLATES =====

# Primary Launch Template
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name_prefix   = "${local.name_prefix}-lt-primary-"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = local.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-primary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-primary"
  })
}

# Secondary Launch Template
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name_prefix   = "${local.name_prefix}-lt-secondary-"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = local.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-secondary"
  })
}

# ===== APPLICATION LOAD BALANCERS =====

# Primary ALB
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.name_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-primary"
  })
}

# Secondary ALB
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.name_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-secondary"
  })
}

# Primary ALB Target Group
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.name_prefix}-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-primary"
  })
}

# Secondary ALB Target Group
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.name_prefix}-tg-secondary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-secondary"
  })
}

# Primary ALB Listener
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = local.common_tags
}

# Secondary ALB Listener
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = local.common_tags
}

# ===== AUTO SCALING GROUPS =====

# Primary Auto Scaling Group
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.name_prefix}-asg-primary"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = local.min_size
  max_size         = local.max_size
  desired_capacity = local.desired_size

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-primary"
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

# Secondary Auto Scaling Group
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.name_prefix}-asg-secondary"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = local.min_size
  max_size         = local.max_size
  desired_capacity = local.desired_size

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-secondary"
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

# ===== RDS SUBNET GROUPS =====

# Primary RDS Subnet Group
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.name_prefix}-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-primary"
  })
}

# Secondary RDS Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.name_prefix}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-secondary"
  })
}

# ===== RDS INSTANCES =====

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2

  identifier = "${local.name_prefix}-db-primary"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "tapdb"
  username = "admin${random_string.db_username.result}"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-primary"
  })
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1

  identifier = "${local.name_prefix}-db-secondary"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "tapdb"
  username = "admin${random_string.db_username.result}"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name

  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-secondary"
  })
}

# ===== SNS TOPIC =====

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  provider = aws.us_east_2
  name     = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts"
  })
}

# SNS Topic for Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_1
  name     = "${local.name_prefix}-alerts-secondary"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts-secondary"
  })
}

# SNS Topic Subscription for Secondary Region - ADD THIS
resource "aws_sns_topic_subscription" "email_alerts_secondary" {
  provider  = aws.us_west_1
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email_alerts" {
  provider  = aws.us_east_2
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ===== LAMBDA FUNCTIONS =====

# Primary Lambda Function for RDS Backup
resource "aws_lambda_function" "primary_backup" {
  provider         = aws.us_east_2
  filename         = "backup_lambda.zip"
  function_name    = "${local.name_prefix}-rds-backup-primary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DB_IDENTIFIER = aws_db_instance.primary.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-backup-primary"
  })
}

# Secondary Lambda Function for RDS Backup
resource "aws_lambda_function" "secondary_backup" {
  provider         = aws.us_west_1
  filename         = "backup_lambda.zip"
  function_name    = "${local.name_prefix}-rds-backup-secondary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DB_IDENTIFIER = aws_db_instance.secondary.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts_secondary.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-backup-secondary"
  })
}

# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "backup_lambda.zip"
  source {
    content = <<EOF
import boto3
import json
import os
from datetime import datetime
def handler(event, context):
    rds = boto3.client('rds')
    sns = boto3.client('sns')
    db_identifier = os.environ['DB_IDENTIFIER']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    try:
        # Create snapshot
        snapshot_id = f"{db_identifier}-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}"
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_identifier
        )
        # Send success notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f'RDS Backup Success - {db_identifier}',
            Message=f'Successfully created snapshot {snapshot_id} for {db_identifier}'
        )
        return {
            'statusCode': 200,
            'body': json.dumps(f'Snapshot {snapshot_id} created successfully')
        }
    except Exception as e:
        # Send failure notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f'RDS Backup Failed - {db_identifier}',
            Message=f'Failed to create snapshot for {db_identifier}: {str(e)}'
        )
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

# ===== CLOUDWATCH ALARMS =====

# Primary CPU Alarm
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.name_prefix}-cpu-alarm-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# Secondary CPU Alarm
resource "aws_cloudwatch_metric_alarm" "secondary_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.name_prefix}-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# Primary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.name_prefix}-rds-cpu-alarm-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

# Secondary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.name_prefix}-rds-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }

  tags = local.common_tags
}

# ===== ROUTE 53 =====

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_east_2
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hosted-zone"
  })
}

# Route 53 Health Check for Primary ALB
resource "aws_route53_health_check" "primary" {
  provider                        = aws.us_east_2
  fqdn                           = aws_lb.primary.dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = "/"
  failure_threshold              = "5"
  request_interval               = "30"
  cloudwatch_alarm_region        = var.primary_region
  cloudwatch_alarm_name          = aws_cloudwatch_metric_alarm.primary_cpu.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-check-primary"
  })
}

# Route 53 Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary" {
  provider                        = aws.us_east_2
  fqdn                           = aws_lb.secondary.dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = "/"
  failure_threshold              = "5"
  request_interval               = "30"
  cloudwatch_alarm_region        = var.secondary_region
  cloudwatch_alarm_name          = aws_cloudwatch_metric_alarm.secondary_cpu.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-check-secondary"
  })
}

# Route 53 Record for Primary (Failover Primary)
resource "aws_route53_record" "primary" {
  provider = aws.us_east_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record for Secondary (Failover Secondary)
resource "aws_route53_record" "secondary" {
  provider = aws.us_east_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# ===== OUTPUTS =====

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}



# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# S3 Bucket Outputs
output "primary_s3_bucket_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "primary_s3_bucket_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_domain_name
}

output "secondary_s3_bucket_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "secondary_s3_bucket_domain_name" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_domain_name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "primary_launch_template_latest_version" {
  description = "Latest version of the primary launch template"
  value       = aws_launch_template.primary.latest_version
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "secondary_launch_template_latest_version" {
  description = "Latest version of the secondary launch template"
  value       = aws_launch_template.secondary.latest_version
}

# ALB Outputs
output "primary_alb_id" {
  description = "ID of the primary ALB"
  value       = aws_lb.primary.id
}

output "primary_alb_arn" {
  description = "ARN of the primary ALB"
  value       = aws_lb.primary.arn
}

output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_id" {
  description = "ID of the secondary ALB"
  value       = aws_lb.secondary.id
}

output "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  value       = aws_lb.secondary.arn
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_id" {
  description = "ID of the primary target group"
  value       = aws_lb_target_group.primary.id
}

output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_id" {
  description = "ID of the secondary target group"
  value       = aws_lb_target_group.secondary.id
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# ALB Listener Outputs
output "primary_alb_listener_id" {
  description = "ID of the primary ALB listener"
  value       = aws_lb_listener.primary.id
}

output "primary_alb_listener_arn" {
  description = "ARN of the primary ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_id" {
  description = "ID of the secondary ALB listener"
  value       = aws_lb_listener.secondary.id
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_id" {
  description = "ID of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.id
}

output "primary_asg_arn" {
  description = "ARN of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.arn
}

output "primary_asg_name" {
  description = "Name of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_id" {
  description = "ID of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.id
}

output "secondary_asg_arn" {
  description = "ARN of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.arn
}

output "secondary_asg_name" {
  description = "Name of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.name
}

# RDS Subnet Group Outputs
output "primary_db_subnet_group_id" {
  description = "ID of the primary RDS subnet group"
  value       = aws_db_subnet_group.primary.id
}

output "primary_db_subnet_group_name" {
  description = "Name of the primary RDS subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_id" {
  description = "ID of the secondary RDS subnet group"
  value       = aws_db_subnet_group.secondary.id
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary RDS subnet group"
  value       = aws_db_subnet_group.secondary.name
}

# RDS Instance Outputs
output "primary_rds_instance_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary.id
}

output "primary_rds_instance_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary.arn
}

output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary.endpoint
}

output "primary_rds_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary.port
}

output "primary_rds_database_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary.db_name
}

output "secondary_rds_instance_id" {
  description = "ID of the secondary RDS instance"
  value       = aws_db_instance.secondary.id
}

output "secondary_rds_instance_arn" {
  description = "ARN of the secondary RDS instance"
  value       = aws_db_instance.secondary.arn
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary.endpoint
}

output "secondary_rds_port" {
  description = "Port of the secondary RDS instance"
  value       = aws_db_instance.secondary.port
}

output "secondary_rds_database_name" {
  description = "Database name of the secondary RDS instance"
  value       = aws_db_instance.secondary.db_name
}

# SNS Topic Outputs
output "sns_topic_id" {
  description = "ID of the SNS topic"
  value       = aws_sns_topic.alerts.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.alerts.name
}

# Lambda Function Outputs
output "primary_lambda_function_name" {
  description = "Name of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.function_name
}

output "primary_lambda_function_arn" {
  description = "ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.arn
}

output "primary_lambda_invoke_arn" {
  description = "Invoke ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.invoke_arn
}

output "secondary_lambda_function_name" {
  description = "Name of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.function_name
}

output "secondary_lambda_function_arn" {
  description = "ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.arn
}

output "secondary_lambda_invoke_arn" {
  description = "Invoke ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.invoke_arn
}

# CloudWatch Alarm Outputs
output "primary_cpu_alarm_id" {
  description = "ID of the primary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu.id
}

output "primary_cpu_alarm_arn" {
  description = "ARN of the primary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu.arn
}

output "secondary_cpu_alarm_id" {
  description = "ID of the secondary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu.id
}

output "secondary_cpu_alarm_arn" {
  description = "ARN of the secondary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu.arn
}

output "primary_rds_cpu_alarm_id" {
  description = "ID of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.id
}

output "primary_rds_cpu_alarm_arn" {
  description = "ARN of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.arn
}

output "secondary_rds_cpu_alarm_id" {
  description = "ID of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.id
}

output "secondary_rds_cpu_alarm_arn" {
  description = "ARN of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.arn
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Name of the Route 53 hosted zone"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Name servers of the Route 53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "primary_health_check_id" {
  description = "ID of the primary health check"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "ID of the secondary health check"
  value       = aws_route53_health_check.secondary.id
}

output "primary_route53_record_name" {
  description = "Name of the primary Route 53 record"
  value       = aws_route53_record.primary.name
}

output "primary_route53_record_fqdn" {
  description = "FQDN of the primary Route 53 record"
  value       = aws_route53_record.primary.fqdn
}

output "secondary_route53_record_name" {
  description = "Name of the secondary Route 53 record"
  value       = aws_route53_record.secondary.name
}

output "secondary_route53_record_fqdn" {
  description = "FQDN of the secondary Route 53 record"
  value       = aws_route53_record.secondary.fqdn
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "primary_ami_name" {
  description = "Name of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "primary_ami_description" {
  description = "Description of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.description
}

output "secondary_ami_id" {
  description = "ID of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "secondary_ami_name" {
  description = "Name of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

output "secondary_ami_description" {
  description = "Description of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.description
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "List of availability zones in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "List of availability zones in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

# EIP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary NAT gateway EIPs"
  value       = aws_eip.primary_nat[*].id
}

output "primary_nat_eip_public_ips" {
  description = "Public IPs of the primary NAT gateway EIPs"
  value       = aws_eip.primary_nat[*].public_ip
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary NAT gateway EIPs"
  value       = aws_eip.secondary_nat[*].id
}

output "secondary_nat_eip_public_ips" {
  description = "Public IPs of the secondary NAT gateway EIPs"
  value       = aws_eip.secondary_nat[*].public_ip
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary private route tables"
  value       = aws_route_table.primary_private[*].id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary private route tables"
  value       = aws_route_table.secondary_private[*].id
}
output "sns_topic_secondary_id" {
  description = "ID of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.id
}

output "sns_topic_secondary_arn" {
  description = "ARN of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "sns_topic_secondary_name" {
  description = "Name of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.name
}
```

# provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
#provider "aws" {
#  region = var.aws_region
#}

provider "aws" {
  alias  = "us_east_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_1"
  region = var.secondary_region
}
```
