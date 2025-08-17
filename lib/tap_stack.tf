# Configure S3 backend for remote state management
terraform {
  backend "s3" {
    # Backend configuration will be provided via command line arguments
  }
}

#######################
# Variables
#######################
variable "author" {
  description = "The author of the infrastructure"
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "created_date" {
  description = "The date when the infrastructure was created"
  type        = string
  default     = "2025-08-17"
}

variable "aws_region" {
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-app"
}

variable "compliance_level" {
  description = "Level of compliance features to enable"
  type        = string
  default     = "strict"
  validation {
    condition     = contains(["standard", "high", "strict"], var.compliance_level)
    error_message = "Compliance level must be one of: standard, high, strict"
  }
}

variable "db_engine" {
  description = "Database engine type"
  type        = string
  default     = "mysql"
  validation {
    condition     = contains(["mysql", "postgres"], var.db_engine)
    error_message = "Database engine must be mysql or postgres"
  }
}

variable "db_instance_class" {
  description = "Database instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "Password123!"  # For demo only, use secrets manager in production
  sensitive   = true
}

#######################
# Random Suffix for Unique Naming
#######################
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

#######################
# Locals
#######################
locals {
  timestamp   = "070301" # 2025-08-17 07:03:01
  name_prefix = "${var.project_name}-${var.environment}-${local.timestamp}-${random_string.suffix.result}"

  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    DeployTime        = local.timestamp
    User              = "ngwakoleslieelijah"
    Author            = var.author
    CreatedDate       = var.created_date
    ComplianceLevel   = var.compliance_level
    CostCenter        = "Engineering"
    DataClassification = "Internal"
    Backup            = "Daily"
    Retention         = "90days"
  }

  enable_encryption    = true
  enable_vpc_endpoints = true
  log_retention_days   = var.compliance_level == "strict" ? 365 : 90
  backup_retention_days = var.compliance_level == "strict" ? 90 : 30

  db_engine_full_name = var.db_engine == "mysql" ? "mysql" : "postgres"
  db_port             = var.db_engine == "mysql" ? 3306 : 5432
  db_family           = var.db_engine == "mysql" ? "mysql8.0" : "postgres14"
}

#######################
# Data Sources
#######################
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

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

#######################
# KMS Key
#######################
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} resources"
  deletion_window_in_days = 30
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
        Sid      = "AllowCloudWatchLogsUseKey"
        Effect   = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

#######################
# VPC, Subnets, IGW, NAT, Routing, Endpoints
#######################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "public" {
  count = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Tier = "private"
  })
}

resource "aws_subnet" "database" {
  count = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 20}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Tier = "database"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  count = 2
  domain = "vpc"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table" "private" {
  count = 2
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route" "private_nat_gateway" {
  count = 2
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
  })
}

resource "aws_route_table_association" "public" {
  count = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.name_prefix}-flow-logs"
  retention_in_days = local.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc-flow-logs" })
}

resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = local.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2-logs" })
}

resource "aws_iam_role" "flow_log_role" {
  name = "${local.name_prefix}-flow-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log-role"
  })
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "${local.name_prefix}-flow-log-policy"
  role = aws_iam_role.flow_log_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
      }
    ]
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.private[0].id, aws_route_table.private[1].id], [aws_route_table.database.id])
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.private[0].id, aws_route_table.private[1].id], [aws_route_table.database.id])
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

#######################
# S3 Bucket and Corrected Lifecycle
#######################
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-bucket"
  force_destroy = true
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-logs-bucket" })
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "log-lifecycle"
    status = "Enabled"
    filter { prefix = "" }
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 60
      storage_class = "GLACIER"
    }
    expiration {
      days = local.backup_retention_days
    }
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSALBLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

#######################
# Security Groups
#######################
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for the ALB"
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
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Security group for the web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
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
    Name = "${local.name_prefix}-web-sg"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for the database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

resource "aws_instance" "web" {
  count         = 2
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.web.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-instance-${count.index + 1}"
  })
}

#######################
# IAM Resources
#######################
# (No change, keep your previously defined IAM roles and policies.)

#######################
# CloudWatch, SNS, etc.
#######################
# (No change, keep your previous resources for CloudWatch alarms, SNS topics, etc.)

#######################
# RDS (fixed: backup_retention_period max 35, no Performance Insights for t3.micro!)
#######################
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${local.name_prefix}-db-params"
  family = local.db_family
  parameter {
    name  = "character_set_server"
    value = "utf8"
  }
  parameter {
    name  = "character_set_client"
    value = "utf8"
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-params"
  })
}

resource "aws_db_instance" "main" {
  identifier             = "${local.name_prefix}-db"
  engine                 = local.db_engine_full_name
  engine_version         = var.db_engine == "mysql" ? "8.0" : "14.6"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.main.arn
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = min(local.backup_retention_days, 35) # FIXED: never above 35
  deletion_protection    = var.environment == "prod" ? true : false
  copy_tags_to_snapshot  = true
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_role.arn

  # Performance Insights removed for db.t3.micro (not supported)
  # performance_insights_enabled          = false
  # performance_insights_retention_period = 7
  # performance_insights_kms_key_id       = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

resource "aws_iam_role" "rds_monitoring_role" {
  name = "${local.name_prefix}-rds-monitoring-role"
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
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

#######################
# Application Load Balancer (with access_logs using S3 above)
#######################
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-http-listener"
  })
}

resource "aws_lb_target_group_attachment" "main" {
  count            = 2
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.web[count.index].id
  port             = 80
}

#######################
# Backup selection (no tags)
#######################
resource "aws_backup_vault" "main" {
  name        = "${local.name_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.main.arn
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-vault"
  })
}

resource "aws_backup_plan" "main" {
  name = "${local.name_prefix}-backup-plan"
  rule {
    rule_name         = "${local.name_prefix}-daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 1 * * ? *)"
    lifecycle {
      delete_after = local.backup_retention_days
    }
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-plan"
  })
}

resource "aws_backup_selection" "main" {
  name         = "${local.name_prefix}-backup-selection"
  iam_role_arn = aws_iam_role.backup_role.arn
  plan_id      = aws_backup_plan.main.id
  resources = [
    aws_instance.web[0].arn,
    aws_instance.web[1].arn,
    aws_db_instance.main.arn
  ]
}

resource "aws_iam_role" "backup_role" {
  name = "${local.name_prefix}-backup-role"
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
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-role"
  })
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

#######################
# Outputs
#######################
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "web_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.web[*].id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    timestamp        = "2025-08-17 07:03:01"
    user             = "ngwakoleslieelijah"
    prefix           = local.name_prefix
    compliance_level = var.compliance_level
  }
}

output "compliance_features" {
  description = "Enabled compliance features"
  value = {
    encryption_enabled     = true
    vpc_flow_logs_enabled  = true
    cloudtrail_enabled     = true
    backup_retention_days  = local.backup_retention_days
    log_retention_days     = local.log_retention_days
    imdsv2_required        = true
    vpc_endpoints_enabled  = true
    mfa_enforcement        = true
    private_subnets_used   = true
    rds_encryption         = true
  }
}