# Terraform Multi-Environment Infrastructure Implementation

Complete Terraform HCL implementation for multi-environment infrastructure deployment with modular architecture.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "rds_instance_class" {
  description = "RDS Aurora instance class"
  type        = string
}

variable "rds_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env-infra"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "multi-env-infra"
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = module.database.cluster_reader_endpoint
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.compute.lambda_function_arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.compute.lambda_function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}
```

## File: backend.tf

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-multi-env"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true

    # Workspace-based state separation
    workspace_key_prefix = "workspaces"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        Environment = var.environment_suffix
        Workspace   = terraform.workspace
      }
    )
  }
}
```

## File: main.tf

```hcl
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment_suffix    = var.environment_suffix
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "vpc"
    }
  )
}

# Database Module
module "database" {
  source = "./modules/database"

  environment_suffix         = var.environment_suffix
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  rds_instance_class         = var.rds_instance_class
  backup_retention_period    = var.rds_backup_retention_period

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "database"
    }
  )
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  environment_suffix    = var.environment_suffix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  lambda_memory_size    = var.lambda_memory_size
  lambda_timeout        = var.lambda_timeout
  dynamodb_table_arn    = aws_dynamodb_table.main.arn
  dynamodb_table_name   = aws_dynamodb_table.main.name

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "compute"
    }
  )
}

# DynamoDB Table
resource "aws_dynamodb_table" "main" {
  name           = "app-data-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Name        = "app-data-${var.environment_suffix}"
    }
  )
}
```

## File: dev.tfvars

```hcl
environment_suffix = "dev"
region             = "us-east-1"

# VPC Configuration
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]

# RDS Configuration
rds_instance_class         = "db.t3.micro"
rds_backup_retention_period = 1

# Lambda Configuration
lambda_memory_size = 128
lambda_timeout     = 30

# Tags
common_tags = {
  Environment = "dev"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "engineering"
}
```

## File: staging.tfvars

```hcl
environment_suffix = "staging"
region             = "us-east-1"

# VPC Configuration
vpc_cidr              = "10.1.0.0/16"
public_subnet_cidrs   = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs  = ["10.1.10.0/24", "10.1.11.0/24"]

# RDS Configuration
rds_instance_class         = "db.t3.small"
rds_backup_retention_period = 7

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 60

# Tags
common_tags = {
  Environment = "staging"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "engineering"
}
```

## File: prod.tfvars

```hcl
environment_suffix = "prod"
region             = "us-east-1"

# VPC Configuration
vpc_cidr              = "10.2.0.0/16"
public_subnet_cidrs   = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs  = ["10.2.10.0/24", "10.2.11.0/24"]

# RDS Configuration
rds_instance_class         = "db.m5.large"
rds_backup_retention_period = 30

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout     = 120

# Tags
common_tags = {
  Environment = "prod"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "operations"
}
```

## File: modules/vpc/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/vpc/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "public-subnet-${var.environment_suffix}-${count.index + 1}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "private-subnet-${var.environment_suffix}-${count.index + 1}"
      Type = "private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "nat-eip-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name = "nat-gateway-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.tags,
    {
      Name = "public-rt-${var.environment_suffix}"
    }
  )
}

# Public Route Table Association
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.tags,
    {
      Name = "private-rt-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Private Route Table Association
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn

  tags = merge(
    var.tags,
    {
      Name = "vpc-flow-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "vpc-flow-logs-${var.environment_suffix}"
    }
  )
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

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

  tags = merge(
    var.tags,
    {
      Name = "vpc-flow-logs-role-${var.environment_suffix}"
    }
  )
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  name = "vpc-flow-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.flow_logs.id

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
        Resource = "*"
      }
    ]
  })
}
```

## File: modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## File: modules/database/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for RDS"
  type        = list(string)
}

variable "rds_instance_class" {
  description = "RDS Aurora instance class"
  type        = string
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/database/main.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "rds-subnet-group-${var.environment_suffix}"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
    }
  )
}

# Data source for VPC
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Random password for RDS
resource "random_password" "master" {
  length  = 32
  special = true
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.3"
  database_name           = "appdb"
  master_username         = "dbadmin"
  master_password         = random_password.master.result
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  tags = merge(
    var.tags,
    {
      Name = "aurora-cluster-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.rds_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = merge(
    var.tags,
    {
      Name = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Secrets Manager Secret for RDS credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "rds-credentials-${var.environment_suffix}"
  description = "RDS Aurora cluster credentials"

  tags = merge(
    var.tags,
    {
      Name = "rds-credentials-${var.environment_suffix}"
    }
  )
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = aws_rds_cluster.main.master_password
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.main.database_name
  })
}
```

## File: modules/database/outputs.tf

```hcl
output "cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.main.id
}

output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "RDS cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}
```

## File: modules/compute/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda"
  type        = list(string)
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda in MB"
  type        = number
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/compute/main.tf

```hcl
# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "lambda-sg-${var.environment_suffix}"
    }
  )
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role-${var.environment_suffix}"

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

  tags = merge(
    var.tags,
    {
      Name = "lambda-execution-role-${var.environment_suffix}"
    }
  )
}

# IAM Policy for Lambda - VPC Access
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Policy for Lambda - DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda.id

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
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs" {
  name = "lambda-logs-policy-${var.environment_suffix}"
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
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/app-function-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "lambda-logs-${var.environment_suffix}"
    }
  )
}

# Lambda Function
resource "aws_lambda_function" "main" {
  filename         = "${path.module}/lambda/function.zip"
  function_name    = "app-function-${var.environment_suffix}"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256("${path.module}/lambda/function.zip")

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT       = var.environment_suffix
      DYNAMODB_TABLE    = var.dynamodb_table_name
      LOG_LEVEL         = "INFO"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "app-function-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.lambda_logs,
    aws_iam_role_policy.lambda_dynamodb,
    aws_iam_role_policy_attachment.lambda_vpc
  ]
}

# Lambda Function URL (for easy testing)
resource "aws_lambda_function_url" "main" {
  function_name      = aws_lambda_function.main.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["*"]
    max_age           = 300
  }
}
```

## File: modules/compute/outputs.tf

```hcl
output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_url" {
  description = "Lambda function URL"
  value       = aws_lambda_function_url.main.function_url
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda.arn
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "lambda_log_group_name" {
  description = "Lambda CloudWatch log group name"
  value       = aws_cloudwatch_log_group.lambda.name
}
```

## File: modules/compute/lambda/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Initialize logger
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(log_level)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function handler for processing requests
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Get environment information
        environment = os.environ.get('ENVIRONMENT', 'unknown')

        # Extract request information
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')

        if http_method == 'GET':
            # Handle GET request - retrieve data
            response = handle_get_request(event)
        elif http_method == 'POST':
            # Handle POST request - store data
            response = handle_post_request(event)
        else:
            response = {
                'statusCode': 405,
                'body': json.dumps({
                    'error': 'Method not allowed'
                })
            }

        logger.info(f"Response: {json.dumps(response)}")
        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_get_request(event):
    """
    Handle GET request - retrieve items from DynamoDB
    """
    try:
        # Scan table for items
        response = table.scan(Limit=10)
        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'count': len(items),
                'items': items,
                'environment': os.environ.get('ENVIRONMENT')
            })
        }
    except Exception as e:
        logger.error(f"Error retrieving items: {str(e)}")
        raise

def handle_post_request(event):
    """
    Handle POST request - store item in DynamoDB
    """
    try:
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)

        # Generate item ID and timestamp
        item_id = f"{datetime.utcnow().timestamp()}"
        timestamp = int(datetime.utcnow().timestamp())

        # Create item
        item = {
            'id': item_id,
            'timestamp': timestamp,
            'data': body,
            'environment': os.environ.get('ENVIRONMENT')
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Item created successfully',
                'item_id': item_id,
                'environment': os.environ.get('ENVIRONMENT')
            })
        }
    except Exception as e:
        logger.error(f"Error storing item: {str(e)}")
        raise
```

## File: modules/compute/lambda/build.sh

```bash
#!/bin/bash

# Script to build Lambda deployment package

set -e

echo "Building Lambda deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy Lambda code
cp index.py "$TEMP_DIR/"

# Create zip file
cd "$TEMP_DIR"
zip -r function.zip index.py

# Move zip to module directory
mv function.zip "$(dirname "$0")/function.zip"

# Cleanup
rm -rf "$TEMP_DIR"

echo "Lambda deployment package created: function.zip"
```

## File: lib/README.md

```markdown
# Multi-Environment Terraform Infrastructure

This Terraform configuration deploys identical infrastructure across three environments (development, staging, production) using a modular architecture with Terraform workspaces for environment isolation.

## Architecture Overview

### Components

- **VPC Module**: Creates VPC with public and private subnets across 2 availability zones
- **Database Module**: Deploys RDS Aurora PostgreSQL cluster with environment-specific instance sizing
- **Compute Module**: Provisions Lambda functions with VPC integration
- **DynamoDB**: On-demand billing NoSQL database for application data

### Environment Configuration

| Environment | VPC CIDR      | RDS Instance    | Lambda Memory | Backup Retention |
|-------------|---------------|-----------------|---------------|------------------|
| Development | 10.0.0.0/16   | db.t3.micro     | 128 MB        | 1 day            |
| Staging     | 10.1.0.0/16   | db.t3.small     | 256 MB        | 7 days           |
| Production  | 10.2.0.0/16   | db.m5.large     | 512 MB        | 30 days          |

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create:
  - VPC and networking resources
  - RDS Aurora clusters
  - Lambda functions
  - DynamoDB tables
  - IAM roles and policies
  - S3 buckets (for state)

## Setup Instructions

### 1. Backend Configuration

First, create the S3 bucket and DynamoDB table for remote state management:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket terraform-state-multi-env \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket terraform-state-multi-env \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket terraform-state-multi-env \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Build Lambda Deployment Package

```bash
cd modules/compute/lambda
chmod +x build.sh
./build.sh
cd ../../..
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Create Workspaces

```bash
# Create development workspace
terraform workspace new dev

# Create staging workspace
terraform workspace new staging

# Create production workspace
terraform workspace new prod
```

## Deployment

### Deploy to Development

```bash
# Select development workspace
terraform workspace select dev

# Plan deployment
terraform plan -var-file="dev.tfvars"

# Apply configuration
terraform apply -var-file="dev.tfvars"
```

### Deploy to Staging

```bash
# Select staging workspace
terraform workspace select staging

# Plan deployment
terraform plan -var-file="staging.tfvars"

# Apply configuration
terraform apply -var-file="staging.tfvars"
```

### Deploy to Production

```bash
# Select production workspace
terraform workspace select prod

# Plan deployment
terraform plan -var-file="prod.tfvars"

# Apply configuration
terraform apply -var-file="prod.tfvars"
```

## Workspace Management

### View Current Workspace

```bash
terraform workspace show
```

### List All Workspaces

```bash
terraform workspace list
```

### Switch Between Workspaces

```bash
terraform workspace select <workspace-name>
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-${var.environment_suffix}`

Examples:
- VPC: `vpc-dev`, `vpc-staging`, `vpc-prod`
- RDS Cluster: `aurora-cluster-dev`, `aurora-cluster-staging`, `aurora-cluster-prod`
- Lambda: `app-function-dev`, `app-function-staging`, `app-function-prod`
- DynamoDB: `app-data-dev`, `app-data-staging`, `app-data-prod`

## Module Structure

```
.
├── backend.tf              # S3 backend configuration
├── provider.tf             # AWS provider configuration
├── variables.tf            # Root variables
├── outputs.tf              # Root outputs
├── main.tf                 # Root configuration
├── dev.tfvars              # Development variables
├── staging.tfvars          # Staging variables
├── prod.tfvars             # Production variables
└── modules/
    ├── vpc/                # VPC networking module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── database/           # RDS Aurora module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── compute/            # Lambda compute module
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── lambda/
            ├── index.py
            ├── build.sh
            └── function.zip
```

## Outputs

After deployment, Terraform will output:

- **VPC ID**: VPC identifier
- **Subnet IDs**: Public and private subnet identifiers
- **RDS Endpoints**: Database cluster endpoint and reader endpoint
- **Lambda ARN**: Lambda function ARN
- **Lambda URL**: Function URL for testing
- **DynamoDB Table**: Table name and ARN

### View Outputs

```bash
terraform output
```

## Testing Lambda Function

The Lambda function is exposed via Function URL. Test it using curl:

```bash
# Get Lambda URL from outputs
LAMBDA_URL=$(terraform output -raw lambda_function_url)

# Test GET request
curl -X GET "$LAMBDA_URL"

# Test POST request
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello from Lambda"}'
```

## Cleanup

To destroy infrastructure for a specific environment:

```bash
# Select workspace
terraform workspace select <environment>

# Destroy resources
terraform destroy -var-file="<environment>.tfvars"
```

**Note**: Always destroy environments in reverse order: prod → staging → dev

## Security Considerations

1. **RDS Credentials**: Stored in AWS Secrets Manager, retrieve using:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id rds-credentials-<environment> \
     --query SecretString --output text
   ```

2. **Lambda IAM Role**: Follows least-privilege with specific permissions for:
   - DynamoDB access (GetItem, PutItem, UpdateItem, Query, Scan)
   - CloudWatch Logs
   - VPC networking

3. **Network Isolation**: Lambda runs in private subnets with no direct internet access

4. **Encryption**: All data encrypted at rest (RDS, DynamoDB, S3)

## Troubleshooting

### Lambda Build Issues

If Lambda deployment fails:
```bash
cd modules/compute/lambda
rm -f function.zip
./build.sh
```

### State Lock Issues

If state is locked:
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Workspace Conflicts

If workspace already exists:
```bash
# Delete workspace (must be empty)
terraform workspace delete <workspace-name>
```

## Cost Optimization

- **Development**: Uses smallest instance sizes (db.t3.micro, 128MB Lambda)
- **Staging**: Medium instance sizes for realistic testing
- **Production**: Sized for production workload (db.m5.large, 512MB Lambda)
- **DynamoDB**: On-demand billing scales with usage
- **Aurora**: Serverless v2 scaling enabled for cost efficiency

## Maintenance

### Update Lambda Code

1. Modify `modules/compute/lambda/index.py`
2. Rebuild package: `cd modules/compute/lambda && ./build.sh`
3. Apply changes: `terraform apply -var-file="<env>.tfvars"`

### Update Module Configuration

1. Modify module variables in tfvars files
2. Plan changes: `terraform plan -var-file="<env>.tfvars"`
3. Apply if acceptable: `terraform apply -var-file="<env>.tfvars"`

## Support

For issues or questions:
1. Check Terraform logs: `TF_LOG=DEBUG terraform apply`
2. Review AWS CloudWatch logs for Lambda errors
3. Verify IAM permissions and VPC configuration

## References

- [Terraform Workspaces](https://www.terraform.io/docs/language/state/workspaces.html)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [RDS Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Lambda Python Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
```
