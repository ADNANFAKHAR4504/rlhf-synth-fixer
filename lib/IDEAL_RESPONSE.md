```hcl
# ============================================================================
# VARIABLES
# ============================================================================

variable "primary_region" {
  description = "Primary AWS region for the main infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (production, staging, etc.)"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "FinOps-Team"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "alerts@example.com"
}

variable "alert_phone" {
  description = "Phone number for SMS alerts (E.164 format)"
  type        = string
  default     = "+1234567890"
}

variable "db_username" {
  description = "Master username for RDS instances"
  type        = string
  default     = "dbadmin"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "primary" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.us_west_2
  state    = "available"
}

data "aws_caller_identity" "current" {
  provider = aws.us_east_1
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  resource_suffix = "drsh"
  
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Purpose     = "DR-Infrastructure"
  }
  
  primary_tags = merge(local.common_tags, {
    DR-Role = "Primary"
    Region  = var.primary_region
  })
  
  secondary_tags = merge(local.common_tags, {
    DR-Role = "Secondary"
    Region  = var.secondary_region
  })
  
  # Network configurations
  primary_vpc_cidr   = "10.1.0.0/16"
  secondary_vpc_cidr = "10.2.0.0/16"
  
  # Subnet configurations
  primary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24"]
  primary_private_subnets = ["10.1.10.0/24", "10.1.11.0/24"]
  
  secondary_public_subnets  = ["10.2.1.0/24", "10.2.2.0/24"]
  secondary_private_subnets = ["10.2.10.0/24", "10.2.11.0/24"]
}

# ============================================================================
# RANDOM PASSWORD FOR RDS
# ============================================================================

resource "random_password" "db_password" {
  length  = 16
  special = true
  # AWS RDS allowed special characters only
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ============================================================================
# SECRETS MANAGER - PRIMARY REGION
# ============================================================================

resource "aws_secretsmanager_secret" "db_password_primary" {
  provider                = aws.us_east_1
  name                    = "rds-master-password-primary-${local.resource_suffix}"
  description             = "Master password for primary RDS instance"
  recovery_window_in_days = 7
  
  tags = local.primary_tags
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider      = aws.us_east_1
  secret_id     = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# ============================================================================
# SECRETS MANAGER - SECONDARY REGION
# ============================================================================

resource "aws_secretsmanager_secret" "db_password_secondary" {
  provider                = aws.us_west_2
  name                    = "rds-master-password-secondary-${local.resource_suffix}"
  description             = "Master password for secondary RDS instance"
  recovery_window_in_days = 7
  
  tags = local.secondary_tags
}

resource "aws_secretsmanager_secret_version" "db_password_secondary" {
  provider      = aws.us_west_2
  secret_id     = aws_secretsmanager_secret.db_password_secondary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# ============================================================================
# VPC - PRIMARY REGION
# ============================================================================

resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.primary_tags, {
    Name = "vpc-primary-${local.resource_suffix}"
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.primary_tags, {
    Name = "igw-primary-${local.resource_suffix}"
  })
}

# Public Subnets - Primary
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.primary_tags, {
    Name = "subnet-public-primary-${count.index + 1}-${local.resource_suffix}"
    Type = "Public"
  })
}

# Private Subnets - Primary
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.primary_tags, {
    Name = "subnet-private-primary-${count.index + 1}-${local.resource_suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways - Primary
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_1
  count    = 2
  domain   = "vpc"
  
  tags = merge(local.primary_tags, {
    Name = "eip-nat-primary-${count.index + 1}-${local.resource_suffix}"
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# NAT Gateways - Primary
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  count         = 2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  tags = merge(local.primary_tags, {
    Name = "nat-primary-${count.index + 1}-${local.resource_suffix}"
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# Route Table - Public Primary
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.primary_tags, {
    Name = "rt-public-primary-${local.resource_suffix}"
    Type = "Public"
  })
}

# Route Tables - Private Primary
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  count    = 2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.primary_tags, {
    Name = "rt-private-primary-${count.index + 1}-${local.resource_suffix}"
    Type = "Private"
  })
}

# Route Table Associations - Public Primary
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route Table Associations - Private Primary
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ============================================================================
# VPC - SECONDARY REGION
# ============================================================================

resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.secondary_tags, {
    Name = "vpc-secondary-${local.resource_suffix}"
  })
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.secondary_tags, {
    Name = "igw-secondary-${local.resource_suffix}"
  })
}

# Public Subnets - Secondary
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.secondary_tags, {
    Name = "subnet-public-secondary-${count.index + 1}-${local.resource_suffix}"
    Type = "Public"
  })
}

# Private Subnets - Secondary
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.secondary_tags, {
    Name = "subnet-private-secondary-${count.index + 1}-${local.resource_suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways - Secondary
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_2
  count    = 2
  domain   = "vpc"
  
  tags = merge(local.secondary_tags, {
    Name = "eip-nat-secondary-${count.index + 1}-${local.resource_suffix}"
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# NAT Gateways - Secondary
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  count         = 2
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  tags = merge(local.secondary_tags, {
    Name = "nat-secondary-${count.index + 1}-${local.resource_suffix}"
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# Route Table - Public Secondary
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.secondary_tags, {
    Name = "rt-public-secondary-${local.resource_suffix}"
    Type = "Public"
  })
}

# Route Tables - Private Secondary
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  count    = 2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.secondary_tags, {
    Name = "rt-private-secondary-${count.index + 1}-${local.resource_suffix}"
    Type = "Private"
  })
}

# Route Table Associations - Public Secondary
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route Table Associations - Private Secondary
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ============================================================================
# SECURITY GROUPS - PRIMARY
# ============================================================================

# Security Group for RDS - Primary
resource "aws_security_group" "rds_primary" {
  provider    = aws.us_east_1
  name        = "rds-primary-${local.resource_suffix}"
  description = "Security group for RDS database in primary region"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    description = "PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = local.primary_private_subnets
  }
  
  ingress {
    description = "PostgreSQL from Lambda"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.primary_tags, {
    Name = "rds-primary-${local.resource_suffix}"
  })
}

# Security Group for Lambda - Primary
resource "aws_security_group" "lambda_primary" {
  provider    = aws.us_east_1
  name        = "lambda-primary-${local.resource_suffix}"
  description = "Security group for Lambda functions in primary region"
  vpc_id      = aws_vpc.primary.id
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.primary_tags, {
    Name = "lambda-primary-${local.resource_suffix}"
  })
}

# ============================================================================
# SECURITY GROUPS - SECONDARY
# ============================================================================

# Security Group for RDS - Secondary
resource "aws_security_group" "rds_secondary" {
  provider    = aws.us_west_2
  name        = "rds-secondary-${local.resource_suffix}"
  description = "Security group for RDS database in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description = "PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = local.secondary_private_subnets
  }
  
  ingress {
    description = "PostgreSQL from Lambda"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.secondary_tags, {
    Name = "rds-secondary-${local.resource_suffix}"
  })
}

# Security Group for Lambda - Secondary
resource "aws_security_group" "lambda_secondary" {
  provider    = aws.us_west_2
  name        = "lambda-secondary-${local.resource_suffix}"
  description = "Security group for Lambda functions in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.secondary_tags, {
    Name = "lambda-secondary-${local.resource_suffix}"
  })
}

# ============================================================================
# RDS SUBNET GROUPS
# ============================================================================

# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary" {
  provider    = aws.us_east_1
  name        = "db-subnet-group-primary-${local.resource_suffix}"
  description = "Database subnet group for primary region"
  subnet_ids  = aws_subnet.primary_private[*].id
  
  tags = merge(local.primary_tags, {
    Name = "db-subnet-group-primary-${local.resource_suffix}"
  })
}

# DB Subnet Group - Secondary
resource "aws_db_subnet_group" "secondary" {
  provider    = aws.us_west_2
  name        = "db-subnet-group-secondary-${local.resource_suffix}"
  description = "Database subnet group for secondary region"
  subnet_ids  = aws_subnet.secondary_private[*].id
  
  tags = merge(local.secondary_tags, {
    Name = "db-subnet-group-secondary-${local.resource_suffix}"
  })
}

# RDS INSTANCES
# ============================================================================

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider                = aws.us_east_1
  identifier              = "rds-primary-${local.resource_suffix}"
  allocated_storage       = 100
  storage_type            = "gp3"
  storage_encrypted       = true
  engine                  = "postgres"
  engine_version          = "17.6"
  instance_class          = "db.r6g.xlarge"
  db_name                 = "financedb"
  username                = var.db_username
  password                = random_password.db_password.result
  parameter_group_name    = "default.postgres17"
  db_subnet_group_name    = aws_db_subnet_group.primary.name
  vpc_security_group_ids  = [aws_security_group.rds_primary.id]
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # High availability
  multi_az               = true
  publicly_accessible    = false
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "rds-primary-final-snapshot-${local.resource_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn
  
  
  tags = merge(local.primary_tags, {
    Name = "rds-primary-${local.resource_suffix}"
  })
  
  depends_on = [aws_cloudwatch_log_group.rds_primary]
}

# Secondary RDS Read Replica
resource "aws_db_instance" "secondary" {
  provider                     = aws.us_west_2
  identifier                   = "rds-secondary-${local.resource_suffix}"
  replicate_source_db          = aws_db_instance.primary.arn
  instance_class               = "db.r6g.xlarge"
  publicly_accessible          = false
  auto_minor_version_upgrade   = false
  skip_final_snapshot          = true
  storage_encrypted            = true
  
  # Monitoring
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring_secondary.arn
  
  tags = merge(local.secondary_tags, {
    Name = "rds-secondary-${local.resource_suffix}"
  })
  
  depends_on = [aws_cloudwatch_log_group.rds_secondary]
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

# CloudWatch Log Group for RDS - Primary
resource "aws_cloudwatch_log_group" "rds_primary" {
  provider          = aws.us_east_1
  name              = "/aws/rds/instance/rds-primary-${local.resource_suffix}/postgresql"
  retention_in_days = 14
  
  tags = local.primary_tags
}

# CloudWatch Log Group for RDS - Secondary
resource "aws_cloudwatch_log_group" "rds_secondary" {
  provider          = aws.us_west_2
  name              = "/aws/rds/instance/rds-secondary-${local.resource_suffix}/postgresql"
  retention_in_days = 14
  
  tags = local.secondary_tags
}

# CloudWatch Log Group for Lambda - Primary
resource "aws_cloudwatch_log_group" "lambda_primary" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/db-health-check-primary-${local.resource_suffix}"
  retention_in_days = 14
  
  tags = local.primary_tags
}

# CloudWatch Log Group for Lambda - Secondary
resource "aws_cloudwatch_log_group" "lambda_secondary" {
  provider          = aws.us_west_2
  name              = "/aws/lambda/db-health-check-secondary-${local.resource_suffix}"
  retention_in_days = 14
  
  tags = local.secondary_tags
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for RDS Enhanced Monitoring - Primary
resource "aws_iam_role" "rds_monitoring" {
  provider = aws.us_east_1
  name     = "rds-monitoring-role-primary-${local.resource_suffix}"
  
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
  
  tags = local.primary_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  provider   = aws.us_east_1
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for RDS Enhanced Monitoring - Secondary
resource "aws_iam_role" "rds_monitoring_secondary" {
  provider = aws.us_west_2
  name     = "rds-monitoring-role-secondary-${local.resource_suffix}"
  
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
  
  tags = local.secondary_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.us_west_2
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for Lambda - Primary
resource "aws_iam_role" "lambda_primary" {
  provider = aws.us_east_1
  name     = "lambda-execution-role-primary-${local.resource_suffix}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.primary_tags
}

# IAM Policy for Lambda - Primary
resource "aws_iam_role_policy" "lambda_primary" {
  provider = aws.us_east_1
  name     = "lambda-policy-primary-${local.resource_suffix}"
  role     = aws_iam_role.lambda_primary.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for Lambda - Secondary
resource "aws_iam_role" "lambda_secondary" {
  provider = aws.us_west_2
  name     = "lambda-execution-role-secondary-${local.resource_suffix}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.secondary_tags
}

# IAM Policy for Lambda - Secondary
resource "aws_iam_role_policy" "lambda_secondary" {
  provider = aws.us_west_2
  name     = "lambda-policy-secondary-${local.resource_suffix}"
  role     = aws_iam_role.lambda_secondary.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

# Lambda Function - Primary
resource "aws_lambda_function" "health_check_primary" {
  provider         = aws.us_east_1
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "db-health-check-primary-${local.resource_suffix}"
  role            = aws_iam_role.lambda_primary.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 10
  memory_size     = 256
  
  environment {
    variables = {
      DB_ENDPOINT     = aws_db_instance.primary.endpoint
      SECRET_NAME     = aws_secretsmanager_secret.db_password_primary.name
      REGION          = var.primary_region
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  tags = merge(local.primary_tags, {
    Name = "lambda-health-check-primary-${local.resource_suffix}"
  })
  
  depends_on = [
    aws_iam_role_policy.lambda_primary,
    aws_cloudwatch_log_group.lambda_primary
  ]
}

# Lambda Function - Secondary
resource "aws_lambda_function" "health_check_secondary" {
  provider         = aws.us_west_2
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "db-health-check-secondary-${local.resource_suffix}"
  role            = aws_iam_role.lambda_secondary.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 10
  memory_size     = 256
  
  environment {
    variables = {
      DB_ENDPOINT     = aws_db_instance.secondary.endpoint
      SECRET_NAME     = aws_secretsmanager_secret.db_password_secondary.name
      REGION          = var.secondary_region
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.secondary_private[*].id
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  
  tags = merge(local.secondary_tags, {
    Name = "lambda-health-check-secondary-${local.resource_suffix}"
  })
  
  depends_on = [
    aws_iam_role_policy.lambda_secondary,
    aws_cloudwatch_log_group.lambda_secondary
  ]
}

# Lambda code inline using archive_file
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"
  
  source {
    content  = <<-EOT
import json
import os
import boto3
import psycopg2
from botocore.exceptions import ClientError

def handler(event, context):
    """
    Health check Lambda function for RDS PostgreSQL
    """
    print("Starting database health check")
    
    # Get environment variables
    db_endpoint = os.environ.get('DB_ENDPOINT')
    secret_name = os.environ.get('SECRET_NAME')
    region = os.environ.get('REGION')
    
    if not all([db_endpoint, secret_name, region]):
        print("Missing required environment variables")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'unhealthy', 'error': 'Configuration error'})
        }
    
    # Initialize boto3 clients
    secrets_client = boto3.client('secretsmanager', region_name=region)
    
    try:
        # Retrieve database credentials from Secrets Manager
        print(f"Retrieving credentials from Secrets Manager: {secret_name}")
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Extract connection details
        db_host = db_endpoint.split(':')[0]
        db_port = 5432
        db_name = 'financedb'
        db_user = secret['username']
        db_password = secret['password']
        
        # Attempt database connection
        print(f"Attempting connection to {db_host}:{db_port}")
        connection = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            connect_timeout=5
        )
        
        # Execute a simple query to verify database is responsive
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        # Check replication lag if this is a read replica
        cursor.execute("""
            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int AS replication_lag
        """)
        lag_result = cursor.fetchone()
        replication_lag = lag_result[0] if lag_result and lag_result[0] is not None else 0
        
        cursor.close()
        connection.close()
        
        print(f"Health check successful. Replication lag: {replication_lag} seconds")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'endpoint': db_endpoint,
                'replication_lag': replication_lag
            })
        }
        
    except ClientError as e:
        print(f"Error retrieving secret: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'unhealthy', 'error': 'Secret retrieval failed'})
        }
    except psycopg2.Error as e:
        print(f"Database connection error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'unhealthy', 'error': 'Database connection failed'})
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'unhealthy', 'error': 'Unexpected error occurred'})
        }
EOT
    filename = "index.py"
  }
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# S3 Bucket - Primary
resource "aws_s3_bucket" "backup_primary" {
  provider = aws.us_east_1
  bucket   = "backup-primary-${local.resource_suffix}-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.primary_tags, {
    Name = "backup-primary-${local.resource_suffix}"
  })
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "backup_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.backup_primary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption - Primary
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.backup_primary.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block - Primary
resource "aws_s3_bucket_public_access_block" "backup_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.backup_primary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy - Primary
resource "aws_s3_bucket_lifecycle_configuration" "backup_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.backup_primary.id
  
  rule {
    id     = "archive-old-backups"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# S3 Bucket - Secondary
resource "aws_s3_bucket" "backup_secondary" {
  provider = aws.us_west_2
  bucket   = "backup-secondary-${local.resource_suffix}-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.secondary_tags, {
    Name = "backup-secondary-${local.resource_suffix}"
  })
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "backup_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.backup_secondary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption - Secondary
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.backup_secondary.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block - Secondary
resource "aws_s3_bucket_public_access_block" "backup_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.backup_secondary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy - Secondary
resource "aws_s3_bucket_lifecycle_configuration" "backup_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.backup_secondary.id
  
  rule {
    id     = "archive-old-backups"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "s3_replication" {
  provider = aws.us_east_1
  name     = "s3-replication-role-${local.resource_suffix}"
  
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
  
  tags = local.primary_tags
}

# IAM Policy for S3 Replication
resource "aws_iam_policy" "s3_replication" {
  provider = aws.us_east_1
  name     = "s3-replication-policy-${local.resource_suffix}"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.backup_primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.backup_primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.backup_secondary.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  provider   = aws.us_east_1
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "backup_replication" {
  provider = aws.us_east_1
  role     = aws_iam_role.s3_replication.arn
  bucket   = aws_s3_bucket.backup_primary.id
  
  rule {
    id     = "replicate-all"
    status = "Enabled"
    
    filter {}
    
    destination {
      bucket        = aws_s3_bucket.backup_secondary.arn
      storage_class = "STANDARD_IA"
    }
    
    delete_marker_replication {
      status = "Enabled"
    }
  }
  
  depends_on = [aws_s3_bucket_versioning.backup_primary]
}

# ============================================================================
# SNS TOPICS
# ============================================================================

# SNS Topic - Primary
resource "aws_sns_topic" "alerts_primary" {
  provider = aws.us_east_1
  name     = "dr-alerts-primary-${local.resource_suffix}"
  
  tags = merge(local.primary_tags, {
    Name = "sns-alerts-primary-${local.resource_suffix}"
  })
}

# SNS Topic Subscription Email - Primary
resource "aws_sns_topic_subscription" "email_primary" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.alerts_primary.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic Subscription SMS - Primary
resource "aws_sns_topic_subscription" "sms_primary" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.alerts_primary.arn
  protocol  = "sms"
  endpoint  = var.alert_phone
}

# SNS Topic - Secondary
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_2
  name     = "dr-alerts-secondary-${local.resource_suffix}"
  
  tags = merge(local.secondary_tags, {
    Name = "sns-alerts-secondary-${local.resource_suffix}"
  })
}

# SNS Topic Subscription Email - Secondary
resource "aws_sns_topic_subscription" "email_secondary" {
  provider  = aws.us_west_2
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic Subscription SMS - Secondary
resource "aws_sns_topic_subscription" "sms_secondary" {
  provider  = aws.us_west_2
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "sms"
  endpoint  = var.alert_phone
}

# ============================================================================
# RDS EVENT SUBSCRIPTIONS
# ============================================================================

# RDS Event Subscription - Primary
resource "aws_db_event_subscription" "primary" {
  provider    = aws.us_east_1
  name        = "rds-events-primary-${local.resource_suffix}"
  sns_topic   = aws_sns_topic.alerts_primary.arn
  
  source_type = "db-instance"
  source_ids  = [aws_db_instance.primary.identifier]
  
  event_categories = [
    "availability",
    "failure",
    "failover",
    "maintenance",
    "notification"
  ]
  
  tags = merge(local.primary_tags, {
    Name = "rds-events-primary-${local.resource_suffix}"
  })
}

# RDS Event Subscription - Secondary
resource "aws_db_event_subscription" "secondary" {
  provider    = aws.us_west_2
  name        = "rds-events-secondary-${local.resource_suffix}"
  sns_topic   = aws_sns_topic.alerts_secondary.arn
  
  source_type = "db-instance"
  source_ids  = [aws_db_instance.secondary.identifier]
  
  event_categories = [
    "availability",
    "failure",
    "failover",
    "maintenance",
    "notification"
  ]
  
  tags = merge(local.secondary_tags, {
    Name = "rds-events-secondary-${local.resource_suffix}"
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# CloudWatch Alarm for Replication Lag - Secondary
resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  provider            = aws.us_west_2
  alarm_name          = "rds-replication-lag-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "60"
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.identifier
  }
  
  tags = merge(local.secondary_tags, {
    Name = "alarm-replication-lag-${local.resource_suffix}"
  })
}

# CloudWatch Alarm for CPU Utilization - Primary
resource "aws_cloudwatch_metric_alarm" "cpu_primary" {
  provider            = aws.us_east_1
  alarm_name          = "rds-cpu-primary-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
  
  tags = merge(local.primary_tags, {
    Name = "alarm-cpu-primary-${local.resource_suffix}"
  })
}

# CloudWatch Alarm for CPU Utilization - Secondary
resource "aws_cloudwatch_metric_alarm" "cpu_secondary" {
  provider            = aws.us_west_2
  alarm_name          = "rds-cpu-secondary-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.identifier
  }
  
  tags = merge(local.secondary_tags, {
    Name = "alarm-cpu-secondary-${local.resource_suffix}"
  })
}

# ============================================================================
# ROUTE53 HEALTH CHECKS AND DNS
# ============================================================================

# Route53 Hosted Zone (assuming you have a domain)
resource "aws_route53_zone" "main" {
  provider = aws.us_east_1
  name     = "dr-finance-${local.resource_suffix}.internal"
  
  vpc {
    vpc_id     = aws_vpc.primary.id
    vpc_region = var.primary_region
  }
  
  vpc {
    vpc_id     = aws_vpc.secondary.id
    vpc_region = var.secondary_region
  }
  
  tags = merge(local.common_tags, {
    Name = "zone-dr-finance-${local.resource_suffix}"
  })
}

# Route53 Health Check for Primary
resource "aws_route53_health_check" "primary" {
  provider          = aws.us_east_1
  fqdn              = aws_db_instance.primary.address
  port              = 5432
  type              = "TCP"
  resource_path     = ""
  failure_threshold = "2"
  request_interval  = "30"
  
  tags = merge(local.primary_tags, {
    Name = "health-check-primary-${local.resource_suffix}"
  })
}

# Route53 Health Check for Secondary
resource "aws_route53_health_check" "secondary" {
  provider          = aws.us_east_1
  fqdn              = aws_db_instance.secondary.address
  port              = 5432
  type              = "TCP"
  resource_path     = ""
  failure_threshold = "2"
  request_interval  = "30"
  
  tags = merge(local.secondary_tags, {
    Name = "health-check-secondary-${local.resource_suffix}"
  })
}

# Route53 Record - Primary (Failover)
resource "aws_route53_record" "db_primary" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.dr-finance-${local.resource_suffix}.internal"
  type     = "CNAME"
  ttl      = 60
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  set_identifier  = "Primary"
  records         = [aws_db_instance.primary.address]
  health_check_id = aws_route53_health_check.primary.id
}

# Route53 Record - Secondary (Failover)
resource "aws_route53_record" "db_secondary" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.dr-finance-${local.resource_suffix}.internal"
  type     = "CNAME"
  ttl      = 60
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  set_identifier  = "Secondary"
  records         = [aws_db_instance.secondary.address]
  health_check_id = aws_route53_health_check.secondary.id
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_primary_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of primary public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of primary private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of secondary public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of secondary private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Database Outputs
output "rds_primary_endpoint" {
  description = "Primary RDS instance endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "rds_primary_address" {
  description = "Primary RDS instance address"
  value       = aws_db_instance.primary.address
}

output "rds_secondary_endpoint" {
  description = "Secondary RDS instance endpoint"
  value       = aws_db_instance.secondary.endpoint
}

output "rds_secondary_address" {
  description = "Secondary RDS instance address"
  value       = aws_db_instance.secondary.address
}

output "rds_primary_id" {
  description = "Primary RDS instance ID"
  value       = aws_db_instance.primary.id
}

output "rds_secondary_id" {
  description = "Secondary RDS instance ID"
  value       = aws_db_instance.secondary.id
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_failover_dns" {
  description = "Route53 failover DNS name"
  value       = "db.dr-finance-${local.resource_suffix}.internal"
}

output "route53_health_check_primary_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}

output "route53_health_check_secondary_id" {
  description = "Secondary health check ID"
  value       = aws_route53_health_check.secondary.id
}

# S3 Outputs
output "s3_bucket_primary_id" {
  description = "Primary S3 backup bucket ID"
  value       = aws_s3_bucket.backup_primary.id
}

output "s3_bucket_primary_arn" {
  description = "Primary S3 backup bucket ARN"
  value       = aws_s3_bucket.backup_primary.arn
}

output "s3_bucket_secondary_id" {
  description = "Secondary S3 backup bucket ID"
  value       = aws_s3_bucket.backup_secondary.id
}

output "s3_bucket_secondary_arn" {
  description = "Secondary S3 backup bucket ARN"
  value       = aws_s3_bucket.backup_secondary.arn
}

# Lambda Outputs
output "lambda_primary_arn" {
  description = "Primary Lambda function ARN"
  value       = aws_lambda_function.health_check_primary.arn
}

output "lambda_primary_name" {
  description = "Primary Lambda function name"
  value       = aws_lambda_function.health_check_primary.function_name
}

output "lambda_secondary_arn" {
  description = "Secondary Lambda function ARN"
  value       = aws_lambda_function.health_check_secondary.arn
}

output "lambda_secondary_name" {
  description = "Secondary Lambda function name"
  value       = aws_lambda_function.health_check_secondary.function_name
}

# SNS Outputs
output "sns_topic_primary_arn" {
  description = "Primary SNS topic ARN"
  value       = aws_sns_topic.alerts_primary.arn
}

output "sns_topic_secondary_arn" {
  description = "Secondary SNS topic ARN"
  value       = aws_sns_topic.alerts_secondary.arn
}

# Security Group Outputs
output "sg_rds_primary_id" {
  description = "Primary RDS security group ID"
  value       = aws_security_group.rds_primary.id
}

output "sg_rds_secondary_id" {
  description = "Secondary RDS security group ID"
  value       = aws_security_group.rds_secondary.id
}

output "sg_lambda_primary_id" {
  description = "Primary Lambda security group ID"
  value       = aws_security_group.lambda_primary.id
}

output "sg_lambda_secondary_id" {
  description = "Secondary Lambda security group ID"
  value       = aws_security_group.lambda_secondary.id
}

# NAT Gateway Outputs
output "nat_gateway_primary_ids" {
  description = "Primary NAT Gateway IDs"
  value       = aws_nat_gateway.primary[*].id
}

output "nat_gateway_secondary_ids" {
  description = "Secondary NAT Gateway IDs"
  value       = aws_nat_gateway.secondary[*].id
}

# Internet Gateway Outputs
output "igw_primary_id" {
  description = "Primary Internet Gateway ID"
  value       = aws_internet_gateway.primary.id
}

output "igw_secondary_id" {
  description = "Secondary Internet Gateway ID"
  value       = aws_internet_gateway.secondary.id
}

# CloudWatch Outputs
output "cloudwatch_alarm_replication_lag" {
  description = "CloudWatch alarm for replication lag"
  value       = aws_cloudwatch_metric_alarm.replication_lag.id
}

output "cloudwatch_alarm_cpu_primary" {
  description = "CloudWatch alarm for primary CPU"
  value       = aws_cloudwatch_metric_alarm.cpu_primary.id
}

output "cloudwatch_alarm_cpu_secondary" {
  description = "CloudWatch alarm for secondary CPU"
  value       = aws_cloudwatch_metric_alarm.cpu_secondary.id
}

# Secrets Manager Outputs
output "secrets_manager_primary_arn" {
  description = "Primary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_primary.arn
}

output "secrets_manager_secondary_arn" {
  description = "Secondary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_secondary.arn
}

# IAM Role Outputs
output "iam_role_lambda_primary_arn" {
  description = "Primary Lambda IAM role ARN"
  value       = aws_iam_role.lambda_primary.arn
}

output "iam_role_lambda_secondary_arn" {
  description = "Secondary Lambda IAM role ARN"
  value       = aws_iam_role.lambda_secondary.arn
}

output "iam_role_rds_monitoring_primary_arn" {
  description = "Primary RDS monitoring IAM role ARN"
  value       = aws_iam_role.rds_monitoring.arn
}

output "iam_role_rds_monitoring_secondary_arn" {
  description = "Secondary RDS monitoring IAM role ARN"
  value       = aws_iam_role.rds_monitoring_secondary.arn
}

output "iam_role_s3_replication_arn" {
  description = "S3 replication IAM role ARN"
  value       = aws_iam_role.s3_replication.arn
}

# RDS Event Subscription Outputs
output "rds_event_subscription_primary_id" {
  description = "Primary RDS event subscription ID"
  value       = aws_db_event_subscription.primary.id
}

output "rds_event_subscription_secondary_id" {
  description = "Secondary RDS event subscription ID"
  value       = aws_db_event_subscription.secondary.id
}

output "aws_primary_region"{
  description = "aws primary region"
  value       = var.primary_region
}                                                                                                                                                                                                                                                                       output "aws_secondary_region"{
  description = "aws seondary region"
  value       = var.secondary_region
} 
```
