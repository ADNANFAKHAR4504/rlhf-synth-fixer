# main.tf

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Get existing Route53 hosted zone if specified
data "aws_route53_zone" "parent" {
  count   = var.parent_hosted_zone_id != null ? 1 : 0
  zone_id = var.parent_hosted_zone_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidrs[local.environment]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-public-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-private-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-database-${count.index + 1}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(local.azs)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-public-rt"
  })
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count = length(local.azs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-private-rt-${count.index + 1}"
  })
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

# Route Table Associations - Database
resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${local.environment}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-db-subnet-group"
  })
}

# Security Groups
# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${local.environment}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-rds-sg"
  })
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-${local.environment}-ecs-tasks-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-ecs-tasks-sg"
  })
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${local.environment}-alb-"
  vpc_id      = aws_vpc.main.id

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
    Name = "${var.project_name}-${local.environment}-alb-sg"
  })
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store DB password in Systems Manager Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${local.environment}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = local.common_tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${local.environment}-postgres"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15.10"
  instance_class = local.rds_instance_classes[local.environment]

  # Database configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database settings
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Multi-AZ and backup configuration
  multi_az               = local.rds_multi_az[local.environment]
  backup_retention_period = local.rds_backup_retention[local.environment]
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  delete_automated_backups = true

  # Security and monitoring
  deletion_protection = false
  skip_final_snapshot = local.environment == "dev" ? true : false
  final_snapshot_identifier = local.environment != "dev" ? "${var.project_name}-${local.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance insights
  performance_insights_enabled = local.environment != "dev" ? true : false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-postgres"
  })
}