# tap_stack.tf - Complete Terraform configuration for multi-region infrastructure

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Regional configurations
  regions = {
    primary = {
      name         = "us-east-1"
      vpc_cidr     = "10.0.0.0/16"
      public_cidr  = "10.0.1.0/24"
      private_cidr = "10.0.2.0/24"
    }
    secondary = {
      name         = "us-west-2"
      vpc_cidr     = "10.1.0.0/16"
      public_cidr  = "10.1.1.0/24"
      private_cidr = "10.1.2.0/24"
    }
  }

  # Resource naming conventions
  resource_names = {
    primary = {
      vpc              = "${var.project_name}-vpc-primary"
      igw              = "${var.project_name}-igw-primary"
      nat              = "${var.project_name}-nat-primary"
      public_subnet    = "${var.project_name}-public-subnet-primary"
      private_subnet   = "${var.project_name}-private-subnet-primary"
      public_rt        = "${var.project_name}-public-rt-primary"
      private_rt       = "${var.project_name}-private-rt-primary"
      security_group   = "${var.project_name}-sg-primary"
      ec2              = "${var.project_name}-ec2-primary"
      s3_bucket        = "${var.project_name}-bucket-primary-${random_string.bucket_suffix.result}"
    }
    secondary = {
      vpc              = "${var.project_name}-vpc-secondary"
      igw              = "${var.project_name}-igw-secondary"
      nat              = "${var.project_name}-nat-secondary"
      public_subnet    = "${var.project_name}-public-subnet-secondary"
      private_subnet   = "${var.project_name}-private-subnet-secondary"
      public_rt        = "${var.project_name}-public-rt-secondary"
      private_rt       = "${var.project_name}-private-rt-secondary"
      security_group   = "${var.project_name}-sg-secondary"
      ec2              = "${var.project_name}-ec2-secondary"
      s3_bucket        = "${var.project_name}-bucket-secondary-${random_string.bucket_suffix.result}"
    }
  }
}

# =============================================================================
# RANDOM RESOURCES
# =============================================================================

# Random string for unique S3 bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.us_west_2
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
  provider = aws.us_east_1
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.us_west_2
  state    = "available"
}

# =============================================================================
# IAM RESOURCES
# =============================================================================

# IAM role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"
  tags = local.common_tags

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
}

# IAM policy for S3 replication
resource "aws_iam_policy" "s3_replication_policy" {
  name        = "${var.project_name}-s3-replication-policy"
  description = "Policy for S3 cross-region replication"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication_role" {
  name = "${var.project_name}-s3-replication-role"
  tags = local.common_tags

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
}

# Attach policy to replication role
resource "aws_iam_role_policy_attachment" "s3_replication_policy_attachment" {
  role       = aws_iam_role.s3_replication_role.name
  policy_arn = aws_iam_policy.s3_replication_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  tags = local.common_tags
}

# =============================================================================
# PRIMARY REGION RESOURCES (us-east-1)
# =============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.regions.primary.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.vpc
    Region = "Primary"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.igw
    Region = "Primary"
  })
}

# Primary Public Subnet
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.regions.primary.public_cidr
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.public_subnet
    Type   = "Public"
    Region = "Primary"
  })
}

# Primary Private Subnet
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.regions.primary.private_cidr
  availability_zone = data.aws_availability_zones.primary.names[0]

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.private_subnet
    Type   = "Private"
    Region = "Primary"
  })
}

# Primary Elastic IP for NAT Gateway
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.resource_names.primary.nat}-eip"
    Region = "Primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary NAT Gateway
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public.id

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.nat
    Region = "Primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.public_rt
    Type   = "Public"
    Region = "Primary"
  })
}

# Primary Private Route Table
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.private_rt
    Type   = "Private"
    Region = "Primary"
  })
}

# Primary Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.primary_public.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.primary_private.id
  route_table_id = aws_route_table.primary_private.id
}

# Primary Security Group
resource "aws_security_group" "primary" {
  provider    = aws.us_east_1
  name        = local.resource_names.primary.security_group
  description = "Security group for primary region EC2 instance"
  vpc_id      = aws_vpc.primary.id

  # Allow HTTPS traffic from within VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.security_group
    Region = "Primary"
  })
}

# Primary EC2 Instance
resource "aws_instance" "primary" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_primary.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.primary_private.id
  vpc_security_group_ids      = [aws_security_group.primary.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Primary Region Server</h1>" > /var/www/html/index.html
              EOF
  )

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.ec2
    Region = "Primary"
  })
}

# =============================================================================
# SECONDARY REGION RESOURCES (us-west-2)
# =============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.regions.secondary.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.vpc
    Region = "Secondary"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.igw
    Region = "Secondary"
  })
}

# Secondary Public Subnet
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.regions.secondary.public_cidr
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.public_subnet
    Type   = "Public"
    Region = "Secondary"
  })
}

# Secondary Private Subnet
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.regions.secondary.private_cidr
  availability_zone = data.aws_availability_zones.secondary.names[0]

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.private_subnet
    Type   = "Private"
    Region = "Secondary"
  })
}

# Secondary Elastic IP for NAT Gateway
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.resource_names.secondary.nat}-eip"
    Region = "Secondary"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary NAT Gateway
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public.id

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.nat
    Region = "Secondary"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.public_rt
    Type   = "Public"
    Region = "Secondary"
  })
}

# Secondary Private Route Table
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.private_rt
    Type   = "Private"
    Region = "Secondary"
  })
}

# Secondary Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.secondary_public.id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.secondary_private.id
  route_table_id = aws_route_table.secondary_private.id
}

# Secondary Security Group
resource "aws_security_group" "secondary" {
  provider    = aws.us_west_2
  name        = local.resource_names.secondary.security_group
  description = "Security group for secondary region EC2 instance"
  vpc_id      = aws_vpc.secondary.id

  # Allow HTTPS traffic from within VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.security_group
    Region = "Secondary"
  })
}

# Secondary EC2 Instance
resource "aws_instance" "secondary" {
  provider                    = aws.us_west_2
  ami                         = data.aws_ami.amazon_linux_secondary.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.secondary_private.id
  vpc_security_group_ids      = [aws_security_group.secondary.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Secondary Region Server</h1>" > /var/www/html/index.html
              EOF
  )

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.ec2
    Region = "Secondary"
  })
}

# =============================================================================
# S3 BUCKETS AND REPLICATION
# =============================================================================

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_1
  bucket   = local.resource_names.primary.s3_bucket

  tags = merge(local.common_tags, {
    Name   = local.resource_names.primary.s3_bucket
    Region = "Primary"
  })
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_2
  bucket   = local.resource_names.secondary.s3_bucket

  tags = merge(local.common_tags, {
    Name   = local.resource_names.secondary.s3_bucket
    Region = "Secondary"
  })
}

# Primary bucket versioning
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Secondary bucket versioning
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Primary bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Primary bucket public access block
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secondary bucket public access block
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication from primary to secondary
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_1
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication_role.arn
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

# Cross-region replication from secondary to primary
resource "aws_s3_bucket_replication_configuration" "secondary_to_primary" {
  provider   = aws.us_west_2
  depends_on = [aws_s3_bucket_versioning.secondary]

  role   = aws_iam_role.s3_replication_role.arn
  bucket = aws_s3_bucket.secondary.id

  rule {
    id     = "ReplicateToPrimary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.primary.arn
      storage_class = "STANDARD"
    }
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

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
output "primary_public_subnet_id" {
  description = "ID of the primary public subnet"
  value       = aws_subnet.primary_public.id
}

output "primary_private_subnet_id" {
  description = "ID of the primary private subnet"
  value       = aws_subnet.primary_private.id
}

output "secondary_public_subnet_id" {
  description = "ID of the secondary public subnet"
  value       = aws_subnet.secondary_public.id
}

output "secondary_private_subnet_id" {
  description = "ID of the secondary private subnet"
  value       = aws_subnet.secondary_private.id
}

# EC2 Outputs
output "primary_ec2_instance_id" {
  description = "ID of the primary EC2 instance"
  value       = aws_instance.primary.id
}

output "secondary_ec2_instance_id" {
  description = "ID of the secondary EC2 instance"
  value       = aws_instance.secondary.id
}

output "primary_ec2_private_ip" {
  description = "Private IP of the primary EC2 instance"
  value       = aws_instance.primary.private_ip
}

output "secondary_ec2_private_ip" {
  description = "Private IP of the secondary EC2 instance"
  value       = aws_instance.secondary.private_ip
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# Security Group Outputs
output "primary_security_group_id" {
  description = "ID of the primary security group"
  value       = aws_security_group.primary.id
}

output "secondary_security_group_id" {
  description = "ID of the secondary security group"
  value       = aws_security_group.secondary.id
}

# S3 Bucket Outputs
output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "s3_replication_iam_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication_role.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

# NAT Gateway Outputs
output "primary_nat_gateway_id" {
  description = "ID of the primary NAT gateway"
  value       = aws_nat_gateway.primary.id
}

output "secondary_nat_gateway_id" {
  description = "ID of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary.id
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

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_id" {
  description = "ID of the primary private route table"
  value       = aws_route_table.primary_private.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_id" {
  description = "ID of the secondary private route table"
  value       = aws_route_table.secondary_private.id
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
# =============================================================================
# ADDITIONAL COMPREHENSIVE OUTPUTS
# =============================================================================

# Elastic IP Outputs
output "primary_nat_eip_id" {
  description = "ID of the primary NAT gateway Elastic IP"
  value       = aws_eip.primary_nat.id
}

output "primary_nat_eip_public_ip" {
  description = "Public IP of the primary NAT gateway Elastic IP"
  value       = aws_eip.primary_nat.public_ip
}

output "primary_nat_eip_allocation_id" {
  description = "Allocation ID of the primary NAT gateway Elastic IP"
  value       = aws_eip.primary_nat.allocation_id
}

output "secondary_nat_eip_id" {
  description = "ID of the secondary NAT gateway Elastic IP"
  value       = aws_eip.secondary_nat.id
}

output "secondary_nat_eip_public_ip" {
  description = "Public IP of the secondary NAT gateway Elastic IP"
  value       = aws_eip.secondary_nat.public_ip
}

output "secondary_nat_eip_allocation_id" {
  description = "Allocation ID of the secondary NAT gateway Elastic IP"
  value       = aws_eip.secondary_nat.allocation_id
}

# Route Table Association Outputs
output "primary_public_route_table_association_id" {
  description = "ID of the primary public route table association"
  value       = aws_route_table_association.primary_public.id
}

output "primary_private_route_table_association_id" {
  description = "ID of the primary private route table association"
  value       = aws_route_table_association.primary_private.id
}

output "secondary_public_route_table_association_id" {
  description = "ID of the secondary public route table association"
  value       = aws_route_table_association.secondary_public.id
}

output "secondary_private_route_table_association_id" {
  description = "ID of the secondary private route table association"
  value       = aws_route_table_association.secondary_private.id
}

# VPC Additional Outputs
output "primary_vpc_arn" {
  description = "ARN of the primary VPC"
  value       = aws_vpc.primary.arn
}

output "secondary_vpc_arn" {
  description = "ARN of the secondary VPC"
  value       = aws_vpc.secondary.arn
}

output "primary_vpc_default_security_group_id" {
  description = "Default security group ID of the primary VPC"
  value       = aws_vpc.primary.default_security_group_id
}

output "secondary_vpc_default_security_group_id" {
  description = "Default security group ID of the secondary VPC"
  value       = aws_vpc.secondary.default_security_group_id
}

output "primary_vpc_main_route_table_id" {
  description = "Main route table ID of the primary VPC"
  value       = aws_vpc.primary.main_route_table_id
}

output "secondary_vpc_main_route_table_id" {
  description = "Main route table ID of the secondary VPC"
  value       = aws_vpc.secondary.main_route_table_id
}

output "primary_vpc_default_network_acl_id" {
  description = "Default network ACL ID of the primary VPC"
  value       = aws_vpc.primary.default_network_acl_id
}

output "secondary_vpc_default_network_acl_id" {
  description = "Default network ACL ID of the secondary VPC"
  value       = aws_vpc.secondary.default_network_acl_id
}

# Subnet Additional Outputs
output "primary_public_subnet_arn" {
  description = "ARN of the primary public subnet"
  value       = aws_subnet.primary_public.arn
}

output "primary_private_subnet_arn" {
  description = "ARN of the primary private subnet"
  value       = aws_subnet.primary_private.arn
}

output "secondary_public_subnet_arn" {
  description = "ARN of the secondary public subnet"
  value       = aws_subnet.secondary_public.arn
}

output "secondary_private_subnet_arn" {
  description = "ARN of the secondary private subnet"
  value       = aws_subnet.secondary_private.arn
}

output "primary_public_subnet_availability_zone" {
  description = "Availability zone of the primary public subnet"
  value       = aws_subnet.primary_public.availability_zone
}

output "primary_private_subnet_availability_zone" {
  description = "Availability zone of the primary private subnet"
  value       = aws_subnet.primary_private.availability_zone
}

output "secondary_public_subnet_availability_zone" {
  description = "Availability zone of the secondary public subnet"
  value       = aws_subnet.secondary_public.availability_zone
}

output "secondary_private_subnet_availability_zone" {
  description = "Availability zone of the secondary private subnet"
  value       = aws_subnet.secondary_private.availability_zone
}

output "primary_public_subnet_cidr_block" {
  description = "CIDR block of the primary public subnet"
  value       = aws_subnet.primary_public.cidr_block
}

output "primary_private_subnet_cidr_block" {
  description = "CIDR block of the primary private subnet"
  value       = aws_subnet.primary_private.cidr_block
}

output "secondary_public_subnet_cidr_block" {
  description = "CIDR block of the secondary public subnet"
  value       = aws_subnet.secondary_public.cidr_block
}

output "secondary_private_subnet_cidr_block" {
  description = "CIDR block of the secondary private subnet"
  value       = aws_subnet.secondary_private.cidr_block
}

# Internet Gateway Additional Outputs
output "primary_internet_gateway_arn" {
  description = "ARN of the primary internet gateway"
  value       = aws_internet_gateway.primary.arn
}

output "secondary_internet_gateway_arn" {
  description = "ARN of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.arn
}

# NAT Gateway Additional Outputs
output "primary_nat_gateway_public_ip" {
  description = "Public IP of the primary NAT gateway"
  value       = aws_nat_gateway.primary.public_ip
}

output "primary_nat_gateway_private_ip" {
  description = "Private IP of the primary NAT gateway"
  value       = aws_nat_gateway.primary.private_ip
}

output "primary_nat_gateway_subnet_id" {
  description = "Subnet ID of the primary NAT gateway"
  value       = aws_nat_gateway.primary.subnet_id
}

output "secondary_nat_gateway_public_ip" {
  description = "Public IP of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary.public_ip
}

output "secondary_nat_gateway_private_ip" {
  description = "Private IP of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary.private_ip
}

output "secondary_nat_gateway_subnet_id" {
  description = "Subnet ID of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary.subnet_id
}

# Security Group Additional Outputs
output "primary_security_group_arn" {
  description = "ARN of the primary security group"
  value       = aws_security_group.primary.arn
}

output "secondary_security_group_arn" {
  description = "ARN of the secondary security group"
  value       = aws_security_group.secondary.arn
}

output "primary_security_group_name" {
  description = "Name of the primary security group"
  value       = aws_security_group.primary.name
}

output "secondary_security_group_name" {
  description = "Name of the secondary security group"
  value       = aws_security_group.secondary.name
}

output "primary_security_group_description" {
  description = "Description of the primary security group"
  value       = aws_security_group.primary.description
}

output "secondary_security_group_description" {
  description = "Description of the secondary security group"
  value       = aws_security_group.secondary.description
}

output "primary_security_group_vpc_id" {
  description = "VPC ID of the primary security group"
  value       = aws_security_group.primary.vpc_id
}

output "secondary_security_group_vpc_id" {
  description = "VPC ID of the secondary security group"
  value       = aws_security_group.secondary.vpc_id
}

# EC2 Instance Additional Outputs
output "primary_ec2_instance_arn" {
  description = "ARN of the primary EC2 instance"
  value       = aws_instance.primary.arn
}

output "secondary_ec2_instance_arn" {
  description = "ARN of the secondary EC2 instance"
  value       = aws_instance.secondary.arn
}

output "primary_ec2_instance_type" {
  description = "Instance type of the primary EC2 instance"
  value       = aws_instance.primary.instance_type
}

output "secondary_ec2_instance_type" {
  description = "Instance type of the secondary EC2 instance"
  value       = aws_instance.secondary.instance_type
}

output "primary_ec2_instance_state" {
  description = "State of the primary EC2 instance"
  value       = aws_instance.primary.instance_state
}

output "secondary_ec2_instance_state" {
  description = "State of the secondary EC2 instance"
  value       = aws_instance.secondary.instance_state
}

output "primary_ec2_availability_zone" {
  description = "Availability zone of the primary EC2 instance"
  value       = aws_instance.primary.availability_zone
}

output "secondary_ec2_availability_zone" {
  description = "Availability zone of the secondary EC2 instance"
  value       = aws_instance.secondary.availability_zone
}

output "primary_ec2_subnet_id" {
  description = "Subnet ID of the primary EC2 instance"
  value       = aws_instance.primary.subnet_id
}

output "secondary_ec2_subnet_id" {
  description = "Subnet ID of the secondary EC2 instance"
  value       = aws_instance.secondary.subnet_id
}

output "primary_ec2_vpc_security_group_ids" {
  description = "VPC security group IDs of the primary EC2 instance"
  value       = aws_instance.primary.vpc_security_group_ids
}

output "secondary_ec2_vpc_security_group_ids" {
  description = "VPC security group IDs of the secondary EC2 instance"
  value       = aws_instance.secondary.vpc_security_group_ids
}

output "primary_ec2_private_dns" {
  description = "Private DNS name of the primary EC2 instance"
  value       = aws_instance.primary.private_dns
}

output "secondary_ec2_private_dns" {
  description = "Private DNS name of the secondary EC2 instance"
  value       = aws_instance.secondary.private_dns
}

# AMI Additional Outputs
output "primary_ami_name" {
  description = "Name of the AMI used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "Name of the AMI used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.name
}

output "primary_ami_description" {
  description = "Description of the AMI used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.description
}

output "secondary_ami_description" {
  description = "Description of the AMI used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.description
}

output "primary_ami_architecture" {
  description = "Architecture of the AMI used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.architecture
}

output "secondary_ami_architecture" {
  description = "Architecture of the AMI used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.architecture
}

output "primary_ami_creation_date" {
  description = "Creation date of the AMI used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.creation_date
}

output "secondary_ami_creation_date" {
  description = "Creation date of the AMI used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.creation_date
}

output "primary_ami_owner_id" {
  description = "Owner ID of the AMI used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.owner_id
}

output "secondary_ami_owner_id" {
  description = "Owner ID of the AMI used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.owner_id
}

# S3 Bucket Additional Outputs
output "primary_s3_bucket_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_domain_name
}

output "secondary_s3_bucket_domain_name" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_domain_name
}

output "primary_s3_bucket_regional_domain_name" {
  description = "Regional domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_regional_domain_name
}

output "secondary_s3_bucket_regional_domain_name" {
  description = "Regional domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_regional_domain_name
}

output "primary_s3_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary.hosted_zone_id
}

output "secondary_s3_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.hosted_zone_id
}

output "primary_s3_bucket_region" {
  description = "Region of the primary S3 bucket"
  value       = aws_s3_bucket.primary.region
}

output "secondary_s3_bucket_region" {
  description = "Region of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.region
}

# S3 Bucket Versioning Outputs
output "primary_s3_bucket_versioning_status" {
  description = "Versioning status of the primary S3 bucket"
  value       = aws_s3_bucket_versioning.primary.versioning_configuration[0].status
}

output "secondary_s3_bucket_versioning_status" {
  description = "Versioning status of the secondary S3 bucket"
  value       = aws_s3_bucket_versioning.secondary.versioning_configuration[0].status
}

# S3 Bucket Replication Configuration Outputs
output "primary_s3_replication_configuration_id" {
  description = "ID of the primary S3 bucket replication configuration"
  value       = aws_s3_bucket_replication_configuration.primary_to_secondary.id
}

output "secondary_s3_replication_configuration_id" {
  description = "ID of the secondary S3 bucket replication configuration"
  value       = aws_s3_bucket_replication_configuration.secondary_to_primary.id
}

# IAM Role Additional Outputs
output "ec2_iam_role_id" {
  description = "ID of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.id
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_iam_role_unique_id" {
  description = "Unique ID of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.unique_id
}

output "s3_replication_iam_role_id" {
  description = "ID of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication_role.id
}

output "s3_replication_iam_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication_role.name
}

output "s3_replication_iam_role_unique_id" {
  description = "Unique ID of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication_role.unique_id
}

# IAM Policy Outputs
output "s3_replication_policy_arn" {
  description = "ARN of the S3 replication policy"
  value       = aws_iam_policy.s3_replication_policy.arn
}

output "s3_replication_policy_id" {
  description = "ID of the S3 replication policy"
  value       = aws_iam_policy.s3_replication_policy.id
}

output "s3_replication_policy_name" {
  description = "Name of the S3 replication policy"
  value       = aws_iam_policy.s3_replication_policy.name
}

# IAM Instance Profile Additional Outputs
output "ec2_instance_profile_id" {
  description = "ID of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.id
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_unique_id" {
  description = "Unique ID of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.unique_id
}

# IAM Role Policy Attachment Outputs
output "s3_replication_policy_attachment_id" {
  description = "ID of the S3 replication policy attachment"
  value       = aws_iam_role_policy_attachment.s3_replication_policy_attachment.id
}

# Random String Outputs
output "bucket_suffix" {
  description = "Random suffix used for S3 bucket names"
  value       = random_string.bucket_suffix.result
}

# Data Source Additional Outputs
output "primary_region_availability_zones_count" {
  description = "Number of availability zones in primary region"
  value       = length(data.aws_availability_zones.primary.names)
}

output "secondary_region_availability_zones_count" {
  description = "Number of availability zones in secondary region"
  value       = length(data.aws_availability_zones.secondary.names)
}

# Configuration Summary Outputs
output "deployment_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    primary_region   = local.regions.primary.name
    secondary_region = local.regions.secondary.name
    environment      = var.environment
    project_name     = var.project_name
    instance_type    = var.instance_type
    vpc_cidrs = {
      primary   = local.regions.primary.vpc_cidr
      secondary = local.regions.secondary.vpc_cidr
    }
    subnet_cidrs = {
      primary_public    = local.regions.primary.public_cidr
      primary_private   = local.regions.primary.private_cidr
      secondary_public  = local.regions.secondary.public_cidr
      secondary_private = local.regions.secondary.private_cidr
    }
  }
}

# Resource Count Summary
output "resource_count_summary" {
  description = "Summary of resources created per region"
  value = {
    per_region = {
      vpcs                = 1
      subnets            = 2
      security_groups    = 1
      ec2_instances      = 1
      nat_gateways       = 1
      internet_gateways  = 1
      route_tables       = 2
      s3_buckets         = 1
    }
    global = {
      iam_roles          = 2
      iam_policies       = 1
      instance_profiles  = 1
      replication_configs = 2
    }
    total_regions = 2
  }
}

# Tags Summary Output
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}
