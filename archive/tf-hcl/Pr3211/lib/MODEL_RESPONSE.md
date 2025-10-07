### Reasoning Trace
---

Let me plan out a comprehensive Terraform file that meets all the requirements stated. I'll structure the file in a logical manner, covering all the components required for a secure, multi-region deployment.

Here's the outline of how I'll structure the file:

1. Terraform and Provider Version Constraints
2. Variables with appropriate defaults, types, and descriptions
3. Locals for name conventions, regional configurations, and tag maps
4. VPC and Networking Resources for both regions
5. Security Groups 
6. S3 Buckets with KMS Encryption
7. KMS Keys for various services
8. IAM Roles and Policies
9. EC2 Instances and ALB
10. RDS Instances
11. Lambda Functions
12. CloudWatch Log Groups
13. VPC Flow Logs
14. Outputs

Let's begin implementing each section in detail:

```terraform
# Terraform version constraints
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "Primary AWS region for deployment (required by provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Name of the application"
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
  description = "CIDR block for the us-east-1 VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_us_west_2" {
  description = "CIDR block for the us-west-2 VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "public_subnet_cidrs_us_east_1" {
  description = "CIDR blocks for public subnets in us-east-1 (map of AZ to CIDR)"
  type        = map(string)
  default = {
    "us-east-1a" = "10.0.1.0/24"
    "us-east-1b" = "10.0.2.0/24"
  }
}

variable "private_subnet_cidrs_us_east_1" {
  description = "CIDR blocks for private subnets in us-east-1 (map of AZ to CIDR)"
  type        = map(string)
  default = {
    "us-east-1a" = "10.0.11.0/24"
    "us-east-1b" = "10.0.12.0/24"
  }
}

variable "public_subnet_cidrs_us_west_2" {
  description = "CIDR blocks for public subnets in us-west-2 (map of AZ to CIDR)"
  type        = map(string)
  default = {
    "us-west-2a" = "10.1.1.0/24"
    "us-west-2b" = "10.1.2.0/24"
  }
}

variable "private_subnet_cidrs_us_west_2" {
  description = "CIDR blocks for private subnets in us-west-2 (map of AZ to CIDR)"
  type        = map(string)
  default = {
    "us-west-2a" = "10.1.11.0/24"
    "us-west-2b" = "10.1.12.0/24"
  }
}

variable "allowed_ingress_cidrs" {
  description = "List of CIDR blocks allowed to access the ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: This should be restricted in production
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
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "backup_retention_days" {
  description = "Number of days to retain RDS backups"
  type        = number
  default     = 7
}

variable "s3_bucket_name_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "tap-app"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda function zip file"
  type        = string
  default     = "function.zip"
}

variable "lambda_handler" {
  description = "Handler for the Lambda function"
  type        = string
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Runtime for the Lambda function"
  type        = string
  default     = "nodejs18.x"
}

variable "enable_https" {
  description = "Whether to enable HTTPS on the ALB"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS (required if enable_https is true)"
  type        = string
  default     = null
}

variable "app_port" {
  description = "Port on which the application listens"
  type        = number
  default     = 8080
}

variable "one_nat_gateway_per_region" {
  description = "Whether to deploy one NAT Gateway per region (true) or one per AZ (false)"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "enable_bastion" {
  description = "Whether to deploy a bastion host"
  type        = bool
  default     = false
}

variable "bastion_allowed_cidrs" {
  description = "List of CIDR blocks allowed to access the bastion host"
  type        = list(string)
  default     = []
}

# Locals
locals {
  regions = ["us-east-1", "us-west-2"]
  
  # Map of regions to providers
  region_providers = {
    "us-east-1" = aws.us_east_1
    "us-west-2" = aws.us_west_2
  }
  
  # Regional VPC CIDRs
  vpc_cidrs = {
    "us-east-1" = var.vpc_cidr_us_east_1
    "us-west-2" = var.vpc_cidr_us_west_2
  }
  
  # Regional subnet CIDRs
  public_subnet_cidrs = {
    "us-east-1" = var.public_subnet_cidrs_us_east_1
    "us-west-2" = var.public_subnet_cidrs_us_west_2
  }
  
  private_subnet_cidrs = {
    "us-east-1" = var.private_subnet_cidrs_us_east_1
    "us-west-2" = var.private_subnet_cidrs_us_west_2
  }
  
  # S3 bucket names
  s3_bucket_names = {
    "us-east-1" = "${var.s3_bucket_name_prefix}-east1-${random_id.this.hex}"
    "us-west-2" = "${var.s3_bucket_name_prefix}-west2-${random_id.this.hex}"
  }
  
  # Key aliases
  kms_s3_alias = {
    "us-east-1" = "alias/${var.app_name}-s3-east1"
    "us-west-2" = "alias/${var.app_name}-s3-west2"
  }
  
  kms_lambda_alias = {
    "us-east-1" = "alias/${var.app_name}-lambda-east1"
    "us-west-2" = "alias/${var.app_name}-lambda-west2"
  }
  
  kms_rds_alias = {
    "us-east-1" = "alias/${var.app_name}-rds-east1"
    "us-west-2" = "alias/${var.app_name}-rds-west2"
  }
  
  kms_logs_alias = {
    "us-east-1" = "alias/${var.app_name}-logs-east1"
    "us-west-2" = "alias/${var.app_name}-logs-west2"
  }
}

# Random ID for unique resource names
resource "random_id" "this" {
  byte_length = 4
}

# VPC and Networking Resources
# US East 1
resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.vpc_cidrs["us-east-1"]
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-vpc-east1"
  })
}

resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-igw-east1"
  })
}

resource "aws_subnet" "public_us_east_1" {
  provider                = aws.us_east_1
  for_each                = var.public_subnet_cidrs_us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-public-subnet-${each.key}"
    Type = "Public"
  })
}

resource "aws_subnet" "private_us_east_1" {
  provider          = aws.us_east_1
  for_each          = var.private_subnet_cidrs_us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = each.value
  availability_zone = each.key
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-private-subnet-${each.key}"
    Type = "Private"
  })
}

resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  for_each = var.one_nat_gateway_per_region ? { "${keys(var.public_subnet_cidrs_us_east_1)[0]}" = true } : var.public_subnet_cidrs_us_east_1
  domain   = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-nat-eip-${each.key}"
  })
}

resource "aws_nat_gateway" "us_east_1" {
  provider      = aws.us_east_1
  for_each      = var.one_nat_gateway_per_region ? { "${keys(var.public_subnet_cidrs_us_east_1)[0]}" = true } : var.public_subnet_cidrs_us_east_1
  allocation_id = aws_eip.nat_us_east_1[each.key].id
  subnet_id     = aws_subnet.public_us_east_1[each.key].id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-nat-${each.key}"
  })
  
  depends_on = [aws_internet_gateway.us_east_1]
}

resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-public-rt-east1"
  })
}

resource "aws_route_table" "private_us_east_1" {
  provider = aws.us_east_1
  for_each = var.one_nat_gateway_per_region ? { "single" = keys(var.public_subnet_cidrs_us_east_1)[0] } : var.private_subnet_cidrs_us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.us_east_1[each.value].id : aws_nat_gateway.us_east_1[each.key].id
  }
  
  tags = merge(var.common_tags, {
    Name = var.one_nat_gateway_per_region ? "${var.app_name}-private-rt-east1" : "${var.app_name}-private-rt-${each.key}"
  })
}

resource "aws_route_table_association" "public_us_east_1" {
  provider       = aws.us_east_1
  for_each       = var.public_subnet_cidrs_us_east_1
  subnet_id      = aws_subnet.public_us_east_1[each.key].id
  route_table_id = aws_route_table.public_us_east_1.id
}

resource "aws_route_table_association" "private_us_east_1" {
  provider       = aws.us_east_1
  for_each       = var.private_subnet_cidrs_us_east_1
  subnet_id      = aws_subnet.private_us_east_1[each.key].id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_east_1["single"].id : aws_route_table.private_us_east_1[each.key].id
}

# US West 2
resource "aws_vpc" "us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = local.vpc_cidrs["us-west-2"]
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-vpc-west2"
  })
}

resource "aws_internet_gateway" "us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-igw-west2"
  })
}

resource "aws_subnet" "public_us_west_2" {
  provider                = aws.us_west_2
  for_each                = var.public_subnet_cidrs_us_west_2
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-public-subnet-${each.key}"
    Type = "Public"
  })
}

resource "aws_subnet" "private_us_west_2" {
  provider          = aws.us_west_2
  for_each          = var.private_subnet_cidrs_us_west_2
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = each.value
  availability_zone = each.key
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-private-subnet-${each.key}"
    Type = "Private"
  })
}

resource "aws_eip" "nat_us_west_2" {
  provider = aws.us_west_2
  for_each = var.one_nat_gateway_per_region ? { "${keys(var.public_subnet_cidrs_us_west_2)[0]}" = true } : var.public_subnet_cidrs_us_west_2
  domain   = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-nat-eip-${each.key}"
  })
}

resource "aws_nat_gateway" "us_west_2" {
  provider      = aws.us_west_2
  for_each      = var.one_nat_gateway_per_region ? { "${keys(var.public_subnet_cidrs_us_west_2)[0]}" = true } : var.public_subnet_cidrs_us_west_2
  allocation_id = aws_eip.nat_us_west_2[each.key].id
  subnet_id     = aws_subnet.public_us_west_2[each.key].id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-nat-${each.key}"
  })
  
  depends_on = [aws_internet_gateway.us_west_2]
}

resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_west_2.id
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-public-rt-west2"
  })
}

resource "aws_route_table" "private_us_west_2" {
  provider = aws.us_west_2
  for_each = var.one_nat_gateway_per_region ? { "single" = keys(var.public_subnet_cidrs_us_west_2)[0] } : var.private_subnet_cidrs_us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.us_west_2[each.value].id : aws_nat_gateway.us_west_2[each.key].id
  }
  
  tags = merge(var.common_tags, {
    Name = var.one_nat_gateway_per_region ? "${var.app_name}-private-rt-west2" : "${var.app_name}-private-rt-${each.key}"
  })
}

resource "aws_route_table_association" "public_us_west_2" {
  provider       = aws.us_west_2
  for_each       = var.public_subnet_cidrs_us_west_2
  subnet_id      = aws_subnet.public_us_west_2[each.key].id
  route_table_id = aws_route_table.public_us_west_2.id
}

resource "aws_route_table_association" "private_us_west_2" {
  provider       = aws.us_west_2
  for_each       = var.private_subnet_cidrs_us_west_2
  subnet_id      = aws_subnet.private_us_west_2[each.key].id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_west_2["single"].id : aws_route_table.private_us_west_2[each.key].id
}

# Security Groups
# US East 1
resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-alb-sg-east1"
  description = "Security group for ALB in us-east-1"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-alb-sg-east1"
  })
}

resource "aws_security_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-app-sg-east1"
  description = "Security group for application instances in us-east-1"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-app-sg-east1"
  })
}

resource "aws_security_group" "db_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-db-sg-east1"
  description = "Security group for RDS instances in us-east-1"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_east_1.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-db-sg-east1"
  })
}

resource "aws_security_group" "bastion_us_east_1" {
  count       = var.enable_bastion ? 1 : 0
  provider    = aws.us_east_1
  name        = "${var.app_name}-bastion-sg-east1"
  description = "Security group for bastion host in us-east-1"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidrs
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-bastion-sg-east1"
  })
}

# US West 2
resource "aws_security_group" "alb_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-alb-sg-west2"
  description = "Security group for ALB in us-west-2"
  vpc_id      = aws_vpc.us_west_2.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-alb-sg-west2"
  })
}

resource "aws_security_group" "app_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-app-sg-west2"
  description = "Security group for application instances in us-west-2"
  vpc_id      = aws_vpc.us_west_2.id
  
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_west_2.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-app-sg-west2"
  })
}

resource "aws_security_group" "db_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-db-sg-west2"
  description = "Security group for RDS instances in us-west-2"
  vpc_id      = aws_vpc.us_west_2.id
  
  ingress {
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_west_2.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-db-sg-west2"
  })
}

resource "aws_security_group" "bastion_us_west_2" {
  count       = var.enable_bastion ? 1 : 0
  provider    = aws.us_west_2
  name        = "${var.app_name}-bastion-sg-west2"
  description = "Security group for bastion host in us-west-2"
  vpc_id      = aws_vpc.us_west_2.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidrs
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-bastion-sg-west2"
  })
}

# KMS Keys
# US East 1
resource "aws_kms_key" "s3_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS key for S3 encryption in us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow S3 to use the key"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow EC2 role to use the key"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.ec2_us_east_1.arn }
        Action    = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-s3-kms-east1"
  })
}

resource "aws_kms_alias" "s3_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_s3_alias["us-east-1"]
  target_key_id = aws_kms_key.s3_us_east_1.key_id
}

resource "aws_kms_key" "lambda_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS key for Lambda encryption in us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow Lambda to use the key"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow Lambda role to use the key"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.lambda_us_east_1.arn }
        Action    = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-kms-east1"
  })
}

resource "aws_kms_alias" "lambda_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_lambda_alias["us-east-1"]
  target_key_id = aws_kms_key.lambda_us_east_1.key_id
}

resource "aws_kms_key" "rds_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS key for RDS encryption in us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow RDS to use the key"
        Effect    = "Allow"
        Principal = { Service = "rds.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-rds-kms-east1"
  })
}

resource "aws_kms_alias" "rds_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_rds_alias["us-east-1"]
  target_key_id = aws_kms_key.rds_us_east_1.key_id
}

resource "aws_kms_key" "logs_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS key for CloudWatch Logs encryption in us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch to use the key"
        Effect    = "Allow"
        Principal = { Service = "logs.us-east-1.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = [
              "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:*"
            ]
          }
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-logs-kms-east1"
  })
}

resource "aws_kms_alias" "logs_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_logs_alias["us-east-1"]
  target_key_id = aws_kms_key.logs_us_east_1.key_id
}

# US West 2
resource "aws_kms_key" "s3_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS key for S3 encryption in us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow S3 to use the key"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow EC2 role to use the key"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.ec2_us_west_2.arn }
        Action    = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-s3-kms-west2"
  })
}

resource "aws_kms_alias" "s3_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_s3_alias["us-west-2"]
  target_key_id = aws_kms_key.s3_us_west_2.key_id
}

resource "aws_kms_key" "lambda_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS key for Lambda encryption in us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow Lambda to use the key"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow Lambda role to use the key"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.lambda_us_west_2.arn }
        Action    = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-kms-west2"
  })
}

resource "aws_kms_alias" "lambda_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_lambda_alias["us-west-2"]
  target_key_id = aws_kms_key.lambda_us_west_2.key_id
}

resource "aws_kms_key" "rds_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS key for RDS encryption in us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow RDS to use the key"
        Effect    = "Allow"
        Principal = { Service = "rds.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-rds-kms-west2"
  })
}

resource "aws_kms_alias" "rds_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_rds_alias["us-west-2"]
  target_key_id = aws_kms_key.rds_us_west_2.key_id
}

resource "aws_kms_key" "logs_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS key for CloudWatch Logs encryption in us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch to use the key"
        Effect    = "Allow"
        Principal = { Service = "logs.us-west-2.amazonaws.com" }
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = [
              "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:*"
            ]
          }
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-logs-kms-west2"
  })
}

resource "aws_kms_alias" "logs_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_logs_alias["us-west-2"]
  target_key_id = aws_kms_key.logs_us_west_2.key_id
}

# S3 Buckets
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = local.s3_bucket_names["us-east-1"]
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-bucket-east1"
  })
}

resource "aws_s3_bucket_versioning" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.app_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  
  rule {
    id     = "cleanup-noncurrent"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = local.s3_bucket_names["us-west-2"]
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-bucket-west2"
  })
}

resource "aws_s3_bucket_versioning" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_us_west_2" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.app_us_west_2.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  
  rule {
    id     = "cleanup-noncurrent"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# IAM Roles and Policies
# US East 1 - EC2 Role
resource "aws_iam_role" "ec2_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-ec2-role-east1"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-ec2-role-east1"
  })
}

resource "aws_iam_policy" "ec2_s3_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-ec2-s3-policy-east1"
  description = "Policy allowing EC2 instances to access the S3 bucket in us-east-1"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
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
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_us_east_1.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-ec2-s3-policy-east1"
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.ec2_us_east_1.name
  policy_arn = aws_iam_policy.ec2_s3_us_east_1.arn
}

resource "aws_iam_instance_profile" "ec2_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-ec2-profile-east1"
  role     = aws_iam_role.ec2_us_east_1.name
}

# US West 2 - EC2 Role
resource "aws_iam_role" "ec2_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-ec2-role-west2"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-ec2-role-west2"
  })
}

resource "aws_iam_policy" "ec2_s3_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-ec2-s3-policy-west2"
  description = "Policy allowing EC2 instances to access the S3 bucket in us-west-2"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
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
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_us_west_2.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-ec2-s3-policy-west2"
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_us_west_2.name
  policy_arn = aws_iam_policy.ec2_s3_us_west_2.arn
}

resource "aws_iam_instance_profile" "ec2_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-ec2-profile-west2"
  role     = aws_iam_role.ec2_us_west_2.name
}

# US East 1 - Lambda Role
resource "aws_iam_role" "lambda_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-lambda-role-east1"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-role-east1"
  })
}

resource "aws_iam_policy" "lambda_logs_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-lambda-logs-policy-east1"
  description = "Policy allowing Lambda to write to CloudWatch Logs in us-east-1"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_us_east_1.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.lambda_us_east_1.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-logs-policy-east1"
  })
}

resource "aws_iam_policy" "lambda_s3_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-lambda-s3-policy-east1"
  description = "Policy allowing Lambda to access the S3 bucket in us-east-1"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_us_east_1.arn,
          "${aws_s3_bucket.app_us_east_1.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_us_east_1.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-s3-policy-east1"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.lambda_us_east_1.name
  policy_arn = aws_iam_policy.lambda_logs_us_east_1.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.lambda_us_east_1.name
  policy_arn = aws_iam_policy.lambda_s3_us_east_1.arn
}

# US West 2 - Lambda Role
resource "aws_iam_role" "lambda_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-lambda-role-west2"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-role-west2"
  })
}

resource "aws_iam_policy" "lambda_logs_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-lambda-logs-policy-west2"
  description = "Policy allowing Lambda to write to CloudWatch Logs in us-west-2"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_us_west_2.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.lambda_us_west_2.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-logs-policy-west2"
  })
}

resource "aws_iam_policy" "lambda_s3_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-lambda-s3-policy-west2"
  description = "Policy allowing Lambda to access the S3 bucket in us-west-2"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_us_west_2.arn,
          "${aws_s3_bucket.app_us_west_2.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_us_west_2.arn
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-s3-policy-west2"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.lambda_us_west_2.name
  policy_arn = aws_iam_policy.lambda_logs_us_west_2.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.lambda_us_west_2.name
  policy_arn = aws_iam_policy.lambda_s3_us_west_2.arn
}

# VPC Flow Logs IAM Roles
resource "aws_iam_role" "flow_logs_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-flow-logs-role-east1"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-flow-logs-role-east1"
  })
}

resource "aws_iam_policy" "flow_logs_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-flow-logs-policy-east1"
  description = "Policy allowing VPC Flow Logs to write to CloudWatch Logs"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
### Answer 
---

