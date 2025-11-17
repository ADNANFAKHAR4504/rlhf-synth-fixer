terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "vpc-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "igw-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name    = "subnet-public-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
    Type    = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name    = "subnet-private-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
    Type    = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name    = "subnet-database-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
    Type    = "database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name    = "eip-nat-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name    = "nat-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "rt-public-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name    = "rt-private-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "rt-database-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-${var.dr_role}-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name    = "sg-alb-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.dr_role}-${var.environment_suffix}"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow MySQL from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name    = "sg-rds-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "lambda-${var.dr_role}-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name    = "sg-lambda-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "dbsg-${var.dr_role}-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name    = "dbsg-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = "aurora-${var.dr_role}-${var.environment_suffix}"
  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.04.0"
  database_name      = var.database_name
  master_username    = var.db_master_username
  master_password    = var.db_master_password

  global_cluster_identifier = var.global_cluster_identifier

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  storage_encrypted = true
  kms_key_id        = var.kms_key_arn

  skip_final_snapshot = true
  deletion_protection = false

  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]

  tags = {
    Name    = "aurora-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }

  depends_on = [aws_db_subnet_group.main]
}

# RDS Aurora Instances
resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "aurora-${var.dr_role}-${count.index}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name    = "aurora-${var.dr_role}-${count.index}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "rds-monitoring-${var.dr_role}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name    = "role-rds-monitoring-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.dr_role}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name    = "alb-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = "tg-${substr(var.dr_role, 0, 1)}-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name    = "tg-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = {
    Name    = "listener-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# VPC Endpoints Module
module "vpc_endpoints" {
  source = "../vpc_endpoints"

  vpc_id             = aws_vpc.main.id
  vpc_cidr           = var.vpc_cidr
  region             = var.region
  dr_role            = var.dr_role
  environment_suffix = var.environment_suffix

  private_subnet_ids       = aws_subnet.private[*].id
  private_route_table_ids  = aws_route_table.private[*].id
  database_route_table_ids = [aws_route_table.database.id]

  environment = var.environment
  cost_center = var.cost_center
}

# RDS Proxy Module
module "rds_proxy" {
  source = "../rds_proxy"

  dr_role            = var.dr_role
  region             = var.region
  environment_suffix = var.environment_suffix

  vpc_id                     = aws_vpc.main.id
  subnet_ids                 = aws_subnet.database[*].id
  allowed_security_group_ids = [aws_security_group.lambda.id]

  rds_cluster_id = aws_rds_cluster.main.id
  secret_arn     = var.db_secret_arn
  kms_key_arn    = var.kms_key_arn

  environment = var.environment
  cost_center = var.cost_center

  depends_on = [aws_rds_cluster.main]
}

# Lambda Module
module "lambda" {
  source = "./lambda"

  environment_suffix = var.environment_suffix
  dr_role            = var.dr_role
  region             = var.region

  vpc_id            = aws_vpc.main.id
  subnet_ids        = aws_subnet.private[*].id
  security_group_id = aws_security_group.lambda.id

  rds_cluster_id = aws_rds_cluster.main.id
  rds_endpoint   = aws_rds_cluster.main.endpoint

  lambda_runtime = var.lambda_runtime
  is_primary     = var.is_primary
  sns_topic_arn  = var.sns_topic_arn

  environment = var.environment
  cost_center = var.cost_center
}
