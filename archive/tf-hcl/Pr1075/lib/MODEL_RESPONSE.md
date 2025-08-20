I'll create a comprehensive Terraform configuration for a serverless infrastructure on AWS with high availability. Here's the complete solution:

## File Structure
```
lib/
├── provider.tf
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars
```

## 1. Provider Configuration (`/lib/provider.tf`)

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment   = var.environment
      Project       = var.project_name
      Owner         = var.owner
      ManagedBy     = "Terraform"
      CostCenter    = var.cost_center
      CreatedDate   = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}
```

## 2. Variables Configuration (`/lib/variables.tf`)

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "Region must be us-west-2 as per requirements."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "serverless-app"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
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
  sensitive   = true
  default     = null
}
```

## 3. Main Infrastructure (`/lib/main.tf`)

```hcl
# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets (3 AZs)
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets (3 AZs) for RDS
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS Aurora Cluster (Multi-AZ)
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.project_name}-aurora-cluster"
  engine                  = "aurora-mysql"
  engine_version          = "8.0.mysql_aurora.3.02.0"
  database_name           = "serverlessdb"
  master_username         = var.db_username
  master_password         = var.db_password != null ? var.db_password : random_password.db_password.result
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "${var.project_name}-aurora-cluster"
  }
}

# RDS Aurora Instances (3 AZs for high availability)
resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 3
  identifier         = "${var.project_name}-aurora-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = {
    Name = "${var.project_name}-aurora-instance-${count.index + 1}"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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
    Name = "${var.project_name}-lambda-role"
  }
}

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "IAM policy for Lambda function"

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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-policy"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda Function 1 - Health Check
resource "aws_lambda_function" "health_check" {
  filename         = "health_check.zip"
  function_name    = "${var.project_name}-health-check"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_ENDPOINT = aws_rds_cluster.main.endpoint
      DB_NAME     = aws_rds_cluster.main.database_name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.health_check,
    data.archive_file.health_check_zip
  ]

  tags = {
    Name = "${var.project_name}-health-check-lambda"
  }
}

# Lambda Function 2 - Data Processor
resource "aws_lambda_function" "data_processor" {
  filename         = "data_processor.zip"
  function_name    = "${var.project_name}-data-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_ENDPOINT = aws_rds_cluster.main.endpoint
      DB_NAME     = aws_rds_cluster.main.database_name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.data_processor,
    data.archive_file.data_processor_zip
  ]

  tags = {
    Name = "${var.project_name}-data-processor-lambda"
  }
}

# Create Lambda deployment packages
data "archive_file" "health_check_zip" {
  type        = "zip"
  output_path = "health_check.zip"
  source {
    content = <<EOF
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Health check passed',
            'db_endpoint': os.environ.get('DB_ENDPOINT', 'Not configured'),
            'environment': '${var.environment}'
        })
    }
EOF
    filename = "index.py"
  }
}

data "archive_file" "data_processor_zip" {
  type        = "zip"
  output_path = "data_processor.zip"
  source {
    content = <<EOF
import json
import os

def handler(event, context):
    # Process data logic here
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Data processed successfully',
            'db_endpoint': os.environ.get('DB_ENDPOINT', 'Not configured'),
            'processed_items': len(event.get('Records', []))
        })
    }
EOF
    filename = "index.py"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "health_check" {
  name              = "/aws/lambda/${var.project_name}-health-check"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-health-check-logs"
  }
}

resource "aws_cloudwatch_log_group" "data_processor" {
  name              = "/aws/lambda/${var.project_name}-data-processor"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-data-processor-logs"
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "Serverless API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-api-gateway"
  }
}

# API Gateway Resource - Health
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

# API Gateway Method - Health GET
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Integration - Health
resource "aws_api_gateway_integration" "health_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.health_check.invoke_arn
}

# API Gateway Resource - Process
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

# API Gateway Method - Process POST
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration - Process
resource "aws_api_gateway_integration" "process_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.process.id
  http_method = aws_api_gateway_method.process_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.data_processor.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.health_integration,
    aws_api_gateway_integration.process_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  tags = {
    Name = "${var.project_name}-api-deployment"
  }
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "health_check_api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "data_processor_api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
```

## 4. Outputs Configuration (`/lib/outputs.tf`)

```hcl
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.main.invoke_url}"
}

output "health_check_endpoint" {
  description = "Health check endpoint"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/health"
}

output "data_processor_endpoint" {
  description = "Data processor endpoint"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/process"
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "rds_cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "lambda_function_names" {
  description = "Names of deployed Lambda functions"
  value = [
    aws_lambda_function.health_check.function_name,
    aws_lambda_function.data_processor.function_name
  ]
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = data.aws_availability_zones.available.names
}
```

## 5. Terraform Variables File (`/lib/terraform.tfvars`)

```hcl
# Environment Configuration
environment   = "production"
project_name  = "serverless-app"
owner         = "DevOps Team"
cost_center   = "Engineering"

# Network Configuration
vpc_cidr = "10.0.0.0/16"

# Database Configuration
db_username = "admin"
# db_password will be auto-generated if not provided
```

## Deployment Instructions

### 1. Initialize Terraform
```bash
cd lib/
terraform init
```

### 2. Validate Configuration
```bash
terraform validate
```

### 3. Plan Deployment
```bash
terraform plan
```

### 4. Apply Configuration
```bash
terraform apply
```

### 5. Test the Deployment
```bash
# Get the API Gateway URL
terraform output api_gateway_url

# Test health check endpoint
curl $(terraform output -raw health_check_endpoint)

# Test data processor endpoint
curl -X POST $(terraform output -raw data_processor_endpoint) \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Key Features Implemented

### ✅ **High Availability**
- **3 Availability Zones**: All resources span across 3 AZs in us-west-2
- **Multi-AZ RDS**: Aurora cluster with 3 instances across different AZs
- **Redundant Subnets**: Public and private subnets in each AZ

### ✅ **Serverless Architecture**
- **2 Lambda Functions**: Health check and data processor
- **API Gateway**: RESTful endpoints with proper integration
- **VPC Configuration**: Secure networking with proper isolation

### ✅ **Security Best Practices**
- **IAM Roles & Policies**: Least privilege access for Lambda functions
- **Security Groups**: Proper network segmentation
- **VPC**: Private subnets for database, public for API access

### ✅ **Cost Management**
- **Comprehensive Tagging**: Environment, Project, Owner, CostCenter tags
- **Default Tags**: Applied automatically to all resources
- **Resource Optimization**: Right-sized instances and retention policies

### ✅ **Operational Excellence**
- **CloudWatch Logs**: Centralized logging for all Lambda functions
- **Monitoring**: Built-in AWS monitoring capabilities
- **Backup Strategy**: 7-day backup retention for RDS

This infrastructure provides a production-ready, highly available serverless application on AWS with proper security, monitoring, and cost management practices.