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
data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "us_west_2" {
  provider = aws.us_west_2
  state    = "available"
}

# Random password for RDS instances
resource "random_password" "db_password" {
  for_each = local.environments
  length   = 16
  special  = true
}

# VPC for US-East-1 environments (dev, staging)
resource "aws_vpc" "us_east_1" {
  for_each = {
    for env_key, env in local.environments : env_key => env
    if env.region == "us-east-1"
  }
  provider = aws.us_east_1

  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-vpc"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# VPC for US-West-2 environments (prod)
resource "aws_vpc" "us_west_2" {
  for_each = {
    for env_key, env in local.environments : env_key => env
    if env.region == "us-west-2"
  }
  provider = aws.us_west_2

  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-vpc"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Local to combine VPCs
locals {
  all_vpcs = merge(aws_vpc.us_east_1, aws_vpc.us_west_2)
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  for_each = local.environments
  vpc_id   = local.all_vpcs[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-igw"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for combo in flatten([
      for env_key, env in local.environments : [
        for subnet_idx in range(length(env.public_subnet_cidrs)) : {
          key        = "${env_key}-${subnet_idx}"
          env_key    = env_key
          env        = env
          subnet_idx = subnet_idx
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id                  = local.all_vpcs[each.value.env_key].id
  cidr_block              = each.value.env.public_subnet_cidrs[each.value.subnet_idx]
  availability_zone       = each.value.env.region == "us-west-2" ? data.aws_availability_zones.us_west_2.names[each.value.subnet_idx] : data.aws_availability_zones.us_east_1.names[each.value.subnet_idx]
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
    for combo in flatten([
      for env_key, env in local.environments : [
        for subnet_idx in range(length(env.private_subnet_cidrs)) : {
          key        = "${env_key}-${subnet_idx}"
          env_key    = env_key
          env        = env
          subnet_idx = subnet_idx
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id            = local.all_vpcs[each.value.env_key].id
  cidr_block        = each.value.env.private_subnet_cidrs[each.value.subnet_idx]
  availability_zone = each.value.env.region == "us-west-2" ? data.aws_availability_zones.us_west_2.names[each.value.subnet_idx] : data.aws_availability_zones.us_east_1.names[each.value.subnet_idx]

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
  vpc_id   = local.all_vpcs[each.key].id

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
  vpc_id   = local.all_vpcs[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-private-rt"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[split("-", each.key)[0]].id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[split("-", each.key)[0]].id
}

# Security Groups
resource "aws_security_group" "web" {
  for_each = local.environments

  name_prefix = "${var.company_name}-${each.key}-web-"
  vpc_id      = local.all_vpcs[each.key].id

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
  vpc_id      = local.all_vpcs[each.key].id

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

# DB Subnet Groups
resource "aws_db_subnet_group" "main" {
  for_each = local.environments

  name = "${var.company_name}-${each.key}-db-subnet-group"
  subnet_ids = [
    for subnet_key, subnet in aws_subnet.private : subnet.id
    if startswith(subnet_key, each.key)
  ]

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-db-subnet-group"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# RDS Instances
resource "aws_db_instance" "main" {
  for_each = local.environments

  identifier     = "${var.company_name}-${each.key}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = "${var.company_name}${each.key}db"
  username = "admin"
  password = random_password.db_password[each.key].result

  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name

  backup_retention_period = each.value.backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-db"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# EC2 Instances
resource "aws_instance" "web" {
  for_each = local.environments

  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.ec2_instance_type

  subnet_id = [
    for subnet_key, subnet in aws_subnet.public : subnet.id
    if startswith(subnet_key, each.key)
  ][0]
  vpc_security_group_ids      = [aws_security_group.web[each.key].id]
  associate_public_ip_address = true

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${each.key} environment</h1>" > /var/www/html/index.html
              EOF
  )

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-web"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Outputs
output "environment_info" {
  value = {
    for env_key, env in local.environments : env_key => {
      region   = env.region
      vpc_id   = local.all_vpcs[env_key].id
      vpc_cidr = local.all_vpcs[env_key].cidr_block
      public_subnets = [
        for subnet_key, subnet in aws_subnet.public : {
          id   = subnet.id
          cidr = subnet.cidr_block
          az   = subnet.availability_zone
        }
        if startswith(subnet_key, env_key)
      ]
      private_subnets = [
        for subnet_key, subnet in aws_subnet.private : {
          id   = subnet.id
          cidr = subnet.cidr_block
          az   = subnet.availability_zone
        }
        if startswith(subnet_key, env_key)
      ]
      rds_endpoint = aws_db_instance.main[env_key].endpoint
      ec2_instance = {
        id         = aws_instance.web[env_key].id
        public_ip  = aws_instance.web[env_key].public_ip
        private_ip = aws_instance.web[env_key].private_ip
      }
    }
  }
  description = "Environment infrastructure details"
}

output "database_passwords" {
  value = {
    for env_key in keys(local.environments) : env_key => random_password.db_password[env_key].result
  }
  description = "Database passwords for each environment"
  sensitive   = true
}
