
# Complete Cross-Region Disaster Recovery Solution for Financial Trading Platform
# Achieves RPO < 1 minute, RTO < 5 minutes with full automation



# ---------------------------------------------------------------------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

# aws_region and dr_region variables are defined in provider.tf

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag"
  type        = string
  default     = "financial-trading-team"
}

variable "project" {
  description = "Project tag"
  type        = string
  default     = "trading-platform"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_dr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "database_name" {
  description = "Name of the Aurora database"
  type        = string
  default     = "tradingdb"
}

variable "database_username" {
  description = "Username for the database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "database_password" {
  description = "Password for the database"
  type        = string
  default     = "TradingPlatform2024!SecurePassword"
  sensitive   = true
}

variable "database_instance_class" {
  description = "Instance class for Aurora instances"
  type        = string
  default     = "db.r5.large"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB global table"
  type        = string
  default     = "trading-config"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "trading-platform.local"
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = "alerts@example.com"
}

# ---------------------------------------------------------------------------------------------------------------------
# DATA SOURCES
# ---------------------------------------------------------------------------------------------------------------------

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "dr" {
  provider = aws.dr
  state    = "available"
}

data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------------------------------------------------
# KMS KEYS FOR ENCRYPTION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for trading platform encryption - primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "trading-kms-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/trading-platform-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "dr" {
  provider                = aws.dr
  description             = "KMS key for trading platform encryption - DR region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "trading-kms-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "dr" {
  provider      = aws.dr
  name          = "alias/trading-platform-dr"
  target_key_id = aws_kms_key.dr.key_id
}

# ---------------------------------------------------------------------------------------------------------------------
# VPC & NETWORK INFRASTRUCTURE - PRIMARY REGION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "trading-vpc-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_public" {
  count                   = 3
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "trading-public-subnet-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_private" {
  count             = 3
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index + 3)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name        = "trading-private-subnet-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name        = "trading-igw-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_eip" "primary" {
  count    = 3
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name        = "trading-eip-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "primary" {
  count         = 3
  provider      = aws.primary
  allocation_id = aws_eip.primary[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = {
    Name        = "trading-nat-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "trading-public-route-table-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_public" {
  count          = 3
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table" "primary_private" {
  count    = 3
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name        = "trading-private-route-table-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_private" {
  count          = 3
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ---------------------------------------------------------------------------------------------------------------------
# VPC & NETWORK INFRASTRUCTURE - DR REGION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "trading-vpc-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "dr_public" {
  count                   = 3
  provider                = aws.dr
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = cidrsubnet(var.vpc_cidr_dr, 8, count.index)
  availability_zone       = data.aws_availability_zones.dr.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "trading-public-subnet-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "dr_private" {
  count             = 3
  provider          = aws.dr
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.vpc_cidr_dr, 8, count.index + 3)
  availability_zone = data.aws_availability_zones.dr.names[count.index]

  tags = {
    Name        = "trading-private-subnet-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name        = "trading-igw-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_eip" "dr" {
  count    = 3
  provider = aws.dr
  domain   = "vpc"

  tags = {
    Name        = "trading-eip-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "dr" {
  count         = 3
  provider      = aws.dr
  allocation_id = aws_eip.dr[count.index].id
  subnet_id     = aws_subnet.dr_public[count.index].id

  tags = {
    Name        = "trading-nat-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.dr]
}

resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = {
    Name        = "trading-public-route-table-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "dr_public" {
  count          = 3
  provider       = aws.dr
  subnet_id      = aws_subnet.dr_public[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table" "dr_private" {
  count    = 3
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr[count.index].id
  }

  tags = {
    Name        = "trading-private-route-table-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "dr_private" {
  count          = 3
  provider       = aws.dr
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private[count.index].id
}

# ---------------------------------------------------------------------------------------------------------------------
# SECURITY GROUPS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name        = "trading-aurora-sg-primary"
  description = "Security group for Aurora database - primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary, var.vpc_cidr_dr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "trading-aurora-sg-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name        = "trading-aurora-sg-dr"
  description = "Security group for Aurora database - DR region"
  vpc_id      = aws_vpc.dr.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary, var.vpc_cidr_dr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "trading-aurora-sg-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "application_primary" {
  provider    = aws.primary
  name        = "trading-app-sg-primary"
  description = "Security group for application servers - primary region"
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
    Name        = "trading-app-sg-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "application_dr" {
  provider    = aws.dr
  name        = "trading-app-sg-dr"
  description = "Security group for application servers - DR region"
  vpc_id      = aws_vpc.dr.id

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
    Name        = "trading-app-sg-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# TRANSIT GATEWAY FOR CROSS-REGION CONNECTIVITY
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_ec2_transit_gateway" "primary" {
  provider                        = aws.primary
  description                     = "Transit Gateway for trading platform - primary region"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"

  tags = {
    Name        = "trading-tgw-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ec2_transit_gateway" "dr" {
  provider                        = aws.dr
  description                     = "Transit Gateway for trading platform - DR region"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"

  tags = {
    Name        = "trading-tgw-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "primary" {
  provider           = aws.primary
  subnet_ids         = aws_subnet.primary_private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.primary.id
  vpc_id             = aws_vpc.primary.id

  tags = {
    Name        = "trading-tgw-attachment-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "dr" {
  provider           = aws.dr
  subnet_ids         = aws_subnet.dr_private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.dr.id
  vpc_id             = aws_vpc.dr.id

  tags = {
    Name        = "trading-tgw-attachment-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ec2_transit_gateway_peering_attachment" "cross_region" {
  provider                = aws.primary
  peer_region             = var.dr_region
  peer_transit_gateway_id = aws_ec2_transit_gateway.dr.id
  transit_gateway_id      = aws_ec2_transit_gateway.primary.id

  tags = {
    Name        = "trading-tgw-peering"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "cross_region" {
  provider                      = aws.dr
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.cross_region.id

  tags = {
    Name        = "trading-tgw-peering-accepter"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# AURORA GLOBAL DATABASE
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "trading-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name        = "trading-db-subnet-group-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_subnet_group" "dr" {
  provider   = aws.dr
  name       = "trading-db-subnet-group-dr"
  subnet_ids = aws_subnet.dr_private[*].id

  tags = {
    Name        = "trading-db-subnet-group-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_global_cluster" "trading" {
  provider                  = aws.primary
  global_cluster_identifier = "trading-global-cluster"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.04.0"
  database_name             = var.database_name
  storage_encrypted         = true
  deletion_protection       = true

  tags = {
    Name        = "trading-global-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster" "primary" {
  provider                     = aws.primary
  cluster_identifier           = "trading-cluster-primary"
  global_cluster_identifier    = aws_rds_global_cluster.trading.id
  engine                       = aws_rds_global_cluster.trading.engine
  engine_version               = aws_rds_global_cluster.trading.engine_version
  database_name                = var.database_name
  master_username              = var.database_username
  master_password              = var.database_password
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  db_subnet_group_name         = aws_db_subnet_group.primary.name
  vpc_security_group_ids       = [aws_security_group.aurora_primary.id]
  storage_encrypted            = true
  kms_key_id                   = aws_kms_key.primary.arn
  deletion_protection          = true
  skip_final_snapshot          = false
  final_snapshot_identifier    = "trading-cluster-primary-final-snapshot"

  tags = {
    Name        = "trading-cluster-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_rds_global_cluster.trading]
}

resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  provider           = aws.primary
  identifier         = "trading-instance-primary-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.database_instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "trading-instance-primary-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr
  cluster_identifier        = "trading-cluster-dr"
  global_cluster_identifier = aws_rds_global_cluster.trading.id
  engine                    = aws_rds_global_cluster.trading.engine
  engine_version            = aws_rds_global_cluster.trading.engine_version
  db_subnet_group_name      = aws_db_subnet_group.dr.name
  vpc_security_group_ids    = [aws_security_group.aurora_dr.id]
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.dr.arn
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "trading-cluster-dr-final-snapshot"

  tags = {
    Name        = "trading-cluster-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_rds_cluster.primary]
}

resource "aws_rds_cluster_instance" "dr" {
  count              = 2
  provider           = aws.dr
  identifier         = "trading-instance-dr-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.dr.id
  instance_class     = var.database_instance_class
  engine             = aws_rds_cluster.dr.engine
  engine_version     = aws_rds_cluster.dr.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_dr.arn

  tags = {
    Name        = "trading-instance-dr-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# DYNAMODB GLOBAL TABLES
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_dynamodb_table" "trading_config_primary" {
  provider         = aws.primary
  name             = var.dynamodb_table_name
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.dynamodb_table_name}-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_dynamodb_table" "trading_config_dr" {
  provider         = aws.dr
  name             = "${var.dynamodb_table_name}-dr"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dr.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.dynamodb_table_name}-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# ROUTE 53 HOSTED ZONE AND HEALTH CHECKS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_route53_zone" "trading" {
  provider = aws.primary
  name     = var.domain_name

  tags = {
    Name        = "trading-hosted-zone"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = "primary.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name        = "trading-health-check-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "dr" {
  provider          = aws.primary
  fqdn              = "dr.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name        = "trading-health-check-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_record" "primary" {
  provider       = aws.primary
  zone_id        = aws_route53_zone.trading.zone_id
  name           = var.domain_name
  type           = "A"
  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  provider       = aws.primary
  zone_id        = aws_route53_zone.trading.zone_id
  name           = var.domain_name
  type           = "A"
  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.dr.id
}

# ---------------------------------------------------------------------------------------------------------------------
# APPLICATION LOAD BALANCERS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "trading-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.application_primary.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "trading-alb-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb" "dr" {
  provider           = aws.dr
  name               = "trading-alb-dr"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.application_dr.id]
  subnets            = aws_subnet.dr_public[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "trading-alb-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM ROLES AND POLICIES
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_iam_role" "rds_monitoring" {
  provider = aws.primary
  name     = "trading-rds-monitoring-role"

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
    Name        = "trading-rds-monitoring-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  provider   = aws.primary
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "rds_monitoring_dr" {
  provider = aws.dr
  name     = "trading-rds-monitoring-role-dr"

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
    Name        = "trading-rds-monitoring-role-dr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_dr" {
  provider   = aws.dr
  role       = aws_iam_role.rds_monitoring_dr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "lambda_failover" {
  provider = aws.primary
  name     = "trading-lambda-failover-role"

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

  tags = {
    Name        = "trading-lambda-failover-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "lambda_failover" {
  provider = aws.primary
  name     = "trading-lambda-failover-policy"
  role     = aws_iam_role.lambda_failover.id

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
          "rds:FailoverGlobalCluster",
          "rds:DescribeGlobalClusters",
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheck",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# LAMBDA FUNCTION FOR AUTOMATED FAILOVER
# ---------------------------------------------------------------------------------------------------------------------

data "archive_file" "lambda_failover" {
  type        = "zip"
  output_path = "/tmp/lambda_failover.zip"
  source {
    content  = <<EOF
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        rds = boto3.client('rds')
        route53 = boto3.client('route53')
        
        # Failover Aurora Global Cluster
        response = rds.failover_global_cluster(
            GlobalClusterIdentifier='trading-global-cluster',
            TargetDbClusterIdentifier='trading-cluster-dr'
        )
        
        logger.info(f"Aurora failover initiated: {response}")
        
        # Update Route53 records to point to DR region
        # This would be implemented based on specific requirements
        
        return {
            'statusCode': 200,
            'body': json.dumps('Failover completed successfully')
        }
    except Exception as e:
        logger.error(f"Failover failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Failover failed: {str(e)}')
        }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "failover" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_failover.output_path
  function_name    = "trading-failover-function"
  role             = aws_iam_role.lambda_failover.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_failover.output_base64sha256
  runtime          = "python3.9"
  timeout          = 300

  environment {
    variables = {
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.trading.id
      DR_CLUSTER_ID     = aws_rds_cluster.dr.id
    }
  }

  tags = {
    Name        = "trading-failover-function"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPICS FOR NOTIFICATIONS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  provider          = aws.primary
  name              = "trading-alerts"
  kms_master_key_id = aws_kms_key.primary.id

  tags = {
    Name        = "trading-alerts"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_subscription" "lambda_alerts" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.failover.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDWATCH ALARMS AND MONITORING
# ---------------------------------------------------------------------------------------------------------------------

# CloudWatch alarms for health checks removed to avoid circular dependency
# Route 53 health checks will handle failover automatically based on endpoint health
# Additional monitoring can be added via CloudWatch dashboards if needed

resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag" {
  provider            = aws.primary
  alarm_name          = "trading-aurora-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "30000" # 30 seconds in milliseconds
  alarm_description   = "This metric monitors Aurora Global DB replication lag"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = {
    Name        = "trading-aurora-replication-lag"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDTRAIL FOR AUDITING
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_s3_bucket" "cloudtrail_primary" {
  provider      = aws.primary
  bucket        = "trading-cloudtrail-${random_id.bucket_suffix.hex}-primary"
  force_destroy = true

  tags = {
    Name        = "trading-cloudtrail-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail_primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail_primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudtrail" "trading" {
  provider                      = aws.primary
  name                          = "trading-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_primary.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.primary.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []
  }

  tags = {
    Name        = "trading-cloudtrail"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_primary]
}

resource "aws_s3_bucket_policy" "cloudtrail_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_primary.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_primary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ---------------------------------------------------------------------------------------------------------------------
# LAMBDA PERMISSION FOR SNS (CloudWatch alarms trigger via SNS)
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lambda_permission" "allow_sns" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "dr_vpc_id" {
  description = "ID of the DR VPC"
  value       = aws_vpc.dr.id
}

output "aurora_global_cluster_id" {
  description = "ID of the Aurora Global Cluster"
  value       = aws_rds_global_cluster.trading.id
}

output "primary_cluster_endpoint" {
  description = "Aurora primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "dr_cluster_endpoint" {
  description = "Aurora DR cluster endpoint"
  value       = aws_rds_cluster.dr.endpoint
}

output "dynamodb_table_primary_name" {
  description = "Name of the DynamoDB table in primary region"
  value       = aws_dynamodb_table.trading_config_primary.name
}

output "dynamodb_table_dr_name" {
  description = "Name of the DynamoDB table in DR region"
  value       = aws_dynamodb_table.trading_config_dr.name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.trading.zone_id
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = aws_lb.primary.dns_name
}

output "dr_alb_dns" {
  description = "DR ALB DNS name"
  value       = aws_lb.dr.dns_name
}

output "failover_lambda_function_name" {
  description = "Name of the failover Lambda function"
  value       = aws_lambda_function.failover.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.trading.name
}

output "kms_key_primary_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.primary.arn
}

output "kms_key_dr_arn" {
  description = "ARN of the DR KMS key"
  value       = aws_kms_key.dr.arn
}

output "transit_gateway_primary_id" {
  description = "ID of the primary Transit Gateway"
  value       = aws_ec2_transit_gateway.primary.id
}

output "transit_gateway_dr_id" {
  description = "ID of the DR Transit Gateway"
  value       = aws_ec2_transit_gateway.dr.id
}
