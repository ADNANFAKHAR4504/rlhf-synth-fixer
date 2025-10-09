### Reasoning Trace
---

Let's break down this complex task step-by-step:

1. We need to create a complete, deployable Terraform script in a single file (`tap_stack.tf`) for a cross-region disaster recovery (DR) solution for a financial trading platform.

2. The infrastructure spans two regions: Primary (us-east-1) and Secondary/DR (us-west-2).

3. Main components include:
   - Multi-region networking (VPCs, subnets, etc.)
   - Aurora PostgreSQL Global Database
   - ECS Fargate clusters
   - Application Load Balancers
   - DynamoDB Global Tables
   - Route 53 for DNS failover
   - CloudWatch, alarms, and Lambda automation
   - IAM and security configurations
   - Blue/Green deployment support

4. The solution needs to achieve RTO < 15 minutes and RPO < 1 minute with automated failover and no manual intervention.

Let's start building this Terraform script:

1. First, I'll define the variables
2. Then set up the multi-region providers
3. Create networking infrastructure in both regions
4. Set up the database layer
5. Configure ECS clusters and services
6. Set up load balancers
7. Implement DynamoDB global tables
8. Configure Route 53 for failover
9. Set up monitoring, alarms, and automation
10. Define IAM roles and security configurations
11. Add outputs

Let's get started:

```hcl
# tap_stack.tf

# ------------------------------------------------------------
# VARIABLES
# ------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for provider configuration (defined in provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary (DR) AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPCs in both regions"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Map of availability zones per region"
  type        = map(list(string))
  default = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "trading-platform"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Financial-Trading-Team"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Trading-DR-Platform"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = "ChangeMe!123456" # Should be replaced with SecureString from Parameter Store or Secrets Manager
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.r5.large"
}

variable "db_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "13.4"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "trading-platform.example.com"
}

variable "container_image" {
  description = "Container image for the trading platform"
  type        = string
  default     = "012345678901.dkr.ecr.us-east-1.amazonaws.com/trading-platform:latest"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8080
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = number
  default     = 1024 # 1 vCPU
}

variable "container_memory" {
  description = "Memory for the container"
  type        = number
  default     = 2048 # 2 GB
}

variable "task_desired_count" {
  description = "Desired count of tasks"
  type        = number
  default     = 3
}

# ------------------------------------------------------------
# PROVIDERS (Additional to provider.tf)
# ------------------------------------------------------------

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

# ------------------------------------------------------------
# KMS KEYS
# ------------------------------------------------------------

resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for encrypting resources in the primary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.app_name}-primary-kms-key"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.app_name}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for encrypting resources in the secondary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.app_name}-secondary-kms-key"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.app_name}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# ------------------------------------------------------------
# NETWORKING - PRIMARY REGION
# ------------------------------------------------------------

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "${var.app_name}-primary-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = length(var.availability_zones["us-east-1"])
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones["us-east-1"][count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.app_name}-primary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = length(var.availability_zones["us-east-1"])
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones["us-east-1"]))
  availability_zone = var.availability_zones["us-east-1"][count.index]
  
  tags = {
    Name        = "${var.app_name}-primary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_db" {
  provider          = aws.primary
  count             = length(var.availability_zones["us-east-1"])
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.availability_zones["us-east-1"]))
  availability_zone = var.availability_zones["us-east-1"][count.index]
  
  tags = {
    Name        = "${var.app_name}-primary-db-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = {
    Name        = "${var.app_name}-primary-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = {
    Name        = "${var.app_name}-primary-public-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain   = "vpc"
  
  tags = {
    Name        = "${var.app_name}-primary-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id
  
  tags = {
    Name        = "${var.app_name}-primary-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }
  
  tags = {
    Name        = "${var.app_name}-primary-private-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_db" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_db[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# ------------------------------------------------------------
# NETWORKING - SECONDARY REGION
# ------------------------------------------------------------

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "${var.app_name}-secondary-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = length(var.availability_zones["us-west-2"])
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones["us-west-2"][count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.app_name}-secondary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = length(var.availability_zones["us-west-2"])
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones["us-west-2"]))
  availability_zone = var.availability_zones["us-west-2"][count.index]
  
  tags = {
    Name        = "${var.app_name}-secondary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_db" {
  provider          = aws.secondary
  count             = length(var.availability_zones["us-west-2"])
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.availability_zones["us-west-2"]))
  availability_zone = var.availability_zones["us-west-2"][count.index]
  
  tags = {
    Name        = "${var.app_name}-secondary-db-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = {
    Name        = "${var.app_name}-secondary-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-public-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  domain   = "vpc"
  
  tags = {
    Name        = "${var.app_name}-secondary-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public[0].id
  
  tags = {
    Name        = "${var.app_name}-secondary-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-private-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

resource "aws_route_table_association" "secondary_db" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_db[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

# ------------------------------------------------------------
# VPC PEERING
# ------------------------------------------------------------

resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider      = aws.primary
  vpc_id        = aws_vpc.primary.id
  peer_vpc_id   = aws_vpc.secondary.id
  peer_region   = var.secondary_region
  auto_accept   = false
  
  tags = {
    Name        = "${var.app_name}-primary-to-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary_accepter" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true
  
  tags = {
    Name        = "${var.app_name}-secondary-accepter"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route" "primary_to_secondary" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary_private.id
  destination_cidr_block    = aws_vpc.secondary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "primary_public_to_secondary" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary_public.id
  destination_cidr_block    = aws_vpc.secondary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_to_primary" {
  provider                  = aws.secondary
  route_table_id            = aws_route_table.secondary_private.id
  destination_cidr_block    = aws_vpc.primary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_public_to_primary" {
  provider                  = aws.secondary
  route_table_id            = aws_route_table.secondary_public.id
  destination_cidr_block    = aws_vpc.primary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# ------------------------------------------------------------
# SECURITY GROUPS
# ------------------------------------------------------------

# Primary Region Security Groups
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-alb-sg"
  description = "Security group for primary ALB"
  vpc_id      = aws_vpc.primary.id
  
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
  
  tags = {
    Name        = "${var.app_name}-primary-alb-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "primary_ecs" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-ecs-sg"
  description = "Security group for primary ECS tasks"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.app_name}-primary-ecs-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "primary_db" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-db-sg"
  description = "Security group for primary database"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ecs.id]
  }
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ecs.id]
    description     = "Allow traffic from secondary region ECS tasks"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.app_name}-primary-db-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Secondary Region Security Groups
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-alb-sg"
  description = "Security group for secondary ALB"
  vpc_id      = aws_vpc.secondary.id
  
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
  
  tags = {
    Name        = "${var.app_name}-secondary-alb-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "secondary_ecs" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-ecs-sg"
  description = "Security group for secondary ECS tasks"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-ecs-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "secondary_db" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-db-sg"
  description = "Security group for secondary database"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ecs.id]
  }
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ecs.id]
    description     = "Allow traffic from primary region ECS tasks"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-db-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ------------------------------------------------------------
# DB SUBNET GROUPS
# ------------------------------------------------------------

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.app_name}-primary-db-subnet-group"
  subnet_ids = aws_subnet.primary_db[*].id
  
  tags = {
    Name        = "${var.app_name}-primary-db-subnet-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.app_name}-secondary-db-subnet-group"
  subnet_ids = aws_subnet.secondary_db[*].id
  
  tags = {
    Name        = "${var.app_name}-secondary-db-subnet-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ------------------------------------------------------------
# AURORA GLOBAL DATABASE
# ------------------------------------------------------------

resource "aws_rds_global_cluster" "trading_platform" {
  provider                  = aws.primary
  global_cluster_identifier = "${var.app_name}-global-db"
  engine                    = "aurora-postgresql"
  engine_version            = var.db_engine_version
  database_name             = "trading"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  provider                  = aws.primary
  cluster_identifier        = "${var.app_name}-primary-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = var.db_engine_version
  global_cluster_identifier = aws_rds_global_cluster.trading_platform.id
  database_name             = "trading"
  master_username           = var.db_username
  master_password           = var.db_password
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.primary_db.id]
  backup_retention_period   = 7
  preferred_backup_window   = "07:00-09:00"
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-primary-final-snapshot"
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.primary.arn
  
  tags = {
    Name        = "${var.app_name}-primary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster_instance" "primary" {
  provider               = aws.primary
  count                  = 2
  identifier             = "${var.app_name}-primary-instance-${count.index}"
  cluster_identifier     = aws_rds_cluster.primary.id
  instance_class         = var.db_instance_class
  engine                 = "aurora-postgresql"
  engine_version         = var.db_engine_version
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  tags = {
    Name        = "${var.app_name}-primary-instance-${count.index}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "${var.app_name}-secondary-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = var.db_engine_version
  global_cluster_identifier = aws_rds_global_cluster.trading_platform.id
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [aws_security_group.secondary_db.id]
  backup_retention_period   = 7
  preferred_backup_window   = "07:00-09:00"
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-secondary-final-snapshot"
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.secondary.arn
  source_region             = var.primary_region
  
  # No master credentials for secondary clusters
  # These come from the primary cluster
  
  depends_on = [aws_rds_cluster_instance.primary]
  
  tags = {
    Name        = "${var.app_name}-secondary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster_instance" "secondary" {
  provider             = aws.secondary
  count                = 2
  identifier           = "${var.app_name}-secondary-instance-${count.index}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = var.db_instance_class
  engine               = "aurora-postgresql"
  engine_version       = var.db_engine_version
  db_subnet_group_name = aws_db_subnet_group.secondary.name
  
  tags = {
    Name        = "${var.app_name}-secondary-instance-${count.index}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ------------------------------------------------------------
# DYNAMODB GLOBAL TABLE
# ------------------------------------------------------------

resource "aws_dynamodb_table" "primary" {
  provider         = aws.primary
  name             = "${var.app_name}-session-state"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "session_id"
    type = "S"
  }
  
  replica {
    region_name = var.secondary_region
    kms_key_arn = aws_kms_key.secondary.arn
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name        = "${var.app_name}-session-state"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ------------------------------------------------------------
# APPLICATION LOAD BALANCERS
# ------------------------------------------------------------

# Primary ALB
resource "aws_lb" "primary" {
  provider                   = aws.primary
  name                       = "${var.app_name}-primary-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.primary_alb.id]
  subnets                    = aws_subnet.primary_public[*].id
  enable_deletion_protection = true
  drop_invalid_header_fields = true
  
  tags = {
    Name        = "${var.app_name}-primary-alb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "primary_blue" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-tg-blue"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "${var.app_name}-primary-tg-blue"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "primary_green" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-tg-green"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "${var.app_name}-primary-tg-green"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_acm_certificate" "primary" {
  provider          = aws.primary
  domain_name       = "primary.${var.domain_name}"
  validation_method = "DNS"
  
  tags = {
    Name        = "${var.app_name}-primary-cert"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "primary_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "primary_https" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.primary.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# Secondary ALB
resource "aws_lb" "secondary" {
  provider                   = aws.secondary
  name                       = "${var.app_name}-secondary-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.secondary_alb.id]
  subnets                    = aws_subnet.secondary_public[*].id
  enable_deletion_protection = true
  drop_invalid_header_fields = true
  
  tags = {
    Name        = "${var.app_name}-secondary-alb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "secondary_blue" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-tg-blue"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-tg-blue"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "secondary_green" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-tg-green"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-tg-green"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_acm_certificate" "secondary" {
  provider          = aws.secondary
  domain_name       = "secondary.${var.domain_name}"
  validation_method = "DNS"
  
  tags = {
    Name        = "${var.app_name}-secondary-cert"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "secondary_http" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "secondary_https" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.secondary.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# ------------------------------------------------------------
# ECS CLUSTERS
# ------------------------------------------------------------

# Primary ECS Cluster
resource "aws_ecs_cluster" "primary" {
  provider = aws.primary
  name     = "${var.app_name}-primary-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name        = "${var.app_name}-primary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_cluster_capacity_providers" "primary" {
  provider       = aws.primary
  cluster_name   = aws_ecs_cluster.primary.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# Secondary ECS Cluster
resource "aws_ecs_cluster" "secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-secondary-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_cluster_capacity_providers" "secondary" {
  provider       = aws.secondary
  cluster_name   = aws_ecs_cluster.secondary.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ------------------------------------------------------------
# IAM ROLES
# ------------------------------------------------------------

resource "aws_iam_role" "ecs_task_execution_role" {
  provider = aws.primary
  name     = "${var.app_name}-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.app_name}-task-execution-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  provider = aws.primary
  name     = "${var.app_name}-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.app_name}-task-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "task_policy" {
  provider    = aws.primary
  name        = "${var.app_name}-task-policy"
  description = "Policy for ECS tasks to access required AWS services"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.primary.arn,
          "${aws_dynamodb_table.primary.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          aws_kms_key.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.app_name}-task-policy"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.task_policy.arn
}

resource "aws_iam_role" "codedeploy_role" {
  provider = aws.primary
  name     = "${var.app_name}-codedeploy-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.app_name}-codedeploy-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "codedeploy_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.codedeploy_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

# ------------------------------------------------------------
# ECS TASK DEFINITIONS AND SERVICES
# ------------------------------------------------------------

resource "aws_ecs_task_definition" "primary" {
  provider                 = aws.primary
  family                   = "${var.app_name}-primary-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "${var.app_name}-primary-container"
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "REGION",
          value = var.primary_region
        },
        {
          name  = "DB_ENDPOINT",
          value = aws_rds_cluster.primary.endpoint
        },
        {
          name  = "DB_NAME",
          value = "trading"
        },
        {
          name  = "DB_USER",
          value = var.db_username
        },
        {
          name  = "DYNAMODB_TABLE",
          value = aws_dynamodb_table.primary.name
        },
        {
          name  = "PRIMARY_REGION",
          value = var.primary_region
        },
        {
          name  = "SECONDARY_REGION",
          value = var.secondary_region
        }
      ]
      
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "arn:aws:ssm:${var.primary_region}:${data.aws_caller_identity.current.account_id}:parameter/trading/db/password"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}-primary"
          "awslogs-region"        = var.primary_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = {
    Name        = "${var.app_name}-primary-task"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

data "aws_caller_identity" "current" {}

resource "aws_ecs_service" "primary" {
  provider                  = aws.primary
  name                      = "${var.app_name}-primary-service"
  cluster                   = aws_ecs_cluster.primary.id
  task_definition           = aws_ecs_task_definition.primary.arn
  desired_count             = var.task_desired_count
  launch_type               = "FARGATE"
  health_check_grace_period_seconds = 120
  
  network_configuration {
    subnets          = aws_subnet.primary_private[*].id
    security_groups  = [aws_security_group.primary_ecs.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.primary_blue.arn
    container_name   = "${var.app_name}-primary-container"
    container_port   = var.container_port
  }
  
  deployment_controller {
    type = "CODE_DEPLOY"
  }
  
  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer
    ]
  }
  
  tags = {
    Name        = "${var.app_name}-primary-service"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  depends_on = [aws_lb_listener.primary_https]
}

resource "aws_ecs_task_definition" "secondary" {
  provider                 = aws.secondary
  family                   = "${var.app_name}-secondary-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "${var.app_name}-secondary-container"
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "REGION",
          value = var.secondary_region
        },
        {
          name  = "DB_ENDPOINT",
          value = aws_rds_cluster.secondary.endpoint
        },
        {
          name  = "DB_NAME",
          value = "trading"
        },
        {
          name  = "DB_USER",
          value = var.db_username
        },
        {
          name  = "DYNAMODB_TABLE",
          value = aws_dynamodb_table.primary.name
        },
        {
          name  = "PRIMARY_REGION",
          value = var.primary_region
        },
        {
          name  = "SECONDARY_REGION",
          value = var.secondary_region
        },
        {
          name  = "IS_DR_REGION",
          value = "true"
        }
      ]
      
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "arn:aws:ssm:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:parameter/trading/db/password"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}-secondary"
          "awslogs-region"        = var.secondary_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = {
    Name        = "${var.app_name}-secondary-task"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_service" "secondary" {
  provider                  = aws.secondary
  name                      = "${var.app_name}-secondary-service"
  cluster                   = aws_ecs_cluster.secondary.id
  task_definition           = aws_ecs_task_definition.secondary.arn
  desired_count             = var.task_desired_count
  launch_type               = "FARGATE"
  health_check_grace_period_seconds = 120
  
  network_configuration {
    subnets          = aws_subnet.secondary_private[*].id
    security_groups  = [aws_security_group.secondary_ecs.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.secondary_blue.arn
    container_name   = "${var.app_name}-secondary-container"
    container_port   = var.container_port
  }
  
  deployment_controller {
    type = "CODE_DEPLOY"
  }
  
  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer
    ]
  }
  
  tags = {
    Name        = "${var.app_name}-secondary-service"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  depends_on = [aws_lb_listener.secondary_https]
}

# ------------------------------------------------------------
# BLUE/GREEN DEPLOYMENT
# ------------------------------------------------------------

resource "aws_codedeploy_app" "primary" {
  provider          = aws.primary
  name              = "${var.app_name}-primary"
  compute_platform  = "ECS"
}

resource "aws_codedeploy_deployment_group" "primary" {
  provider               = aws.primary
  app_name               = aws_codedeploy_app.primary.name
  deployment_group_name  = "${var.app_name}-primary-deployment-group"
  service_role_arn       = aws_iam_role.codedeploy_role.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"
  
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
  
  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    
    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }
  
  ecs_service {
    cluster_name = aws_ecs_cluster.primary.name
    service_name = aws_ecs_service.primary.name
  }
  
  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
  
  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.primary_https.arn]
      }
      
      target_group {
        name = aws_lb_target_group.primary_blue.name
      }
      
      target_group {
        name = aws_lb_target_group.primary_green.name
      }
    }
  }
}

resource "aws_codedeploy_app" "secondary" {
  provider          = aws.secondary
  name              = "${var.app_name}-secondary"
  compute_platform  = "ECS"
}

resource "aws_codedeploy_deployment_group" "secondary" {
  provider               = aws.secondary
  app_name               = aws_codedeploy_app.secondary.name
  deployment_group_name  = "${var.app_name}-secondary-deployment-group"
  service_role_arn       = aws_iam_role.codedeploy_role.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"
  
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
  
  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    
    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }
  
  ecs_service {
    cluster_name = aws_ecs_cluster.secondary.name
    service_name = aws_ecs_service.secondary.name
  }
  
  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
  
  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.secondary_https.arn]
      }
      
      target_group {
        name = aws_lb_target_group.secondary_blue.name
      }
      
      target_group {
        name = aws_lb_target_group.secondary_green.name
      }
    }
  }
}

# ------------------------------------------------------------
# ROUTE53 FAILOVER
# ------------------------------------------------------------

resource "aws_route53_zone" "primary" {
  provider = aws.primary
  name     = var.domain_name
  
  tags = {
    Name        = "${var.app_name}-zone"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name        = "${var.app_name}-primary-health-check"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  fqdn              = aws_lb.secondary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name        = "${var.app_name}-secondary-health-check"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.primary.zone_id
  name     = var.domain_name
  type     = "A"
  
  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  health_check_id = aws_route53_health_check.primary.id
  set_identifier  = "primary
### Answer 
---

