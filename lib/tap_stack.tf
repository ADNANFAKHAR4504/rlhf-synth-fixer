# tap_stack.tf
# Main infrastructure resources with comprehensive security controls
# Problem ID: security_configuration_as_code_Terraform_HCL_h7js29a0kdr1

# Local values for consistent tagging and naming
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "ngwakoleslieelijah"
    CreatedDate = "2025-08-15"
    ProblemID   = "security_configuration_as_code_Terraform_HCL_h7js29a0kdr1"
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

# Random string for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Random string to ensure resource name uniqueness
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

module "data" {
  source = "./modules/data"

  app_data_s3_bucket_arn = aws_s3_bucket.app_data.arn
  s3_kms_key_arn         = aws_kms_key.s3_key.arn
  region                 = var.region
  project_name           = var.project_name
  environment            = var.environment
  is_localstack          = var.is_localstack
}

#######################
# VPC and Networking
#######################

# Main VPC with DNS support enabled for RDS
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "networking"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
    Type = "networking"
  })
}

# Public subnets for ALB and NAT Gateways (Multi-AZ)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = module.data.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    Tier = "public"
  })
}

# Private subnets for EC2 instances (Multi-AZ)
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = module.data.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    Tier = "application"
  })
}

# Database subnets for RDS (Multi-AZ)
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = module.data.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "database-subnet"
    Tier = "database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
    Type = "networking"
  })
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
    Type = "networking"
  })
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "networking"
  })
}

# Route tables for private subnets (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    Type = "networking"
  })
}

# Route table for database subnets (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
    Type = "networking"
  })
}

# Route table associations
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

#######################
# KMS Keys for Encryption
#######################

# KMS key for RDS encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${module.data.partition}:iam::${module.data.caller_identity_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
    Type = "encryption"
  })
}

# KMS key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${module.data.partition}:iam::${module.data.caller_identity_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
    Type = "encryption"
  })
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms-key"
    Type = "encryption"
  })
}

#######################
# Security
#######################

module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = aws_vpc.main.id
  allowed_cidr_blocks = var.allowed_cidr_blocks
  common_tags         = local.common_tags
}

#######################
# Monitoring
#######################

module "monitoring" {
  source = "./modules/monitoring"

  project_name       = var.project_name
  environment        = var.environment
  notification_email = var.notification_email
  asg_name           = module.compute.asg_name
  random_suffix      = random_string.suffix.result
  common_tags        = local.common_tags
}

#######################
# Application Load Balancer
#######################

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb-${random_string.suffix.result}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.security.alb_sg_id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
    Type = "load-balancer"
  })
}

# Target group for EC2 instances
resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-app-tg-${random_string.suffix.result}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-target-group"
    Type = "load-balancer"
  })
}

# ALB Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-listener"
    Type = "load-balancer"
  })
}

#######################
# IAM Roles and Policies
#######################

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role-${random_string.suffix.result}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
    Type = "iam"
  })
}

# IAM policy for EC2 S3 access
resource "aws_iam_role_policy" "ec2_s3_policy" {
  name   = "${local.name_prefix}-ec2-s3-policy"
  role   = aws_iam_role.ec2_role.id
  policy = module.data.ec2_s3_access_policy
}

data "aws_iam_policy_document" "cloudwatch_logs_policy" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
      "logs:DescribeLogGroups"
    ]

    resources = [
      "arn:${module.data.partition}:logs:${var.region}:${module.data.caller_identity_account_id}:log-group:/aws/ec2/${local.name_prefix}:*",
      "arn:${module.data.partition}:logs:${var.region}:${module.data.caller_identity_account_id}:log-group:/aws/lambda/*"
    ]
  }
}

# IAM policy for CloudWatch logs
resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name   = "${local.name_prefix}-ec2-cloudwatch-policy"
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.cloudwatch_logs_policy.json
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile-${random_string.suffix.result}"
  role = aws_iam_role.ec2_role.name
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role-${random_string.suffix.result}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-role"
    Type = "iam"
  })
}

# Attach VPC execution policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:${module.data.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

#######################
# Compute
#######################

module "compute" {
  source = "./modules/compute"

  project_name    = var.project_name
  environment     = var.environment
  app_subnet_ids  = aws_subnet.private[*].id
  vpc_id          = aws_vpc.main.id
  instance_type   = var.instance_type
  ami_id          = module.data.amazon_linux_ami_id
  ec2_sg_id       = module.security.ec2_sg_id
  ec2_iam_profile = aws_iam_instance_profile.ec2_profile.name
  ebs_kms_key_arn = aws_kms_key.ebs_key.arn
  log_group_name  = module.monitoring.ec2_log_group_name
  tg_arn          = aws_lb_target_group.app.arn
  common_tags     = local.common_tags
}

#######################
# EC2 Instances
#######################

#######################
# RDS Database
#######################

# DB subnet group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${local.name_prefix}-db-subnet-group-"
  subnet_ids  = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
    Type = "database"
  })
}

# RDS instance with encryption and Multi-AZ
resource "aws_db_instance" "main" {
  identifier             = "${local.name_prefix}-database-${random_string.suffix.result}"
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [module.security.rds_sg_id]
  skip_final_snapshot    = true
  multi_az               = false
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
    Type = "database"
  })
}

#######################
# S3 Buckets
#######################

# S3 bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket        = "${local.name_prefix}-app-data-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-data-bucket"
    Type = "storage"
  })
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${local.name_prefix}-alb-logs-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-logs-bucket"
    Type = "storage"
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_key.arn
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for ALB logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  policy = data.aws_iam_policy_document.alb_logs_s3_policy.json
}

data "aws_iam_policy_document" "alb_logs_s3_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${module.data.elb_service_account_id}:root"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.alb_logs.arn}/alb-logs/*"]
  }
}

# outputs.tf
# Outputs for the secure infrastructure module

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS database instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_data_s3_bucket_name" {
  description = "Name of the S3 bucket for application data"
  value       = aws_s3_bucket.app_data.bucket
}

output "alb_logs_s3_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "ec2_autoscaling_group_name" {
  description = "Name of the EC2 Auto Scaling group"
  value       = module.compute.asg_name
}

output "ec2_sg_id" {
  description = "ID of the EC2 security group"
  value       = module.security.ec2_sg_id
}

output "rds_sg_id" {
  description = "ID of the RDS security group"
  value       = module.security.rds_sg_id
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = module.security.alb_sg_id
}

output "rds_kms_key_id" {
  description = "ID of the RDS KMS key"
  value       = aws_kms_key.rds_key.id
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}
