I'll create a comprehensive Terraform configuration file that meets all your requirements. Note that I've corrected the region names based on your provider configuration (us-east-1 and us-west-2 instead of us-east-2 and us-west-12 as mentioned in the requirements).

```hcl
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
```

## Key Features of This Configuration:

### 1. **Multi-Region Architecture**
- Primary region: `us-east-1` with VPC CIDR `10.0.0.0/16`
- Secondary region: `us-west-2` with VPC CIDR `10.1.0.0/16`
- Each region has dedicated provider aliases

### 2. **Network Configuration**
- Complete VPC setup with public and private subnets
- Internet Gateways and NAT Gateways for proper connectivity
- Route tables with appropriate routing rules
- Security groups allowing only HTTPS traffic from within VPC CIDR

### 3. **EC2 Instances**
- Deployed in private subnets for security
- Latest Amazon Linux 2 AMI automatically selected
- Proper IAM roles with least privilege access
- User data script for basic web server setup

### 4. **S3 Cross-Region
