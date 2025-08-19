variable "account_id" {
  type = string
}

variable "caller_arn" {
  type = string
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

variable "availability_zones" {
  type = list(string)
}

######################
# Networking
######################

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.main]
  tags = {
    Name = "${var.project_name}-nat-gateway"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

######################
# Security
######################

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  # SSH ONLY from VPC CIDR - NEVER from 0.0.0.0/0
  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Allow HTTP from ALB to EC2
resource "aws_security_group_rule" "ec2_ingress_http_from_alb" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id
  source_security_group_id = aws_security_group.alb.id
  description       = "Allow HTTP from ALB"
}

# Allow HTTPS from ALB to EC2
resource "aws_security_group_rule" "ec2_ingress_https_from_alb" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id
  source_security_group_id = aws_security_group.alb.id
  description       = "Allow HTTPS from ALB"
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  # HTTP from internet
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS from internet
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Allow HTTP from ALB to EC2
resource "aws_security_group_rule" "alb_egress_http_to_ec2" {
  type              = "egress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.alb.id
  source_security_group_id = aws_security_group.ec2.id
  description       = "Allow HTTP to EC2"
}

# Allow HTTPS from ALB to EC2
resource "aws_security_group_rule" "alb_egress_https_to_ec2" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.alb.id
  source_security_group_id = aws_security_group.ec2.id
  description       = "Allow HTTPS to EC2"
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS instances"

  # MySQL/PostgreSQL from EC2 security group ONLY
  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # No outbound rules needed for RDS
  egress {
    description = "No outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
resource "aws_security_group" "vpc_endpoint" {
  name_prefix = "${var.project_name}-vpc-endpoint-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  # HTTPS from VPC CIDR
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # No outbound rules needed
  egress {
    description = "No outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "${var.project_name}-vpc-endpoint-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

######################
# Storage
######################

# KMS Key for encryption
data "aws_kms_key" "main" {
  key_id = "alias/${var.project_name}-key"
}

resource "aws_s3_bucket" "logs" {
  bucket = "tap-app-dev-064031-qcf7m9d3-logs-bucket"
  force_destroy = true
}

resource "aws_s3_object" "test_object" {
  bucket = aws_s3_bucket.logs.id
  key    = "test-object.txt"
  content = "This is a test object."
}

# VPC S3 Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = {
    Name = "${var.project_name}-s3-endpoint"
  }
}

######################
# IAM
######################

# IAM User with MFA requirement
data "aws_iam_user" "app_user" {
  user_name = "${var.project_name}-app-user"
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "private_route_table_ids" {
  value = aws_route_table.private[*].id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}

output "ec2_sg_id" {
  value = aws_security_group.ec2.id
}

output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "rds_sg_id" {
  value = aws_security_group.rds.id
}

output "vpc_endpoint_sg_id" {
  value = aws_security_group.vpc_endpoint.id
}


output "kms_key_id" {
  value = data.aws_kms_key.main.key_id
}

output "vpc_endpoint_s3_id" {
  value = aws_vpc_endpoint.s3.id
}

output "s3_logs_bucket_name" {
  value = aws_s3_bucket.logs.bucket
}

output "s3_logs_bucket_arn" {
  value = aws_s3_bucket.logs.arn
}
