# tap_stack.tf - Multi-Region High Availability AWS Infrastructure
# This configuration deploys identical infrastructure in us-east-1 and eu-west-1
# Supports both production and development environments

# Password will be generated and stored in AWS Secrets Manager
# No more hardcoded passwords for security

# Local values for configuration
locals {
  environment = split("-", var.environment_suffix)[0] # Extract env from suffix like "prod-pr123"

  common_tags = {
    Environment = local.environment
    ManagedBy   = "Terraform"
    Project     = "multi-region-ha"
  }

  # Region-specific configuration
  regions = {
    us_east_1 = {
      vpc_cidr = "10.0.0.0/16"
      azs      = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    eu_west_1 = {
      vpc_cidr = "10.1.0.0/16"
      azs      = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
    }
  }

  # Environment-specific configuration
  env_config = {
    prod = {
      instance_type     = "t3.medium"
      db_instance_class = "db.t3.medium"
      asg_min_size      = 2
      asg_max_size      = 5
    }
    dev = {
      instance_type     = "t3.micro"
      db_instance_class = "db.t3.micro"
      asg_min_size      = 2
      asg_max_size      = 5
    }
  }
}

# Multi-region provider configuration (aliases defined in provider.tf)
# This configuration uses provider aliases for multi-region deployment

# Data sources for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2_us" {
  provider    = aws.us_east_1
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

data "aws_ami" "amazon_linux_2_eu" {
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

# Generate random passwords for RDS instances
resource "random_password" "rds_password_us_east_1" {
  length  = 32
  special = true
}

resource "random_password" "rds_password_eu_west_1" {
  length  = 32
  special = true
}

# Secrets Manager for RDS passwords - US-EAST-1
resource "aws_secretsmanager_secret" "rds_password_us_east_1" {
  provider                = aws.us_east_1
  name                    = "${local.environment}-rds-password-us-east-1"
  description             = "RDS master password for ${local.environment} environment in US-EAST-1"
  kms_key_id              = aws_kms_key.us_east_1.arn
  recovery_window_in_days = 0 # Immediate deletion for testing

  tags = {
    Name = "${local.environment}-rds-password-us-east-1"
  }
}

resource "aws_secretsmanager_secret_version" "rds_password_us_east_1" {
  provider  = aws.us_east_1
  secret_id = aws_secretsmanager_secret.rds_password_us_east_1.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.rds_password_us_east_1.result
  })
}

# Secrets Manager for RDS passwords - EU-WEST-1
resource "aws_secretsmanager_secret" "rds_password_eu_west_1" {
  provider                = aws.eu_west_1
  name                    = "${local.environment}-rds-password-eu-west-1"
  description             = "RDS master password for ${local.environment} environment in EU-WEST-1"
  kms_key_id              = aws_kms_key.eu_west_1.arn
  recovery_window_in_days = 0 # Immediate deletion for testing

  tags = {
    Name = "${local.environment}-rds-password-eu-west-1"
  }
}

resource "aws_secretsmanager_secret_version" "rds_password_eu_west_1" {
  provider  = aws.eu_west_1
  secret_id = aws_secretsmanager_secret.rds_password_eu_west_1.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.rds_password_eu_west_1.result
  })
}

# KMS keys for encryption
resource "aws_kms_key" "us_east_1" {
  provider                = aws.us_east_1
  description             = "${local.environment}-kms-key-us-east-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10

  tags = {
    Name = "${local.environment}-kms-key-us-east-1"
  }
}

resource "aws_kms_alias" "us_east_1" {
  provider      = aws.us_east_1
  name          = "alias/${local.environment}-multi-region-key-us"
  target_key_id = aws_kms_key.us_east_1.key_id
}

resource "aws_kms_key" "eu_west_1" {
  provider                = aws.eu_west_1
  description             = "${local.environment}-kms-key-eu-west-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10

  tags = {
    Name = "${local.environment}-kms-key-eu-west-1"
  }
}

resource "aws_kms_alias" "eu_west_1" {
  provider      = aws.eu_west_1
  name          = "alias/${local.environment}-multi-region-key-eu"
  target_key_id = aws_kms_key.eu_west_1.key_id
}

# VPC and Networking Components
# All resources are defined inline in this file for single-file deployment

# VPC Resources for US-EAST-1
resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.regions.us_east_1.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.environment}-vpc-us-east-1"
  }
}

# Internet Gateway US-EAST-1
resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = {
    Name = "${local.environment}-igw-us-east-1"
  }
}

# Public Subnets US-EAST-1
resource "aws_subnet" "public_us_east_1" {
  provider                = aws.us_east_1
  count                   = length(local.regions.us_east_1.azs)
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = cidrsubnet(local.regions.us_east_1.vpc_cidr, 8, count.index)
  availability_zone       = local.regions.us_east_1.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.environment}-public-subnet-${count.index + 1}-us-east-1"
    Type = "Public"
  }
}

# Private Subnets US-EAST-1
resource "aws_subnet" "private_us_east_1" {
  provider          = aws.us_east_1
  count             = length(local.regions.us_east_1.azs)
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = cidrsubnet(local.regions.us_east_1.vpc_cidr, 8, count.index + 100)
  availability_zone = local.regions.us_east_1.azs[count.index]

  tags = {
    Name = "${local.environment}-private-subnet-${count.index + 1}-us-east-1"
    Type = "Private"
  }
}

# Database Subnets US-EAST-1
resource "aws_subnet" "database_us_east_1" {
  provider          = aws.us_east_1
  count             = length(local.regions.us_east_1.azs)
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = cidrsubnet(local.regions.us_east_1.vpc_cidr, 8, count.index + 200)
  availability_zone = local.regions.us_east_1.azs[count.index]

  tags = {
    Name = "${local.environment}-db-subnet-${count.index + 1}-us-east-1"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways US-EAST-1
resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  count    = length(local.regions.us_east_1.azs)
  domain   = "vpc"

  tags = {
    Name = "${local.environment}-eip-nat-${count.index + 1}-us-east-1"
  }

  depends_on = [aws_internet_gateway.us_east_1]
}

# NAT Gateways US-EAST-1
resource "aws_nat_gateway" "us_east_1" {
  provider      = aws.us_east_1
  count         = length(local.regions.us_east_1.azs)
  allocation_id = aws_eip.nat_us_east_1[count.index].id
  subnet_id     = aws_subnet.public_us_east_1[count.index].id

  tags = {
    Name = "${local.environment}-nat-gw-${count.index + 1}-us-east-1"
  }

  depends_on = [aws_internet_gateway.us_east_1]
}

# Public Route Table US-EAST-1
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = {
    Name = "${local.environment}-public-rt-us-east-1"
  }
}

# Private Route Tables US-EAST-1
resource "aws_route_table" "private_us_east_1" {
  provider = aws.us_east_1
  count    = length(local.regions.us_east_1.azs)
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_east_1[count.index].id
  }

  tags = {
    Name = "${local.environment}-private-rt-${count.index + 1}-us-east-1"
  }
}

# Route Table Associations US-EAST-1
resource "aws_route_table_association" "public_us_east_1" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.public_us_east_1)
  subnet_id      = aws_subnet.public_us_east_1[count.index].id
  route_table_id = aws_route_table.public_us_east_1.id
}

resource "aws_route_table_association" "private_us_east_1" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.private_us_east_1)
  subnet_id      = aws_subnet.private_us_east_1[count.index].id
  route_table_id = aws_route_table.private_us_east_1[count.index].id
}

resource "aws_route_table_association" "database_us_east_1" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.database_us_east_1)
  subnet_id      = aws_subnet.database_us_east_1[count.index].id
  route_table_id = aws_route_table.private_us_east_1[count.index].id
}

# VPC Resources for EU-WEST-1 (Identical structure)
resource "aws_vpc" "eu_west_1" {
  provider             = aws.eu_west_1
  cidr_block           = local.regions.eu_west_1.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.environment}-vpc-eu-west-1"
  }
}

# Internet Gateway EU-WEST-1
resource "aws_internet_gateway" "eu_west_1" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.eu_west_1.id

  tags = {
    Name = "${local.environment}-igw-eu-west-1"
  }
}

# Public Subnets EU-WEST-1
resource "aws_subnet" "public_eu_west_1" {
  provider                = aws.eu_west_1
  count                   = length(local.regions.eu_west_1.azs)
  vpc_id                  = aws_vpc.eu_west_1.id
  cidr_block              = cidrsubnet(local.regions.eu_west_1.vpc_cidr, 8, count.index)
  availability_zone       = local.regions.eu_west_1.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.environment}-public-subnet-${count.index + 1}-eu-west-1"
    Type = "Public"
  }
}

# Private Subnets EU-WEST-1
resource "aws_subnet" "private_eu_west_1" {
  provider          = aws.eu_west_1
  count             = length(local.regions.eu_west_1.azs)
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = cidrsubnet(local.regions.eu_west_1.vpc_cidr, 8, count.index + 100)
  availability_zone = local.regions.eu_west_1.azs[count.index]

  tags = {
    Name = "${local.environment}-private-subnet-${count.index + 1}-eu-west-1"
    Type = "Private"
  }
}

# Database Subnets EU-WEST-1
resource "aws_subnet" "database_eu_west_1" {
  provider          = aws.eu_west_1
  count             = length(local.regions.eu_west_1.azs)
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = cidrsubnet(local.regions.eu_west_1.vpc_cidr, 8, count.index + 200)
  availability_zone = local.regions.eu_west_1.azs[count.index]

  tags = {
    Name = "${local.environment}-db-subnet-${count.index + 1}-eu-west-1"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways EU-WEST-1
resource "aws_eip" "nat_eu_west_1" {
  provider = aws.eu_west_1
  count    = length(local.regions.eu_west_1.azs)
  domain   = "vpc"

  tags = {
    Name = "${local.environment}-eip-nat-${count.index + 1}-eu-west-1"
  }

  depends_on = [aws_internet_gateway.eu_west_1]
}

# NAT Gateways EU-WEST-1
resource "aws_nat_gateway" "eu_west_1" {
  provider      = aws.eu_west_1
  count         = length(local.regions.eu_west_1.azs)
  allocation_id = aws_eip.nat_eu_west_1[count.index].id
  subnet_id     = aws_subnet.public_eu_west_1[count.index].id

  tags = {
    Name = "${local.environment}-nat-gw-${count.index + 1}-eu-west-1"
  }

  depends_on = [aws_internet_gateway.eu_west_1]
}

# Public Route Table EU-WEST-1
resource "aws_route_table" "public_eu_west_1" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.eu_west_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eu_west_1.id
  }

  tags = {
    Name = "${local.environment}-public-rt-eu-west-1"
  }
}

# Private Route Tables EU-WEST-1
resource "aws_route_table" "private_eu_west_1" {
  provider = aws.eu_west_1
  count    = length(local.regions.eu_west_1.azs)
  vpc_id   = aws_vpc.eu_west_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eu_west_1[count.index].id
  }

  tags = {
    Name = "${local.environment}-private-rt-${count.index + 1}-eu-west-1"
  }
}

# Route Table Associations EU-WEST-1
resource "aws_route_table_association" "public_eu_west_1" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.public_eu_west_1)
  subnet_id      = aws_subnet.public_eu_west_1[count.index].id
  route_table_id = aws_route_table.public_eu_west_1.id
}

resource "aws_route_table_association" "private_eu_west_1" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.private_eu_west_1)
  subnet_id      = aws_subnet.private_eu_west_1[count.index].id
  route_table_id = aws_route_table.private_eu_west_1[count.index].id
}

resource "aws_route_table_association" "database_eu_west_1" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.database_eu_west_1)
  subnet_id      = aws_subnet.database_eu_west_1[count.index].id
  route_table_id = aws_route_table.private_eu_west_1[count.index].id
}

# Network ACLs with restrictive rules - US-EAST-1
resource "aws_network_acl" "main_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  # Inbound rules - Only allow HTTP, HTTPS, and ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
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

  # Outbound rules
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${local.environment}-nacl-us-east-1"
  }
}

# Network ACLs with restrictive rules - EU-WEST-1
resource "aws_network_acl" "main_eu_west_1" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.eu_west_1.id

  # Inbound rules - Only allow HTTP, HTTPS, and ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
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

  # Outbound rules
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${local.environment}-nacl-eu-west-1"
  }
}

# Security Groups - US-EAST-1
# ALB Security Group - Only allows HTTP/HTTPS from internet
resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.environment}-alb-sg-us-east-1"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-alb-sg-us-east-1"
  }
}

# Web Server Security Group - Only allows traffic from ALB
resource "aws_security_group" "web_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.environment}-web-sg-us-east-1"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-web-sg-us-east-1"
  }
}

# RDS Security Group - Only allows traffic from web servers
resource "aws_security_group" "rds_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.environment}-rds-sg-us-east-1"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    description     = "PostgreSQL from web servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_us_east_1.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-rds-sg-us-east-1"
  }
}

# Security Groups - EU-WEST-1 (Identical structure)
# ALB Security Group
resource "aws_security_group" "alb_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "${local.environment}-alb-sg-eu-west-1"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.eu_west_1.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-alb-sg-eu-west-1"
  }
}

# Web Server Security Group
resource "aws_security_group" "web_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "${local.environment}-web-sg-eu-west-1"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.eu_west_1.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_eu_west_1.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_eu_west_1.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-web-sg-eu-west-1"
  }
}

# RDS Security Group
resource "aws_security_group" "rds_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "${local.environment}-rds-sg-eu-west-1"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.eu_west_1.id

  ingress {
    description     = "PostgreSQL from web servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_eu_west_1.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.environment}-rds-sg-eu-west-1"
  }
}

# IAM Role for EC2 Instances - Least privilege principle
resource "aws_iam_role" "ec2_role" {
  name = "${local.environment}-ec2-role"

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

# IAM Policy for EC2 instances - Minimal permissions for CloudWatch and S3
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.environment}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${local.environment}-*",
          "arn:aws:s3:::${local.environment}-*/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# S3 Buckets with encryption and versioning - US-EAST-1
resource "aws_s3_bucket" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = "${local.environment}-config-bucket-us-east-1-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.environment}-config-bucket-us-east-1"
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy - Restrict access
resource "aws_s3_bucket_policy" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.config_us_east_1.arn,
          "${aws_s3_bucket.config_us_east_1.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowEC2Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config_us_east_1.arn,
          "${aws_s3_bucket.config_us_east_1.arn}/*"
        ]
      }
    ]
  })
}

# S3 Buckets - EU-WEST-1 (Identical configuration)
resource "aws_s3_bucket" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = "${local.environment}-config-bucket-eu-west-1-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.environment}-config-bucket-eu-west-1"
  })
}

resource "aws_s3_bucket_versioning" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.eu_west_1.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.config_eu_west_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.config_eu_west_1.arn,
          "${aws_s3_bucket.config_eu_west_1.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowEC2Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config_eu_west_1.arn,
          "${aws_s3_bucket.config_eu_west_1.arn}/*"
        ]
      }
    ]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# CloudWatch Log Groups - US-EAST-1
resource "aws_cloudwatch_log_group" "app_logs_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/ec2/${local.environment}/app-logs-us-east-1"
  retention_in_days = local.environment == "prod" ? 30 : 7
  kms_key_id        = aws_kms_key.us_east_1.arn

  tags = {
    Name = "${local.environment}-app-logs-us-east-1"
  }
}

# CloudWatch Log Groups - EU-WEST-1
resource "aws_cloudwatch_log_group" "app_logs_eu_west_1" {
  provider          = aws.eu_west_1
  name              = "/aws/ec2/${local.environment}/app-logs-eu-west-1"
  retention_in_days = local.environment == "prod" ? 30 : 7
  kms_key_id        = aws_kms_key.eu_west_1.arn

  tags = {
    Name = "${local.environment}-app-logs-eu-west-1"
  }
}

# Application Load Balancer - US-EAST-1
resource "aws_lb" "main_us_east_1" {
  provider           = aws.us_east_1
  name               = "${local.environment}-alb-us-east-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_east_1.id]
  subnets            = aws_subnet.public_us_east_1[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "${local.environment}-alb-us-east-1"
  }
}

# ALB Target Group - US-EAST-1
resource "aws_lb_target_group" "main_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.environment}-tg-us-east-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.us_east_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "${local.environment}-tg-us-east-1"
  }
}

# ALB Listener - US-EAST-1
resource "aws_lb_listener" "main_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.main_us_east_1.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_us_east_1.arn
  }
}

# Application Load Balancer - EU-WEST-1
resource "aws_lb" "main_eu_west_1" {
  provider           = aws.eu_west_1
  name               = "${local.environment}-alb-eu-west-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_eu_west_1.id]
  subnets            = aws_subnet.public_eu_west_1[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "${local.environment}-alb-eu-west-1"
  }
}

# ALB Target Group - EU-WEST-1
resource "aws_lb_target_group" "main_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "${local.environment}-tg-eu-west-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.eu_west_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "${local.environment}-tg-eu-west-1"
  }
}

# ALB Listener - EU-WEST-1
resource "aws_lb_listener" "main_eu_west_1" {
  provider          = aws.eu_west_1
  load_balancer_arn = aws_lb.main_eu_west_1.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_eu_west_1.arn
  }
}

# Launch Template - US-EAST-1
resource "aws_launch_template" "web_us_east_1" {
  provider      = aws.us_east_1
  name_prefix   = substr(local.environment, 0, 3) # Using first 3 chars of environment
  image_id      = data.aws_ami.amazon_linux_2_us.id
  instance_type = local.env_config[local.environment].instance_type

  vpc_security_group_ids = [aws_security_group.web_us_east_1.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.us_east_1.arn
      delete_on_termination = true
    }
  }

  # User data script for basic web server setup
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${local.environment} - US-EAST-1</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch logs
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<CWCONFIG
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "${aws_cloudwatch_log_group.app_logs_us_east_1.name}",
                "log_stream_name": "{instance_id}/httpd/access"
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "${aws_cloudwatch_log_group.app_logs_us_east_1.name}",
                "log_stream_name": "{instance_id}/httpd/error"
              }
            ]
          }
        }
      }
    }
CWCONFIG
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.environment}-web-instance-us-east-1"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.environment}-web-volume-us-east-1"
    })
  }
}

# Launch Template - EU-WEST-1
resource "aws_launch_template" "web_eu_west_1" {
  provider      = aws.eu_west_1
  name_prefix   = substr(local.environment, 0, 3) # Using first 3 chars of environment  
  image_id      = data.aws_ami.amazon_linux_2_eu.id
  instance_type = local.env_config[local.environment].instance_type

  vpc_security_group_ids = [aws_security_group.web_eu_west_1.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.eu_west_1.arn
      delete_on_termination = true
    }
  }

  # User data script for basic web server setup
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${local.environment} - EU-WEST-1</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch logs
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<CWCONFIG
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "${aws_cloudwatch_log_group.app_logs_eu_west_1.name}",
                "log_stream_name": "{instance_id}/httpd/access"
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "${aws_cloudwatch_log_group.app_logs_eu_west_1.name}",
                "log_stream_name": "{instance_id}/httpd/error"
              }
            ]
          }
        }
      }
    }
CWCONFIG
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.environment}-web-instance-eu-west-1"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.environment}-web-volume-eu-west-1"
    })
  }
}

# Auto Scaling Group - US-EAST-1
resource "aws_autoscaling_group" "web_us_east_1" {
  provider                  = aws.us_east_1
  name                      = "${local.environment}-asg-us-east-1"
  vpc_zone_identifier       = aws_subnet.private_us_east_1[*].id
  target_group_arns         = [aws_lb_target_group.main_us_east_1.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = local.env_config[local.environment].asg_min_size
  max_size         = local.env_config[local.environment].asg_max_size
  desired_capacity = local.env_config[local.environment].asg_min_size

  launch_template {
    id      = aws_launch_template.web_us_east_1.id
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
    value               = "${local.environment}-asg-instance-us-east-1"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = local.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Group - EU-WEST-1
resource "aws_autoscaling_group" "web_eu_west_1" {
  provider                  = aws.eu_west_1
  name                      = "${local.environment}-asg-eu-west-1"
  vpc_zone_identifier       = aws_subnet.private_eu_west_1[*].id
  target_group_arns         = [aws_lb_target_group.main_eu_west_1.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = local.env_config[local.environment].asg_min_size
  max_size         = local.env_config[local.environment].asg_max_size
  desired_capacity = local.env_config[local.environment].asg_min_size

  launch_template {
    id      = aws_launch_template.web_eu_west_1.id
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
    value               = "${local.environment}-asg-instance-eu-west-1"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = local.environment
    propagate_at_launch = true
  }
}

# RDS Subnet Groups - US-EAST-1
resource "aws_db_subnet_group" "rds_us_east_1" {
  provider   = aws.us_east_1
  name       = "${local.environment}-db-subnet-group-us-east-1"
  subnet_ids = aws_subnet.database_us_east_1[*].id

  tags = {
    Name = "${local.environment}-db-subnet-group-us-east-1"
  }
}

# RDS Subnet Groups - EU-WEST-1
resource "aws_db_subnet_group" "rds_eu_west_1" {
  provider   = aws.eu_west_1
  name       = "${local.environment}-db-subnet-group-eu-west-1"
  subnet_ids = aws_subnet.database_eu_west_1[*].id

  tags = {
    Name = "${local.environment}-db-subnet-group-eu-west-1"
  }
}

# RDS Instance - US-EAST-1 (Multi-AZ PostgreSQL)
resource "aws_db_instance" "main_us_east_1" {
  provider   = aws.us_east_1
  identifier = "${local.environment}-rds-us-east-1"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = local.env_config[local.environment].db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.us_east_1.arn

  db_name  = "${local.environment}db"
  username = var.db_username
  password = random_password.rds_password_us_east_1.result

  vpc_security_group_ids = [aws_security_group.rds_us_east_1.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_us_east_1.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = local.environment == "prod" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # IMPORTANT: No deletion protection as per requirements
  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "${local.environment}-rds-us-east-1"
  }
}

# RDS Instance - EU-WEST-1 (Multi-AZ PostgreSQL)
resource "aws_db_instance" "main_eu_west_1" {
  provider   = aws.eu_west_1
  identifier = "${local.environment}-rds-eu-west-1"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = local.env_config[local.environment].db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.eu_west_1.arn

  db_name  = "${local.environment}db"
  username = var.db_username
  password = random_password.rds_password_eu_west_1.result

  vpc_security_group_ids = [aws_security_group.rds_eu_west_1.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_eu_west_1.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = local.environment == "prod" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # IMPORTANT: No deletion protection as per requirements
  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "${local.environment}-rds-eu-west-1"
  }
}

# Outputs for reference
output "alb_endpoints" {
  description = "Load balancer endpoints for each region"
  value = {
    us_east_1 = aws_lb.main_us_east_1.dns_name
    eu_west_1 = aws_lb.main_eu_west_1.dns_name
  }
}

output "rds_endpoints" {
  description = "RDS endpoints for each region"
  value = {
    us_east_1 = aws_db_instance.main_us_east_1.endpoint
    eu_west_1 = aws_db_instance.main_eu_west_1.endpoint
  }
  sensitive = true
}

output "s3_buckets" {
  description = "S3 bucket names for each region"
  value = {
    us_east_1 = aws_s3_bucket.config_us_east_1.id
    eu_west_1 = aws_s3_bucket.config_eu_west_1.id
  }
}

output "rds_secrets" {
  description = "Secrets Manager ARNs for RDS passwords"
  value = {
    us_east_1 = aws_secretsmanager_secret.rds_password_us_east_1.arn
    eu_west_1 = aws_secretsmanager_secret.rds_password_eu_west_1.arn
  }
}
