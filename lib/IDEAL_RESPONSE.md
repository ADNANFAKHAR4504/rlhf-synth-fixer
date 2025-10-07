# tap_stack.tf - Complete Infrastructure Stack

```hcl

# ==========================================
# VARIABLES
# ==========================================

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = "multiregiontask.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# ==========================================
# DATA SOURCES
# ==========================================

# Get available AZs for primary region
data "aws_availability_zones" "primary_azs" {
  provider = aws.us_west_2
  state    = "available"
}

# Get available AZs for secondary region
data "aws_availability_zones" "secondary_azs" {
  provider = aws.eu_west_1
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "primary_amazon_linux" {
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "secondary_amazon_linux" {
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

# ==========================================
# LOCALS
# ==========================================

locals {
  # Random suffix for resource naming
  resource_suffix = random_string.suffix.result
  
  # Naming conventions
  primary_vpc_name   = "vpc-primary-${local.resource_suffix}"
  secondary_vpc_name = "vpc-secondary-${local.resource_suffix}"
  
  # CIDR blocks
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"
  
  # Common tags
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Stack       = "tap-stack"
  }
}

# ==========================================
# RANDOM RESOURCES
# ==========================================

# Random suffix for resource naming
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
  number  = false
}

# Random username for RDS primary
resource "random_string" "rds_username_primary" {
  length  = 8
  special = false
  upper   = false
  number  = false
}

# Random password for RDS primary
resource "random_password" "rds_password_primary" {
  length  = 16
  special = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

# Random username for RDS secondary
resource "random_string" "rds_username_secondary" {
  length  = 8
  special = false
  upper   = false
  number  = false
}

# Random password for RDS secondary
resource "random_password" "rds_password_secondary" {
  length  = 16
  special = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

# ==========================================
# PRIMARY REGION NETWORKING (us-west-2)
# ==========================================

# Primary VPC
resource "aws_vpc" "primary_vpc" {
  provider             = aws.us_west_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = local.primary_vpc_name
  })
}

# Internet Gateway for Primary VPC
resource "aws_internet_gateway" "primary_igw" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary_vpc.id

  tags = merge(local.common_tags, {
    Name = "igw-primary-${local.resource_suffix}"
  })
}

# Public Subnet 1 - Primary
resource "aws_subnet" "primary_public_subnet_1" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.primary_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.primary_azs.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "subnet-primary-public-1-${local.resource_suffix}"
    Type = "Public"
  })
}

# Public Subnet 2 - Primary
resource "aws_subnet" "primary_public_subnet_2" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.primary_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.primary_azs.names[1]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "subnet-primary-public-2-${local.resource_suffix}"
    Type = "Public"
  })
}

# Private Subnet 1 - Primary
resource "aws_subnet" "primary_private_subnet_1" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.primary_azs.names[0]

  tags = merge(local.common_tags, {
    Name = "subnet-primary-private-1-${local.resource_suffix}"
    Type = "Private"
  })
}

# Private Subnet 2 - Primary
resource "aws_subnet" "primary_private_subnet_2" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.primary_azs.names[1]

  tags = merge(local.common_tags, {
    Name = "subnet-primary-private-2-${local.resource_suffix}"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway 1 - Primary
resource "aws_eip" "primary_nat_eip_1" {
  provider = aws.us_west_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "eip-primary-nat-1-${local.resource_suffix}"
  })
}

# Elastic IP for NAT Gateway 2 - Primary
resource "aws_eip" "primary_nat_eip_2" {
  provider = aws.us_west_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "eip-primary-nat-2-${local.resource_suffix}"
  })
}

# NAT Gateway 1 - Primary
resource "aws_nat_gateway" "primary_nat_gw_1" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.primary_nat_eip_1.id
  subnet_id     = aws_subnet.primary_public_subnet_1.id

  tags = merge(local.common_tags, {
    Name = "nat-primary-1-${local.resource_suffix}"
  })

  depends_on = [aws_internet_gateway.primary_igw]
}

# NAT Gateway 2 - Primary
resource "aws_nat_gateway" "primary_nat_gw_2" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.primary_nat_eip_2.id
  subnet_id     = aws_subnet.primary_public_subnet_2.id

  tags = merge(local.common_tags, {
    Name = "nat-primary-2-${local.resource_suffix}"
  })

  depends_on = [aws_internet_gateway.primary_igw]
}

# Public Route Table - Primary
resource "aws_route_table" "primary_public_rt" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-primary-public-${local.resource_suffix}"
  })
}

# Private Route Table 1 - Primary
resource "aws_route_table" "primary_private_rt_1" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_nat_gw_1.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-primary-private-1-${local.resource_suffix}"
  })
}

# Private Route Table 2 - Primary
resource "aws_route_table" "primary_private_rt_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_nat_gw_2.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-primary-private-2-${local.resource_suffix}"
  })
}

# Route Table Associations - Primary
resource "aws_route_table_association" "primary_public_rta_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_public_subnet_1.id
  route_table_id = aws_route_table.primary_public_rt.id
}

resource "aws_route_table_association" "primary_public_rta_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_public_subnet_2.id
  route_table_id = aws_route_table.primary_public_rt.id
}

resource "aws_route_table_association" "primary_private_rta_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_private_subnet_1.id
  route_table_id = aws_route_table.primary_private_rt_1.id
}

resource "aws_route_table_association" "primary_private_rta_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_private_subnet_2.id
  route_table_id = aws_route_table.primary_private_rt_2.id
}

# ==========================================
# SECONDARY REGION NETWORKING (eu-west-1)
# ==========================================

# Secondary VPC
resource "aws_vpc" "secondary_vpc" {
  provider             = aws.eu_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = local.secondary_vpc_name
  })
}

# Internet Gateway for Secondary VPC
resource "aws_internet_gateway" "secondary_igw" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "igw-secondary-${local.resource_suffix}"
  })
}

# Public Subnet 1 - Secondary
resource "aws_subnet" "secondary_public_subnet_1" {
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary_vpc.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.secondary_azs.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "subnet-secondary-public-1-${local.resource_suffix}"
    Type = "Public"
  })
}

# Public Subnet 2 - Secondary
resource "aws_subnet" "secondary_public_subnet_2" {
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary_vpc.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = data.aws_availability_zones.secondary_azs.names[1]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "subnet-secondary-public-2-${local.resource_suffix}"
    Type = "Public"
  })
}

# Private Subnet 1 - Secondary
resource "aws_subnet" "secondary_private_subnet_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary_vpc.id
  cidr_block        = "10.1.10.0/24"
  availability_zone = data.aws_availability_zones.secondary_azs.names[0]

  tags = merge(local.common_tags, {
    Name = "subnet-secondary-private-1-${local.resource_suffix}"
    Type = "Private"
  })
}

# Private Subnet 2 - Secondary
resource "aws_subnet" "secondary_private_subnet_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary_vpc.id
  cidr_block        = "10.1.11.0/24"
  availability_zone = data.aws_availability_zones.secondary_azs.names[1]

  tags = merge(local.common_tags, {
    Name = "subnet-secondary-private-2-${local.resource_suffix}"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway 1 - Secondary
resource "aws_eip" "secondary_nat_eip_1" {
  provider = aws.eu_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "eip-secondary-nat-1-${local.resource_suffix}"
  })
}

# Elastic IP for NAT Gateway 2 - Secondary
resource "aws_eip" "secondary_nat_eip_2" {
  provider = aws.eu_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "eip-secondary-nat-2-${local.resource_suffix}"
  })
}

# NAT Gateway 1 - Secondary
resource "aws_nat_gateway" "secondary_nat_gw_1" {
  provider      = aws.eu_west_1
  allocation_id = aws_eip.secondary_nat_eip_1.id
  subnet_id     = aws_subnet.secondary_public_subnet_1.id

  tags = merge(local.common_tags, {
    Name = "nat-secondary-1-${local.resource_suffix}"
  })

  depends_on = [aws_internet_gateway.secondary_igw]
}

# NAT Gateway 2 - Secondary
resource "aws_nat_gateway" "secondary_nat_gw_2" {
  provider      = aws.eu_west_1
  allocation_id = aws_eip.secondary_nat_eip_2.id
  subnet_id     = aws_subnet.secondary_public_subnet_2.id

  tags = merge(local.common_tags, {
    Name = "nat-secondary-2-${local.resource_suffix}"
  })

  depends_on = [aws_internet_gateway.secondary_igw]
}

# Public Route Table - Secondary
resource "aws_route_table" "secondary_public_rt" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-secondary-public-${local.resource_suffix}"
  })
}

# Private Route Table 1 - Secondary
resource "aws_route_table" "secondary_private_rt_1" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_nat_gw_1.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-secondary-private-1-${local.resource_suffix}"
  })
}

# Private Route Table 2 - Secondary
resource "aws_route_table" "secondary_private_rt_2" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_nat_gw_2.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-secondary-private-2-${local.resource_suffix}"
  })
}

# Route Table Associations - Secondary
resource "aws_route_table_association" "secondary_public_rta_1" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_public_subnet_1.id
  route_table_id = aws_route_table.secondary_public_rt.id
}

resource "aws_route_table_association" "secondary_public_rta_2" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_public_subnet_2.id
  route_table_id = aws_route_table.secondary_public_rt.id
}

resource "aws_route_table_association" "secondary_private_rta_1" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_private_subnet_1.id
  route_table_id = aws_route_table.secondary_private_rt_1.id
}

resource "aws_route_table_association" "secondary_private_rta_2" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_private_subnet_2.id
  route_table_id = aws_route_table.secondary_private_rt_2.id
}

# ==========================================
# SECURITY GROUPS
# ==========================================

# Security Group for ALB - Primary
resource "aws_security_group" "primary_alb_sg" {
  provider    = aws.us_west_2
  name        = "alb-sg-primary-${local.resource_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
    Name = "sg-alb-primary-${local.resource_suffix}"
  })
}

# Security Group for ALB - Secondary
resource "aws_security_group" "secondary_alb_sg" {
  provider    = aws.eu_west_1
  name        = "alb-sg-secondary-${local.resource_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
    Name = "sg-alb-secondary-${local.resource_suffix}"
  })
}

# Security Group for EC2 - Primary
resource "aws_security_group" "primary_ec2_sg" {
  provider    = aws.us_west_2
  name        = "ec2-sg-primary-${local.resource_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-ec2-primary-${local.resource_suffix}"
  })
}

# Security Group for EC2 - Secondary
resource "aws_security_group" "secondary_ec2_sg" {
  provider    = aws.eu_west_1
  name        = "ec2-sg-secondary-${local.resource_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-ec2-secondary-${local.resource_suffix}"
  })
}

# Security Group for RDS - Primary
resource "aws_security_group" "primary_rds_sg" {
  provider    = aws.us_west_2
  name        = "rds-sg-primary-${local.resource_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-rds-primary-${local.resource_suffix}"
  })
}

# Security Group for RDS - Secondary
resource "aws_security_group" "secondary_rds_sg" {
  provider    = aws.eu_west_1
  name        = "rds-sg-secondary-${local.resource_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-rds-secondary-${local.resource_suffix}"
  })
}

# ==========================================
# S3 BUCKETS
# ==========================================

# Primary S3 Bucket
resource "aws_s3_bucket" "primary_bucket" {
  provider = aws.us_west_2
  bucket   = "tap-primary-bucket-${local.resource_suffix}"

  tags = merge(local.common_tags, {
    Name = "s3-primary-${local.resource_suffix}"
  })
}

# Primary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "primary_bucket_versioning" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.primary_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Primary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_bucket_encryption" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.primary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Primary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "primary_bucket_pab" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.primary_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary_bucket" {
  provider = aws.eu_west_1
  bucket   = "tap-secondary-bucket-${local.resource_suffix}"

  tags = merge(local.common_tags, {
    Name = "s3-secondary-${local.resource_suffix}"
  })
}

# Secondary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secondary_bucket_versioning" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Secondary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_bucket_encryption" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secondary_bucket_pab" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==========================================
# IAM ROLES AND POLICIES
# ==========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  provider = aws.us_west_2
  name     = "ec2-role-${local.resource_suffix}"

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
    Name = "iam-role-ec2-${local.resource_suffix}"
  })
}

# IAM Policy for S3 Access (Least Privilege)
resource "aws_iam_policy" "s3_access_policy" {
  provider    = aws.us_west_2
  name        = "s3-access-policy-${local.resource_suffix}"
  description = "Policy for S3 bucket access with least privilege"

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
          aws_s3_bucket.primary_bucket.arn,
          "${aws_s3_bucket.primary_bucket.arn}/*",
          aws_s3_bucket.secondary_bucket.arn,
          "${aws_s3_bucket.secondary_bucket.arn}/*"
        ]
      }
    ]
  })
}

# Attach S3 policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_s3_attachment" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

# IAM Policy for CloudWatch
resource "aws_iam_policy" "cloudwatch_policy" {
  provider    = aws.us_west_2
  name        = "cloudwatch-policy-${local.resource_suffix}"
  description = "Policy for CloudWatch access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach CloudWatch policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_attachment" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_policy.arn
}

# IAM Policy for SSM Parameter Store
resource "aws_iam_policy" "ssm_policy" {
  provider    = aws.us_west_2
  name        = "ssm-policy-${local.resource_suffix}"
  description = "Policy for SSM Parameter Store access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParameterHistory"
        ]
        Resource = [
          "arn:aws:ssm:${var.primary_region}:*:parameter/rds/*",
          "arn:aws:ssm:${var.secondary_region}:*:parameter/rds/*"
        ]
      }
    ]
  })
}

# Attach SSM policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_ssm_attachment" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ssm_policy.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.us_west_2
  name     = "ec2-profile-${local.resource_suffix}"
  role     = aws_iam_role.ec2_role.name
}

# ==========================================
# RDS DATABASE - PRIMARY REGION
# ==========================================

# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary_db_subnet_group" {
  provider    = aws.us_west_2
  name        = "db-subnet-group-primary-${local.resource_suffix}"
  description = "Database subnet group for primary region"
  subnet_ids  = [
    aws_subnet.primary_private_subnet_1.id,
    aws_subnet.primary_private_subnet_2.id
  ]

  tags = merge(local.common_tags, {
    Name = "db-subnet-primary-${local.resource_suffix}"
  })
}

# RDS Instance - Primary
resource "aws_db_instance" "primary_rds" {
  provider     = aws.us_west_2
  identifier   = "rds-primary-${local.resource_suffix}"
  
  # Database configuration
  engine                      = "mysql"
  engine_version             = "8.0.35"
  instance_class             = "db.t3.micro"
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  
  # Credentials
  db_name  = "tapdb"
  username = random_string.rds_username_primary.result
  password = random_password.rds_password_primary.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.primary_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.primary_rds_sg.id]
  publicly_accessible    = false
  
  # High availability
  multi_az               = true
  
  # Maintenance and backup
  auto_minor_version_upgrade = true
  backup_retention_period    = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  # Protection
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "rds-primary-${local.resource_suffix}"
  })
}

# ==========================================
# RDS DATABASE - SECONDARY REGION
# ==========================================

# DB Subnet Group - Secondary
resource "aws_db_subnet_group" "secondary_db_subnet_group" {
  provider    = aws.eu_west_1
  name        = "db-subnet-group-secondary-${local.resource_suffix}"
  description = "Database subnet group for secondary region"
  subnet_ids  = [
    aws_subnet.secondary_private_subnet_1.id,
    aws_subnet.secondary_private_subnet_2.id
  ]

  tags = merge(local.common_tags, {
    Name = "db-subnet-secondary-${local.resource_suffix}"
  })
}

# RDS Instance - Secondary
resource "aws_db_instance" "secondary_rds" {
  provider     = aws.eu_west_1
  identifier   = "rds-secondary-${local.resource_suffix}"
  
  # Database configuration
  engine                      = "mysql"
  engine_version             = "8.0.35"
  instance_class             = "db.t3.micro"
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  
  # Credentials
  db_name  = "tapdb"
  username = random_string.rds_username_secondary.result
  password = random_password.rds_password_secondary.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.secondary_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.secondary_rds_sg.id]
  publicly_accessible    = false
  
  # High availability
  multi_az               = true
  
  # Maintenance and backup
  auto_minor_version_upgrade = true
  backup_retention_period    = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  # Protection
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "rds-secondary-${local.resource_suffix}"
  })
}

# ==========================================
# SECRETS MANAGER
# ==========================================

# Primary RDS Credentials Secret
resource "aws_secretsmanager_secret" "primary_rds_secret" {
  provider    = aws.us_west_2
  name        = "rds-primary-secret-${local.resource_suffix}"
  description = "RDS master credentials for primary region"

  tags = merge(local.common_tags, {
    Name = "secret-rds-primary-${local.resource_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "primary_rds_secret_version" {
  provider      = aws.us_west_2
  secret_id     = aws_secretsmanager_secret.primary_rds_secret.id
  secret_string = jsonencode({
    username = random_string.rds_username_primary.result
    password = random_password.rds_password_primary.result
    engine   = "mysql"
    host     = aws_db_instance.primary_rds.address
    port     = 3306
    dbname   = "tapdb"
  })
}

# Secondary RDS Credentials Secret
resource "aws_secretsmanager_secret" "secondary_rds_secret" {
  provider    = aws.eu_west_1
  name        = "rds-secondary-secret-${local.resource_suffix}"
  description = "RDS master credentials for secondary region"

  tags = merge(local.common_tags, {
    Name = "secret-rds-secondary-${local.resource_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "secondary_rds_secret_version" {
  provider      = aws.eu_west_1
  secret_id     = aws_secretsmanager_secret.secondary_rds_secret.id
  secret_string = jsonencode({
    username = random_string.rds_username_secondary.result
    password = random_password.rds_password_secondary.result
    engine   = "mysql"
    host     = aws_db_instance.secondary_rds.address
    port     = 3306
    dbname   = "tapdb"
  })
}

# ==========================================
# SSM PARAMETER STORE
# ==========================================

# Primary Region Parameters
resource "aws_ssm_parameter" "primary_db_host" {
  provider = aws.us_west_2
  name     = "/rds/primary/host"
  type     = "String"
  value    = aws_db_instance.primary_rds.address

  tags = merge(local.common_tags, {
    Name = "param-db-host-primary-${local.resource_suffix}"
  })
}

resource "aws_ssm_parameter" "primary_db_username" {
  provider = aws.us_west_2
  name     = "/rds/primary/username"
  type     = "SecureString"
  value    = random_string.rds_username_primary.result

  tags = merge(local.common_tags, {
    Name = "param-db-user-primary-${local.resource_suffix}"
  })
}

resource "aws_ssm_parameter" "primary_db_password" {
  provider = aws.us_west_2
  name     = "/rds/primary/password"
  type     = "SecureString"
  value    = random_password.rds_password_primary.result

  tags = merge(local.common_tags, {
    Name = "param-db-pass-primary-${local.resource_suffix}"
  })
}

# Secondary Region Parameters
resource "aws_ssm_parameter" "secondary_db_host" {
  provider = aws.eu_west_1
  name     = "/rds/secondary/host"
  type     = "String"
  value    = aws_db_instance.secondary_rds.address

  tags = merge(local.common_tags, {
    Name = "param-db-host-secondary-${local.resource_suffix}"
  })
}

resource "aws_ssm_parameter" "secondary_db_username" {
  provider = aws.eu_west_1
  name     = "/rds/secondary/username"
  type     = "SecureString"
  value    = random_string.rds_username_secondary.result

  tags = merge(local.common_tags, {
    Name = "param-db-user-secondary-${local.resource_suffix}"
  })
}

resource "aws_ssm_parameter" "secondary_db_password" {
  provider = aws.eu_west_1
  name     = "/rds/secondary/password"
  type     = "SecureString"
  value    = random_password.rds_password_secondary.result

  tags = merge(local.common_tags, {
    Name = "param-db-pass-secondary-${local.resource_suffix}"
  })
}

# ==========================================
# APPLICATION LOAD BALANCER - PRIMARY
# ==========================================

resource "aws_lb" "primary_alb" {
  provider           = aws.us_west_2
  name               = "alb-primary-${local.resource_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb_sg.id]
  subnets            = [
    aws_subnet.primary_public_subnet_1.id,
    aws_subnet.primary_public_subnet_2.id
  ]

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "alb-primary-${local.resource_suffix}"
  })
}

# Target Group - Primary
resource "aws_lb_target_group" "primary_tg" {
  provider    = aws.us_west_2
  name        = "tg-primary-${local.resource_suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary_vpc.id
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

  tags = merge(local.common_tags, {
    Name = "tg-primary-${local.resource_suffix}"
  })
}

# ALB Listener - Primary
resource "aws_lb_listener" "primary_listener" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.primary_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_tg.arn
  }
}

# ==========================================
# APPLICATION LOAD BALANCER - SECONDARY
# ==========================================

resource "aws_lb" "secondary_alb" {
  provider           = aws.eu_west_1
  name               = "alb-secondary-${local.resource_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb_sg.id]
  subnets            = [
    aws_subnet.secondary_public_subnet_1.id,
    aws_subnet.secondary_public_subnet_2.id
  ]

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "alb-secondary-${local.resource_suffix}"
  })
}

# Target Group - Secondary
resource "aws_lb_target_group" "secondary_tg" {
  provider    = aws.eu_west_1
  name        = "tg-secondary-${local.resource_suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary_vpc.id
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

  tags = merge(local.common_tags, {
    Name = "tg-secondary-${local.resource_suffix}"
  })
}

# ALB Listener - Secondary
resource "aws_lb_listener" "secondary_listener" {
  provider          = aws.eu_west_1
  load_balancer_arn = aws_lb.secondary_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_tg.arn
  }
}

# ==========================================
# LAUNCH TEMPLATES AND AUTO SCALING - PRIMARY
# ==========================================

# Launch Template - Primary
resource "aws_launch_template" "primary_lt" {
  provider      = aws.us_west_2
  name_prefix   = "lt-primary-${local.resource_suffix}"
  image_id      = data.aws_ami.primary_amazon_linux.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.primary_ec2_sg.id]

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Primary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "asg-instance-primary-${local.resource_suffix}"
    })
  }
}

# Auto Scaling Group - Primary
resource "aws_autoscaling_group" "primary_asg" {
  provider            = aws.us_west_2
  name                = "asg-primary-${local.resource_suffix}"
  vpc_zone_identifier = [
    aws_subnet.primary_private_subnet_1.id,
    aws_subnet.primary_private_subnet_2.id
  ]
  target_group_arns = [aws_lb_target_group.primary_tg.arn]
  health_check_type = "ELB"
  min_size          = 2
  max_size          = 5
  desired_capacity  = 2

  launch_template {
    id      = aws_launch_template.primary_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-primary-${local.resource_suffix}"
    propagate_at_launch = true
  }
}

# Auto Scaling Policy - Primary
resource "aws_autoscaling_policy" "primary_scaling_policy" {
  provider               = aws.us_west_2
  name                   = "asg-policy-primary-${local.resource_suffix}"
  autoscaling_group_name = aws_autoscaling_group.primary_asg.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown              = 300
}

# CloudWatch Metric Alarm for Scaling - Primary
resource "aws_cloudwatch_metric_alarm" "primary_cpu_alarm" {
  provider            = aws.us_west_2
  alarm_name          = "high-cpu-primary-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "70"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.primary_scaling_policy.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary_asg.name
  }
}

# ==========================================
# LAUNCH TEMPLATES AND AUTO SCALING - SECONDARY
# ==========================================

# Launch Template - Secondary
resource "aws_launch_template" "secondary_lt" {
  provider      = aws.eu_west_1
  name_prefix   = "lt-secondary-${local.resource_suffix}"
  image_id      = data.aws_ami.secondary_amazon_linux.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.secondary_ec2_sg.id]

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Secondary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "asg-instance-secondary-${local.resource_suffix}"
    })
  }
}

# Auto Scaling Group - Secondary
resource "aws_autoscaling_group" "secondary_asg" {
  provider            = aws.eu_west_1
  name                = "asg-secondary-${local.resource_suffix}"
  vpc_zone_identifier = [
    aws_subnet.secondary_private_subnet_1.id,
    aws_subnet.secondary_private_subnet_2.id
  ]
  target_group_arns = [aws_lb_target_group.secondary_tg.arn]
  health_check_type = "ELB"
  min_size          = 2
  max_size          = 5
  desired_capacity  = 2

  launch_template {
    id      = aws_launch_template.secondary_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-secondary-${local.resource_suffix}"
    propagate_at_launch = true
  }
}

# Auto Scaling Policy - Secondary
resource "aws_autoscaling_policy" "secondary_scaling_policy" {
  provider               = aws.eu_west_1
  name                   = "asg-policy-secondary-${local.resource_suffix}"
  autoscaling_group_name = aws_autoscaling_group.secondary_asg.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown              = 300
}

# CloudWatch Metric Alarm for Scaling - Secondary
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_alarm" {
  provider            = aws.eu_west_1
  alarm_name          = "high-cpu-secondary-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "70"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.secondary_scaling_policy.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary_asg.name
  }
}

# ==========================================
# AWS CERTIFICATE MANAGER
# ==========================================

# ACM Certificate (us-east-1 for CloudFront)
resource "aws_acm_certificate" "cloudfront_cert" {
  provider          = aws.us_west_2
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "acm-cert-${local.resource_suffix}"
  })
}

# ==========================================
# ROUTE 53
# ==========================================

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_west_2
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name = "route53-zone-${local.resource_suffix}"
  })
}

# Health Check for Primary ALB
resource "aws_route53_health_check" "primary_health" {
  provider          = aws.us_west_2
  fqdn              = aws_lb.primary_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.common_tags, {
    Name = "health-check-primary-${local.resource_suffix}"
  })
}

# Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary_health" {
  provider          = aws.us_west_2
  fqdn              = aws_lb.secondary_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.common_tags, {
    Name = "health-check-secondary-${local.resource_suffix}"
  })
}

# Primary Route 53 Record
resource "aws_route53_record" "primary" {
  provider = aws.us_west_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"
  ttl      = "60"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "Primary"
  records         = [aws_lb.primary_alb.dns_name]
  health_check_id = aws_route53_health_check.primary_health.id
}

# Secondary Route 53 Record
resource "aws_route53_record" "secondary" {
  provider = aws.us_west_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"
  ttl      = "60"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "Secondary"
  records        = [aws_lb.secondary_alb.dns_name]
}

# ==========================================
# AWS WAF
# ==========================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  provider = aws.us_west_2
  name     = "waf-web-acl-${local.resource_suffix}"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  # SQL injection protection
  rule {
    name     = "SQLInjectionProtection"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SQLInjectionProtectionMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "WAFMetric"
    sampled_requests_enabled  = true
  }

  tags = merge(local.common_tags, {
    Name = "waf-acl-${local.resource_suffix}"
  })
}

# ==========================================
# CLOUDFRONT DISTRIBUTION
# ==========================================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  provider = aws.us_west_2
  comment  = "OAI for S3 bucket ${local.resource_suffix}"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "cloudfront_policy" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.primary_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.primary_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  provider = aws.us_west_2
  enabled  = true
  comment  = "CloudFront distribution for ${local.resource_suffix}"

  # Primary origin - ALB
  origin {
    domain_name = aws_lb.primary_alb.dns_name
    origin_id   = "ALB-${aws_lb.primary_alb.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Secondary origin - S3
  origin {
    domain_name = aws_s3_bucket.primary_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.primary_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.primary_alb.id}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.primary_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = merge(local.common_tags, {
    Name = "cloudfront-${local.resource_suffix}"
  })
}

# ==========================================
# OUTPUTS
# ==========================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary_vpc.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary_vpc.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary_vpc.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary_vpc.cidr_block
}

# Subnet Outputs - Primary
output "primary_public_subnet_1_id" {
  description = "ID of primary public subnet 1"
  value       = aws_subnet.primary_public_subnet_1.id
}

output "primary_public_subnet_2_id" {
  description = "ID of primary public subnet 2"
  value       = aws_subnet.primary_public_subnet_2.id
}

output "primary_private_subnet_1_id" {
  description = "ID of primary private subnet 1"
  value       = aws_subnet.primary_private_subnet_1.id
}

output "primary_private_subnet_2_id" {
  description = "ID of primary private subnet 2"
  value       = aws_subnet.primary_private_subnet_2.id
}

# Subnet Outputs - Secondary
output "secondary_public_subnet_1_id" {
  description = "ID of secondary public subnet 1"
  value       = aws_subnet.secondary_public_subnet_1.id
}

output "secondary_public_subnet_2_id" {
  description = "ID of secondary public subnet 2"
  value       = aws_subnet.secondary_public_subnet_2.id
}

output "secondary_private_subnet_1_id" {
  description = "ID of secondary private subnet 1"
  value       = aws_subnet.secondary_private_subnet_1.id
}

output "secondary_private_subnet_2_id" {
  description = "ID of secondary private subnet 2"
  value       = aws_subnet.secondary_private_subnet_2.id
}

# Internet Gateway Outputs
output "primary_igw_id" {
  description = "ID of the primary Internet Gateway"
  value       = aws_internet_gateway.primary_igw.id
}

output "secondary_igw_id" {
  description = "ID of the secondary Internet Gateway"
  value       = aws_internet_gateway.secondary_igw.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_1_id" {
  description = "ID of primary NAT Gateway 1"
  value       = aws_nat_gateway.primary_nat_gw_1.id
}

output "primary_nat_gateway_2_id" {
  description = "ID of primary NAT Gateway 2"
  value       = aws_nat_gateway.primary_nat_gw_2.id
}

output "secondary_nat_gateway_1_id" {
  description = "ID of secondary NAT Gateway 1"
  value       = aws_nat_gateway.secondary_nat_gw_1.id
}

output "secondary_nat_gateway_2_id" {
  description = "ID of secondary NAT Gateway 2"
  value       = aws_nat_gateway.secondary_nat_gw_2.id
}

# Elastic IP Outputs
output "primary_nat_eip_1" {
  description = "Elastic IP for primary NAT Gateway 1"
  value       = aws_eip.primary_nat_eip_1.public_ip
}

output "primary_nat_eip_2" {
  description = "Elastic IP for primary NAT Gateway 2"
  value       = aws_eip.primary_nat_eip_2.public_ip
}

output "secondary_nat_eip_1" {
  description = "Elastic IP for secondary NAT Gateway 1"
  value       = aws_eip.secondary_nat_eip_1.public_ip
}

output "secondary_nat_eip_2" {
  description = "Elastic IP for secondary NAT Gateway 2"
  value       = aws_eip.secondary_nat_eip_2.public_ip
}

# Security Group Outputs
output "primary_alb_sg_id" {
  description = "Security group ID for primary ALB"
  value       = aws_security_group.primary_alb_sg.id
}

output "secondary_alb_sg_id" {
  description = "Security group ID for secondary ALB"
  value       = aws_security_group.secondary_alb_sg.id
}

output "primary_ec2_sg_id" {
  description = "Security group ID for primary EC2 instances"
  value       = aws_security_group.primary_ec2_sg.id
}

output "secondary_ec2_sg_id" {
  description = "Security group ID for secondary EC2 instances"
  value       = aws_security_group.secondary_ec2_sg.id
}

output "primary_rds_sg_id" {
  description = "Security group ID for primary RDS"
  value       = aws_security_group.primary_rds_sg.id
}

output "secondary_rds_sg_id" {
  description = "Security group ID for secondary RDS"
  value       = aws_security_group.secondary_rds_sg.id
}

# S3 Bucket Outputs
output "primary_s3_bucket_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.arn
}

output "primary_s3_bucket_domain" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.bucket_domain_name
}

output "secondary_s3_bucket_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.id
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.arn
}

output "secondary_s3_bucket_domain" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.bucket_domain_name
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_rds_address" {
  description = "Address of the primary RDS instance"
  value       = aws_db_instance.primary_rds.address
}

output "primary_rds_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary_rds.arn
}

output "primary_rds_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary_rds.id
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.endpoint
}

output "secondary_rds_address" {
  description = "Address of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.address
}

output "secondary_rds_arn" {
  description = "ARN of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.arn
}

output "secondary_rds_id" {
  description = "ID of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.id
}

# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS secret in Secrets Manager"
  value       = aws_secretsmanager_secret.primary_rds_secret.arn
}

output "primary_rds_secret_id" {
  description = "ID of the primary RDS secret in Secrets Manager"
  value       = aws_secretsmanager_secret.primary_rds_secret.id
}

output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS secret in Secrets Manager"
  value       = aws_secretsmanager_secret.secondary_rds_secret.arn
}

output "secondary_rds_secret_id" {
  description = "ID of the secondary RDS secret in Secrets Manager"
  value       = aws_secretsmanager_secret.secondary_rds_secret.id
}

# SSM Parameter Store Outputs
output "primary_db_host_parameter" {
  description = "SSM parameter name for primary DB host"
  value       = aws_ssm_parameter.primary_db_host.name
}

output "primary_db_username_parameter" {
  description = "SSM parameter name for primary DB username"
  value       = aws_ssm_parameter.primary_db_username.name
}

output "secondary_db_host_parameter" {
  description = "SSM parameter name for secondary DB host"
  value       = aws_ssm_parameter.secondary_db_host.name
}

output "secondary_db_username_parameter" {
  description = "SSM parameter name for secondary DB username"
  value       = aws_ssm_parameter.secondary_db_username.name
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

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# IAM Policy Outputs
output "s3_access_policy_arn" {
  description = "ARN of the S3 access policy"
  value       = aws_iam_policy.s3_access_policy.arn
}

output "cloudwatch_policy_arn" {
  description = "ARN of the CloudWatch policy"
  value       = aws_iam_policy.cloudwatch_policy.arn
}

output "ssm_policy_arn" {
  description = "ARN of the SSM policy"
  value       = aws_iam_policy.ssm_policy.arn
}

# Load Balancer Outputs
output "primary_alb_dns" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary_alb.dns_name
}

output "primary_alb_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary_alb.arn
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary Application Load Balancer"
  value       = aws_lb.primary_alb.zone_id
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary_alb.dns_name
}

output "secondary_alb_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary_alb.arn
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary_alb.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary_tg.arn
}

output "primary_target_group_name" {
  description = "Name of the primary target group"
  value       = aws_lb_target_group.primary_tg.name
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary_tg.arn
}

output "secondary_target_group_name" {
  description = "Name of the secondary target group"
  value       = aws_lb_target_group.secondary_tg.name
}

# Auto Scaling Group Outputs
output "primary_asg_id" {
  description = "ID of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary_asg.id
}

output "primary_asg_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary_asg.arn
}

output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary_asg.name
}

output "secondary_asg_id" {
  description = "ID of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary_asg.id
}

output "secondary_asg_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary_asg.arn
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary_asg.name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary_lt.id
}

output "primary_launch_template_arn" {
  description = "ARN of the primary launch template"
  value       = aws_launch_template.primary_lt.arn
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary_lt.id
}

output "secondary_launch_template_arn" {
  description = "ARN of the secondary launch template"
  value       = aws_launch_template.secondary_lt.arn
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of the AMI used in primary region"
  value       = data.aws_ami.primary_amazon_linux.id
}

output "primary_ami_name" {
  description = "Name of the AMI used in primary region"
  value       = data.aws_ami.primary_amazon_linux.name
}

output "secondary_ami_id" {
  description = "ID of the AMI used in secondary region"
  value       = data.aws_ami.secondary_amazon_linux.id
}

output "secondary_ami_name" {
  description = "Name of the AMI used in secondary region"
  value       = data.aws_ami.secondary_amazon_linux.name
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "Zone ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Name of the Route 53 hosted zone"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Name servers for the Route 53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "primary_health_check_id" {
  description = "ID of the primary health check"
  value       = aws_route53_health_check.primary_health.id
}

output "secondary_health_check_id" {
  description = "ID of the secondary health check"
  value       = aws_route53_health_check.secondary_health.id
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "CloudFront Route 53 zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "cloudfront_oai_id" {
  description = "ID of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.oai.id
}

output "cloudfront_oai_path" {
  description = "Path of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# ACM Certificate Outputs
output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.cloudfront_cert.arn
}

output "acm_certificate_domain" {
  description = "Domain name of the ACM certificate"
  value       = aws_acm_certificate.cloudfront_cert.domain_name
}

# CloudWatch Alarm Outputs
output "primary_cpu_alarm_arn" {
  description = "ARN of the primary CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_alarm.arn
}

output "secondary_cpu_alarm_arn" {
  description = "ARN of the secondary CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_alarm.arn
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public_rt.id
}

output "primary_private_route_table_1_id" {
  description = "ID of the primary private route table 1"
  value       = aws_route_table.primary_private_rt_1.id
}

output "primary_private_route_table_2_id" {
  description = "ID of the primary private route table 2"
  value       = aws_route_table.primary_private_rt_2.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public_rt.id
}

output "secondary_private_route_table_1_id" {
  description = "ID of the secondary private route table 1"
  value       = aws_route_table.secondary_private_rt_1.id
}

output "secondary_private_route_table_2_id" {
  description = "ID of the secondary private route table 2"
  value       = aws_route_table.secondary_private_rt_2.id
}

# DB Subnet Group Outputs
output "primary_db_subnet_group_name" {
  description = "Name of the primary DB subnet group"
  value       = aws_db_subnet_group.primary_db_subnet_group.name
}

output "primary_db_subnet_group_arn" {
  description = "ARN of the primary DB subnet group"
  value       = aws_db_subnet_group.primary_db_subnet_group.arn
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary_db_subnet_group.name
}

output "secondary_db_subnet_group_arn" {
  description = "ARN of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary_db_subnet_group.arn
}

# Resource Suffix Output
output "resource_suffix" {
  description = "Random suffix used for resource naming"
  value       = local.resource_suffix
}

# Environment Output
output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Region Outputs
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

# Domain Output
output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
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
provider "aws" {
  alias  = "us_west_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "eu_west_1"
  region = var.secondary_region
}

```
