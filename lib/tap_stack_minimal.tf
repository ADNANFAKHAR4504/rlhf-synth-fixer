# Variables
variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "tapstack"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# Local values for environment configuration
locals {
  environments = {
    dev = {
      name                 = "dev"
      region               = "us-east-1"
      vpc_cidr             = "10.0.0.0/16"
      public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
      private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
      cost_center          = "Development"
      backup_retention     = 7
    }
    staging = {
      name                 = "staging"
      region               = "us-east-1"
      vpc_cidr             = "10.1.0.0/16"
      public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
      private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
      cost_center          = "Staging"
      backup_retention     = 14
    }
    prod = {
      name                 = "prod"
      region               = "us-west-2"
      vpc_cidr             = "10.2.0.0/16"
      public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
      private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]
      cost_center          = "Production"
      backup_retention     = 30
    }
  }

  common_tags = {
    Project   = "TAP-Stack"
    ManagedBy = "Terraform"
    Company   = var.company_name
  }
}

# Data sources for AMIs
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

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Random password for RDS instances
resource "random_password" "db_password" {
  for_each = local.environments
  length   = 16
  special  = true
}

# VPC
resource "aws_vpc" "main" {
  for_each = local.environments

  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-vpc"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  for_each = local.environments
  vpc_id   = aws_vpc.main[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-igw"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key    = env.name
      env        = env
      subnet_idx = idx
    }
  }

  vpc_id                  = aws_vpc.main[each.value.env_key].id
  cidr_block              = each.value.env.public_subnet_cidrs[each.value.subnet_idx]
  availability_zone       = data.aws_availability_zones.available.names[each.value.subnet_idx]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.value.env_key}-public-subnet-${each.value.subnet_idx + 1}"
    Environment = each.value.env.name
    CostCenter  = each.value.env.cost_center
    Type        = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key    = env.name
      env        = env
      subnet_idx = idx
    }
  }

  vpc_id            = aws_vpc.main[each.value.env_key].id
  cidr_block        = each.value.env.private_subnet_cidrs[each.value.subnet_idx]
  availability_zone = data.aws_availability_zones.available.names[each.value.subnet_idx]

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.value.env_key}-private-subnet-${each.value.subnet_idx + 1}"
    Environment = each.value.env.name
    CostCenter  = each.value.env.cost_center
    Type        = "Private"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  for_each = local.environments
  vpc_id   = aws_vpc.main[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-public-rt"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_route_table" "private" {
  for_each = local.environments
  vpc_id   = aws_vpc.main[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-private-rt"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key   = env.name
      subnet_id = aws_subnet.public["${env.name}-${idx}"].id
    }
  }

  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.public[each.value.env_key].id
}

resource "aws_route_table_association" "private" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key   = env.name
      subnet_id = aws_subnet.private["${env.name}-${idx}"].id
    }
  }

  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.private[each.value.env_key].id
}

# Security Groups
resource "aws_security_group" "web" {
  for_each = local.environments

  name_prefix = "${var.company_name}-${each.key}-web-"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-web-sg"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_security_group" "rds" {
  for_each = local.environments

  name_prefix = "${var.company_name}-${each.key}-rds-"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web[each.key].id]
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-rds-sg"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Outputs
output "environment_info" {
  value = {
    for env_key, env in local.environments : env_key => {
      region = env.region
      vpc_id = aws_vpc.main[env_key].id
    }
  }
  description = "Environment infrastructure details"
}
