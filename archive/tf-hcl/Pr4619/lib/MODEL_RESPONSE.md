```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for the new region (us-west-2)
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Project       = var.project_name
      ManagedBy     = "terraform"
      MigratedFrom  = "us-west-1"
      MigrationDate = var.migration_date
    }
  }
}

# Alias provider for the old region (for reference/cleanup)
provider "aws" {
  alias  = "old_region"
  region = "us-west-1"
}

# Variables
variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "cloud-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "cloud-ops"
}

variable "use2_cidr" {
  description = "CIDR block for us-east-2 VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "euw2_cidr" {
  description = "CIDR block for eu-west-2 VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "use2_public_subnets" {
  description = "Public subnet CIDR blocks for us-east-2"
  type        = map(string)
  default     = {
    "us-east-2a" = "10.10.1.0/24"
    "us-east-2b" = "10.10.2.0/24"
  }
}

variable "use2_private_subnets" {
  description = "Private subnet CIDR blocks for us-east-2"
  type        = map(string)
  default     = {
    "us-east-2a" = "10.10.11.0/24"
    "us-east-2b" = "10.10.12.0/24"
  }
}

variable "euw2_public_subnets" {
  description = "Public subnet CIDR blocks for eu-west-2"
  type        = map(string)
  default     = {
    "eu-west-2a" = "10.20.1.0/24"
    "eu-west-2b" = "10.20.2.0/24"
  }
}

variable "euw2_private_subnets" {
  description = "Private subnet CIDR blocks for eu-west-2"
  type        = map(string)
  default     = {
    "eu-west-2a" = "10.20.11.0/24"
    "eu-west-2b" = "10.20.12.0/24"
  }
}

variable "web_instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "rds_engine_version" {
  description = "RDS PostgreSQL engine version"
  type        = string
  default     = "13.4"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "rds_storage_size" {
  description = "RDS storage size in GB"
  type        = number
  default     = 20
}

variable "s3_file_expiration_days" {
  description = "Number of days to retain files in S3"
  type        = number
  default     = 90
}
Now, let's start creating the resources for each region. We'll begin with the network foundation.

# US-EAST-2 Resources

# VPC in us-east-2
resource "aws_vpc" "use2_vpc" {
  provider = aws.use2
  
  cidr_block           = var.use2_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-vpc"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Internet Gateway for us-east-2
resource "aws_internet_gateway" "use2_igw" {
  provider = aws.use2
  
  vpc_id = aws_vpc.use2_vpc.id
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-igw"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public subnets in us-east-2
resource "aws_subnet" "use2_public" {
  provider = aws.use2
  
  for_each = var.use2_public_subnets
  
  vpc_id                  = aws_vpc.use2_vpc.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-public-${substr(each.key, -1, 1)}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Private subnets in us-east-2
resource "aws_subnet" "use2_private" {
  provider = aws.use2
  
  for_each = var.use2_private_subnets
  
  vpc_id                  = aws_vpc.use2_vpc.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-private-${substr(each.key, -1, 1)}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Elastic IP for NAT Gateway in us-east-2
resource "aws_eip" "use2_nat_eip" {
  provider = aws.use2
  domain   = "vpc"
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-nat-eip"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# NAT Gateway in us-east-2
resource "aws_nat_gateway" "use2_nat" {
  provider = aws.use2
  
  allocation_id = aws_eip.use2_nat_eip.id
  subnet_id     = aws_subnet.use2_public[keys(var.use2_public_subnets)[0]].id
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-nat"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public route table in us-east-2
resource "aws_route_table" "use2_public_rt" {
  provider = aws.use2
  
  vpc_id = aws_vpc.use2_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.use2_igw.id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-public-rt"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Private route table in us-east-2
resource "aws_route_table" "use2_private_rt" {
  provider = aws.use2
  
  vpc_id = aws_vpc.use2_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.use2_nat.id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-private-rt"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public subnet route table associations in us-east-2
resource "aws_route_table_association" "use2_public" {
  provider = aws.use2
  
  for_each = aws_subnet.use2_public
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.use2_public_rt.id
}

# Private subnet route table associations in us-east-2
resource "aws_route_table_association" "use2_private" {
  provider = aws.use2
  
  for_each = aws_subnet.use2_private
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.use2_private_rt.id
}
Now, let's repeat this for EU-WEST-2 region:

# EU-WEST-2 Resources

# VPC in eu-west-2
resource "aws_vpc" "euw2_vpc" {
  provider = aws.euw2
  
  cidr_block           = var.euw2_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-vpc"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Internet Gateway for eu-west-2
resource "aws_internet_gateway" "euw2_igw" {
  provider = aws.euw2
  
  vpc_id = aws_vpc.euw2_vpc.id
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-igw"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public subnets in eu-west-2
resource "aws_subnet" "euw2_public" {
  provider = aws.euw2
  
  for_each = var.euw2_public_subnets
  
  vpc_id                  = aws_vpc.euw2_vpc.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-public-${substr(each.key, -1, 1)}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Private subnets in eu-west-2
resource "aws_subnet" "euw2_private" {
  provider = aws.euw2
  
  for_each = var.euw2_private_subnets
  
  vpc_id                  = aws_vpc.euw2_vpc.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-private-${substr(each.key, -1, 1)}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Elastic IP for NAT Gateway in eu-west-2
resource "aws_eip" "euw2_nat_eip" {
  provider = aws.euw2
  domain   = "vpc"
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-nat-eip"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# NAT Gateway in eu-west-2
resource "aws_nat_gateway" "euw2_nat" {
  provider = aws.euw2
  
  allocation_id = aws_eip.euw2_nat_eip.id
  subnet_id     = aws_subnet.euw2_public[keys(var.euw2_public_subnets)[0]].id
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-nat"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public route table in eu-west-2
resource "aws_route_table" "euw2_public_rt" {
  provider = aws.euw2
  
  vpc_id = aws_vpc.euw2_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.euw2_igw.id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-public-rt"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Private route table in eu-west-2
resource "aws_route_table" "euw2_private_rt" {
  provider = aws.euw2
  
  vpc_id = aws_vpc.euw2_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.euw2_nat.id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-private-rt"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Public subnet route table associations in eu-west-2
resource "aws_route_table_association" "euw2_public" {
  provider = aws.euw2
  
  for_each = aws_subnet.euw2_public
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.euw2_public_rt.id
}

# Private subnet route table associations in eu-west-2
resource "aws_route_table_association" "euw2_private" {
  provider = aws.euw2
  
  for_each = aws_subnet.euw2_private
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.euw2_private_rt.id
}
Next, let's create the KMS keys for encryption in both regions:

# KMS key in us-east-2
resource "aws_kms_key" "use2_kms" {
  provider = aws.use2
  
  description             = "KMS key for encrypting resources in us-east-2"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-kms"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

resource "aws_kms_alias" "use2_kms_alias" {
  provider = aws.use2
  
  name          = "alias/cloud-setup-${var.env}-use2-kms"
  target_key_id = aws_kms_key.use2_kms.key_id
}

# KMS key in eu-west-2
resource "aws_kms_key" "euw2_kms" {
  provider = aws.euw2
  
  description             = "KMS key for encrypting resources in eu-west-2"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-kms"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

resource "aws_kms_alias" "euw2_kms_alias" {
  provider = aws.euw2
  
  name          = "alias/cloud-setup-${var.env}-euw2-kms"
  target_key_id = aws_kms_key.euw2_kms.key_id
}
Now, let's create the security groups for our instances in both regions:

# Security group for web servers in us-east-2
resource "aws_security_group" "use2_web_sg" {
  provider = aws.use2
  
  name        = "cloud-setup-${var.env}-use2-web-sg"
  description = "Security group for web servers in us-east-2"
  vpc_id      = aws_vpc.use2_vpc.id
  
  ingress {
    description      = "HTTPS from anywhere"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  ingress {
    description      = "HTTP from anywhere (for ALB)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-web-sg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Security group for RDS in us-east-2
resource "aws_security_group" "use2_rds_sg" {
  provider = aws.use2
  
  name        = "cloud-setup-${var.env}-use2-rds-sg"
  description = "Security group for RDS in us-east-2"
  vpc_id      = aws_vpc.use2_vpc.id
  
  ingress {
    description     = "PostgreSQL from web tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.use2_web_sg.id]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-rds-sg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Security group for web servers in eu-west-2
resource "aws_security_group" "euw2_web_sg" {
  provider = aws.euw2
  
  name        = "cloud-setup-${var.env}-euw2-web-sg"
  description = "Security group for web servers in eu-west-2"
  vpc_id      = aws_vpc.euw2_vpc.id
  
  ingress {
    description      = "HTTPS from anywhere"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  ingress {
    description      = "HTTP from anywhere (for ALB)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-web-sg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Security group for RDS in eu-west-2
resource "aws_security_group" "euw2_rds_sg" {
  provider = aws.euw2
  
  name        = "cloud-setup-${var.env}-euw2-rds-sg"
  description = "Security group for RDS in eu-west-2"
  vpc_id      = aws_vpc.euw2_vpc.id
  
  ingress {
    description     = "PostgreSQL from web tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.euw2_web_sg.id]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-rds-sg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}
Now, let's create IAM roles and policies for EC2 instances:

# IAM role for EC2 instances with SSM access
resource "aws_iam_role" "ec2_role" {
  provider = aws.use2
  
  name = "cloud-setup-${var.env}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
  
  tags = {
    Name        = "cloud-setup-${var.env}-ec2-role"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Attach AmazonEC2ReadOnlyAccess policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_ro_attach" {
  provider = aws.use2
  
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
}

# Attach AmazonSSMManagedInstanceCore policy for SSM access
resource "aws_iam_role_policy_attachment" "ssm_attach" {
  provider = aws.use2
  
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.use2
  
  name = "cloud-setup-${var.env}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
Let's create RDS instances in both regions:

# RDS subnet group in us-east-2
resource "aws_db_subnet_group" "use2_db_subnet_group" {
  provider = aws.use2
  
  name        = "cloud-setup-${var.env}-use2-db-subnet-group"
  description = "DB subnet group for RDS in us-east-2"
  subnet_ids  = [for subnet in aws_subnet.use2_private : subnet.id]
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-db-subnet-group"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# RDS parameter group in us-east-2
resource "aws_db_parameter_group" "use2_db_param_group" {
  provider = aws.use2
  
  name        = "cloud-setup-${var.env}-use2-postgres"
  family      = "postgres13"
  description = "PostgreSQL parameter group for RDS in us-east-2"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-postgres"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# RDS instance in us-east-2
resource "aws_db_instance" "use2_db" {
  provider = aws.use2
  
  identifier             = "cloud-setup-${var.env}-use2-db"
  engine                 = "postgres"
  engine_version         = var.rds_engine_version
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_storage_size
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.use2_kms.arn
  username               = "dbadmin"
  password               = "YourStrongPasswordHere123!"  # In a real scenario, use aws_secretsmanager_secret
  db_subnet_group_name   = aws_db_subnet_group.use2_db_subnet_group.name
  parameter_group_name   = aws_db_parameter_group.use2_db_param_group.name
  vpc_security_group_ids = [aws_security_group.use2_rds_sg.id]
  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-db"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# RDS subnet group in eu-west-2
resource "aws_db_subnet_group" "euw2_db_subnet_group" {
  provider = aws.euw2
  
  name        = "cloud-setup-${var.env}-euw2-db-subnet-group"
  description = "DB subnet group for RDS in eu-west-2"
  subnet_ids  = [for subnet in aws_subnet.euw2_private : subnet.id]
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-db-subnet-group"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# RDS parameter group in eu-west-2
resource "aws_db_parameter_group" "euw2_db_param_group" {
  provider = aws.euw2
  
  name        = "cloud-setup-${var.env}-euw2-postgres"
  family      = "postgres13"
  description = "PostgreSQL parameter group for RDS in eu-west-2"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-postgres"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# RDS instance in eu-west-2
resource "aws_db_instance" "euw2_db" {
  provider = aws.euw2
  
  identifier             = "cloud-setup-${var.env}-euw2-db"
  engine                 = "postgres"
  engine_version         = var.rds_engine_version
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_storage_size
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.euw2_kms.arn
  username               = "dbadmin"
  password               = "YourStrongPasswordHere123!"  # In a real scenario, use aws_secretsmanager_secret
  db_subnet_group_name   = aws_db_subnet_group.euw2_db_subnet_group.name
  parameter_group_name   = aws_db_parameter_group.euw2_db_param_group.name
  vpc_security_group_ids = [aws_security_group.euw2_rds_sg.id]
  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-db"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}
Let's create S3 buckets and Lambda functions for file processing:

# S3 bucket in us-east-2
resource "aws_s3_bucket" "use2_bucket" {
  provider = aws.use2
  
  bucket = "cloud-setup-${var.env}-use2-files-${random_id.suffix.hex}"
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-files"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

# S3 bucket versioning in us-east-2
resource "aws_s3_bucket_versioning" "use2_bucket_versioning" {
  provider = aws.use2
  
  bucket = aws_s3_bucket.use2_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption in us-east-2
resource "aws_s3_bucket_server_side_encryption_configuration" "use2_bucket_encryption" {
  provider = aws.use2
  
  bucket = aws_s3_bucket.use2_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.use2_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block in us-east-2
resource "aws_s3_bucket_public_access_block" "use2_bucket_public_access_block" {
  provider = aws.use2
  
  bucket                  = aws_s3_bucket.use2_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lambda IAM role
resource "aws_iam_role" "use2_lambda_role" {
  provider = aws.use2
  
  name = "cloud-setup-${var.env}-use2-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-lambda-role"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Lambda IAM policy for S3 access
resource "aws_iam_policy" "use2_lambda_s3_policy" {
  provider = aws.use2
  
  name        = "cloud-setup-${var.env}-use2-lambda-s3-policy"
  description = "Policy for Lambda to access S3"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.use2_bucket.arn,
          "${aws_s3_bucket.use2_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.use2_kms.arn
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "use2_lambda_s3_attach" {
  provider = aws.use2
  
  role       = aws_iam_role.use2_lambda_role.name
  policy_arn = aws_iam_policy.use2_lambda_s3_policy.arn
}

# Lambda basic execution role attachment
resource "aws_iam_role_policy_attachment" "use2_lambda_basic_exec_attach" {
  provider = aws.use2
  
  role       = aws_iam_role.use2_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function in us-east-2
resource "aws_lambda_function" "use2_lambda" {
  provider = aws.use2
  
  function_name    = "cloud-setup-${var.env}-use2-processor"
  role             = aws_iam_role.use2_lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  filename         = "lambda.zip"  # In a real scenario, this would be your actual Lambda code
  source_code_hash = filebase64sha256("lambda.zip")
  
  environment {
    variables = {
      REGION = "us-east-2"
      BUCKET = aws_s3_bucket.use2_bucket.bucket
    }
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-processor"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# S3 bucket notification for Lambda trigger
resource "aws_s3_bucket_notification" "use2_bucket_notification" {
  provider = aws.use2
  
  bucket = aws_s3_bucket.use2_bucket.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.use2_lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
}

# Lambda permission for S3 invocation
resource "aws_lambda_permission" "use2_allow_bucket" {
  provider = aws.use2
  
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.use2_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.use2_bucket.arn
}
Now let's do the same for EU-WEST-2:

# S3 bucket in eu-west-2
resource "aws_s3_bucket" "euw2_bucket" {
  provider = aws.euw2
  
  bucket = "cloud-setup-${var.env}-euw2-files-${random_id.suffix.hex}"
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-files"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# S3 bucket versioning in eu-west-2
resource "aws_s3_bucket_versioning" "euw2_bucket_versioning" {
  provider = aws.euw2
  
  bucket = aws_s3_bucket.euw2_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption in eu-west-2
resource "aws_s3_bucket_server_side_encryption_configuration" "euw2_bucket_encryption" {
  provider = aws.euw2
  
  bucket = aws_s3_bucket.euw2_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.euw2_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block in eu-west-2
resource "aws_s3_bucket_public_access_block" "euw2_bucket_public_access_block" {
  provider = aws.euw2
  
  bucket                  = aws_s3_bucket.euw2_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lambda IAM role for eu-west-2
resource "aws_iam_role" "euw2_lambda_role" {
  provider = aws.euw2
  
  name = "cloud-setup-${var.env}-euw2-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-lambda-role"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# Lambda IAM policy for S3 access in eu-west-2
resource "aws_iam_policy" "euw2_lambda_s3_policy" {
  provider = aws.euw2
  
  name        = "cloud-setup-${var.env}-euw2-lambda-s3-policy"
  description = "Policy for Lambda to access S3 in eu-west-2"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.euw2_bucket.arn,
          "${aws_s3_bucket.euw2_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.euw2_kms.arn
      }
    ]
  })
}

# Attach policy to Lambda role in eu-west-2
resource "aws_iam_role_policy_attachment" "euw2_lambda_s3_attach" {
  provider = aws.euw2
  
  role       = aws_iam_role.euw2_lambda_role.name
  policy_arn = aws_iam_policy.euw2_lambda_s3_policy.arn
}

# Lambda basic execution role attachment in eu-west-2
resource "aws_iam_role_policy_attachment" "euw2_lambda_basic_exec_attach" {
  provider = aws.euw2
  
  role       = aws_iam_role.euw2_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function in eu-west-2
resource "aws_lambda_function" "euw2_lambda" {
  provider = aws.euw2
  
  function_name    = "cloud-setup-${var.env}-euw2-processor"
  role             = aws_iam_role.euw2_lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  filename         = "lambda.zip"  # In a real scenario, this would be your actual Lambda code
  source_code_hash = filebase64sha256("lambda.zip")
  
  environment {
    variables = {
      REGION = "eu-west-2"
      BUCKET = aws_s3_bucket.euw2_bucket.bucket
    }
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-processor"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# S3 bucket notification for Lambda trigger in eu-west-2
resource "aws_s3_bucket_notification" "euw2_bucket_notification" {
  provider = aws.euw2
  
  bucket = aws_s3_bucket.euw2_bucket.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.euw2_lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
}

# Lambda permission for S3 invocation in eu-west-2
resource "aws_lambda_permission" "euw2_allow_bucket" {
  provider = aws.euw2
  
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.euw2_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.euw2_bucket.arn
}
Now, let's create EC2 instances and ALB in both regions:

# EC2 instances in us-east-2
resource "aws_instance" "use2_web" {
  provider = aws.use2
  
  count = 2
  
  ami                    = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI (example)
  instance_type          = var.web_instance_type
  subnet_id              = aws_subnet.use2_private[keys(var.use2_private_subnets)[count.index % length(keys(var.use2_private_subnets))]].id
  vpc_security_group_ids = [aws_security_group.use2_web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"  # Enforce IMDSv2
  }
  
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo '<html><body><h1>Hello from us-east-2 instance ${count.index}</h1></body></html>' > /var/www/html/index.html
              EOF
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-web-${count.index}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB in us-east-2
resource "aws_lb" "use2_alb" {
  provider = aws.use2
  
  name               = "cloud-setup-${var.env}-use2-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.use2_web_sg.id]
  subnets            = [for subnet in aws_subnet.use2_public : subnet.id]
  
  enable_deletion_protection = false
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-alb"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB target group in us-east-2
resource "aws_lb_target_group" "use2_tg" {
  provider = aws.use2
  
  name     = "cloud-setup-${var.env}-use2-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.use2_vpc.id
  
  health_check {
    enabled             = true
    path                = "/"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-tg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB target group attachment in us-east-2
resource "aws_lb_target_group_attachment" "use2_tg_attachment" {
  provider = aws.use2
  
  count            = length(aws_instance.use2_web)
  target_group_arn = aws_lb_target_group.use2_tg.arn
  target_id        = aws_instance.use2_web[count.index].id
  port             = 80
}

# ALB listener in us-east-2
resource "aws_lb_listener" "use2_listener" {
  provider = aws.use2
  
  load_balancer_arn = aws_lb.use2_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.use2_tg.arn
  }
}

# EC2 instances in eu-west-2
resource "aws_instance" "euw2_web" {
  provider = aws.euw2
  
  count = 2
  
  ami                    = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI (example)
  instance_type          = var.web_instance_type
  subnet_id              = aws_subnet.euw2_private[keys(var.euw2_private_subnets)[count.index % length(keys(var.euw2_private_subnets))]].id
  vpc_security_group_ids = [aws_security_group.euw2_web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"  # Enforce IMDSv2
  }
  
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo '<html><body><h1>Hello from eu-west-2 instance ${count.index}</h1></body></html>' > /var/www/html/index.html
              EOF
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-web-${count.index}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB in eu-west-2
resource "aws_lb" "euw2_alb" {
  provider = aws.euw2
  
  name               = "cloud-setup-${var.env}-euw2-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.euw2_web_sg.id]
  subnets            = [for subnet in aws_subnet.euw2_public : subnet.id]
  
  enable_deletion_protection = false
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-alb"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB target group in eu-west-2
resource "aws_lb_target_group" "euw2_tg" {
  provider = aws.euw2
  
  name     = "cloud-setup-${var.env}-euw2-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.euw2_vpc.id
  
  health_check {
    enabled             = true
    path                = "/"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-tg"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# ALB target group attachment in eu-west-2
resource "aws_lb_target_group_attachment" "euw2_tg_attachment" {
  provider = aws.euw2
  
  count            = length(aws_instance.euw2_web)
  target_group_arn = aws_lb_target_group.euw2_tg.arn
  target_id        = aws_instance.euw2_web[count.index].id
  port             = 80
}

# ALB listener in eu-west-2
resource "aws_lb_listener" "euw2_listener" {
  provider = aws.euw2
  
  load_balancer_arn = aws_lb.euw2_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.euw2_tg.arn
  }
}
Finally, let's create CloudWatch alarms and SNS topics:

# SNS topic for us-east-2
resource "aws_sns_topic" "use2_alerts" {
  provider = aws.use2
  
  name = "cloud-setup-${var.env}-use2-alerts"
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-alerts"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# CloudWatch alarm for EC2 CPU in us-east-2
resource "aws_cloudwatch_metric_alarm" "use2_cpu_alarm" {
  provider = aws.use2
  
  count               = length(aws_instance.use2_web)
  alarm_name          = "cloud-setup-${var.env}-use2-cpu-alarm-${count.index}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.use2_alerts.arn]
  
  dimensions = {
    InstanceId = aws_instance.use2_web[count.index].id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-cpu-alarm-${count.index}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# CloudWatch log group for EC2 in us-east-2
resource "aws_cloudwatch_log_group" "use2_logs" {
  provider = aws.use2
  
  name              = "/aws/ec2/cloud-setup-${var.env}-use2"
  retention_in_days = 30
  
  tags = {
    Name        = "cloud-setup-${var.env}-use2-logs"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# SNS topic for eu-west-2
resource "aws_sns_topic" "euw2_alerts" {
  provider = aws.euw2
  
  name = "cloud-setup-${var.env}-euw2-alerts"
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-alerts"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# CloudWatch alarm for EC2 CPU in eu-west-2
resource "aws_cloudwatch_metric_alarm" "euw2_cpu_alarm" {
  provider = aws.euw2
  
  count               = length(aws_instance.euw2_web)
  alarm_name          = "cloud-setup-${var.env}-euw2-cpu-alarm-${count.index}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.euw2_alerts.arn]
  
  dimensions = {
    InstanceId = aws_instance.euw2_web[count.index].id
  }
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-cpu-alarm-${count.index}"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}

# CloudWatch log group for EC2 in eu-west-2
resource "aws_cloudwatch_log_group" "euw2_logs" {
  provider = aws.euw2
  
  name              = "/aws/ec2/cloud-setup-${var.env}-euw2"
  retention_in_days = 30
  
  tags = {
    Name        = "cloud-setup-${var.env}-euw2-logs"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    project     = "cloud-setup"
  }
}
Finally, let's define the outputs required by the validation system:

# Outputs
output "use2_vpc_id" {
  description = "ID of the VPC in us-east-2"
  value       = aws_vpc.use2_vpc.id
}

output "use2_public_subnet_ids" {
  description = "IDs of public subnets in us-east-2"
  value       = [for subnet in aws_subnet.use2_public : subnet.id]
}

output "use2_private_subnet_ids" {
  description = "IDs of private subnets in us-east-2"
  value       = [for subnet in aws_subnet.use2_private : subnet.id]
}

output "euw2_vpc_id" {
  description = "ID of the VPC in eu-west-2"
  value       = aws_vpc.euw2_vpc.id
}

output "euw2_public_subnet_ids" {
  description = "IDs of public subnets in eu-west-2"
  value       = [for subnet in aws_subnet.euw2_public : subnet.id]
}

output "euw2_private_subnet_ids" {
  description = "IDs of private subnets in eu-west-2"
  value       = [for subnet in aws_subnet.euw2_private : subnet.id]
}

output "use2_kms_key_arn" {
  description = "ARN of the KMS key in us-east-2"
  value       = aws_kms_key.use2_kms.arn
}

output "euw2_kms_key_arn" {
  description = "ARN of the KMS key in eu-west-2"
  value       = aws_kms_key.euw2_kms.arn
}

output "use2_s3_bucket_name" {
  description = "Name of the S3 bucket in us-east-2"
  value       = aws_s3_bucket.use2_bucket.bucket
}

output "euw2_s3_bucket_name" {
  description = "Name of the S3 bucket in eu-west-2"
  value       = aws_s3_bucket.euw2_bucket.bucket
}

output "use2_lambda_function" {
  description = "Details of the Lambda function in us-east-2"
  value       = aws_lambda_function.use2_lambda.function_name
}

output "euw2_lambda_function" {
  description = "Details of the Lambda function in eu-west-2"
  value       = aws_lambda_function.euw2_lambda.function_name
}

output "use2_alb_arn" {
  description = "ARN of the ALB in us-east-2"
  value       = aws_lb.use2_alb.arn
}

output "use2_alb_dns_name" {
  description = "DNS name of the ALB in us-east-2"
  value       = aws_lb.use2_alb.dns_name
}

output "euw2_alb_arn" {
  description = "ARN of the ALB in eu-west-2"
  value       = aws_lb.euw2_alb.arn
}

output "euw2_alb_dns_name" {
  description = "DNS name of the ALB in eu-west-2"
  value       = aws_lb.euw2_alb.dns_name
}

output "use2_rds_endpoint" {
  description = "Endpoint of the RDS instance in us-east-2"
  value       = aws_db_instance.use2_db### Answer 
```