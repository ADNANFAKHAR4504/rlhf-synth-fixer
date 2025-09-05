### Reasoning Trace
---

This is a comprehensive Terraform infrastructure task requiring multiple AWS services across three environments. Let me break down what I need to create:

1. **Three environments**: Dev, Staging, and Production
2. **Regions**: Dev and Staging in us-east-1, Production in us-west-2
3. **Services needed**:
   - VPC with subnets and routing
   - EC2 instances with ELB
   - RDS with encryption, Multi-AZ, backups
   - Lambda functions for RDS snapshots
   - Security Groups
   - CloudTrail with S3 logging
   - CloudWatch Alarms
   - S3 buckets
   - Parameter Store
   - IAM roles and policies
   - Proper tagging

I need to structure this with:
- Variables for environments and common configurations
- Locals for computed values
- Data sources for AMIs and AZs
- Resources for each service
- Outputs for important values

Let me create two files:
1. `provider.tf` - Provider configurations
2. `tap_stack.tf` - Main infrastructure

I'll use a map-based approach to define the three environments with their specific configurations.
### Answer 
---

I'll create a comprehensive Terraform configuration that provisions AWS infrastructure across three environments with full isolation and consistency. Here are the two required files:

## provider.tf

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

# Provider for Dev and Staging (us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Provider for Production (us-west-2)
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Project     = "TAP-Stack"
      ManagedBy   = "Terraform"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

# Random provider for generating passwords and identifiers
provider "random" {}
```

## tap_stack.tf

```hcl
# Variables
variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "tapstack"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# Local values for environment configuration
locals {
  environments = {
    dev = {
      name           = "dev"
      provider_alias = "us_east_1"
      region        = "us-east-1"
      vpc_cidr      = "10.0.0.0/16"
      public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
      private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
      cost_center   = "Development"
      backup_retention = 7
    }
    staging = {
      name           = "staging"
      provider_alias = "us_east_1"
      region        = "us-east-1"
      vpc_cidr      = "10.1.0.0/16"
      public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
      private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
      cost_center   = "Staging"
      backup_retention = 14
    }
    prod = {
      name           = "prod"
      provider_alias = "us_west_2"
      region        = "us-west-2"
      vpc_cidr      = "10.2.0.0/16"
      public_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24"]
      private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]
      cost_center   = "Production"
      backup_retention = 30
    }
  }
  
  common_tags = {
    Project     = "TAP-Stack"
    ManagedBy   = "Terraform"
    Company     = var.company_name
  }
}

# Data sources for AMIs
data "aws_ami" "amazon_linux_east" {
  provider    = aws.us_east_1
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

data "aws_ami" "amazon_linux_west" {
  provider    = aws.us_west_2
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

# Data sources for availability zones
data "aws_availability_zones" "available_east" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "available_west" {
  provider = aws.us_west_2
  state    = "available"
}

# Random password for RDS instances
resource "random_password" "db_password" {
  for_each = local.environments
  length   = 16
  special  = true
}

# Parameter Store - AMI IDs
resource "aws_ssm_parameter" "ami_id_east" {
  provider = aws.us_east_1
  name     = "/tapstack/ami/amazon-linux"
  type     = "String"
  value    = data.aws_ami.amazon_linux_east.id

  tags = merge(local.common_tags, {
    Environment = "shared"
    CostCenter  = "Infrastructure"
  })
}

resource "aws_ssm_parameter" "ami_id_west" {
  provider = aws.us_west_2
  name     = "/tapstack/ami/amazon-linux"
  type     = "String"
  value    = data.aws_ami.amazon_linux_west.id

  tags = merge(local.common_tags, {
    Environment = "shared"
    CostCenter  = "Infrastructure"
  })
}

# Parameter Store - DB Passwords
resource "aws_ssm_parameter" "db_password" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  name     = "/tapstack/${each.key}/db/password"
  type     = "SecureString"
  value    = random_password.db_password[each.key].result

  tags = merge(local.common_tags, {
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail_logs" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = "${var.company_name}-${each.key}-cloudtrail-logs-${random_id.bucket_suffix[each.key].hex}"

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-cloudtrail-logs"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "random_id" "bucket_suffix" {
  for_each = local.environments
  keepers = {
    environment = each.key
  }
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = aws_s3_bucket.cloudtrail_logs[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = aws_s3_bucket.cloudtrail_logs[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Environment S3 Buckets
resource "aws_s3_bucket" "environment_bucket" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = "${var.company_name}-${each.key}-storage-${random_id.env_bucket_suffix[each.key].hex}"

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-storage"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "random_id" "env_bucket_suffix" {
  for_each = local.environments
  keepers = {
    environment = each.key
  }
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "environment_bucket" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = aws_s3_bucket.environment_bucket[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

# VPC
resource "aws_vpc" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-vpc"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  vpc_id   = aws_vpc.main[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-igw"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key = env.name
      env     = env
      subnet_idx = idx
    }
  }
  
  provider = local.environments[each.value.env_key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  vpc_id            = aws_vpc.main[each.value.env_key].id
  cidr_block        = each.value.env.public_subnet_cidrs[each.value.subnet_idx]
  availability_zone = local.environments[each.value.env_key].provider_alias == "us_east_1" ? data.aws_availability_zones.available_east.names[each.value.subnet_idx] : data.aws_availability_zones.available_west.names[each.value.subnet_idx]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.value.env_key}-public-subnet-${each.value.subnet_idx + 1}"
    Environment = each.value.env.name
    CostCenter  = each.value.env.cost_center
    Type        = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key = env.name
      env     = env
      subnet_idx = idx
    }
  }
  
  provider = local.environments[each.value.env_key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  vpc_id            = aws_vpc.main[each.value.env_key].id
  cidr_block        = each.value.env.private_subnet_cidrs[each.value.subnet_idx]
  availability_zone = local.environments[each.value.env_key].provider_alias == "us_east_1" ? data.aws_availability_zones.available_east.names[each.value.subnet_idx] : data.aws_availability_zones.available_west.names[each.value.subnet_idx]

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.value.env_key}-private-subnet-${each.value.subnet_idx + 1}"
    Environment = each.value.env.name
    CostCenter  = each.value.env.cost_center
    Type        = "Private"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  vpc_id   = aws_vpc.main[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-public-rt"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_route_table" "private" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  vpc_id   = aws_vpc.main[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-private-rt"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key = env.name
      subnet_id = aws_subnet.public["${env.name}-${idx}"].id
    }
  }
  
  provider       = local.environments[each.value.env_key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.public[each.value.env_key].id
}

resource "aws_route_table_association" "private" {
  for_each = {
    for idx, env in local.environments : "${env.name}-${idx}" => {
      env_key = env.name
      subnet_id = aws_subnet.private["${env.name}-${idx}"].id
    }
  }
  
  provider       = local.environments[each.value.env_key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.private[each.value.env_key].id
}

# Security Groups
resource "aws_security_group" "web" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name_prefix = "${var.company_name}-${each.key}-web-"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-web-sg"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_security_group" "rds" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name_prefix = "${var.company_name}-${each.key}-rds-"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web[each.key].id]
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-rds-sg"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  for_each = local.environments
  name     = "${var.company_name}-${each.key}-ec2-role"

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
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_iam_role_policy" "ec2_rds_policy" {
  for_each = local.environments
  name     = "${var.company_name}-${each.key}-ec2-rds-policy"
  role     = aws_iam_role.ec2_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters"
        ]
        Resource = "arn:aws:rds:${each.value.region}:*:db:${var.company_name}-${each.key}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${each.value.region}:*:parameter/tapstack/${each.key}/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  for_each = local.environments
  name     = "${var.company_name}-${each.key}-ec2-profile"
  role     = aws_iam_role.ec2_role[each.key].name

  tags = merge(local.common_tags, {
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name = "${var.company_name}-${each.key}-db-subnet-group"
  subnet_ids = [
    aws_subnet.private["${each.key}-0"].id,
    aws_subnet.private["${each.key}-1"].id
  ]

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-db-subnet-group"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  identifier = "${var.company_name}-${each.key}-db"
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  storage_type          = "gp2"
  
  db_name  = "${var.company_name}${each.key}db"
  username = "admin"
  password = random_password.db_password[each.key].result
  
  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name
  
  multi_az            = true
  backup_retention_period = each.value.backup_retention
  backup_window       = "03:00-04:00"
  maintenance_window  = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-db"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Lambda IAM Role for RDS Snapshots
resource "aws_iam_role" "lambda_snapshot_role" {
  for_each = local.environments
  name     = "${var.company_name}-${each.key}-lambda-snapshot-role"

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
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_iam_role_policy" "lambda_snapshot_policy" {
  for_each = local.environments
  name     = "${var.company_name}-${each.key}-lambda-snapshot-policy"
  role     = aws_iam_role.lambda_snapshot_role[each.key].id

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
        Resource = "arn:aws:logs:${each.value.region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function for RDS snapshots
resource "aws_lambda_function" "rds_snapshot" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  filename         = "lambda_function.zip"
  function_name    = "${var.company_name}-${each.key}-rds-snapshot"
  role            = aws_iam_role.lambda_snapshot_role[each.key].arn
  handler         = "index.lambda_handler"
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      DB_INSTANCE_IDENTIFIER = aws_db_instance.main[each.key].id
    }
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-rds-snapshot"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Create Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    rds_client = boto3.client('rds')
    db_instance_id = os.environ['DB_INSTANCE_IDENTIFIER']
    
    snapshot_id = f"{db_instance_id}-snapshot-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}"
    
    try:
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Snapshot {snapshot_id} created successfully')
        }
    except Exception as e:
        print(f"Error creating snapshot: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error creating snapshot: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

# EventBridge rule for Lambda scheduling
resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name                = "${var.company_name}-${each.key}-rds-snapshot-schedule"
  description         = "Trigger RDS snapshot Lambda function daily"
  schedule_expression = "rate(24 hours)"

  tags = merge(local.common_tags, {
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  rule      = aws_cloudwatch_event_rule.lambda_schedule[each.key].name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.rds_snapshot[each.key].arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_snapshot[each.key].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule[each.key].arn
}

# Launch Template for EC2
resource "aws_launch_template" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name_prefix   = "${var.company_name}-${each.key}-"
  image_id      = local.environments[each.key].provider_alias == "us_east_1" ? data.aws_ami.amazon_linux_east.id : data.aws_ami.amazon_linux_west.id
  instance_type = var.ec2_instance_type
  
  vpc_security_group_ids = [aws_security_group.web[each.key].id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile[each.key].name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${each.key} environment!</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name        = "${var.company_name}-${each.key}-instance"
      Environment = each.value.name
      CostCenter  = each.value.cost_center
    })
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-launch-template"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# EC2 Instance
resource "aws_instance" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  launch_template {
    id      = aws_launch_template.main[each.key].id
    version = "$Latest"
  }
  
  subnet_id = aws_subnet.public["${each.key}-0"].id

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-instance"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name               = "${var.company_name}-${each.key}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web[each.key].id]
  subnets           = [
    aws_subnet.public["${each.key}-0"].id,
    aws_subnet.public["${each.key}-1"].id
  ]

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-alb"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_lb_target_group" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name     = "${var.company_name}-${each.key}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main[each.key].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-tg"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

resource "aws_lb_target_group_attachment" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  target_group_arn = aws_lb_target_group.main[each.key].arn
  target_id        = aws_instance.main[each.key].id
  port             = 80
}

resource "aws_lb_listener" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  load_balancer_arn = aws_lb.main[each.key].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[each.key].arn
  }

  tags = merge(local.common_tags, {
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# CloudWatch Alarms for CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  alarm_name          = "${var.company_name}-${each.key}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-high-cpu-alarm"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  
  name           = "${var.company_name}-${each.key}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs[each.key].bucket
  
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging              = true

  tags = merge(local.common_tags, {
    Name        = "${var.company_name}-${each.key}-cloudtrail"
    Environment = each.value.name
    CostCenter  = each.value.cost_center
  })
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  for_each = local.environments
  provider = local.environments[each.key].provider_alias == "us_east_1" ? aws.us_east_1 : aws.us_west_2
  bucket   = aws_s3_bucket.cloudtrail_logs[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs[each.key].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs[each.key].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Outputs
output "environment_info" {
  value = {
    for env_key, env in local.environments : env_key => {
      region                = env.region
      vpc_id               = aws_vpc.main[env_key].id
      load_balancer_dns    = aws_lb.main[env_key].dns_name
      instance_id          = aws_instance.main[env_key].id
      db_endpoint          = aws_db_instance.main[env_key].endpoint
      s3_bucket           = aws_s3_bucket.environment_bucket[env_key].bucket
      cloudtrail_bucket   = aws_s3_bucket.cloudtrail_logs[env_key].bucket
    }
  }
  description = "Environment infrastructure details"
}

output "parameter_store_paths" {
  value = {
    for env_key, env in local.environments : env_key => {
      db_password = aws_ssm_parameter.db_password[env_key].name
      ami_id     = env.provider_alias == "us_east_1" ? aws_ssm_parameter.ami_id_east.name : aws_ssm_parameter.ami_id_west.name
    }
  }
  description = "Parameter Store paths for each environment"
}
```

## Key Features Implemented

### Infrastructure Consistency
- Identical configurations across all three environments using local variables
- Environment-specific customizations (backup retention, cost centers, etc.)
- Consistent naming conventions with company prefix and environment suffix

### Multi-Region Architecture
- Dev & Staging: us-east-1
- Production: us-west-2
- Provider aliases ensure correct resource deployment

### Security & Compliance
- Environment isolation: No cross-environment communication
- IAM roles restrict EC2 access to RDS by environment
- Security Groups with consistent rules (SSH from specified CIDR, HTTP open)
- Parameter Store for secure credential management
- CloudTrail logging to dedicated S3 buckets

### Monitoring & Operations

- CloudWatch Alarms for CPU usage >75%
- Lambda functions for automated RDS snapshots
- EventBridge scheduling for daily snapshot automation

### Storage & Database

- RDS instances with encryption, Multi-AZ, and automated backups
- Environment-specific S3 buckets with consistent naming
- Different backup retention periods per environment

### Tagging Strategy

- Comprehensive tagging for cost allocation
- Environment-specific tags for resource management
- Project and company tags for governance

### Deployment Instructions

1. Initialize Terraform:

   ```bash
   terraform init
   ```

2. Plan the deployment:

   ```bash
   terraform plan
   ```

3. Apply the configuration:

   ```bash
   terraform apply
   ```

4. Access applications:

   - Use the load balancer DNS names from the output
   - Each environment will have its own isolated infrastructure

### Cost Optimization

- Launch templates enable easy scaling and Reserved Instance usage
- Consistent instance types across environments for RI planning
- Resource tagging enables detailed cost allocation and optimization

This Terraform configuration creates a complete, production-ready AWS infrastructure
with full environment isolation, consistent security policies, and comprehensive
monitoring across all three environments.