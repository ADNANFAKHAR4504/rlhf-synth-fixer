# tap_stack.tf - Complete infrastructure stack for multi-region deployment
```hcl
# =============================================================================
# VARIABLES
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

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

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
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

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = "stacknewentry.com"
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  common_tags = {
    Environment = "Production"
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Naming conventions
  primary_prefix   = "${var.project_name}-${var.environment}-primary"
  secondary_prefix = "${var.project_name}-${var.environment}-secondary"

  # Subnet calculations
  primary_public_subnet_1  = cidrsubnet(var.primary_vpc_cidr, 8, 1)   # 10.0.1.0/24
  primary_public_subnet_2  = cidrsubnet(var.primary_vpc_cidr, 8, 2)   # 10.0.2.0/24
  primary_private_subnet_1 = cidrsubnet(var.primary_vpc_cidr, 8, 10)  # 10.0.10.0/24
  primary_private_subnet_2 = cidrsubnet(var.primary_vpc_cidr, 8, 11)  # 10.0.11.0/24

  secondary_public_subnet_1  = cidrsubnet(var.secondary_vpc_cidr, 8, 1)   # 10.1.1.0/24
  secondary_public_subnet_2  = cidrsubnet(var.secondary_vpc_cidr, 8, 2)   # 10.1.2.0/24
  secondary_private_subnet_1 = cidrsubnet(var.secondary_vpc_cidr, 8, 10)  # 10.1.10.0/24
  secondary_private_subnet_2 = cidrsubnet(var.secondary_vpc_cidr, 8, 11)  # 10.1.11.0/24
}

# =============================================================================
# DATA SOURCES
# =============================================================================

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

# =============================================================================
# RANDOM RESOURCES FOR RDS
# =============================================================================

# Generate random username for RDS master user (8 characters, starts with letter)
resource "random_string" "db_username" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true

  # Ensure it starts with a letter
  keepers = {
    prefix = "a"
  }
}

# Generate random password for RDS master user (16 characters with special chars)
resource "random_password" "db_password" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*+-=?^_`|~"
}

# =============================================================================
# VPC AND NETWORKING - PRIMARY REGION (US-EAST-2)
# =============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-vpc"
    Region = var.primary_region
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-igw"
    Region = var.primary_region
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public_1" {
  provider                = aws.us_east_2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_1
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-public-subnet-1"
    Type   = "Public"
    Region = var.primary_region
  })
}

resource "aws_subnet" "primary_public_2" {
  provider                = aws.us_east_2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_2
  availability_zone       = data.aws_availability_zones.primary.names[1]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-public-subnet-2"
    Type   = "Public"
    Region = var.primary_region
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private_1" {
  provider          = aws.us_east_2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_1
  availability_zone = data.aws_availability_zones.primary.names[0]

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-private-subnet-1"
    Type   = "Private"
    Region = var.primary_region
  })
}

resource "aws_subnet" "primary_private_2" {
  provider          = aws.us_east_2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_2
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-private-subnet-2"
    Type   = "Private"
    Region = var.primary_region
  })
}

# Primary NAT Gateway EIPs
resource "aws_eip" "primary_nat_1" {
  provider = aws.us_east_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-nat-eip-1"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_eip" "primary_nat_2" {
  provider = aws.us_east_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-nat-eip-2"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary NAT Gateways
resource "aws_nat_gateway" "primary_1" {
  provider      = aws.us_east_2
  allocation_id = aws_eip.primary_nat_1.id
  subnet_id     = aws_subnet.primary_public_1.id

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-nat-1"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "primary_2" {
  provider      = aws.us_east_2
  allocation_id = aws_eip.primary_nat_2.id
  subnet_id     = aws_subnet.primary_public_2.id

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-nat-2"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary Route Tables
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-public-rt"
    Type   = "Public"
    Region = var.primary_region
  })
}

resource "aws_route_table" "primary_private_1" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_1.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-private-rt-1"
    Type   = "Private"
    Region = var.primary_region
  })
}

resource "aws_route_table" "primary_private_2" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_2.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-private-rt-2"
    Type   = "Private"
    Region = var.primary_region
  })
}

# Primary Route Table Associations
resource "aws_route_table_association" "primary_public_1" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_public_1.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_public_2" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_public_2.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private_1" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_private_1.id
  route_table_id = aws_route_table.primary_private_1.id
}

resource "aws_route_table_association" "primary_private_2" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_private_2.id
  route_table_id = aws_route_table.primary_private_2.id
}

# =============================================================================
# VPC AND NETWORKING - SECONDARY REGION (US-WEST-1)
# =============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-vpc"
    Region = var.secondary_region
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-igw"
    Region = var.secondary_region
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public_1" {
  provider                = aws.us_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_1
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-public-subnet-1"
    Type   = "Public"
    Region = var.secondary_region
  })
}

resource "aws_subnet" "secondary_public_2" {
  provider                = aws.us_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_2
  availability_zone       = data.aws_availability_zones.secondary.names[1]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-public-subnet-2"
    Type   = "Public"
    Region = var.secondary_region
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private_1" {
  provider          = aws.us_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_1
  availability_zone = data.aws_availability_zones.secondary.names[0]

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-private-subnet-1"
    Type   = "Private"
    Region = var.secondary_region
  })
}

resource "aws_subnet" "secondary_private_2" {
  provider          = aws.us_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_2
  availability_zone = data.aws_availability_zones.secondary.names[1]

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-private-subnet-2"
    Type   = "Private"
    Region = var.secondary_region
  })
}

# Secondary NAT Gateway EIPs
resource "aws_eip" "secondary_nat_1" {
  provider = aws.us_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-nat-eip-1"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_eip" "secondary_nat_2" {
  provider = aws.us_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-nat-eip-2"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary NAT Gateways
resource "aws_nat_gateway" "secondary_1" {
  provider      = aws.us_west_1
  allocation_id = aws_eip.secondary_nat_1.id
  subnet_id     = aws_subnet.secondary_public_1.id

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-nat-1"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_nat_gateway" "secondary_2" {
  provider      = aws.us_west_1
  allocation_id = aws_eip.secondary_nat_2.id
  subnet_id     = aws_subnet.secondary_public_2.id

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-nat-2"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary Route Tables
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-public-rt"
    Type   = "Public"
    Region = var.secondary_region
  })
}

resource "aws_route_table" "secondary_private_1" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_1.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-private-rt-1"
    Type   = "Private"
    Region = var.secondary_region
  })
}

resource "aws_route_table" "secondary_private_2" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_2.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-private-rt-2"
    Type   = "Private"
    Region = var.secondary_region
  })
}

# Secondary Route Table Associations
resource "aws_route_table_association" "secondary_public_1" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_public_1.id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_public_2" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_public_2.id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private_1" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_private_1.id
  route_table_id = aws_route_table.secondary_private_1.id
}

resource "aws_route_table_association" "secondary_private_2" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_private_2.id
  route_table_id = aws_route_table.secondary_private_2.id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Security Group for Load Balancer - Primary Region
resource "aws_security_group" "primary_alb" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
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
    Name   = "${local.primary_prefix}-alb-sg"
    Region = var.primary_region
  })
}

# Security Group for EC2 Instances - Primary Region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-ec2-sg"
    Region = var.primary_region
  })
}

# Security Group for RDS - Primary Region
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-rds-sg"
  description = "Security group for RDS database"
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
    Name   = "${local.primary_prefix}-rds-sg"
    Region = var.primary_region
  })
}

# Security Group for Load Balancer - Secondary Region
resource "aws_security_group" "secondary_alb" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
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
    Name   = "${local.secondary_prefix}-alb-sg"
    Region = var.secondary_region
  })
}

# Security Group for EC2 Instances - Secondary Region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.secondary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-ec2-sg"
    Region = var.secondary_region
  })
}

# Security Group for RDS - Secondary Region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-rds-sg"
  description = "Security group for RDS database"
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
    Name   = "${local.secondary_prefix}-rds-sg"
    Region = var.secondary_region
  })
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-${var.environment}-ec2-role"

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

# IAM Policy for S3 access
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-${var.environment}-s3-access"
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
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for CloudWatch
resource "aws_iam_policy" "cloudwatch_access" {
  name        = "${var.project_name}-${var.environment}-cloudwatch-access"
  description = "Policy for EC2 instances to access CloudWatch"

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

  tags = local.common_tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_access.arn
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# =============================================================================
# S3 BUCKET FOR LOGS
# =============================================================================

# S3 Bucket for application logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${var.environment}-logs-${random_string.bucket_suffix.result}"

  tags = local.common_tags
}

# Random suffix for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"
    filter {}
    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# =============================================================================
# LAUNCH TEMPLATES
# =============================================================================

# User data script for EC2 instances
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Configure log forwarding to S3
    yum install -y aws-cli
    echo "*/5 * * * * root aws s3 sync /var/log/ s3://${aws_s3_bucket.logs.bucket}/$(hostname)/ --exclude '*' --include '*.log'" >> /etc/crontab
  EOF
  )
}

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.primary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.primary_prefix}-instance"
      Region = var.primary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-launch-template"
    Region = var.primary_region
  })
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.secondary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.secondary_prefix}-instance"
      Region = var.secondary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-launch-template"
    Region = var.secondary_region
  })
}

# =============================================================================
# APPLICATION LOAD BALANCERS
# =============================================================================

# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = [aws_subnet.primary_public_1.id, aws_subnet.primary_public_2.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-alb"
    Region = var.primary_region
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-tg"
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
    Name   = "${local.primary_prefix}-tg"
    Region = var.primary_region
  })
}

# Load Balancer Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-listener"
    Region = var.primary_region
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = [aws_subnet.secondary_public_1.id, aws_subnet.secondary_public_2.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-alb"
    Region = var.secondary_region
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-tg"
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
    Name   = "${local.secondary_prefix}-tg"
    Region = var.secondary_region
  })
}

# Load Balancer Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-listener"
    Region = var.secondary_region
  })
}

# =============================================================================
# AUTO SCALING GROUPS
# =============================================================================

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.primary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.primary_prefix}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  tag {
    key                 = "Region"
    value               = var.primary_region
    propagate_at_launch = true
  }
}

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.secondary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.secondary_prefix}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  tag {
    key                 = "Region"
    value               = var.secondary_region
    propagate_at_launch = true
  }
}

# =============================================================================
# RDS DATABASE
# =============================================================================

# DB Subnet Group - Primary Region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.primary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-db-subnet-group"
    Region = var.primary_region
  })
}

# DB Subnet Group - Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.secondary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-db-subnet-group"
    Region = var.secondary_region
  })
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2

  identifier     = "${local.primary_prefix}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "appdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-database"
    Region = var.primary_region
  })
}

# Read Replica in Secondary Region
resource "aws_db_instance" "secondary_replica" {
  provider = aws.us_west_1

  identifier                = "${local.secondary_prefix}-database-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  storage_encrypted         = true
  instance_class            = var.db_instance_class
  auto_minor_version_upgrade = false

  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-database-replica"
    Region = var.secondary_region
  })
}

# =============================================================================
# ROUTE 53
# =============================================================================

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = local.common_tags
}

# Route 53 Health Check - Primary ALB
resource "aws_route53_health_check" "primary_alb" {
  fqdn                            = aws_lb.primary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.primary_region
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-health-check"
  })
}

# Route 53 Health Check - Secondary ALB
resource "aws_route53_health_check" "secondary_alb" {
  fqdn                            = aws_lb.secondary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.secondary_region
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.secondary_alb_health.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-health-check"
  })
}

# Route 53 Record - Primary (Weighted Routing)
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "primary"
  weighted_routing_policy {
    weight = 100
  }

  health_check_id = aws_route53_health_check.primary_alb.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record - Secondary (Weighted Routing)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"
  weighted_routing_policy {
    weight = 0
  }

  health_check_id = aws_route53_health_check.secondary_alb.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# =============================================================================
# CLOUDWATCH MONITORING AND ALARMS
# =============================================================================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  provider          = aws.us_east_2
  name              = "/aws/ec2/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary ALB Health
resource "aws_cloudwatch_metric_alarm" "primary_alb_health" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors primary ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary ALB Health
resource "aws_cloudwatch_metric_alarm" "secondary_alb_health" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors secondary ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary RDS CPU
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors primary RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

# SNS Topic for Alerts - Primary Region
resource "aws_sns_topic" "alerts" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-alerts"

  tags = local.common_tags
}

# SNS Topic for Alerts - Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-alerts"

  tags = local.common_tags
}

# =============================================================================
# AUTO SCALING POLICIES
# =============================================================================

# Auto Scaling Policy - Scale Up Primary
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Auto Scaling Policy - Scale Down Primary
resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Auto Scaling Policy - Scale Up Secondary
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# Auto Scaling Policy - Scale Down Secondary
resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# CloudWatch Metric Alarm - Primary CPU High
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors primary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary CPU Low
resource "aws_cloudwatch_metric_alarm" "primary_cpu_low" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors primary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary CPU High
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors secondary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary CPU Low
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_low" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors secondary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
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
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = [aws_subnet.primary_public_1.id, aws_subnet.primary_public_2.id]
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = [aws_subnet.secondary_public_1.id, aws_subnet.secondary_public_2.id]
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]
}

# Load Balancer Outputs
output "primary_alb_dns_name" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "primary_launch_template_arn" {
  description = "ARN of the primary launch template"
  value       = aws_launch_template.primary.arn
}

output "secondary_launch_template_arn" {
  description = "ARN of the secondary launch template"
  value       = aws_launch_template.secondary.arn
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "ID of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "primary_ami_name" {
  description = "Name of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "Name of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary database"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary read replica"
  value       = aws_db_instance.secondary_replica.endpoint
}

output "primary_rds_identifier" {
  description = "RDS instance identifier for primary database"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_identifier" {
  description = "RDS instance identifier for secondary read replica"
  value       = aws_db_instance.secondary_replica.id
}

output "primary_rds_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary.arn
}

output "secondary_rds_arn" {
  description = "ARN of the secondary RDS read replica"
  value       = aws_db_instance.secondary_replica.arn
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.primary.db_name
}

output "rds_username" {
  description = "Master username for the database"
  value       = aws_db_instance.primary.username
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.logs.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.logs.bucket_regional_domain_name
}

# IAM Outputs
output "ec2_iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "s3_access_policy_arn" {
  description = "ARN of the S3 access policy"
  value       = aws_iam_policy.s3_access.arn
}

output "cloudwatch_access_policy_arn" {
  description = "ARN of the CloudWatch access policy"
  value       = aws_iam_policy.cloudwatch_access.arn
}

# Security Group Outputs
output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_health_check_id" {
  description = "Route 53 health check ID for primary ALB"
  value       = aws_route53_health_check.primary_alb.id
}

output "secondary_health_check_id" {
  description = "Route 53 health check ID for secondary ALB"
  value       = aws_route53_health_check.secondary_alb.id
}

output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
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
  value       = [aws_nat_gateway.primary_1.id, aws_nat_gateway.primary_2.id]
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = [aws_nat_gateway.secondary_1.id, aws_nat_gateway.secondary_2.id]
}

output "primary_nat_gateway_public_ips" {
  description = "Public IPs of the primary NAT gateways"
  value       = [aws_eip.primary_nat_1.public_ip, aws_eip.primary_nat_2.public_ip]
}

output "secondary_nat_gateway_public_ips" {
  description = "Public IPs of the secondary NAT gateways"
  value       = [aws_eip.secondary_nat_1.public_ip, aws_eip.secondary_nat_2.public_ip]
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary private route tables"
  value       = [aws_route_table.primary_private_1.id, aws_route_table.primary_private_2.id]
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary private route tables"
  value       = [aws_route_table.secondary_private_1.id, aws_route_table.secondary_private_2.id]
}

# DB Subnet Group Outputs
output "primary_db_subnet_group_name" {
  description = "Name of the primary DB subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary.name
}

output "primary_db_subnet_group_arn" {
  description = "ARN of the primary DB subnet group"
  value       = aws_db_subnet_group.primary.arn
}

output "secondary_db_subnet_group_arn" {
  description = "ARN of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "primary_alb_health_alarm_name" {
  description = "Name of the primary ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name
}

output "secondary_alb_health_alarm_name" {
  description = "Name of the secondary ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_alb_health.alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.alarm_name
}

output "primary_cpu_high_alarm_name" {
  description = "Name of the primary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.alarm_name
}

output "primary_cpu_low_alarm_name" {
  description = "Name of the primary CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_low.alarm_name
}

output "secondary_cpu_high_alarm_name" {
  description = "Name of the secondary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.alarm_name
}

output "secondary_cpu_low_alarm_name" {
  description = "Name of the secondary CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_low.alarm_name
}

# SNS Topic Outputs
output "primary_sns_topic_arn" {
  description = "ARN of the primary SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "secondary_sns_topic_arn" {
  description = "ARN of the secondary SNS topic for alerts"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "primary_sns_topic_name" {
  description = "Name of the primary SNS topic for alerts"
  value       = aws_sns_topic.alerts.name
}

output "secondary_sns_topic_name" {
  description = "Name of the secondary SNS topic for alerts"
  value       = aws_sns_topic.alerts_secondary.name
}

# Auto Scaling Policy Outputs
output "primary_scale_up_policy_arn" {
  description = "ARN of the primary scale up policy"
  value       = aws_autoscaling_policy.primary_scale_up.arn
}

output "primary_scale_down_policy_arn" {
  description = "ARN of the primary scale down policy"
  value       = aws_autoscaling_policy.primary_scale_down.arn
}

output "secondary_scale_up_policy_arn" {
  description = "ARN of the secondary scale up policy"
  value       = aws_autoscaling_policy.secondary_scale_up.arn
}

output "secondary_scale_down_policy_arn" {
  description = "ARN of the secondary scale down policy"
  value       = aws_autoscaling_policy.secondary_scale_down.arn
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "Availability zones used in primary region"
  value       = [data.aws_availability_zones.primary.names[0], data.aws_availability_zones.primary.names[1]]
}

output "secondary_availability_zones" {
  description = "Availability zones used in secondary region"
  value       = [data.aws_availability_zones.secondary.names[0], data.aws_availability_zones.secondary.names[1]]
}

# EIP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary NAT gateway Elastic IPs"
  value       = [aws_eip.primary_nat_1.id, aws_eip.primary_nat_2.id]
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary NAT gateway Elastic IPs"
  value       = [aws_eip.secondary_nat_1.id, aws_eip.secondary_nat_2.id]
}

# Load Balancer Listener Outputs
output "primary_alb_listener_arn" {
  description = "ARN of the primary ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Random Resource Outputs
output "s3_bucket_suffix" {
  description = "Random suffix used for S3 bucket name"
  value       = random_string.bucket_suffix.result
}

output "db_username_suffix" {
  description = "Random suffix used for database username"
  value       = random_string.db_username.result
}

# Subnet CIDR Outputs
# Primary Subnet CIDRs
output "primary_public_subnet_1_cidr" {
  description = "CIDR block of primary public subnet 1"
  value       = local.primary_public_subnet_1
}

output "primary_public_subnet_2_cidr" {
  description = "CIDR block of primary public subnet 2"
  value       = local.primary_public_subnet_2
}

output "primary_private_subnet_1_cidr" {
  description = "CIDR block of primary private subnet 1"
  value       = local.primary_private_subnet_1
}

output "primary_private_subnet_2_cidr" {
  description = "CIDR block of primary private subnet 2"
  value       = local.primary_private_subnet_2
}

# Secondary Subnet CIDRs
output "secondary_public_subnet_1_cidr" {
  description = "CIDR block of secondary public subnet 1"
  value       = local.secondary_public_subnet_1
}

output "secondary_public_subnet_2_cidr" {
  description = "CIDR block of secondary public subnet 2"
  value       = local.secondary_public_subnet_2
}

output "secondary_private_subnet_1_cidr" {
  description = "CIDR block of secondary private subnet 1"
  value       = local.secondary_private_subnet_1
}

output "secondary_private_subnet_2_cidr" {
  description = "CIDR block of secondary private subnet 2"
  value       = local.secondary_private_subnet_2
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

# Environment and Project Outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# Resource Naming Prefix Outputs
output "primary_resource_prefix" {
  description = "Resource naming prefix for primary region"
  value       = local.primary_prefix
}

output "secondary_resource_prefix" {
  description = "Resource naming prefix for secondary region"
  value       = local.secondary_prefix
}

# Common Tags Output
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Instance Type Output
output "ec2_instance_type" {
  description = "EC2 instance type used"
  value       = var.instance_type
}

output "rds_instance_class" {
  description = "RDS instance class used"
  value       = var.db_instance_class
}

# Auto Scaling Configuration Outputs
# Auto Scaling Configuration Outputs (Flattened)
output "primary_asg_min_size" {
  description = "Minimum size of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.min_size
}

output "primary_asg_max_size" {
  description = "Maximum size of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.max_size
}

output "primary_asg_desired_capacity" {
  description = "Desired capacity of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.desired_capacity
}

output "secondary_asg_min_size" {
  description = "Minimum size of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.min_size
}

output "secondary_asg_max_size" {
  description = "Maximum size of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.max_size
}

output "secondary_asg_desired_capacity" {
  description = "Desired capacity of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.desired_capacity
}

# RDS Configuration Outputs (Flattened)
output "rds_engine" {
  description = "Database engine of the RDS instance"
  value       = aws_db_instance.primary.engine
}

output "rds_engine_version" {
  description = "Database engine version of the RDS instance"
  value       = aws_db_instance.primary.engine_version
}

output "rds_allocated_storage" {
  description = "Allocated storage (GB) for the RDS instance"
  value       = aws_db_instance.primary.allocated_storage
}

output "rds_max_allocated_storage" {
  description = "Maximum allocated storage (GB) for the RDS instance"
  value       = aws_db_instance.primary.max_allocated_storage
}

output "rds_storage_type" {
  description = "Storage type of the RDS instance"
  value       = aws_db_instance.primary.storage_type
}

output "rds_storage_encrypted" {
  description = "Whether storage encryption is enabled for the RDS instance"
  value       = aws_db_instance.primary.storage_encrypted
}

output "rds_backup_retention_period" {
  description = "Backup retention period (days) for the RDS instance"
  value       = aws_db_instance.primary.backup_retention_period
}

# S3 Lifecycle Configuration Output
output "s3_lifecycle_policy" {
  description = "S3 bucket lifecycle policy configuration"
  value = {
    expiration_days = 30
    rule_status     = "Enabled"
  }
}

# Main Application URL Output (Primary requirement)
output "application_url" {
  description = "Public DNS of the ELB for external access"
  value       = "http://${var.domain_name}"
}

# Backup Application URLs
output "primary_application_url" {
  description = "Direct URL to primary region ALB"
  value       = "http://${aws_lb.primary.dns_name}"
}

output "secondary_application_url" {
  description = "Direct URL to secondary region ALB"
  value       = "http://${aws_lb.secondary.dns_name}"
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
