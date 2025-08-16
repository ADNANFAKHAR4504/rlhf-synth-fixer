# Configure S3 backend for remote state management
terraform {
  backend "s3" {
    # Backend configuration will be provided via command line arguments
    # bucket, key, region, encrypt, use_lockfile
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
  default     = "2025-08-16"
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
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-app"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for EC2 instances"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "ubRda3jFWlV4t42w"
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access EC2 instances via SSH"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
  default     = "ngwakoleslieelijah@example.com"
}

variable "region" {
  description = "AWS region (alias for aws_region)"
  type        = string
  default     = "us-east-1"
}

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating new one (recommended to avoid VPC limits)"
  type        = bool
  default     = false
}

variable "existing_vpc_id" {
  description = "ID of existing VPC to use (required if use_existing_vpc is true)"
  type        = string
  default     = ""

  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && var.existing_vpc_id != "")
    error_message = "existing_vpc_id must be provided when use_existing_vpc is true."
  }
}

variable "existing_public_subnet_ids" {
  description = "IDs of existing public subnets (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []

  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && length(var.existing_public_subnet_ids) >= 2)
    error_message = "At least 2 existing_public_subnet_ids must be provided when use_existing_vpc is true."
  }
}

variable "existing_private_subnet_ids" {
  description = "IDs of existing private subnets (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []

  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && length(var.existing_private_subnet_ids) >= 2)
    error_message = "At least 2 existing_private_subnet_ids must be provided when use_existing_vpc is true."
  }
}

# New variable to control RDS deployment
variable "deploy_rds" {
  description = "Whether to deploy RDS resources (set to false to avoid conflicts)"
  type        = bool
  default     = false  # Set to false initially to avoid conflicts
}

#######################
# Random Suffix for Unique Naming
#######################

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

#######################
# Locals
#######################

locals {
  # Use timestamp-based naming for complete uniqueness
  timestamp   = formatdate("DDHHmm", timestamp())
  name_prefix = "${var.project_name}-${var.environment}-${local.timestamp}-${random_string.suffix.result}"
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedBy   = var.author
    CreatedDate = var.created_date
    DeployTime  = local.timestamp
  }

  # Use existing VPC or create new one
  vpc_id              = var.use_existing_vpc ? var.existing_vpc_id : aws_vpc.main[0].id
  public_subnet_ids   = var.use_existing_vpc ? var.existing_public_subnet_ids : aws_subnet.public[*].id
  private_subnet_ids  = var.use_existing_vpc ? var.existing_private_subnet_ids : aws_subnet.private[*].id
  database_subnet_ids = var.use_existing_vpc ? var.existing_private_subnet_ids : aws_subnet.database[*].id
}

#######################
# Data Sources
#######################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_elb_service_account" "main" {}

data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

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
  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_vpc" "existing" {
  count = var.use_existing_vpc ? 1 : 0
  id    = var.existing_vpc_id
}

data "aws_subnet" "existing_public" {
  count = var.use_existing_vpc ? length(var.existing_public_subnet_ids) : 0
  id    = var.existing_public_subnet_ids[count.index]
}

data "aws_subnet" "existing_private" {
  count = var.use_existing_vpc ? length(var.existing_private_subnet_ids) : 0
  id    = var.existing_private_subnet_ids[count.index]
}

#######################
# VPC and Networking
#######################

resource "aws_vpc" "main" {
  count = var.use_existing_vpc ? 0 : 1

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "networking"
  })
}

resource "aws_internet_gateway" "main" {
  count  = var.use_existing_vpc ? 0 : 1
  vpc_id = aws_vpc.main[0].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
    Type = "networking"
  })
}

resource "aws_subnet" "public" {
  count = var.use_existing_vpc ? 0 : 2

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = var.use_existing_vpc ? 0 : 2

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    Tier = "application"
  })
}

resource "aws_subnet" "database" {
  count = (var.use_existing_vpc || !var.deploy_rds) ? 0 : 2

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "database-subnet"
    Tier = "database"
  })
}

resource "aws_route_table" "public" {
  count  = var.use_existing_vpc ? 0 : 1
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "networking"
  })
}

resource "aws_route_table_association" "public" {
  count          = var.use_existing_vpc ? 0 : 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_eip" "nat" {
  count  = var.use_existing_vpc ? 0 : 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
    Type = "networking"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.use_existing_vpc ? 0 : 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
    Type = "networking"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = var.use_existing_vpc ? 0 : 2
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    Type = "networking"
  })
}

resource "aws_route_table_association" "private" {
  count          = var.use_existing_vpc ? 0 : 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count          = (var.use_existing_vpc || !var.deploy_rds) ? 0 : 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

#######################
# KMS Keys
#######################

resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption - ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "Enable IAM User Permissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "Allow ELB to use the key for logging",
        Effect = "Allow",
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        },
        Action   = "kms:GenerateDataKey*",
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 to use the key for S3",
        Effect = "Allow",
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        },
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ],
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
    Type = "encryption"
  })
}

resource "aws_kms_alias" "s3_key" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS encryption - ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms-key"
    Type = "encryption"
  })
}

resource "aws_kms_alias" "ebs_key" {
  name          = "alias/${local.name_prefix}-ebs-key"
  target_key_id = aws_kms_key.ebs_key.key_id
}

# RDS KMS key - only create if RDS deployment is enabled
resource "aws_kms_key" "rds_key" {
  count = var.deploy_rds ? 1 : 0
  
  description             = "KMS key for RDS encryption - ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
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

resource "aws_kms_alias" "rds_key" {
  count = var.deploy_rds ? 1 : 0
  
  name          = "alias/${local.name_prefix}-rds-key"
  target_key_id = aws_kms_key.rds_key[0].key_id
}

#######################
# S3 Buckets
#######################

resource "aws_s3_bucket" "app_data" {
  bucket = "${local.name_prefix}-app-data"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-data-bucket"
    Type = "storage"
  })
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-logs-bucket"
    Type = "storage"
  })
}

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

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}



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

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowPutObject",
        Effect = "Allow",
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        },
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.alb_logs]
}

resource "aws_s3_bucket_policy" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_data]
}

#######################
# Security Groups
#######################

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer - ${local.name_prefix}"
  vpc_id      = local.vpc_id

  ingress {
    description = "HTTP traffic from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS traffic from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic to EC2 instances"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.use_existing_vpc ? data.aws_vpc.existing[0].cidr_block : var.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
    Type = "LoadBalancer"
  })
}

resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances - ${local.name_prefix}"
  vpc_id      = local.vpc_id

  ingress {
    description     = "HTTP traffic from ALB only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS traffic from ALB only"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH access from allowed CIDR blocks only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
    Type = "Compute"
  })
}

# RDS Security Group - only create if RDS deployment is enabled
resource "aws_security_group" "rds" {
  count = var.deploy_rds ? 1 : 0
  
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database - ${local.name_prefix}"
  vpc_id      = local.vpc_id

  ingress {
    description     = "MySQL/Aurora access from EC2 instances only"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
    Type = "Database"
  })
}

resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions - ${local.name_prefix}"
  vpc_id      = local.vpc_id

  egress {
    description = "HTTPS outbound for AWS API calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Database access to RDS"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.use_existing_vpc ? data.aws_vpc.existing[0].cidr_block : var.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
    Type = "Serverless"
  })
}

#######################
# IAM Roles and Policies
#######################

resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
    Type = "iam"
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-instance-profile"
    Type = "iam"
  })
}

resource "aws_iam_policy" "ec2_s3_access" {
  name        = "${local.name_prefix}-ec2-s3-policy"
  description = "Policy for EC2 instances to access S3 and KMS - ${local.name_prefix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      },
      {
        Sid    = "AllowKMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [aws_kms_key.s3_key.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_s3_access.arn
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "${local.name_prefix}-cloudwatch-logs-policy"
  description = "Policy for services to write to CloudWatch Logs - ${local.name_prefix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudWatchLogs"
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups"
      ]
      Resource = "arn:${data.aws_partition.current.partition}:logs:*:*:*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-role"
    Type = "iam"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

#######################
# Monitoring
#######################

resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-logs"
    Type = "Logging"
  })
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.name_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-logs"
    Type = "Logging"
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
    Type = "Notification"
  })
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = var.notification_email != "" && var.notification_email != null ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

#######################
# Application Load Balancer
#######################

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.public_subnet_ids

  enable_deletion_protection = var.environment == "prod" ? var.enable_deletion_protection : false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
    Type = "load-balancer"
  })

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = local.vpc_id

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-target-group"
    Type = "load-balancer"
  })
}

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
# EC2 Instances
#######################

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = aws_kms_key.ebs_key.arn
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd
    systemctl start httpd
    systemctl enable httpd
    
    echo "OK" > /var/www/html/health
    echo "<h1>Hello from ${var.project_name} ${var.environment} - ${local.timestamp}</h1>" > /var/www/html/index.html
    
    chown apache:apache /var/www/html/health
    chown apache:apache /var/www/html/index.html
    
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOL
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "${aws_cloudwatch_log_group.ec2_logs.name}",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      }
    }
    EOL
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
      -s
    
    echo "Instance setup completed at $(date)" >> /var/log/user-data.log
    EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-instance"
      Type = "compute"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-launch-template"
    Type = "compute"
  })
}

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-app-asg"
  vpc_zone_identifier = local.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  wait_for_capacity_timeout = "10m"
}

#######################
# RDS Database (Conditional)
#######################

resource "aws_db_subnet_group" "main" {
  count = var.deploy_rds ? 1 : 0
  
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = local.database_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
    Type = "database"
  })
}

resource "aws_db_instance" "main" {
  count = var.deploy_rds ? 1 : 0
  
  identifier = "${local.name_prefix}-database"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.environment == "prod" ? "db.t3.medium" : "db.t3.micro"

  allocated_storage     = var.environment == "prod" ? 100 : 20
  max_allocated_storage = var.environment == "prod" ? 1000 : 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_key[0].arn

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds[0].id]
  db_subnet_group_name   = aws_db_subnet_group.main[0].name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  multi_az            = var.environment == "prod" ? true : false
  publicly_accessible = false
  deletion_protection = var.environment == "prod" ? var.enable_deletion_protection : false

  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
    Type = "database"
  })
}

#######################
# CloudWatch Alarms
#######################

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "${local.name_prefix}-ec2-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-cpu-alarm"
    Type = "Monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  count = var.deploy_rds ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-cpu-alarm"
    Type = "Monitoring"
  })
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = concat(
            [
              ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name],
              ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
            ],
            var.deploy_rds ? [
              ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main[0].id]
            ] : []
          )
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "System Metrics"
        }
      }
    ]
  })
}

#######################
# Lambda Function
#######################

resource "aws_lambda_function" "app" {
  filename         = "lambda_function.zip"
  function_name    = "${local.name_prefix}-app-function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

  vpc_config {
    subnet_ids         = local.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      PROJECT_NAME = var.project_name
      RDS_ENDPOINT = var.deploy_rds ? aws_db_instance.main[0].endpoint : "none"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda"
    Type = "Serverless"
  })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_vpc_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content = <<EOF
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f'Event: {json.dumps(event)}')
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from ${var.project_name} ${var.environment} Lambda - ${local.timestamp}!',
            'event': event
        })
    }
EOF
    filename = "index.py"
  }
}

#######################
# S3 Lifecycle Configurations
#######################

resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "app_data_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "alb_logs_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = local.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = var.deploy_rds ? aws_db_instance.main[0].endpoint : "RDS not deployed"
  sensitive   = false
}

output "app_data_bucket_name" {
  description = "Name of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "alb_logs_bucket_name" {
  description = "Name of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.id
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb_sg    = aws_security_group.alb.id
    ec2_sg    = aws_security_group.ec2.id
    rds_sg    = var.deploy_rds ? aws_security_group.rds[0].id : "RDS not deployed"
    lambda_sg = aws_security_group.lambda.id
  }
}

output "resource_name_prefix" {
  description = "The name prefix used for all resources"
  value       = local.name_prefix
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    timestamp    = local.timestamp
    deploy_rds   = var.deploy_rds
    vpc_created  = !var.use_existing_vpc
    environment  = var.environment
  }
}