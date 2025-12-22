# LocalStack-Compatible Infrastructure Configuration
# This simplified configuration only uses services available in LocalStack Community Edition
# Services used: S3, IAM, CloudWatch, SNS, STS

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider configuration for LocalStack
provider "aws" {
  region = "us-east-1"

  # LocalStack configuration
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3         = "http://localhost:4566"
    iam        = "http://localhost:4566"
    sts        = "http://localhost:4566"
    sns        = "http://localhost:4566"
    cloudwatch = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Environment       = var.environment
      ManagedBy         = "Terraform"
      Project           = "RegionMigration"
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

# IAM Role for EC2 Instances (IAM is supported in LocalStack)
resource "aws_iam_role" "ec2_role" {
  name_prefix = "ec2-role-${var.environment_suffix}-"

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

  tags = {
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "ec2-profile-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.name

  tags = {
    Name = "ec2-profile-${var.environment_suffix}"
  }
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name_prefix = "s3-access-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      }
    ]
  })
}

# S3 Bucket for Application Data (S3 is fully supported in LocalStack)
resource "aws_s3_bucket" "app_data" {
  bucket_prefix = "app-data-${var.environment_suffix}-"

  tags = {
    Name = "app-data-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# VPC (placeholder for LocalStack)
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "Private"
  }
}

# NAT Gateway (count based on enable_nat_gateway variable)
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "nat-eip-${var.environment_suffix}"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "private-rt-${var.environment_suffix}"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group for Web Tier
resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environment_suffix}-"
  description = "Security group for web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "web-sg-${var.environment_suffix}"
    Tier = "Web"
  }
}

# Security Group for App Tier
resource "aws_security_group" "app" {
  name_prefix = "app-sg-${var.environment_suffix}-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "Allow traffic from web tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "app-sg-${var.environment_suffix}"
    Tier = "Application"
  }
}

# Security Group for Database Tier
resource "aws_security_group" "database" {
  name_prefix = "db-sg-${var.environment_suffix}-"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Allow PostgreSQL from app tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "db-sg-${var.environment_suffix}"
    Tier = "Database"
  }
}

# Web Tier EC2 Instances
resource "aws_instance" "web" {
  count                  = var.web_instance_count
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[count.index % length(var.availability_zones)].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Web Server ${count.index + 1}</h1>" > /var/www/html/index.html
              EOF

  tags = {
    Name = "web-server-${count.index + 1}-${var.environment_suffix}"
    Tier = "Web"
  }
}

# Application Tier EC2 Instances
resource "aws_instance" "app" {
  count                  = var.app_instance_count
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.private[count.index % length(var.availability_zones)].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              # Application setup would go here
              EOF

  tags = {
    Name = "app-server-${count.index + 1}-${var.environment_suffix}"
    Tier = "Application"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "db-subnet-group-${var.environment_suffix}"
  }
}

# RDS Instance with PostgreSQL
resource "aws_db_instance" "main" {
  identifier_prefix      = "db-${var.environment_suffix}-"
  allocated_storage      = 20
  storage_type           = "gp3"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "main-db-${var.environment_suffix}"
  }
}

# Data source for Amazon Linux AMI
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

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "web_instance_ids" {
  description = "Web server instance IDs"
  value       = aws_instance.web[*].id
}

output "app_instance_ids" {
  description = "Application server instance IDs"
  value       = aws_instance.app[*].id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app_data.id
}

output "web_security_group_id" {
  description = "Web tier security group ID"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "Application tier security group ID"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Database tier security group ID"
  value       = aws_security_group.database.id
}
