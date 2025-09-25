```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "Primary AWS region (used by provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "tap-app"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

variable "vpc_cidr_us_east_1" {
  description = "VPC CIDR for us-east-1"
  type        = string
  default     = "10.1.0.0/16"
}

variable "vpc_cidr_us_west_2" {
  description = "VPC CIDR for us-west-2"
  type        = string
  default     = "10.2.0.0/16"
}

variable "public_subnet_cidrs_us_east_1" {
  description = "Public subnet CIDRs for us-east-1"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "private_subnet_cidrs_us_east_1" {
  description = "Private subnet CIDRs for us-east-1"
  type        = list(string)
  default     = ["10.1.11.0/24", "10.1.12.0/24"]
}

variable "public_subnet_cidrs_us_west_2" {
  description = "Public subnet CIDRs for us-west-2"
  type        = list(string)
  default     = ["10.2.1.0/24", "10.2.2.0/24"]
}

variable "private_subnet_cidrs_us_west_2" {
  description = "Private subnet CIDRs for us-west-2"
  type        = list(string)
  default     = ["10.2.11.0/24", "10.2.12.0/24"]
}

variable "allowed_ingress_cidrs" {
  description = "List of CIDR blocks allowed to access ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict in production
}

variable "db_engine" {
  description = "RDS database engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS database engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
  sensitive   = false
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "backup_retention_days" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "s3_bucket_name_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "tap-app"
}

variable "lambda_zip_path" {
  description = "Path to Lambda function ZIP file"
  type        = string
  default     = "lambda.zip"
}

variable "lambda_handler" {
  description = "Lambda function handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "python3.11"
}

variable "enable_https" {
  description = "Enable HTTPS on ALB"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "app_port" {
  description = "Application port on EC2 instances"
  type        = number
  default     = 8080
}

variable "one_nat_gateway_per_region" {
  description = "Use only one NAT gateway per region (cost optimization)"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 30
}

variable "enable_bastion" {
  description = "Enable bastion host"
  type        = bool
  default     = false
}

variable "bastion_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH to bastion"
  type        = list(string)
  default     = []
}

# Locals
locals {
  regions = ["us-east-1", "us-west-2"]

  vpc_configs = {
    "us-east-1" = {
      cidr             = var.vpc_cidr_us_east_1
      public_subnets   = var.public_subnet_cidrs_us_east_1
      private_subnets  = var.private_subnet_cidrs_us_east_1
    }
    "us-west-2" = {
      cidr             = var.vpc_cidr_us_west_2
      public_subnets   = var.public_subnet_cidrs_us_west_2
      private_subnets  = var.private_subnet_cidrs_us_west_2
    }
  }

  common_tags = merge(var.common_tags, {
    Environment = "Production"
    Application = var.app_name
  })

  # Generate unique S3 bucket names
  s3_bucket_names = {
    "us-east-1" = "${var.s3_bucket_name_prefix}-${data.aws_caller_identity.current.account_id}-us-east-1"
    "us-west-2" = "${var.s3_bucket_name_prefix}-${data.aws_caller_identity.current.account_id}-us-west-2"
  }
}

# Data Sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "us_west_2" {
  provider = aws.us_west_2
  state    = "available"
}

# KMS Keys - US-EAST-1
resource "aws_kms_key" "main_us_east_1" {
  provider                = aws.us_east_1
  description             = "${var.app_name} encryption key for us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-kms-us-east-1"
  })
}

resource "aws_kms_alias" "main_us_east_1" {
  provider      = aws.us_east_1
  name          = "alias/${var.app_name}-us-east-1"
  target_key_id = aws_kms_key.main_us_east_1.id
}

# KMS Keys - US-WEST-2
resource "aws_kms_key" "main_us_west_2" {
  provider                = aws.us_west_2
  description             = "${var.app_name} encryption key for us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-kms-us-west-2"
  })
}

resource "aws_kms_alias" "main_us_west_2" {
  provider      = aws.us_west_2
  name          = "alias/${var.app_name}-us-west-2"
  target_key_id = aws_kms_key.main_us_west_2.id
}

# VPC - US-EAST-1
resource "aws_vpc" "main_us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.vpc_configs["us-east-1"].cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-us-east-1"
  })
}

# VPC - US-WEST-2
resource "aws_vpc" "main_us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = local.vpc_configs["us-west-2"].cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-us-west-2"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-igw-us-east-1"
  })
}

resource "aws_internet_gateway" "main_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.main_us_west_2.id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-igw-us-west-2"
  })
}

# Public Subnets - US-EAST-1
resource "aws_subnet" "public_us_east_1" {
  provider                = aws.us_east_1
  count                   = length(local.vpc_configs["us-east-1"].public_subnets)
  vpc_id                  = aws_vpc.main_us_east_1.id
  cidr_block              = local.vpc_configs["us-east-1"].public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.us_east_1.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-public-subnet-${count.index + 1}-us-east-1"
    Type = "Public"
  })
}

# Public Subnets - US-WEST-2
resource "aws_subnet" "public_us_west_2" {
  provider                = aws.us_west_2
  count                   = length(local.vpc_configs["us-west-2"].public_subnets)
  vpc_id                  = aws_vpc.main_us_west_2.id
  cidr_block              = local.vpc_configs["us-west-2"].public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.us_west_2.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-public-subnet-${count.index + 1}-us-west-2"
    Type = "Public"
  })
}

# Private Subnets - US-EAST-1
resource "aws_subnet" "private_us_east_1" {
  provider          = aws.us_east_1
  count             = length(local.vpc_configs["us-east-1"].private_subnets)
  vpc_id            = aws_vpc.main_us_east_1.id
  cidr_block        = local.vpc_configs["us-east-1"].private_subnets[count.index]
  availability_zone = data.aws_availability_zones.us_east_1.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-subnet-${count.index + 1}-us-east-1"
    Type = "Private"
  })
}

# Private Subnets - US-WEST-2
resource "aws_subnet" "private_us_west_2" {
  provider          = aws.us_west_2
  count             = length(local.vpc_configs["us-west-2"].private_subnets)
  vpc_id            = aws_vpc.main_us_west_2.id
  cidr_block        = local.vpc_configs["us-west-2"].private_subnets[count.index]
  availability_zone = data.aws_availability_zones.us_west_2.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-subnet-${count.index + 1}-us-west-2"
    Type = "Private"
  })
}

# EIPs for NAT Gateways - US-EAST-1
resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  count    = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.public_us_east_1)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-nat-eip-${count.index + 1}-us-east-1"
  })
}

# EIPs for NAT Gateways - US-WEST-2
resource "aws_eip" "nat_us_west_2" {
  provider = aws.us_west_2
  count    = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.public_us_west_2)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-nat-eip-${count.index + 1}-us-west-2"
  })
}

# NAT Gateways - US-EAST-1
resource "aws_nat_gateway" "main_us_east_1" {
  provider      = aws.us_east_1
  count         = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.public_us_east_1)
  allocation_id = aws_eip.nat_us_east_1[count.index].id
  subnet_id     = aws_subnet.public_us_east_1[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-nat-gateway-${count.index + 1}-us-east-1"
  })

  depends_on = [aws_internet_gateway.main_us_east_1]
}

# NAT Gateways - US-WEST-2
resource "aws_nat_gateway" "main_us_west_2" {
  provider      = aws.us_west_2
  count         = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.public_us_west_2)
  allocation_id = aws_eip.nat_us_west_2[count.index].id
  subnet_id     = aws_subnet.public_us_west_2[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-nat-gateway-${count.index + 1}-us-west-2"
  })

  depends_on = [aws_internet_gateway.main_us_west_2]
}

# Route Tables - US-EAST-1
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_us_east_1.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-public-rt-us-east-1"
  })
}

resource "aws_route_table" "private_us_east_1" {
  provider = aws.us_east_1
  count    = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.private_us_east_1)
  vpc_id   = aws_vpc.main_us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.main_us_east_1[0].id : aws_nat_gateway.main_us_east_1[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-rt-${count.index + 1}-us-east-1"
  })
}

# Route Tables - US-WEST-2
resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.main_us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_us_west_2.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-public-rt-us-west-2"
  })
}

resource "aws_route_table" "private_us_west_2" {
  provider = aws.us_west_2
  count    = var.one_nat_gateway_per_region ? 1 : length(aws_subnet.private_us_west_2)
  vpc_id   = aws_vpc.main_us_west_2.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.main_us_west_2[0].id : aws_nat_gateway.main_us_west_2[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-private-rt-${count.index + 1}-us-west-2"
  })
}

# Route Table Associations - US-EAST-1
resource "aws_route_table_association" "public_us_east_1" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.public_us_east_1)
  subnet_id      = aws_subnet.public_us_east_1[count.index].id
  route_table_id = aws_route_table.public_us_east_1.id
}

resource "aws_route_table_association" "private_us_east_1" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.private_us_east_1)
  subnet_id      = aws_subnet.private_us_east_1[count.index].id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_east_1[0].id : aws_route_table.private_us_east_1[count.index].id
}

# Route Table Associations - US-WEST-2
resource "aws_route_table_association" "public_us_west_2" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.public_us_west_2)
  subnet_id      = aws_subnet.public_us_west_2[count.index].id
  route_table_id = aws_route_table.public_us_west_2.id
}

resource "aws_route_table_association" "private_us_west_2" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.private_us_west_2)
  subnet_id      = aws_subnet.private_us_west_2[count.index].id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_west_2[0].id : aws_route_table.private_us_west_2[count.index].id
}

# VPC Flow Logs IAM Role
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.app_name}-vpc-flow-logs-role"

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

  tags = local.common_tags
}

# VPC Flow Logs IAM Policy - US-EAST-1
resource "aws_iam_role_policy" "vpc_flow_logs_us_east_1" {
  name = "${var.app_name}-vpc-flow-logs-policy-us-east-1"
  role = aws_iam_role.vpc_flow_logs.id

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
        Resource = [
          aws_cloudwatch_log_group.vpc_flow_logs_us_east_1.arn,
          "${aws_cloudwatch_log_group.vpc_flow_logs_us_east_1.arn}:*"
        ]
      }
    ]
  })
}

# VPC Flow Logs IAM Policy - US-WEST-2
resource "aws_iam_role_policy" "vpc_flow_logs_us_west_2" {
  name = "${var.app_name}-vpc-flow-logs-policy-us-west-2"
  role = aws_iam_role.vpc_flow_logs.id

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
        Resource = [
          aws_cloudwatch_log_group.vpc_flow_logs_us_west_2.arn,
          "${aws_cloudwatch_log_group.vpc_flow_logs_us_west_2.arn}:*"
        ]
      }
    ]
  })
}

# CloudWatch Log Groups for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/vpc/${var.app_name}-us-east-1"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main_us_east_1.arn

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-flow-logs-us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/vpc/${var.app_name}-us-west-2"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main_us_west_2.arn

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-flow-logs-us-west-2"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_us_east_1" {
  provider                 = aws.us_east_1
  iam_role_arn            = aws_iam_role.vpc_flow_logs.arn
  log_destination_type    = "cloud-watch-logs"
  log_destination         = aws_cloudwatch_log_group.vpc_flow_logs_us_east_1.arn
  traffic_type            = "ALL"
  vpc_id                  = aws_vpc.main_us_east_1.id
  max_aggregation_interval = 60

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-flow-log-us-east-1"
  })
}

resource "aws_flow_log" "vpc_us_west_2" {
  provider                 = aws.us_west_2
  iam_role_arn            = aws_iam_role.vpc_flow_logs.arn
  log_destination_type    = "cloud-watch-logs"
  log_destination         = aws_cloudwatch_log_group.vpc_flow_logs_us_west_2.arn
  traffic_type            = "ALL"
  vpc_id                  = aws_vpc.main_us_west_2.id
  max_aggregation_interval = 60

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-vpc-flow-log-us-west-2"
  })
}

# Security Groups - ALB - US-EAST-1
resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${var.app_name}-alb-"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main_us_east_1.id

  ingress {
    description = "HTTP from allowed CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      description = "HTTPS from allowed CIDRs"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }

  egress {
    description = "Allow outbound to app instances"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = local.vpc_configs["us-east-1"].private_subnets
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-sg-us-east-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups - ALB - US-WEST-2
resource "aws_security_group" "alb_us_west_2" {
  provider    = aws.us_west_2
  name_prefix = "${var.app_name}-alb-"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main_us_west_2.id

  ingress {
    description = "HTTP from allowed CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      description = "HTTPS from allowed CIDRs"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }

  egress {
    description = "Allow outbound to app instances"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = local.vpc_configs["us-west-2"].private_subnets
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-sg-us-west-2"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups - App - US-EAST-1
resource "aws_security_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${var.app_name}-app-"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main_us_east_1.id

  ingress {
    description     = "App port from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }

  egress {
    description = "HTTPS outbound for updates"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP outbound for updates"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-app-sg-us-east-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups - App - US-WEST-2
resource "aws_security_group" "app_us_west_2" {
  provider    = aws.us_west_2
  name_prefix = "${var.app_name}-app-"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main_us_west_2.id

  ingress {
    description     = "App port from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_west_2.id]
  }

  egress {
    description = "HTTPS outbound for updates"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP outbound for updates"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-app-sg-us-west-2"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups - Database - US-EAST-1
resource "aws_security_group" "db_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${var.app_name}-db-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main_us_east_1.id

  ingress {
    description     = "Database port from app instances"
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_east_1.id]
  }

  # No egress rules - database doesn't need outbound

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-sg-us-east-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups - Database - US-WEST-2
resource "aws_security_group" "db_us_west_2" {
  provider    = aws.us_west_2
  name_prefix = "${var.app_name}-db-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main_us_west_2.id

  ingress {
    description     = "Database port from app instances"
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_west_2.id]
  }

  # No egress rules - database doesn't need outbound

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-sg-us-west-2"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Buckets
resource "aws_s3_bucket" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = local.s3_bucket_names["us-east-1"]

  tags = merge(local.common_tags, {
    Name = local.s3_bucket_names["us-east-1"]
  })
}

resource "aws_s3_bucket" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = local.s3_bucket_names["us-west-2"]

  tags = merge(local.common_tags, {
    Name = local.s3_bucket_names["us-west-2"]
  })
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "app_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.app_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "app_us_west_2" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.app_us_west_2.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main_us_east_1.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main_us_west_2.arn
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Lifecycle Rules
resource "aws_s3_bucket_lifecycle_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_instance" {
  name = "${var.app_name}-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for EC2 S3 Access - US-EAST-1
resource "aws_iam_role_policy" "ec2_s3_access_us_east_1" {
  name = "${var.app_name}-ec2-s3-access-us-east-1"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_us_east_1.arn,
          "${aws_s3_bucket.app_us_east_1.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main_us_east_1.arn
      }
    ]
  })
}

# IAM Policy for EC2 S3 Access - US-WEST-2
resource "aws_iam_role_policy" "ec2_s3_access_us_west_2" {
  name = "${var.app_name}-ec2-s3-access-us-west-2"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_us_west_2.arn,
          "${aws_s3_bucket.app_us_west_2.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main_us_west_2.arn
      }
    ]
  })
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${var.app_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_instance.name

  tags = local.common_tags
}

# ALB - US-EAST-1
resource "aws_lb" "main_us_east_1" {
  provider           = aws.us_east_1
  name               = "${var.app_name}-alb-us-east-1"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_east_1.id]
  subnets            = aws_subnet.public_us_east_1[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-us-east-1"
  })
}

# ALB - US-WEST-2
resource "aws_lb" "main_us_west_2" {
  provider           = aws.us_west_2
  name               = "${var.app_name}-alb-us-west-2"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_west_2.id]
  subnets            = aws_subnet.public_us_west_2[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-alb-us-west-2"
  })
}

# Target Groups
resource "aws_lb_target_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-tg-us-east-1"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_us_east_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-tg-us-east-1"
  })
}

resource "aws_lb_target_group" "app_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-tg-us-west-2"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_us_west_2.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-tg-us-west-2"
  })
}

# ALB Listeners
resource "aws_lb_listener" "http_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.main_us_east_1.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_us_east_1.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-http-listener-us-east-1"
  })
}

resource "aws_lb_listener" "http_us_west_2" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.main_us_west_2.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_us_west_2.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-http-listener-us-west-2"
  })
}

# HTTPS Listeners (conditional)
resource "aws_lb_listener" "https_us_east_1" {
  provider          = aws.us_east_1
  count             = var.enable_https && var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main_us_east_1.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_us_east_1.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-https-listener-us-east-1"
  })
}

resource "aws_lb_listener" "https_us_west_2" {
  provider          = aws.us_west_2
  count             = var.enable_https && var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main_us_west_2.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_us_west_2.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-https-listener-us-west-2"
  })
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2_us_east_1" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_2_us_west_2" {
  provider    = aws.us_west_2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# EC2 Instances - US-EAST-1
resource "aws_instance" "app_us_east_1" {
  provider                    = aws.us_east_1
  count                       = 2
  ami                         = data.aws_ami.amazon_linux_2_us_east_1.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private_us_east_1[count.index % length(aws_subnet.private_us_east_1)].id
  vpc_security_group_ids      = [aws_security_group.app_us_east_1.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_instance.name
  associate_public_ip_address = false

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.app_name} in us-east-1 - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
    sed -i 's/Listen 80/Listen ${var.app_port}/' /etc/httpd/conf/httpd.conf
    systemctl restart httpd
  EOF
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.main_us_east_1.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-instance-${count.index + 1}-us-east-1"
  })
}

# EC2 Instances - US-WEST-2
resource "aws_instance" "app_us_west_2" {
  provider                    = aws.us_west_2
  count                       = 2
  ami                         = data.aws_ami.amazon_linux_2_us_west_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private_us_west_2[count.index % length(aws_subnet.private_us_west_2)].id
  vpc_security_group_ids      = [aws_security_group.app_us_west_2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_instance.name
  associate_public_ip_address = false

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.app_name} in us-west-2 - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
    sed -i 's/Listen 80/Listen ${var.app_port}/' /etc/httpd/conf/httpd.conf
    systemctl restart httpd
  EOF
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.main_us_west_2.arn
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-instance-${count.index + 1}-us-west-2"
  })
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "app_us_east_1" {
  provider         = aws.us_east_1
  count            = length(aws_instance.app_us_east_1)
  target_group_arn = aws_lb_target_group.app_us_east_1.arn
  target_id        = aws_instance.app_us_east_1[count.index].id
  port             = var.app_port
}

resource "aws_lb_target_group_attachment" "app_us_west_2" {
  provider         = aws.us_west_2
  count            = length(aws_instance.app_us_west_2)
  target_group_arn = aws_lb_target_group.app_us_west_2.arn
  target_id        = aws_instance.app_us_west_2[count.index].id
  port             = var.app_port
}

# DB Subnet Groups
resource "aws_db_subnet_group" "main_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-db-subnet-group-us-east-1"
  description = "DB subnet group for RDS"
  subnet_ids  = aws_subnet.private_us_east_1[*].id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-subnet-group-us-east-1"
  })
}

resource "aws_db_subnet_group" "main_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-db-subnet-group-us-west-2"
  description = "DB subnet group for RDS"
  subnet_ids  = aws_subnet.private_us_west_2[*].id

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-subnet-group-us-west-2"
  })
}

# RDS Instances
resource "aws_db_instance" "main_us_east_1" {
  provider                   = aws.us_east_1
  identifier                 = "${var.app_name}-db-us-east-1"
  engine                     = var.db_engine
  engine_version            = var.db_engine_version
  instance_class            = var.db_instance_class
  allocated_storage         = 20
  storage_type              = "gp3"
  storage_encrypted         = true
  kms_key_id               = aws_kms_key.main_us_east_1.arn
  db_subnet_group_name     = aws_db_subnet_group.main_us_east_1.name
  vpc_security_group_ids   = [aws_security_group.db_us_east_1.id]

  db_name  = "${replace(var.app_name, "-", "")}db"
  username = var.db_username
  password = var.db_password

  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-db-final-snapshot-us-east-1-${formatdate("YYYYMMDDHHmmss", timestamp())}"

  enabled_cloudwatch_logs_exports = var.db_engine == "postgres" ? ["postgresql"] : ["error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-us-east-1"
  })
}

resource "aws_db_instance" "main_us_west_2" {
  provider                   = aws.us_west_2
  identifier                 = "${var.app_name}-db-us-west-2"
  engine                     = var.db_engine
  engine_version            = var.db_engine_version
  instance_class            = var.db_instance_class
  allocated_storage         = 20
  storage_type              = "gp3"
  storage_encrypted         = true
  kms_key_id               = aws_kms_key.main_us_west_2.arn
  db_subnet_group_name     = aws_db_subnet_group.main_us_west_2.name
  vpc_security_group_ids   = [aws_security_group.db_us_west_2.id]

  db_name  = "${replace(var.app_name, "-", "")}db"
  username = var.db_username
  password = var.db_password

  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-db-final-snapshot-us-west-2-${formatdate("YYYYMMDDHHmmss", timestamp())}"

  enabled_cloudwatch_logs_exports = var.db_engine == "postgres" ? ["postgresql"] : ["error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-us-west-2"
  })
}

# Lambda IAM Role
resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# Lambda CloudWatch Logs Policy - US-EAST-1
resource "aws_iam_role_policy" "lambda_logs_us_east_1" {
  name = "${var.app_name}-lambda-logs-us-east-1"
  role = aws_iam_role.lambda.id

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
        Resource = [
          "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.app_name}-function-us-east-1",
          "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.app_name}-function-us-east-1:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main_us_east_1.arn
      }
    ]
  })
}

# Lambda CloudWatch Logs Policy - US-WEST-2
resource "aws_iam_role_policy" "lambda_logs_us_west_2" {
  name = "${var.app_name}-lambda-logs-us-west-2"
  role = aws_iam_role.lambda.id

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
        Resource = [
          "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.app_name}-function-us-west-2",
          "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.app_name}-function-us-west-2:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main_us_west_2.arn
      }
    ]
  })
}

# Lambda S3 Access Policy - US-EAST-1
resource "aws_iam_role_policy" "lambda_s3_us_east_1" {
  name = "${var.app_name}-lambda-s3-us-east-1"
  role = aws_iam_role.lambda
}
```
