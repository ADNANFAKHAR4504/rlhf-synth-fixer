```hcl

# ===================================================================
# VARIABLES - Input parameters for the stack
# ===================================================================

variable "primary_region" {
  description = "Primary AWS region for the main RDS instance"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

variable "db_instance_class" {
  description = "RDS instance class for the database"
  type        = string
  default     = "db.r7g.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 400
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 1000
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "tradingdb"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "02:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:06:00"
}

# ===================================================================
# LOCALS - Computed values and naming conventions
# ===================================================================

locals {
  suffix = "rdha"

  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "HighFrequencyTrading"
    Suffix      = local.suffix
  }

  # VPC configurations
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Availability zones for each region
  primary_azs   = ["${var.primary_region}a", "${var.primary_region}b"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}b"]

  # Resource naming
  primary_prefix   = "primary-${local.suffix}"
  secondary_prefix = "dr-${local.suffix}"
}

# ===================================================================
# RANDOM PASSWORD GENERATION
# ===================================================================

resource "random_password" "db_master_password" {
  length  = 16
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# ===================================================================
# DATA SOURCES
# ===================================================================

# Get current AWS account ID
data "aws_caller_identity" "current" {
  provider = aws.us_east_1
}

# Get AMI for NAT instances if needed
data "aws_ami" "amazon_linux_2" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_2_secondary" {
  provider    = aws.us_west_2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# ===================================================================
# PRIMARY REGION VPC RESOURCES (us-east-1)
# ===================================================================

# Primary VPC
resource "aws_vpc" "primary_vpc" {
  provider             = aws.us_east_1
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-vpc"
    Region = var.primary_region
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  count                   = 2
  vpc_id                  = aws_vpc.primary_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  count             = 2
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = "10.0.${count.index + 3}.0/24"
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary_igw" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-igw"
  })
}

# Primary Elastic IPs for NAT Gateway
resource "aws_eip" "primary_nat_eip" {
  provider = aws.us_east_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.primary_igw]
}

# Primary NAT Gateway
resource "aws_nat_gateway" "primary_nat" {
  provider      = aws.us_east_1
  allocation_id = aws_eip.primary_nat_eip.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-gateway"
  })

  depends_on = [aws_internet_gateway.primary_igw]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-rt"
  })
}

# Primary Private Route Table
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_nat.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-rt"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# ===================================================================
# SECONDARY REGION VPC RESOURCES (us-west-2)
# ===================================================================

# Secondary VPC
resource "aws_vpc" "secondary_vpc" {
  provider             = aws.us_west_2
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-vpc"
    Region = var.secondary_region
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  count                   = 2
  vpc_id                  = aws_vpc.secondary_vpc.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  count             = 2
  vpc_id            = aws_vpc.secondary_vpc.id
  cidr_block        = "10.1.${count.index + 3}.0/24"
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary_igw" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-igw"
  })
}

# Secondary Elastic IP for NAT Gateway
resource "aws_eip" "secondary_nat_eip" {
  provider = aws.us_west_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.secondary_igw]
}

# Secondary NAT Gateway
resource "aws_nat_gateway" "secondary_nat" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.secondary_nat_eip.id
  subnet_id     = aws_subnet.secondary_public[0].id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-gateway"
  })

  depends_on = [aws_internet_gateway.secondary_igw]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-rt"
  })
}

# Secondary Private Route Table
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_nat.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-rt"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

# ===================================================================
# VPC PEERING CONNECTION
# ===================================================================

# VPC Peering Connection Request (from primary region)
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.us_east_1
  vpc_id      = aws_vpc.primary_vpc.id
  peer_vpc_id = aws_vpc.secondary_vpc.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-to-${local.secondary_prefix}-peering"
  })
}

# VPC Peering Connection Accepter (in secondary region)
resource "aws_vpc_peering_connection_accepter" "secondary_accepter" {
  provider                  = aws.us_west_2
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-peering-accepter"
  })
}

# Routes for VPC Peering - Primary to Secondary
resource "aws_route" "primary_to_secondary_private" {
  provider                  = aws.us_east_1
  route_table_id            = aws_route_table.primary_private.id
  destination_cidr_block    = local.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id

  depends_on = [aws_vpc_peering_connection_accepter.secondary_accepter]
}

# Routes for VPC Peering - Secondary to Primary
resource "aws_route" "secondary_to_primary_private" {
  provider                  = aws.us_west_2
  route_table_id            = aws_route_table.secondary_private.id
  destination_cidr_block    = local.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id

  depends_on = [aws_vpc_peering_connection_accepter.secondary_accepter]
}

# ===================================================================
# SECURITY GROUPS
# ===================================================================

# Primary RDS Security Group
resource "aws_security_group" "primary_rds_sg" {
  provider    = aws.us_east_1
  name        = "${local.primary_prefix}-rds-sg"
  description = "Security group for primary RDS PostgreSQL instance"
  vpc_id      = aws_vpc.primary_vpc.id

  # Allow PostgreSQL traffic from within VPC
  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.primary_vpc_cidr]
  }

  # Allow PostgreSQL traffic from peered VPC
  ingress {
    description = "PostgreSQL from DR region"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.secondary_vpc_cidr]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-sg"
  })
}

# Secondary RDS Security Group
resource "aws_security_group" "secondary_rds_sg" {
  provider    = aws.us_west_2
  name        = "${local.secondary_prefix}-rds-sg"
  description = "Security group for secondary RDS PostgreSQL instance"
  vpc_id      = aws_vpc.secondary_vpc.id

  # Allow PostgreSQL traffic from within VPC
  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.secondary_vpc_cidr]
  }

  # Allow PostgreSQL traffic from peered VPC
  ingress {
    description = "PostgreSQL from primary region"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.primary_vpc_cidr]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-sg"
  })
}

# ===================================================================
# KMS KEYS FOR ENCRYPTION
# ===================================================================

# Primary Region KMS Key
resource "aws_kms_key" "primary_rds_key" {
  provider                = aws.us_east_1
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-kms-key"
  })
}

# Primary Region KMS Key Alias
resource "aws_kms_alias" "primary_rds_key_alias" {
  provider      = aws.us_east_1
  name          = "alias/${local.primary_prefix}-rds-key"
  target_key_id = aws_kms_key.primary_rds_key.key_id
}

# Secondary Region KMS Key
resource "aws_kms_key" "secondary_rds_key" {
  provider                = aws.us_west_2
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-kms-key"
  })
}

# Secondary Region KMS Key Alias
resource "aws_kms_alias" "secondary_rds_key_alias" {
  provider      = aws.us_west_2
  name          = "alias/${local.secondary_prefix}-rds-key"
  target_key_id = aws_kms_key.secondary_rds_key.key_id
}

# ===================================================================
# RDS SUBNET GROUPS
# ===================================================================

# Primary DB Subnet Group
resource "aws_db_subnet_group" "primary_db_subnet_group" {
  provider    = aws.us_east_1
  name        = "${local.primary_prefix}-db-subnet-group"
  description = "Database subnet group for primary RDS instance"
  subnet_ids  = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-db-subnet-group"
  })
}

# Secondary DB Subnet Group
resource "aws_db_subnet_group" "secondary_db_subnet_group" {
  provider    = aws.us_west_2
  name        = "${local.secondary_prefix}-db-subnet-group"
  description = "Database subnet group for secondary RDS instance"
  subnet_ids  = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-db-subnet-group"
  })
}


# ===================================================================
# PRIMARY RDS INSTANCE (Multi-AZ)
# ===================================================================

resource "aws_db_instance" "primary_rds" {
  provider = aws.us_east_1

  # Basic configuration
  identifier     = "${local.primary_prefix}-postgres-db"
  engine         = "postgres"
  engine_version = "17.4"
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.primary_rds_key.arn

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_master_password.result
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.primary_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.primary_rds_sg.id]
  publicly_accessible    = false

  # High availability configuration
  multi_az          = true
  availability_zone = null # Let AWS choose for Multi-AZ


  # Backup configuration
  backup_retention_period   = var.backup_retention_period
  backup_window             = var.backup_window
  maintenance_window        = var.maintenance_window
  copy_tags_to_snapshot     = true
  delete_automated_backups  = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.primary_prefix}-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring configuration
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Other configurations
  auto_minor_version_upgrade  = true
  deletion_protection         = true
  allow_major_version_upgrade = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-postgres-db"
    Type   = "Primary"
    Region = var.primary_region
  })

  depends_on = [
    aws_cloudwatch_log_group.primary_rds_logs
  ]
}

# ===================================================================
# PRIMARY REGION READ REPLICAS
# ===================================================================

# Read Replica 1 (AZ 1)
resource "aws_db_instance" "primary_read_replica_1" {
  provider = aws.us_east_1

  identifier          = "${local.primary_prefix}-postgres-read-1"
  replicate_source_db = aws_db_instance.primary_rds.identifier
  instance_class      = var.db_instance_class

  # Storage configuration (inherited from source)
  storage_encrypted = true
  kms_key_id        = aws_kms_key.primary_rds_key.arn

  # Network configuration
  publicly_accessible = false
  availability_zone   = local.primary_azs[0]


  # Monitoring configuration
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Other configurations
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true
  deletion_protection        = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-postgres-read-1"
    Type   = "Read-Replica"
    AZ     = local.primary_azs[0]
    Region = var.primary_region
  })
}

# Read Replica 2 (AZ 2)
resource "aws_db_instance" "primary_read_replica_2" {
  provider = aws.us_east_1

  identifier          = "${local.primary_prefix}-postgres-read-2"
  replicate_source_db = aws_db_instance.primary_rds.identifier
  instance_class      = var.db_instance_class

  # Storage configuration (inherited from source)
  storage_encrypted = true
  kms_key_id        = aws_kms_key.primary_rds_key.arn

  # Network configuration
  publicly_accessible = false
  availability_zone   = local.primary_azs[1]


  # Monitoring configuration
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Other configurations
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true
  deletion_protection        = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-postgres-read-2"
    Type   = "Read-Replica"
    AZ     = local.primary_azs[1]
    Region = var.primary_region
  })
}

# ===================================================================
# CROSS-REGION READ REPLICA (Disaster Recovery)
# ===================================================================

resource "aws_db_instance" "cross_region_replica" {
  provider = aws.us_west_2

  identifier          = "${local.secondary_prefix}-postgres-replica"
  replicate_source_db = aws_db_instance.primary_rds.arn
  instance_class      = var.db_instance_class

  # Storage configuration
  storage_encrypted = true
  kms_key_id        = aws_kms_key.secondary_rds_key.arn

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.secondary_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.secondary_rds_sg.id]
  publicly_accessible    = false


  # Backup configuration for DR
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window

  # Monitoring configuration
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring_secondary.arn
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Other configurations
  auto_minor_version_upgrade = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${local.secondary_prefix}-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  deletion_protection        = true

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-postgres-replica"
    Type   = "Cross-Region-Replica"
    Region = var.secondary_region
    Role   = "Disaster-Recovery"
  })

  depends_on = [
    aws_cloudwatch_log_group.secondary_rds_logs
  ]
}

# ===================================================================
# IAM ROLES FOR ENHANCED MONITORING
# ===================================================================

# IAM Role for RDS Enhanced Monitoring (Primary Region)
resource "aws_iam_role" "rds_enhanced_monitoring" {
  provider = aws.us_east_1
  name     = "${local.primary_prefix}-rds-monitoring-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-monitoring-role"
  })
}

# Attach AWS managed policy for enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  provider   = aws.us_east_1
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for RDS Enhanced Monitoring (Secondary Region)
resource "aws_iam_role" "rds_enhanced_monitoring_secondary" {
  provider = aws.us_west_2
  name     = "${local.secondary_prefix}-rds-monitoring-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-monitoring-role"
  })
}

# Attach AWS managed policy for enhanced monitoring (Secondary)
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring_secondary" {
  provider   = aws.us_west_2
  role       = aws_iam_role.rds_enhanced_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ===================================================================
# CLOUDWATCH LOG GROUPS
# ===================================================================

# Primary RDS CloudWatch Log Group
resource "aws_cloudwatch_log_group" "primary_rds_logs" {
  provider          = aws.us_east_1
  name              = "/aws/rds/instance/${local.primary_prefix}-postgres-db/postgresql"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-logs"
  })
}

# Secondary RDS CloudWatch Log Group
resource "aws_cloudwatch_log_group" "secondary_rds_logs" {
  provider          = aws.us_west_2
  name              = "/aws/rds/instance/${local.secondary_prefix}-postgres-replica/postgresql"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-logs"
  })
}

# ===================================================================
# CLOUDWATCH ALARMS - PRIMARY REGION
# ===================================================================

# CPU Utilization Alarm - Primary
resource "aws_cloudwatch_metric_alarm" "primary_cpu_utilization" {
  provider            = aws.us_east_1
  alarm_name          = "${local.primary_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_rds.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-cpu-alarm"
  })
}

# Database Connections Alarm - Primary
resource "aws_cloudwatch_metric_alarm" "primary_db_connections" {
  provider            = aws.us_east_1
  alarm_name          = "${local.primary_prefix}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "400"
  alarm_description   = "This metric monitors database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_rds.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-connections-alarm"
  })
}

# Read Replica Lag Alarm - Read Replica 1
resource "aws_cloudwatch_metric_alarm" "primary_replica_lag_1" {
  provider            = aws.us_east_1
  alarm_name          = "${local.primary_prefix}-read-replica-1-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors read replica lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_read_replica_1.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-replica-lag-alarm-1"
  })
}

# Read Replica Lag Alarm - Read Replica 2
resource "aws_cloudwatch_metric_alarm" "primary_replica_lag_2" {
  provider            = aws.us_east_1
  alarm_name          = "${local.primary_prefix}-read-replica-2-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors read replica lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_read_replica_2.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-replica-lag-alarm-2"
  })
}

# Storage Space Alarm - Primary
resource "aws_cloudwatch_metric_alarm" "primary_storage_space" {
  provider            = aws.us_east_1
  alarm_name          = "${local.primary_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB in bytes
  alarm_description   = "This metric monitors available storage space"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_rds.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-storage-alarm"
  })
}

# ===================================================================
# CLOUDWATCH ALARMS - SECONDARY REGION
# ===================================================================

# Cross-Region Replica Lag Alarm
resource "aws_cloudwatch_metric_alarm" "cross_region_replica_lag" {
  provider            = aws.us_west_2
  alarm_name          = "${local.secondary_prefix}-cross-region-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "60"
  alarm_description   = "This metric monitors cross-region replica lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.cross_region_replica.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-replica-lag-alarm"
  })
}

# CPU Utilization Alarm - Secondary
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_utilization" {
  provider            = aws.us_west_2
  alarm_name          = "${local.secondary_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization for DR replica"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.cross_region_replica.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-cpu-alarm"
  })
}

# ===================================================================
# SECRETS MANAGER FOR DATABASE PASSWORD
# ===================================================================

# Store database password in Secrets Manager (Primary Region)
resource "aws_secretsmanager_secret" "db_master_password" {
  provider    = aws.us_east_1
  name        = "${local.primary_prefix}-db-master-password"
  description = "Master password for RDS PostgreSQL database"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-db-master-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  provider  = aws.us_east_1
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_master_password.result
    engine   = "postgres"
    host     = aws_db_instance.primary_rds.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# Replicate secret to secondary region for DR
resource "aws_secretsmanager_secret" "db_master_password_secondary" {
  provider    = aws.us_west_2
  name        = "${local.secondary_prefix}-db-master-password"
  description = "Master password for RDS PostgreSQL database (DR copy)"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-db-master-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_master_password_secondary" {
  provider  = aws.us_west_2
  secret_id = aws_secretsmanager_secret.db_master_password_secondary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_master_password.result
    engine   = "postgres"
    host     = aws_db_instance.cross_region_replica.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# ===================================================================
# OUTPUTS
# ===================================================================

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary_vpc.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary_vpc.cidr_block
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary_vpc.id
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary_vpc.cidr_block
}

output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

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

output "primary_rds_instance_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary_rds.id
}

output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_rds_reader_endpoint" {
  description = "Reader endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_read_replica_1_endpoint" {
  description = "Endpoint of primary read replica 1"
  value       = aws_db_instance.primary_read_replica_1.endpoint
}

output "primary_read_replica_2_endpoint" {
  description = "Endpoint of primary read replica 2"
  value       = aws_db_instance.primary_read_replica_2.endpoint
}

output "cross_region_replica_endpoint" {
  description = "Endpoint of cross-region read replica"
  value       = aws_db_instance.cross_region_replica.endpoint
}

output "primary_rds_security_group_id" {
  description = "Security group ID for primary RDS instance"
  value       = aws_security_group.primary_rds_sg.id
}

output "secondary_rds_security_group_id" {
  description = "Security group ID for secondary RDS instance"
  value       = aws_security_group.secondary_rds_sg.id
}

output "primary_kms_key_id" {
  description = "KMS key ID for primary region encryption"
  value       = aws_kms_key.primary_rds_key.id
}

output "secondary_kms_key_id" {
  description = "KMS key ID for secondary region encryption"
  value       = aws_kms_key.secondary_rds_key.id
}

output "primary_db_subnet_group_name" {
  description = "Name of primary DB subnet group"
  value       = aws_db_subnet_group.primary_db_subnet_group.name
}

output "secondary_db_subnet_group_name" {
  description = "Name of secondary DB subnet group"
  value       = aws_db_subnet_group.secondary_db_subnet_group.name
}

output "primary_nat_gateway_id" {
  description = "ID of primary NAT Gateway"
  value       = aws_nat_gateway.primary_nat.id
}

output "secondary_nat_gateway_id" {
  description = "ID of secondary NAT Gateway"
  value       = aws_nat_gateway.secondary_nat.id
}

output "primary_internet_gateway_id" {
  description = "ID of primary Internet Gateway"
  value       = aws_internet_gateway.primary_igw.id
}

output "secondary_internet_gateway_id" {
  description = "ID of secondary Internet Gateway"
  value       = aws_internet_gateway.secondary_igw.id
}

output "primary_cloudwatch_log_group" {
  description = "CloudWatch log group for primary RDS"
  value       = aws_cloudwatch_log_group.primary_rds_logs.name
}

output "secondary_cloudwatch_log_group" {
  description = "CloudWatch log group for secondary RDS"
  value       = aws_cloudwatch_log_group.secondary_rds_logs.name
}

output "primary_secret_arn" {
  description = "ARN of the primary database password secret"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "secondary_secret_arn" {
  description = "ARN of the secondary database password secret"
  value       = aws_secretsmanager_secret.db_master_password_secondary.arn
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = var.db_name
}

output "rds_master_username" {
  description = "Master username for RDS database"
  value       = var.db_username
}

output "primary_monitoring_role_arn" {
  description = "ARN of primary RDS enhanced monitoring role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

output "secondary_monitoring_role_arn" {
  description = "ARN of secondary RDS enhanced monitoring role"
  value       = aws_iam_role.rds_enhanced_monitoring_secondary.arn
}

output "deployment_timestamp" {
  description = "Timestamp of the deployment"
  value       = timestamp()
}

output "terraform_workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "aws_primary_region" {
  description = "aws primary region"
  value       = var.primary_region
}

output "aws_secondary_region" {
  description = "aws secondary region"
  value       = var.secondary_region
}

```

```

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
  alias  = "us_east_1"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.secondary_region
}

```
