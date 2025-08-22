# tap_stack.tf - Multi-Region Resilient AWS Infrastructure
# This configuration creates a high-availability setup across us-east-1 and us-west-2

# ============================================================================
# PRIMARY REGION INFRASTRUCTURE (us-east-1)
# ============================================================================

# VPC in Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name   = "primary-vpc-${var.environment_suffix}"
    Region = var.aws_region_primary
  }
}

# Internet Gateway for Primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name = "primary-igw-${var.environment_suffix}"
  }
}

# Public Subnets in Primary Region
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "primary-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets in Primary Region
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "primary-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Route Table for Public Subnets in Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "primary-public-rt-${var.environment_suffix}"
  }
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# NAT Gateway for Private Subnets in Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name = "primary-nat-eip-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = {
    Name = "primary-nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.primary]
}

# Route Table for Private Subnets in Primary Region
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = {
    Name = "primary-private-rt-${var.environment_suffix}"
  }
}

# Associate Private Subnets with Route Table
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# ============================================================================
# SECONDARY REGION INFRASTRUCTURE (us-west-2)
# ============================================================================

# VPC in Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name   = "secondary-vpc-${var.environment_suffix}"
    Region = var.aws_region_secondary
  }
}

# Internet Gateway for Secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name = "secondary-igw-${var.environment_suffix}"
  }
}

# Public Subnets in Secondary Region
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "secondary-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets in Secondary Region
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name = "secondary-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Route Table for Public Subnets in Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name = "secondary-public-rt-${var.environment_suffix}"
  }
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# NAT Gateway for Private Subnets in Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name = "secondary-nat-eip-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public[0].id

  tags = {
    Name = "secondary-nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.secondary]
}

# Route Table for Private Subnets in Secondary Region
resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  tags = {
    Name = "secondary-private-rt-${var.environment_suffix}"
  }
}

# Associate Private Subnets with Route Table
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "rds-enhanced-monitoring-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "rds-enhanced-monitoring-role-${var.environment_suffix}"
  }
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# RDS SUBNET GROUPS
# ============================================================================

# DB Subnet Group for Primary Region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "primary-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name = "primary-db-subnet-group-${var.environment_suffix}"
  }
}

# DB Subnet Group for Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "secondary-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = {
    Name = "secondary-db-subnet-group-${var.environment_suffix}"
  }
}

# ============================================================================
# SECURITY GROUPS FOR RDS
# ============================================================================

# Security Group for RDS in Primary Region
resource "aws_security_group" "rds_primary" {
  provider    = aws.primary
  name        = "rds-primary-sg-${var.environment_suffix}"
  description = "Security group for RDS MySQL in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
    description = "MySQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "rds-primary-sg-${var.environment_suffix}"
  }
}

# Security Group for RDS in Secondary Region
resource "aws_security_group" "rds_secondary" {
  provider    = aws.secondary
  name        = "rds-secondary-sg-${var.environment_suffix}"
  description = "Security group for RDS MySQL in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
    description = "MySQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "rds-secondary-sg-${var.environment_suffix}"
  }
}

# ============================================================================
# RDS PARAMETER GROUP
# ============================================================================

# Custom parameter group for MySQL
resource "aws_db_parameter_group" "mysql" {
  provider = aws.primary
  family   = "mysql8.0"
  name     = "custom-mysql8-params-${var.environment_suffix}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  tags = {
    Name = "custom-mysql8-params-${var.environment_suffix}"
  }
}

# Parameter group for secondary region
resource "aws_db_parameter_group" "mysql_secondary" {
  provider = aws.secondary
  family   = "mysql8.0"
  name     = "custom-mysql8-params-secondary-${var.environment_suffix}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  tags = {
    Name = "custom-mysql8-params-secondary-${var.environment_suffix}"
  }
}

# ============================================================================
# RDS INSTANCES
# ============================================================================

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  provider                = aws.primary
  name                    = "rds-mysql-password-${var.environment_suffix}"
  description             = "Password for RDS MySQL instances"
  recovery_window_in_days = 0 # Allow immediate deletion

  replica {
    region = "us-west-2"
  }

  tags = {
    Name = "rds-mysql-password-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

# RDS MySQL Instance in Primary Region (Multi-AZ)
resource "aws_db_instance" "primary" {
  provider = aws.primary

  # Basic Configuration
  identifier = "mysql-primary-${var.environment_suffix}-v2"
  engine     = "mysql"
  #engine_version = "8.0.36"
  instance_class = var.db_instance_class

  # Storage Configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database Configuration
  db_name  = "maindb"
  username = "admin"
  password = random_password.db_password.result

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  publicly_accessible    = false

  # High Availability Configuration
  multi_az = true

  # Backup Configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Monitoring Configuration
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  # performance_insights_enabled = true

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.mysql.name

  # Deletion Protection
  deletion_protection = false # Set to true for production
  skip_final_snapshot = true  # Set to false for production

  # Enable automated backups for cross-region replication
  copy_tags_to_snapshot = true

  tags = {
    Name = "mysql-primary-${var.environment_suffix}"
    Role = "primary"
  }
}

# RDS MySQL Instance in Secondary Region (Multi-AZ)
resource "aws_db_instance" "secondary" {
  provider = aws.secondary

  # Basic Configuration
  identifier = "mysql-secondary-${var.environment_suffix}"
  engine     = "mysql"
  #engine_version = "8.0.36"
  instance_class = var.db_instance_class

  # Storage Configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database Configuration
  db_name  = "maindb"
  username = "admin"
  password = random_password.db_password.result

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  publicly_accessible    = false

  # High Availability Configuration
  multi_az = true

  # Backup Configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Monitoring Configuration
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  # performance_insights_enabled = true

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.mysql_secondary.name

  # Deletion Protection
  deletion_protection = false # Set to true for production
  skip_final_snapshot = true  # Set to false for production

  # Enable automated backups
  copy_tags_to_snapshot = true

  tags = {
    Name = "mysql-secondary-${var.environment_suffix}"
    Role = "secondary"
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

# Primary Region Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "primary_public_subnet_ids" {
  description = "IDs of public subnets in primary region"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of private subnets in primary region"
  value       = aws_subnet.primary_private[*].id
}

# Secondary Region Outputs
output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint in secondary region"
  value       = aws_db_instance.secondary.endpoint
  sensitive   = true
}

output "secondary_public_subnet_ids" {
  description = "IDs of public subnets in secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of private subnets in secondary region"
  value       = aws_subnet.secondary_private[*].id
}

# Database Credentials
output "db_secret_arn" {
  description = "ARN of the secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}