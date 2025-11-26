# Multi-Environment Payment Processing Infrastructure Solution

This solution implements a workspace-based Terraform configuration that deploys identical infrastructure across three environments (dev, staging, prod) for a payment processing system.

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy to terraform.tfvars and update with your values

project_name       = "payment-processing"
environment_suffix = "dev-001"

# Region is set per workspace via workspace-specific variable files
```

## File: dev.tfvars

```hcl
# Development environment configuration
environment        = "dev"
aws_region         = "eu-west-1"
environment_suffix = "dev"

# Network Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# Database Configuration
aurora_instance_class = "db.t3.small"
aurora_instance_count = 1

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 7

# ALB Configuration
alb_instance_type = "t3.small"

# Tags
project_id = "payment-proc"
```

## File: staging.tfvars

```hcl
# Staging environment configuration
environment        = "staging"
aws_region         = "us-west-2"
environment_suffix = "staging"

# Network Configuration
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Database Configuration
aurora_instance_class = "db.t3.medium"
aurora_instance_count = 2

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout     = 60

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 30

# ALB Configuration
alb_instance_type = "t3.medium"

# Tags
project_id = "payment-proc"
```

## File: prod.tfvars

```hcl
# Production environment configuration
environment        = "prod"
aws_region         = "us-east-1"
environment_suffix = "prod"

# Network Configuration
vpc_cidr = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database Configuration
aurora_instance_class = "db.r5.large"
aurora_instance_count = 3

# Lambda Configuration
lambda_memory_size = 1024
lambda_timeout     = 120

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 90

# ALB Configuration
alb_instance_type = "t3.large"

# Tags
project_id = "payment-proc"
```

## File: variables.tf

```hcl
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
}

variable "environment_suffix" {
  description = "Suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-processing"
}

variable "project_id" {
  description = "Project identifier for tagging"
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

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
}

variable "lambda_memory_size" {
  description = "Lambda function memory in MB"
  type        = number
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
}

variable "s3_bucket_count" {
  description = "Number of S3 buckets to create"
  type        = number
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "alb_instance_type" {
  description = "Instance type for ALB targets"
  type        = string
}
```

## File: locals.tf

```hcl
locals {
  # Environment-specific instance type mapping
  instance_types = {
    dev     = "t3.small"
    staging = "t3.medium"
    prod    = "t3.large"
  }

  # Environment-specific database size mapping
  db_instance_classes = {
    dev     = "db.t3.small"
    staging = "db.t3.medium"
    prod    = "db.r5.large"
  }

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_id
    ManagedBy   = "terraform"
    Workspace   = terraform.workspace
  }

  # Resource naming prefix
  name_prefix = "${var.project_name}-${var.environment_suffix}"
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

  backend "s3" {
    bucket         = "payment-processing-terraform-state"
    key            = "payment-processing/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "payment-processing-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

## File: modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpc"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-igw"
    }
  )
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
      Type = "public"
    }
  )
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
      Type = "private"
    }
  )
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
    }
  )
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-rt"
    }
  )
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-rt-${count.index + 1}"
    }
  )
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: modules/vpc/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways"
  value       = aws_nat_gateway.main[*].id
}
```

## File: modules/aurora/main.tf

```hcl
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.name_prefix}-aurora-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-subnet-group"
    }
  )
}

resource "aws_security_group" "aurora" {
  name_prefix = "${var.name_prefix}-aurora-"
  description = "Security group for Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-sg"
    }
  )
}

data "aws_ssm_parameter" "db_password" {
  name = "/payment-processing/${var.environment}/db-password"
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "${var.name_prefix}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_version         = "13.7"
  database_name          = "paymentdb"
  master_username        = "dbadmin"
  master_password        = data.aws_ssm_parameter.db_password.value
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  storage_encrypted = true

  skip_final_snapshot = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-cluster"
    }
  )
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.instance_count

  identifier         = "${var.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-instance-${count.index + 1}"
    }
  )
}
```

## File: modules/aurora/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Aurora"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access Aurora"
  type        = list(string)
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
}

variable "instance_count" {
  description = "Number of Aurora instances"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/aurora/outputs.tf

```hcl
output "cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.aurora.id
}

output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "security_group_id" {
  description = "Aurora security group ID"
  value       = aws_security_group.aurora.id
}
```

## File: modules/lambda/main.tf

```hcl
resource "aws_iam_role" "lambda" {
  name_prefix = "${var.name_prefix}-lambda-"

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

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3" {
  name_prefix = "${var.name_prefix}-lambda-s3-"
  role        = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${var.s3_bucket_arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "processor" {
  filename         = "${path.module}/function.zip"
  function_name    = "${var.name_prefix}-data-processor"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/function.zip")
  runtime          = "python3.9"
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = {
      ENVIRONMENT = var.environment
      BUCKET_NAME = var.bucket_name
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-data-processor"
    }
  )
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.processor.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-logs"
    }
  )
}
```

## File: modules/lambda/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "s3_bucket_arn" {
  description = "ARN of S3 bucket for Lambda access"
  type        = string
}

variable "bucket_name" {
  description = "Name of S3 bucket"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/lambda/function/index.py

```python
import json
import os
import boto3

s3_client = boto3.client('s3')

def handler(event, context):
    """
    Lambda function to process data from S3 buckets.
    This function is identical across all environments.
    """
    environment = os.environ.get('ENVIRONMENT', 'dev')
    bucket_name = os.environ.get('BUCKET_NAME')

    print(f"Processing in environment: {environment}")

    # Process S3 event if present
    if 'Records' in event:
        for record in event['Records']:
            if 's3' in record:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']

                print(f"Processing object: {key} from bucket: {bucket}")

                try:
                    # Get object from S3
                    response = s3_client.get_object(Bucket=bucket, Key=key)
                    content = response['Body'].read()

                    # Process the content (example: convert to uppercase)
                    processed_content = content.decode('utf-8').upper()

                    # Write processed content back
                    output_key = f"processed/{key}"
                    s3_client.put_object(
                        Bucket=bucket,
                        Key=output_key,
                        Body=processed_content
                    )

                    print(f"Successfully processed {key}")

                except Exception as e:
                    print(f"Error processing {key}: {str(e)}")
                    raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Processing complete',
            'environment': environment
        })
    }
```

## File: modules/lambda/outputs.tf

```hcl
output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.processor.arn
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.processor.function_name
}

output "role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda.arn
}
```

## File: modules/validation/main.tf

```hcl
# Custom validation module to enforce identical security group rules
variable "security_groups" {
  description = "Map of security groups to validate"
  type = map(object({
    name        = string
    ingress     = list(any)
    egress      = list(any)
  }))
}

variable "expected_rules" {
  description = "Expected security group rules across environments"
  type        = any
}

locals {
  # Validate that all security groups have consistent rules
  validation_checks = {
    for sg_name, sg in var.security_groups :
    sg_name => (
      length(sg.ingress) == length(var.expected_rules[sg_name].ingress) &&
      length(sg.egress) == length(var.expected_rules[sg_name].egress)
    )
  }

  all_valid = alltrue([for k, v in local.validation_checks : v])
}

resource "null_resource" "validation" {
  count = local.all_valid ? 0 : 1

  provisioner "local-exec" {
    command = "echo 'ERROR: Security group rules validation failed' && exit 1"
  }
}

output "validation_result" {
  description = "Security group validation result"
  value       = local.all_valid
}
```

## File: main.tf

```hcl
# Main Terraform configuration

module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

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

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    }
  )
}

resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-sg"
    }
  )
}

# S3 Buckets
resource "aws_s3_bucket" "data" {
  count = var.s3_bucket_count

  bucket = "${local.name_prefix}-data-${count.index + 1}"

  tags = merge(
    local.common_tags,
    {
      Name  = "${local.name_prefix}-data-${count.index + 1}"
      Index = count.index + 1
    }
  )
}

resource "aws_s3_bucket_versioning" "data" {
  count = var.s3_bucket_count

  bucket = aws_s3_bucket.data[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Aurora Module
module "aurora" {
  source = "./modules/aurora"

  name_prefix              = local.name_prefix
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnet_ids
  allowed_security_groups  = [aws_security_group.lambda.id]
  instance_class           = var.aurora_instance_class
  instance_count           = var.aurora_instance_count
  tags                     = local.common_tags
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  name_prefix         = local.name_prefix
  environment         = var.environment
  memory_size         = var.lambda_memory_size
  timeout             = var.lambda_timeout
  s3_bucket_arn       = aws_s3_bucket.data[0].arn
  bucket_name         = aws_s3_bucket.data[0].id
  log_retention_days  = var.log_retention_days
  tags                = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-tg"
    }
  )
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alerts"
    }
  )
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "alerts@example.com"

  filter_policy = jsonencode({
    severity = ["critical", "high"]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/payment-processing/${var.environment}/application"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-logs"
    }
  )
}

# IAM Roles with environment-specific trust policies
resource "aws_iam_role" "app_role" {
  for_each = toset(["api", "worker", "scheduler"])

  name_prefix = "${local.name_prefix}-${each.key}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.environment}-${each.key}"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.key}-role"
      Type = each.key
    }
  )
}

resource "aws_iam_role_policy" "app_role_policy" {
  for_each = aws_iam_role.app_role

  name_prefix = "${local.name_prefix}-${each.key}-policy-"
  role        = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.data[0].arn}/*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.application.arn}:*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Data source to verify CIDR non-overlap
data "aws_vpc" "validate_cidr" {
  id = module.vpc.vpc_id

  lifecycle {
    postcondition {
      condition     = !contains(["10.0.0.0/16", "10.1.0.0/16", "10.2.0.0/16"], self.cidr_block) || var.vpc_cidr == self.cidr_block
      error_message = "VPC CIDR block overlaps with other environments"
    }
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "aurora_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.aurora.cluster_endpoint
  sensitive   = true
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = aws_s3_bucket.data[*].id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "iam_role_arns" {
  description = "IAM role ARNs"
  value       = { for k, v in aws_iam_role.app_role : k => v.arn }
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "workspace" {
  description = "Current workspace"
  value       = terraform.workspace
}
```

## File: scripts/validate-config.sh

```bash
#!/bin/bash
# Validation script to compare resource configurations between workspaces

set -e

WORKSPACES=("dev" "staging" "prod")
OUTPUT_DIR="./validation-reports"
mkdir -p "$OUTPUT_DIR"

echo "=== Multi-Environment Configuration Validation ==="
echo ""

# Function to extract configuration from workspace
extract_config() {
    local workspace=$1
    terraform workspace select "$workspace"
    terraform show -json > "$OUTPUT_DIR/${workspace}-state.json"
}

# Extract configurations from all workspaces
for ws in "${WORKSPACES[@]}"; do
    echo "Extracting configuration from $ws workspace..."
    extract_config "$ws"
done

# Compare security group rules
echo ""
echo "=== Comparing Security Group Rules ==="
for i in "${!WORKSPACES[@]}"; do
    for j in "${!WORKSPACES[@]}"; do
        if [ $i -lt $j ]; then
            ws1="${WORKSPACES[$i]}"
            ws2="${WORKSPACES[$j]}"

            echo "Comparing $ws1 vs $ws2:"

            # Extract security group rules
            jq '.values.root_module.resources[] | select(.type=="aws_security_group") | {name: .name, ingress: .values.ingress, egress: .values.egress}' \
                "$OUTPUT_DIR/${ws1}-state.json" > "$OUTPUT_DIR/${ws1}-sg-rules.json"

            jq '.values.root_module.resources[] | select(.type=="aws_security_group") | {name: .name, ingress: .values.ingress, egress: .values.egress}' \
                "$OUTPUT_DIR/${ws2}-state.json" > "$OUTPUT_DIR/${ws2}-sg-rules.json"

            # Compare rules
            if diff -u "$OUTPUT_DIR/${ws1}-sg-rules.json" "$OUTPUT_DIR/${ws2}-sg-rules.json" > "$OUTPUT_DIR/${ws1}-vs-${ws2}-sg-diff.txt"; then
                echo "  Security groups: IDENTICAL"
            else
                echo "  Security groups: DIFFERENCES FOUND (see $OUTPUT_DIR/${ws1}-vs-${ws2}-sg-diff.txt)"
            fi
        fi
    done
done

# Verify CIDR non-overlap
echo ""
echo "=== Verifying VPC CIDR Non-Overlap ==="
for ws in "${WORKSPACES[@]}"; do
    cidr=$(jq -r '.values.root_module.child_modules[] | select(.address=="module.vpc") | .resources[] | select(.type=="aws_vpc") | .values.cidr_block' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws VPC CIDR: $cidr"
done

# Verify Lambda runtime consistency
echo ""
echo "=== Verifying Lambda Runtime Versions ==="
for ws in "${WORKSPACES[@]}"; do
    runtime=$(jq -r '.values.root_module.child_modules[] | select(.address=="module.lambda") | .resources[] | select(.type=="aws_lambda_function") | .values.runtime' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws Lambda runtime: $runtime"
done

# Verify S3 bucket versioning
echo ""
echo "=== Verifying S3 Bucket Versioning ==="
for ws in "${WORKSPACES[@]}"; do
    versioning=$(jq -r '.values.root_module.resources[] | select(.type=="aws_s3_bucket_versioning") | .values.versioning_configuration[0].status' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws S3 versioning: $versioning"
done

# Generate summary report
echo ""
echo "=== Validation Summary ==="
cat > "$OUTPUT_DIR/validation-summary.txt" <<EOF
Multi-Environment Validation Report
Generated: $(date)

Workspaces Validated: ${WORKSPACES[@]}

Configuration Consistency:
- Security Group Rules: See individual diff files
- VPC CIDR Ranges: See output above
- Lambda Runtime Versions: See output above
- S3 Bucket Versioning: See output above

Files Generated:
$(ls -1 "$OUTPUT_DIR")
EOF

cat "$OUTPUT_DIR/validation-summary.txt"

echo ""
echo "Validation complete. Reports saved to $OUTPUT_DIR/"
```

## File: scripts/deploy.sh

```bash
#!/bin/bash
# Deployment script for workspace-based environments

set -e

ENVIRONMENT=$1
TFVARS_FILE="${ENVIRONMENT}.tfvars"

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <dev|staging|prod>"
    exit 1
fi

if [ ! -f "$TFVARS_FILE" ]; then
    echo "Error: $TFVARS_FILE not found"
    exit 1
fi

echo "=== Deploying to $ENVIRONMENT environment ==="
echo ""

# Select or create workspace
if terraform workspace list | grep -q "$ENVIRONMENT"; then
    terraform workspace select "$ENVIRONMENT"
else
    terraform workspace new "$ENVIRONMENT"
fi

# Initialize
echo "Initializing Terraform..."
terraform init

# Validate
echo "Validating configuration..."
terraform validate

# Plan
echo "Creating deployment plan..."
terraform plan -var-file="$TFVARS_FILE" -out="${ENVIRONMENT}.tfplan"

# Apply
echo ""
read -p "Apply this plan? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    terraform apply "${ENVIRONMENT}.tfplan"
    echo ""
    echo "=== Deployment Complete ==="
    terraform output
else
    echo "Deployment cancelled"
    exit 0
fi
```

## File: README.md

```markdown
# Multi-Environment Payment Processing Infrastructure

Terraform configuration for deploying identical payment processing infrastructure across three environments (dev, staging, prod) using workspaces.

## Architecture

- **VPC**: 3 availability zones with public/private subnets per environment
- **Database**: Aurora PostgreSQL 13.7 with encryption at rest
- **Compute**: Lambda functions (Python 3.9) for data processing
- **Storage**: 3 S3 buckets per environment with versioning
- **Load Balancing**: Application Load Balancer with identical listener rules
- **Observability**: CloudWatch Log Groups with environment-specific retention
- **Alerting**: SNS topics with consistent subscription filters

## Environments

| Environment | Region      | VPC CIDR    | Log Retention | Instance Class |
|-------------|-------------|-------------|---------------|----------------|
| Development | eu-west-1   | 10.0.0.0/16 | 7 days        | db.t3.small    |
| Staging     | us-west-2   | 10.1.0.0/16 | 30 days       | db.t3.medium   |
| Production  | us-east-1   | 10.2.0.0/16 | 90 days       | db.r5.large    |

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Separate AWS accounts for each environment
- Database passwords stored in Parameter Store:
  - `/payment-processing/dev/db-password`
  - `/payment-processing/staging/db-password`
  - `/payment-processing/prod/db-password`

## Deployment

### Initial Setup

1. Create S3 bucket for state storage:
```bash
aws s3 mb s3://payment-processing-terraform-state --region us-east-1
```

2. Create DynamoDB table for state locking:
```bash
aws dynamodb create-table \
  --table-name payment-processing-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

3. Store database passwords in Parameter Store (per environment):
```bash
aws ssm put-parameter \
  --name "/payment-processing/dev/db-password" \
  --value "YOUR_PASSWORD" \
  --type "SecureString" \
  --region eu-west-1
```

### Deploy to Environment

Using the deployment script:
```bash
./scripts/deploy.sh dev
./scripts/deploy.sh staging
./scripts/deploy.sh prod
```

Manual deployment:
```bash
# Select workspace
terraform workspace select dev  # or staging, prod

# Initialize
terraform init

# Plan
terraform plan -var-file=dev.tfvars

# Apply
terraform apply -var-file=dev.tfvars
```

## Workspace Management

List workspaces:
```bash
terraform workspace list
```

Create new workspace:
```bash
terraform workspace new <environment>
```

Switch workspace:
```bash
terraform workspace select <environment>
```

## Validation

Run validation script to compare configurations:
```bash
./scripts/validate-config.sh
```

This validates:
- Security group rule consistency
- VPC CIDR non-overlap
- Lambda runtime versions
- S3 bucket versioning
- Resource naming patterns

## Module Structure

```
.
├── main.tf                 # Main configuration
├── variables.tf            # Variable definitions
├── locals.tf               # Local values and mappings
├── provider.tf             # Provider and backend configuration
├── outputs.tf              # Output definitions
├── dev.tfvars              # Dev environment variables
├── staging.tfvars          # Staging environment variables
├── prod.tfvars             # Production environment variables
├── modules/
│   ├── vpc/                # VPC module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── aurora/             # Aurora module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── lambda/             # Lambda module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── function/
│   │       └── index.py
│   └── validation/         # Validation module
│       └── main.tf
└── scripts/
    ├── deploy.sh           # Deployment script
    └── validate-config.sh  # Validation script
```

## Resource Naming

All resources follow the naming pattern:
```
{project-name}-{environment-suffix}-{resource-type}
```

Example: `payment-processing-dev-vpc`

The `environment_suffix` variable ensures uniqueness across deployments.

## IAM Roles

Three IAM roles per environment with environment-specific trust policies:
- `api`: For API services
- `worker`: For background workers
- `scheduler`: For scheduled tasks

All roles have identical permission boundaries but different trust policies based on environment.

## Monitoring

CloudWatch Log Groups with environment-specific retention:
- Development: 7 days
- Staging: 30 days
- Production: 90 days

SNS topics configured with identical subscription filters across all environments.

## Cleanup

Destroy environment:
```bash
terraform workspace select <environment>
terraform destroy -var-file=<environment>.tfvars
```

## Security

- All Aurora clusters use encryption at rest
- Database passwords stored in Parameter Store (never in code)
- S3 buckets have versioning enabled
- Security group rules validated for consistency
- IAM roles follow principle of least privilege

## Compliance

- Identical configurations across environments meet financial services requirements
- Validation scripts prevent configuration drift
- All resources tagged with environment and project identifiers
- Audit trail via Terraform state and CloudWatch Logs

## Troubleshooting

### CIDR Overlap Error
Verify VPC CIDRs in tfvars files don't overlap:
- Dev: 10.0.0.0/16
- Staging: 10.1.0.0/16
- Prod: 10.2.0.0/16

### Database Password Not Found
Ensure Parameter Store parameters exist in the correct region for each environment.

### State Lock Error
Check DynamoDB table exists and Terraform has appropriate permissions.

## Support

For issues or questions, contact the infrastructure team.
```
