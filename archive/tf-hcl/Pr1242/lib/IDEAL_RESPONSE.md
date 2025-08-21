# Terraform Infrastructure Code

## provider.tf

```hcl
# provider.tf

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
provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_2"
  region = "us-east-2"
}

provider "aws" {
  alias  = "us_west_1"
  region = "us-west-1"
}

```

## tap_stack.tf

```hcl
# Variables
variable "aws_region" {
  description = "AWS region for provider configuration"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "vpc_cidrs" {
  description = "CIDR blocks for VPCs in different regions"
  type        = map(string)
  default = {
    "us-east-2" = "10.0.0.0/16"
    "us-west-1" = "10.1.0.0/16"
  }
}

variable "availability_zones" {
  description = "Availability zones for each region"
  type        = map(list(string))
  default = {
    "us-east-2" = ["us-east-2a", "us-east-2b"]
    "us-west-1" = ["us-west-1a", "us-west-1c"]
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# Locals
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }

  regions = ["us-east-2", "us-west-1"]
}


# Data sources for AMIs
data "aws_ami" "amazon_linux_east" {
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

data "aws_ami" "amazon_linux_west" {
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

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# KMS Keys for encryption
resource "aws_kms_key" "s3_key" {
  provider                = aws.us_east_2
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-kms-key"
  })
}

resource "aws_kms_alias" "s3_key_alias" {
  provider      = aws.us_east_2
  name          = "alias/${var.project_name}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_key" "rds_key_east" {
  provider                = aws.us_east_2
  description             = "KMS key for RDS encryption in us-east-2"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-kms-key-east"
  })
}

resource "aws_kms_key" "rds_key_west" {
  provider                = aws.us_west_1
  description             = "KMS key for RDS encryption in us-west-1"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-kms-key-west"
  })
}

# VPC - US East 1
resource "aws_vpc" "main_east" {
  provider             = aws.us_east_2
  cidr_block           = var.vpc_cidrs["us-east-2"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-vpc-us-east-2"
    Region = "us-east-2"
  })
}

# VPC - US West 1
resource "aws_vpc" "main_west" {
  provider             = aws.us_west_1
  cidr_block           = var.vpc_cidrs["us-west-1"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-vpc-us-west-1"
    Region = "us-west-1"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main_east" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.main_east.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-igw-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_internet_gateway" "main_west" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.main_west.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-igw-us-west-1"
    Region = "us-west-1"
  })
}

# Public Subnets
resource "aws_subnet" "public_east" {
  provider                = aws.us_east_2
  vpc_id                  = aws_vpc.main_east.id
  cidr_block              = cidrsubnet(var.vpc_cidrs["us-east-2"], 8, 1)
  availability_zone       = var.availability_zones["us-east-2"][0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-subnet-us-east-2"
    Type   = "Public"
    Region = "us-east-2"
  })
}

resource "aws_subnet" "public_west" {
  provider                = aws.us_west_1
  vpc_id                  = aws_vpc.main_west.id
  cidr_block              = cidrsubnet(var.vpc_cidrs["us-west-1"], 8, 1)
  availability_zone       = var.availability_zones["us-west-1"][0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-subnet-us-west-1"
    Type   = "Public"
    Region = "us-west-1"
  })
}

# Private Subnets
resource "aws_subnet" "private_east_1" {
  provider          = aws.us_east_2
  vpc_id            = aws_vpc.main_east.id
  cidr_block        = cidrsubnet(var.vpc_cidrs["us-east-2"], 8, 2)
  availability_zone = var.availability_zones["us-east-2"][0]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-subnet-1-us-east-2"
    Type   = "Private"
    Region = "us-east-2"
  })
}

resource "aws_subnet" "private_east_2" {
  provider          = aws.us_east_2
  vpc_id            = aws_vpc.main_east.id
  cidr_block        = cidrsubnet(var.vpc_cidrs["us-east-2"], 8, 3)
  availability_zone = var.availability_zones["us-east-2"][1]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-subnet-2-us-east-2"
    Type   = "Private"
    Region = "us-east-2"
  })
}

resource "aws_subnet" "private_west_1" {
  provider          = aws.us_west_1
  vpc_id            = aws_vpc.main_west.id
  cidr_block        = cidrsubnet(var.vpc_cidrs["us-west-1"], 8, 2)
  availability_zone = var.availability_zones["us-west-1"][0]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-subnet-1-us-west-1"
    Type   = "Private"
    Region = "us-west-1"
  })
}

resource "aws_subnet" "private_west_2" {
  provider          = aws.us_west_1
  vpc_id            = aws_vpc.main_west.id
  cidr_block        = cidrsubnet(var.vpc_cidrs["us-west-1"], 8, 3)
  availability_zone = var.availability_zones["us-west-1"][1]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-subnet-2-us-west-1"
    Type   = "Private"
    Region = "us-west-1"
  })
}

# Route Tables - Public
resource "aws_route_table" "public_east" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.main_east.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_east.id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-rt-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_route_table" "public_west" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.main_west.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_west.id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-rt-us-west-1"
    Region = "us-west-1"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_east" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.public_east.id
  route_table_id = aws_route_table.public_east.id
}

resource "aws_route_table_association" "public_west" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.public_west.id
  route_table_id = aws_route_table.public_west.id
}

# Security Groups for EC2
resource "aws_security_group" "ec2_east" {
  provider    = aws.us_east_2
  name        = "${var.project_name}-ec2-sg-us-east-2"
  description = "Security group for EC2 instances in us-east-2"
  vpc_id      = aws_vpc.main_east.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "SSH outbound"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-ec2-sg-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_security_group" "ec2_west" {
  provider    = aws.us_west_1
  name        = "${var.project_name}-ec2-sg-us-west-1"
  description = "Security group for EC2 instances in us-west-1"
  vpc_id      = aws_vpc.main_west.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "SSH outbound"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-ec2-sg-us-west-1"
    Region = "us-west-1"
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

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

resource "aws_iam_policy" "s3_access_policy" {
  name        = "${var.project_name}-s3-access-policy"
  description = "Policy for EC2 instances to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# EC2 Instances
resource "aws_instance" "web_east" {
  provider                    = aws.us_east_2
  ami                         = data.aws_ami.amazon_linux_east.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public_east.id
  vpc_security_group_ids      = [aws_security_group.ec2_east.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.project_name} - US East 1</h1>" > /var/www/html/index.html
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-web-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_instance" "web_west" {
  provider                    = aws.us_west_1
  ami                         = data.aws_ami.amazon_linux_west.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public_west.id
  vpc_security_group_ids      = [aws_security_group.ec2_west.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.project_name} - US West 1</h1>" > /var/www/html/index.html
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-web-us-west-1"
    Region = "us-west-1"
  })
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  provider = aws.us_east_2
  bucket   = "${var.project_name}-bucket-${random_password.db_password.id}"

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-bucket"
    Region = "us-east-2"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "main" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = "s3:ListBucket"
        Resource = aws_s3_bucket.main.arn
      }
    ]
  })
}

# RDS Subnet Groups
resource "aws_db_subnet_group" "main_east" {
  provider   = aws.us_east_2
  name       = "${var.project_name}-db-subnet-group-east"
  subnet_ids = [aws_subnet.private_east_1.id, aws_subnet.private_east_2.id]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-subnet-group-east"
    Region = "us-east-2"
  })
}

resource "aws_db_subnet_group" "main_west" {
  provider   = aws.us_west_1
  name       = "${var.project_name}-db-subnet-group-west"
  subnet_ids = [aws_subnet.private_west_1.id, aws_subnet.private_west_2.id]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-subnet-group-west"
    Region = "us-west-1"
  })
}

# RDS Security Groups
resource "aws_security_group" "rds_east" {
  provider    = aws.us_east_2
  name        = "${var.project_name}-rds-sg-us-east-2"
  description = "Security group for RDS in us-east-2"
  vpc_id      = aws_vpc.main_east.id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_east.id]
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rds-sg-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_security_group" "rds_west" {
  provider    = aws.us_west_1
  name        = "${var.project_name}-rds-sg-us-west-1"
  description = "Security group for RDS in us-west-1"
  vpc_id      = aws_vpc.main_west.id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_west.id]
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rds-sg-us-west-1"
    Region = "us-west-1"
  })
}

# RDS Instances
resource "aws_db_instance" "main_east" {
  provider = aws.us_east_2

  identifier     = "${var.project_name}-db-us-east-2"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_key_east.arn

  db_name  = "tapstackdb"
  username = "dbadmin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_east.id]
  db_subnet_group_name   = aws_db_subnet_group.main_east.name

  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-us-east-2"
    Region = "us-east-2"
  })
}

resource "aws_db_instance" "main_west" {
  provider = aws.us_west_1

  identifier     = "${var.project_name}-db-us-west-1"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_key_west.arn

  db_name  = "tapstackdb"
  username = "dbadmin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_west.id]
  db_subnet_group_name   = aws_db_subnet_group.main_west.name

  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-us-west-1"
    Region = "us-west-1"
  })
}

# Outputs
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    us_east_2 = aws_vpc.main_east.id
    us_west_1 = aws_vpc.main_west.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = {
    us_east_2 = aws_subnet.public_east.id
    us_west_1 = aws_subnet.public_west.id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value = {
    us_east_2 = [aws_subnet.private_east_1.id, aws_subnet.private_east_2.id]
    us_west_1 = [aws_subnet.private_west_1.id, aws_subnet.private_west_2.id]
  }
}

output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value = {
    us_east_2 = aws_instance.web_east.id
    us_west_1 = aws_instance.web_west.id
  }
}

output "ec2_public_ips" {
  description = "EC2 instance public IP addresses"
  value = {
    us_east_2 = aws_instance.web_east.public_ip
    us_west_1 = aws_instance.web_west.public_ip
  }
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "rds_endpoints" {
  description = "RDS instance endpoints"
  value = {
    us_east_2 = aws_db_instance.main_east.endpoint
    us_west_1 = aws_db_instance.main_west.endpoint
  }
}

output "rds_instance_ids" {
  description = "RDS instance IDs"
  value = {
    us_east_2 = aws_db_instance.main_east.id
    us_west_1 = aws_db_instance.main_west.id
  }
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    s3_key       = aws_kms_key.s3_key.key_id
    rds_key_east = aws_kms_key.rds_key_east.key_id
    rds_key_west = aws_kms_key.rds_key_west.key_id
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    ec2_east = aws_security_group.ec2_east.id
    ec2_west = aws_security_group.ec2_west.id
    rds_east = aws_security_group.rds_east.id
    rds_west = aws_security_group.rds_west.id
  }
}

output "iam_role_arn" {
  description = "IAM role ARN for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

```
