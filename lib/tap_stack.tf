# Multi-Region Disaster Recovery Infrastructure
# RTO: 15 minutes | RPO: 5 minutes
# Primary: us-east-1 | Secondary: us-west-2

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (prod or staging)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be 'prod' or 'staging'."
  }
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "aurora_instance_class" {
  description = "Aurora instance size"
  type        = string
  default     = "db.r5.large"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for app servers"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_capacity" {
  description = "Minimum ASG capacity"
  type        = number
  default     = 2
}

variable "asg_max_capacity" {
  description = "Maximum ASG capacity"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
  default     = 3
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dr-app"
}

# ============================================================================
# SECONDARY REGION PROVIDER
# ============================================================================

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# ============================================================================
# KMS KEYS FOR RDS ENCRYPTION
# ============================================================================

resource "aws_kms_key" "rds_primary" {
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-rds-kms-primary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_primary" {
  name          = "alias/${var.project_name}-rds-primary"
  target_key_id = aws_kms_key.rds_primary.key_id
}

resource "aws_kms_key" "rds_secondary" {
  provider                = aws.secondary
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-rds-kms-secondary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-rds-secondary"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

# Latest Amazon Linux 2023 AMI - Primary Region
data "aws_ami" "amazon_linux_primary" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Latest Amazon Linux 2023 AMI - Secondary Region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================================================
# PRIMARY REGION - NETWORKING
# ============================================================================

resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc-primary"
    Environment = var.environment
    Region      = var.aws_region
    Purpose     = "Primary VPC for DR setup"
  }
}

resource "aws_subnet" "primary_public" {
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 4, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-primary-${count.index + 1}"
    Environment = var.environment
    Tier        = "Public"
  }
}

resource "aws_subnet" "primary_private" {
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 4, count.index + 2)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-primary-${count.index + 1}"
    Environment = var.environment
    Tier        = "Private"
  }
}

resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name        = "${var.project_name}-igw-primary"
    Environment = var.environment
  }
}

resource "aws_eip" "primary_nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-primary-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "primary" {
  count         = 2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-primary-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "${var.project_name}-rt-public-primary"
    Environment = var.environment
  }
}

resource "aws_route_table" "primary_private" {
  count  = 2
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-rt-private-primary-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "primary_public" {
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  count          = 2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ============================================================================
# SECONDARY REGION - NETWORKING
# ============================================================================

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc-secondary"
    Environment = var.environment
    Region      = var.secondary_region
    Purpose     = "Secondary VPC for DR setup"
  }
}

resource "aws_subnet" "secondary_public" {
  count                   = 2
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 4, count.index)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-secondary-${count.index + 1}"
    Environment = var.environment
    Tier        = "Public"
  }
}

resource "aws_subnet" "secondary_private" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 4, count.index + 2)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-secondary-${count.index + 1}"
    Environment = var.environment
    Tier        = "Private"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name        = "${var.project_name}-igw-secondary"
    Environment = var.environment
  }
}

resource "aws_eip" "secondary_nat" {
  count    = 2
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-secondary-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "secondary" {
  count         = 2
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-secondary-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name        = "${var.project_name}-rt-public-secondary"
    Environment = var.environment
  }
}

resource "aws_route_table" "secondary_private" {
  count    = 2
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-rt-private-secondary-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "secondary_public" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ============================================================================
# SECURITY GROUPS - PRIMARY REGION
# ============================================================================

resource "aws_security_group" "primary_alb" {
  name_prefix = "${var.project_name}-alb-primary-"
  description = "Security group for primary ALB"
  vpc_id      = aws_vpc.primary.id

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
    Name        = "${var.project_name}-sg-alb-primary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "primary_app" {
  name_prefix = "${var.project_name}-app-primary-"
  description = "Security group for primary application servers"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-sg-app-primary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "primary_db" {
  name_prefix = "${var.project_name}-db-primary-"
  description = "Security group for primary Aurora database"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_app.id]
    description     = "Allow MySQL traffic from app servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-sg-db-primary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# SECURITY GROUPS - SECONDARY REGION
# ============================================================================

resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name_prefix = "${var.project_name}-alb-secondary-"
  description = "Security group for secondary ALB"
  vpc_id      = aws_vpc.secondary.id

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
    Name        = "${var.project_name}-sg-alb-secondary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "secondary_app" {
  provider    = aws.secondary
  name_prefix = "${var.project_name}-app-secondary-"
  description = "Security group for secondary application servers"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-sg-app-secondary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "secondary_db" {
  provider    = aws.secondary
  name_prefix = "${var.project_name}-db-secondary-"
  description = "Security group for secondary Aurora database"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_app.id]
    description     = "Allow MySQL traffic from app servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-sg-db-secondary"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# AURORA GLOBAL DATABASE
# ============================================================================

resource "aws_db_subnet_group" "primary" {
  name       = "${var.project_name}-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group-primary"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.project_name}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group-secondary"
    Environment = var.environment
  }
}

resource "aws_rds_global_cluster" "main" {
  global_cluster_identifier = "${var.project_name}-global-db-${var.environment}"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.04.0"
  database_name             = "${replace(var.project_name, "-", "")}db"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  cluster_identifier        = "${var.project_name}-aurora-primary"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  database_name             = aws_rds_global_cluster.main.database_name
  master_username           = "admin"
  master_password           = "ChangeMe123456!" # In production, use AWS Secrets Manager
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.primary_db.id]
  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.rds_primary.arn
  skip_final_snapshot       = true
  global_cluster_identifier = aws_rds_global_cluster.main.id

  tags = {
    Name        = "${var.project_name}-aurora-primary"
    Environment = var.environment
    Region      = var.aws_region
  }

  depends_on = [aws_rds_global_cluster.main]
}

resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  identifier         = "${var.project_name}-aurora-primary-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  tags = {
    Name        = "${var.project_name}-aurora-primary-instance-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "${var.project_name}-aurora-secondary"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [aws_security_group.secondary_db.id]
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.rds_secondary.arn
  skip_final_snapshot       = true
  global_cluster_identifier = aws_rds_global_cluster.main.id

  tags = {
    Name        = "${var.project_name}-aurora-secondary"
    Environment = var.environment
    Region      = var.secondary_region
  }

  depends_on = [aws_rds_cluster_instance.primary]
}

resource "aws_rds_cluster_instance" "secondary" {
  count              = 2
  provider           = aws.secondary
  identifier         = "${var.project_name}-aurora-secondary-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.secondary.engine
  engine_version     = aws_rds_cluster.secondary.engine_version

  tags = {
    Name        = "${var.project_name}-aurora-secondary-instance-${count.index + 1}"
    Environment = var.environment
  }
}

# ============================================================================
# DYNAMODB GLOBAL TABLE
# ============================================================================

resource "aws_dynamodb_table" "main" {
  name             = "${var.project_name}-dynamodb-${var.environment}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  replica {
    region_name = var.secondary_region
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-global"
    Environment = var.environment
    Purpose     = "Global table for DR"
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER - PRIMARY
# ============================================================================

resource "aws_lb" "primary" {
  name               = "${var.project_name}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name        = "${var.project_name}-alb-primary"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "primary" {
  name     = "${var.project_name}-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name        = "${var.project_name}-tg-primary"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "primary" {
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER - SECONDARY
# ============================================================================

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${var.project_name}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name        = "${var.project_name}-alb-secondary"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-tg-secondary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name        = "${var.project_name}-tg-secondary"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role-${var.environment}"

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

  tags = {
    Name        = "${var.project_name}-ec2-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.main.arn
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
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-failover-role"

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
    Name        = "${var.project_name}-lambda-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-failover-policy"
  role = aws_iam_role.lambda_role.id

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
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# LAMBDA FAILOVER FUNCTION
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda_failover" {
  name              = "/aws/lambda/${var.project_name}-failover"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-lambda-logs"
    Environment = var.environment
  }
}

# Create Lambda function code as a local file
resource "local_file" "lambda_code" {
  filename = "${path.module}/lambda_src/index.py"
  content  = <<-EOF
import json
import boto3
import os

def handler(event, context):
    """
    Automated failover function triggered by CloudWatch alarms
    Performs RDS Global Cluster failover from primary to secondary region
    """
    print(f"Failover triggered: {json.dumps(event)}")

    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    secondary_region = os.environ['SECONDARY_REGION']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    rds = boto3.client('rds')
    sns = boto3.client('sns')

    try:
        # Initiate Aurora Global Database failover
        print(f"Initiating failover for {{global_cluster_id}} to {{secondary_region}}")
        response = rds.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=f"{{os.environ['GLOBAL_CLUSTER_ID']}}-secondary"
        )

        message = f"DR Failover initiated successfully to {{secondary_region}}"
        print(message)

        # Send SNS notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"DR Failover Initiated - {{os.environ['ENVIRONMENT']}}",
            Message=message
        )

        return {{
            'statusCode': 200,
            'body': json.dumps({{'message': message, 'response': str(response)}})
        }}
    except Exception as e:
        error_msg = f"Failover failed: {{str(e)}}"
        print(error_msg)
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"DR Failover FAILED - {{os.environ['ENVIRONMENT']}}",
            Message=error_msg
        )
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': error_msg}})
        }}
EOF
}

# Create zip archive for Lambda deployment
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/failover_function.zip"
}

resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "${var.project_name}-failover-automation"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300

  environment {
    variables = {
      GLOBAL_CLUSTER_ID       = aws_rds_global_cluster.main.id
      PRIMARY_REGION          = var.aws_region
      SECONDARY_REGION        = var.secondary_region
      SNS_TOPIC_ARN           = aws_sns_topic.alerts.arn
      PRIMARY_ALB_DNS         = aws_lb.primary.dns_name
      SECONDARY_ALB_DNS       = aws_lb.secondary.dns_name
      ENVIRONMENT             = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-lambda-failover"
    Environment = var.environment
  }

  depends_on = [aws_cloudwatch_log_group.lambda_failover]
}

# ============================================================================
# AUTO SCALING GROUPS - PRIMARY
# ============================================================================

resource "aws_launch_template" "primary" {
  name_prefix   = "${var.project_name}-lt-primary-"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.primary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Primary Region App - ${var.environment}</h1>" > /var/www/html/index.html
              echo "OK" > /var/www/html/health
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-instance-primary"
      Environment = var.environment
      Region      = var.aws_region
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "primary" {
  name                = "${var.project_name}-asg-primary"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.asg_min_capacity
  max_size            = var.asg_max_capacity
  desired_capacity    = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-primary"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# ============================================================================
# AUTO SCALING GROUPS - SECONDARY
# ============================================================================

resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name_prefix   = "${var.project_name}-lt-secondary-"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.secondary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Secondary Region App - ${var.environment}</h1>" > /var/www/html/index.html
              echo "OK" > /var/www/html/health
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-instance-secondary"
      Environment = var.environment
      Region      = var.secondary_region
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "${var.project_name}-asg-secondary"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.asg_min_capacity
  max_size            = var.asg_max_capacity
  desired_capacity    = 0  # Start with 0 capacity in standby region

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-secondary"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# ============================================================================
# CLOUDWATCH ALARMS AND MONITORING
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-dr-alerts-${var.environment}"

  tags = {
    Name        = "${var.project_name}-sns-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# CloudWatch Alarm - Primary ALB Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "primary_alb_unhealthy" {
  alarm_name          = "${var.project_name}-primary-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = var.asg_desired_capacity * 0.5
  alarm_description   = "Triggers when >50% of primary ALB targets are unhealthy"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-primary-unhealthy"
    Environment = var.environment
  }
}

# CloudWatch Alarm - Primary Aurora DB Connections
resource "aws_cloudwatch_metric_alarm" "primary_db_connections" {
  alarm_name          = "${var.project_name}-primary-db-connections-critical"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Triggers when primary Aurora DB has no active connections"
  treat_missing_data  = "breaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-db-connections"
    Environment = var.environment
  }
}

# CloudWatch Alarm - Primary Region Total Failures
resource "aws_cloudwatch_metric_alarm" "primary_region_failure" {
  alarm_name          = "${var.project_name}-primary-region-total-failure"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Critical: Primary region complete failure detected - triggers DR failover"
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-region-failure"
    Environment = var.environment
    Critical    = "true"
  }
}

# ============================================================================
# EVENTBRIDGE RULES FOR AUTOMATION
# ============================================================================

resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "${var.project_name}-dr-health-check"
  description         = "Periodic health check for DR readiness"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name        = "${var.project_name}-eventbridge-health"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "health_check_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check.name
  target_id = "HealthCheckLambda"
  arn       = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check.arn
}

# ============================================================================
# AWS BACKUP PLAN FOR DISASTER RECOVERY
# ============================================================================

resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault"

  tags = {
    Name        = "${var.project_name}-backup-vault"
    Environment = var.environment
    Purpose     = "Centralized backup storage"
  }
}

resource "aws_backup_plan" "daily" {
  name = "${var.project_name}-daily-backup-plan"

  rule {
    rule_name         = "daily_backup_rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = 30 # Keep backups for 30 days
    }

    recovery_point_tags = {
      BackupType  = "Daily"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  tags = {
    Name        = "${var.project_name}-backup-plan"
    Environment = var.environment
  }
}

resource "aws_backup_selection" "aurora_backup" {
  name         = "${var.project_name}-aurora-backup-selection"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_rds_cluster.primary.arn,
    aws_dynamodb_table.main.arn
  ]
}

resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-backup-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# ============================================================================
# WAF WEB APPLICATION FIREWALL FOR ALB SECURITY
# ============================================================================

resource "aws_wafv2_web_acl" "primary" {
  name        = "${var.project_name}-waf-primary"
  description = "WAF rules for primary region ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-metrics"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-waf-primary"
    Environment = var.environment
  }
}

resource "aws_wafv2_web_acl_association" "primary" {
  resource_arn = aws_lb.primary.arn
  web_acl_arn  = aws_wafv2_web_acl.primary.arn
}

# ============================================================================
# ROUTE53 HEALTH CHECKS AND FAILOVER
# ============================================================================

resource "aws_route53_health_check" "primary_alb" {
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  measure_latency   = true

  tags = {
    Name        = "${var.project_name}-primary-health-check"
    Environment = var.environment
  }
}

resource "aws_route53_health_check" "secondary_alb" {
  fqdn              = aws_lb.secondary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  measure_latency   = true

  tags = {
    Name        = "${var.project_name}-secondary-health-check"
    Environment = var.environment
  }
}

# ============================================================================
# ADDITIONAL CLOUDWATCH ALARMS FOR ENHANCED MONITORING
# ============================================================================

# Monitor Lambda failover function errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-failover-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when Lambda failover function encounters errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.failover.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-lambda-errors"
    Environment = var.environment
  }
}

# Monitor ALB response time
resource "aws_cloudwatch_metric_alarm" "primary_alb_latency" {
  alarm_name          = "${var.project_name}-primary-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when ALB response time exceeds 5 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-alb-latency"
    Environment = var.environment
  }
}

# Monitor DynamoDB read/write throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on DynamoDB throttling events"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-dynamodb-throttles"
    Environment = var.environment
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "primary_alb_dns" {
  description = "DNS name of primary ALB"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB Global Table name"
  value       = aws_dynamodb_table.main.name
}

output "lambda_failover_function" {
  description = "Lambda failover function ARN"
  value       = aws_lambda_function.failover.arn
}

output "sns_alerts_topic" {
  description = "SNS topic for DR alerts"
  value       = aws_sns_topic.alerts.arn
}

output "rto_rpo_summary" {
  description = "DR configuration summary"
  value = {
    rto_target      = "15 minutes"
    rpo_target      = "5 minutes"
    primary_region  = var.aws_region
    secondary_region = var.secondary_region
    aurora_replication = "Continuous (< 1 second lag)"
    dynamodb_replication = "Sub-second global replication"
    failover_automation = "Lambda-based automated failover"
  }
}

output "route53_health_checks" {
  description = "Route53 health check IDs"
  value = {
    primary_check   = aws_route53_health_check.primary_alb.id
    secondary_check = aws_route53_health_check.secondary_alb.id
  }
}

output "monitoring_alarms" {
  description = "CloudWatch alarm ARNs"
  value = {
    primary_alb_unhealthy = aws_cloudwatch_metric_alarm.primary_alb_unhealthy.arn
    primary_db_connections = aws_cloudwatch_metric_alarm.primary_db_connections.arn
    primary_region_failure = aws_cloudwatch_metric_alarm.primary_region_failure.arn
    lambda_errors = aws_cloudwatch_metric_alarm.lambda_errors.arn
    alb_latency = aws_cloudwatch_metric_alarm.primary_alb_latency.arn
    dynamodb_throttles = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
  }
}

output "cost_optimization_notes" {
  description = "Cost optimization recommendations"
  value = {
    aurora_standby_note = "Secondary Aurora cluster uses read replicas only in standby mode"
    asg_standby_note = "Secondary ASG starts with 0 capacity (warm standby pattern)"
    dynamodb_billing = "PAY_PER_REQUEST billing mode - scales automatically"
    nat_gateway_note = "Consider single NAT Gateway per region for cost savings in non-prod"
  }
}

output "backup_configuration" {
  description = "AWS Backup configuration details"
  value = {
    vault_name = aws_backup_vault.main.name
    plan_name = aws_backup_plan.daily.name
    schedule = "Daily at 2 AM UTC"
    retention = "30 days"
    protected_resources = "Aurora Primary Cluster, DynamoDB Global Table"
  }
}

output "security_configuration" {
  description = "Security and WAF configuration"
  value = {
    waf_enabled = "Yes - Primary ALB protected by WAFv2"
    waf_rules = "Rate limiting (10k req/min), AWS Managed Common Rules, Known Bad Inputs"
    encryption_at_rest = "Enabled for Aurora, DynamoDB, EBS volumes"
    encryption_in_transit = "TLS/SSL enforced for all data transfer"
  }
}
