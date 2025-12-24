# Multi-Environment Payment Processing Infrastructure - Terraform Implementation

This implementation provides a complete multi-environment infrastructure for a payment processing system using Terraform with HCL. The solution uses reusable modules to maintain consistency across dev, staging, and production environments while allowing environment-specific scaling.

## File: lib/variables.tf

```hcl
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
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

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    # Backend configuration will be provided via backend config files
    # terraform init -backend-config=backend-dev.hcl
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: lib/main.tf

```hcl
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  environment_suffix  = var.environment_suffix
  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr
  azs                 = var.azs
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "VPC"
    }
  )
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "SecurityGroups"
    }
  )
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment          = var.environment
  environment_suffix   = var.environment_suffix
  project_name         = var.project_name
  vpc_id               = module.vpc.vpc_id
  db_subnet_ids        = module.vpc.private_subnet_ids
  instance_class       = var.rds_instance_class
  allocated_storage    = var.rds_allocated_storage
  username             = var.rds_username
  security_group_ids   = [module.security_groups.rds_security_group_id]
  
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "RDS"
    }
  )
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  security_group_ids = [module.security_groups.lambda_security_group_id]
  log_retention_days = var.log_retention_days
  
  # Pass RDS connection info
  db_host     = module.rds.db_endpoint
  db_name     = module.rds.db_name
  db_username = module.rds.db_username
  db_password = module.rds.db_password
  
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "Lambda"
    }
  )
}

# CloudWatch Logs Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  retention_days     = var.log_retention_days
  
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "CloudWatch"
    }
  )
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.function_arn
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = module.security_groups.lambda_security_group_id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.security_groups.rds_security_group_id
}
```

## File: lib/modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-vpc"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-igw"
    }
  )
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
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
      Name = "${var.project_name}-${var.environment_suffix}-public-rt"
    }
  )
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-rt"
    }
  )
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Endpoints for S3 and DynamoDB (cost-free)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-s3-endpoint"
    }
  )
}

resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.dynamodb"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-dynamodb-endpoint"
    }
  )
}

resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

data "aws_region" "current" {}
```

## File: lib/modules/vpc/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
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

## File: lib/modules/vpc/outputs.tf

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

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## File: lib/modules/security_groups/main.tf

```hcl
# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-lambda-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow PostgreSQL from Lambda"
  }

  # Environment-specific ingress rules
  dynamic "ingress" {
    for_each = var.environment == "dev" ? [1] : []
    content {
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/8"]
      description = "Dev environment: Allow PostgreSQL from private networks"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-rds-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/modules/security_groups/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/security_groups/outputs.tf

```hcl
output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
```

## File: lib/modules/rds/main.tf

```hcl
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-"
  description = "Database subnet group for ${var.environment}"
  subnet_ids  = var.db_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment_suffix}-db"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "payment_${replace(var.environment_suffix, "-", "_")}"
  username = var.username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids

  # Multi-AZ for production, single-AZ for dev/staging
  multi_az = var.environment == "prod" ? true : false

  # Backup configuration
  backup_retention_period = 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  # Destroyability settings
  skip_final_snapshot       = true
  deletion_protection       = false
  delete_automated_backups  = true

  # Performance insights
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-db"
    }
  )
}
```

## File: lib/modules/rds/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "db_subnet_ids" {
  description = "Subnet IDs for database"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
}

variable "username" {
  description = "Master username"
  type        = string
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/rds/outputs.tf

```hcl
output "db_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "db_arn" {
  description = "Database ARN"
  value       = aws_db_instance.main.arn
}
```

## File: lib/modules/lambda/main.tf

```hcl
# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-"

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
      Name = "${var.project_name}-${var.environment_suffix}-lambda-role"
    }
  )
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-policy-"
  role        = aws_iam_role.lambda.id

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
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-payment-processor"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-lambda-logs"
    }
  )
}

# Lambda function code archive
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<-EOT
      const { Client } = require('pg');

      exports.handler = async (event) => {
        console.log('Processing payment:', JSON.stringify(event));
        
        const client = new Client({
          host: process.env.DB_HOST.split(':')[0],
          port: 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
        });

        try {
          await client.connect();
          const result = await client.query('SELECT NOW()');
          console.log('Database connection successful:', result.rows[0]);
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Payment processed successfully',
              timestamp: result.rows[0].now
            })
          };
        } catch (error) {
          console.error('Error:', error);
          throw error;
        } finally {
          await client.end();
        }
      };
    EOT
    filename = "index.js"
  }
}

# Lambda Function
resource "aws_lambda_function" "main" {
  function_name = "${var.project_name}-${var.environment_suffix}-payment-processor"
  description   = "Payment processing function for ${var.environment}"
  
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  
  role    = aws_iam_role.lambda.arn
  handler = "index.handler"
  runtime = "nodejs18.x"
  
  memory_size = var.memory_size
  timeout     = var.timeout

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
      DB_HOST     = var.db_host
      DB_NAME     = var.db_name
      DB_USERNAME = var.db_username
      DB_PASSWORD = var.db_password
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-payment-processor"
    }
  )
}
```

## File: lib/modules/lambda/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda"
  type        = list(string)
}

variable "memory_size" {
  description = "Memory size in MB"
  type        = number
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/lambda/outputs.tf

```hcl
output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_invoke_arn" {
  description = "Lambda function invoke ARN"
  value       = aws_lambda_function.main.invoke_arn
}

output "role_arn" {
  description = "Lambda IAM role ARN"
  value       = aws_iam_role.lambda.arn
}
```

## File: lib/modules/cloudwatch/main.tf

```hcl
# General application log group
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.project_name}/${var.environment_suffix}/application"
  retention_in_days = var.retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-app-logs"
    }
  )
}

# Payment processing log group
resource "aws_cloudwatch_log_group" "payment" {
  name              = "/aws/${var.project_name}/${var.environment_suffix}/payment"
  retention_in_days = var.retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-payment-logs"
    }
  )
}
```

## File: lib/modules/cloudwatch/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/cloudwatch/outputs.tf

```hcl
output "application_log_group_name" {
  description = "Application log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "payment_log_group_name" {
  description = "Payment log group name"
  value       = aws_cloudwatch_log_group.payment.name
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example variable values - copy to dev.tfvars, staging.tfvars, prod.tfvars

environment        = "dev"
environment_suffix = "dev-abc123"
project_name       = "payment"
aws_region         = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30

# RDS Configuration
rds_instance_class     = "db.t3.micro"
rds_allocated_storage  = 20
rds_username           = "dbadmin"

# CloudWatch Configuration
log_retention_days = 7

# Tags
common_tags = {
  Project    = "PaymentProcessing"
  ManagedBy  = "Terraform"
  Environment = "dev"
}
```

## File: lib/dev.tfvars

```hcl
environment        = "dev"
environment_suffix = "dev"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

lambda_memory_size = 256
lambda_timeout     = 30

rds_instance_class    = "db.t3.micro"
rds_allocated_storage = 20
rds_username          = "dbadmin"

log_retention_days = 7

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "dev"
}
```

## File: lib/staging.tfvars

```hcl
environment        = "staging"
environment_suffix = "staging"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

lambda_memory_size = 512
lambda_timeout     = 60

rds_instance_class    = "db.t3.small"
rds_allocated_storage = 50
rds_username          = "dbadmin"

log_retention_days = 30

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "staging"
}
```

## File: lib/prod.tfvars

```hcl
environment        = "prod"
environment_suffix = "prod"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]

lambda_memory_size = 1024
lambda_timeout     = 90

rds_instance_class    = "db.t3.medium"
rds_allocated_storage = 100
rds_username          = "dbadmin"

log_retention_days = 90

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "prod"
}
```

## File: lib/backend-dev.hcl

```hcl
bucket         = "terraform-state-payment-dev"
key            = "payment/dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-dev"
```

## File: lib/backend-staging.hcl

```hcl
bucket         = "terraform-state-payment-staging"
key            = "payment/staging/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-staging"
```

## File: lib/backend-prod.hcl

```hcl
bucket         = "terraform-state-payment-prod"
key            = "payment/prod/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-prod"
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Processing Infrastructure

This Terraform configuration provides a complete multi-environment infrastructure for a payment processing system with identical code across dev, staging, and production environments.

## Architecture

- **VPC**: Dedicated VPC per environment with public and private subnets across 2 AZs
- **Lambda**: Payment processing functions with environment-specific memory allocation
- **RDS PostgreSQL**: Transaction database with environment-specific instance sizing
- **Security Groups**: Environment-aware security rules
- **CloudWatch**: Logging with environment-specific retention periods
- **State Backend**: S3 + DynamoDB for remote state management

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 buckets and DynamoDB tables for state backend (created separately)

## Environment-Specific Configurations

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| Lambda Memory | 256 MB | 512 MB | 1024 MB |
| RDS Instance | t3.micro | t3.small | t3.medium |
| Log Retention | 7 days | 30 days | 90 days |
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Multi-AZ RDS | No | No | Yes |

## Deployment Instructions

### 1. Create State Backend Resources (One-time setup)

```bash
# Create S3 buckets for state
aws s3 mb s3://terraform-state-payment-dev --region us-east-1
aws s3 mb s3://terraform-state-payment-staging --region us-east-1
aws s3 mb s3://terraform-state-payment-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning --bucket terraform-state-payment-dev --versioning-configuration Status=Enabled
aws s3api put-bucket-versioning --bucket terraform-state-payment-staging --versioning-configuration Status=Enabled
aws s3api put-bucket-versioning --bucket terraform-state-payment-prod --versioning-configuration Status=Enabled

# Create DynamoDB tables for locking
aws dynamodb create-table \
  --table-name terraform-locks-payment-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

aws dynamodb create-table \
  --table-name terraform-locks-payment-staging \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

aws dynamodb create-table \
  --table-name terraform-locks-payment-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Deploy Development Environment

```bash
cd lib

# Initialize with dev backend
terraform init -backend-config=backend-dev.hcl

# Plan
terraform plan -var-file=dev.tfvars

# Apply
terraform apply -var-file=dev.tfvars
```

### 3. Deploy Staging Environment

```bash
# Re-initialize with staging backend
terraform init -backend-config=backend-staging.hcl -reconfigure

# Plan
terraform plan -var-file=staging.tfvars

# Apply
terraform apply -var-file=staging.tfvars
```

### 4. Deploy Production Environment

```bash
# Re-initialize with prod backend
terraform init -backend-config=backend-prod.hcl -reconfigure

# Plan
terraform plan -var-file=prod.tfvars

# Apply
terraform apply -var-file=prod.tfvars
```

## Module Structure

```
lib/
├── main.tf                    # Root module orchestration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── provider.tf                # Provider configuration
├── dev.tfvars                 # Dev environment values
├── staging.tfvars             # Staging environment values
├── prod.tfvars                # Prod environment values
├── backend-dev.hcl            # Dev state backend config
├── backend-staging.hcl        # Staging state backend config
├── backend-prod.hcl           # Prod state backend config
└── modules/
    ├── vpc/                   # VPC networking module
    ├── security_groups/       # Security groups module
    ├── rds/                   # RDS database module
    ├── lambda/                # Lambda functions module
    └── cloudwatch/            # CloudWatch logs module
```

## Resource Naming Convention

All resources follow the pattern: `{project}-{environment_suffix}-{resource-type}`

Examples:
- `payment-dev-vpc`
- `payment-staging-lambda-sg`
- `payment-prod-db`

## Outputs

After deployment, Terraform outputs key resource identifiers:

- VPC ID and CIDR
- Subnet IDs (public and private)
- Lambda function name and ARN
- RDS endpoint and database name
- Security group IDs

View outputs:
```bash
terraform output
```

## Cleanup

To destroy an environment:

```bash
# Initialize with appropriate backend
terraform init -backend-config=backend-dev.hcl -reconfigure

# Destroy
terraform destroy -var-file=dev.tfvars
```

## Security Considerations

- RDS passwords are randomly generated and stored in Terraform state (use AWS Secrets Manager for production)
- Security groups follow least-privilege principles
- All data encrypted at rest (S3, RDS)
- VPC endpoints used for S3 and DynamoDB (cost optimization)
- Dev environment has broader access rules for testing

## Cost Optimization

- VPC Endpoints for S3 and DynamoDB (no NAT Gateway needed)
- Single-AZ RDS for dev and staging
- Appropriate instance sizing per environment
- CloudWatch log retention tuned per environment

## Notes

- Lambda function includes placeholder code for payment processing
- Database password is auto-generated and stored in state
- All resources are fully destroyable (skip_final_snapshot = true)
- No deletion protection enabled for easier cleanup
```
