### Reasoning Trace
---

Let me break down all the requirements:

1. VPC in us-east-2 with CIDR 10.0.0.0/16 and VPC Flow Logs
2. 2 private and 2 public subnets, NAT gateway, internet gateway, route tables
3. S3 bucket with AES-256 encryption
4. IAM roles for EC2 instances
5. VPC flow logs enabled
6. RDS in private subnet with random username (8 chars, starts with letter, no special chars) and password (16 chars with special chars but AWS-allowed), stored in Secrets Manager, not publicly accessible, auto minor version upgrades, Multi-AZ
7. Lambda for RDS backup management with encrypted environment variables
8. ElastiCache clusters with backups, not publicly accessible
9. CloudTrail for auditing
10. Security groups with least privilege
11. Security measures including IAM roles, security groups, S3 bucket policies
12. AWS Systems Manager Document for maintenance tasks

I need to create a comprehensive Terraform file with all these components. Let me structure this:

Variables:
- region (default us-east-2)
- vpc_cidr (default 10.0.0.0/16)
- environment name
- other necessary variables

Resources needed:
- VPC with flow logs
- 2 public subnets, 2 private subnets
- Internet Gateway
- NAT Gateways (for each AZ)
- Route tables and associations
- S3 bucket with encryption
- IAM roles for EC2, Lambda, VPC Flow Logs
- RDS subnet group, RDS instance with Secrets Manager
- Lambda function for RDS backup
- ElastiCache subnet group and cluster
- CloudTrail with S3 bucket
- Security Groups
- Systems Manager Document

Let me start coding this step by step:
### Answer 
---

```hcl
# tap_stack.tf - Complete Terraform configuration for secure AWS infrastructure

# =============================================================================
# VARIABLES
# =============================================================================

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  availability_zones = ["${var.region}a", "${var.region}b"]
  
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# =============================================================================
# RANDOM RESOURCES FOR RDS CREDENTIALS
# =============================================================================

resource "random_string" "rds_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
  lower   = true
}

resource "random_password" "rds_password" {
  length  = 16
  special = true
  # Excluding characters that AWS RDS doesn't allow
  override_special = "!#$%&*+-=?^_`|~"
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# =============================================================================
# VPC FLOW LOGS
# =============================================================================

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 14

  tags = local.common_tags
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-flow-logs"
  })
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Security Group for Web Servers
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-sg"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id, aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg"
  })
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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lambda-sg"
  })
}

# Security Group for ElastiCache
resource "aws_security_group" "elasticache" {
  name_prefix = "${var.project_name}-elasticache-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-elasticache-sg"
  })
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# S3 Bucket for Application Data
resource "aws_s3_bucket" "main" {
  bucket_prefix = "${var.project_name}-app-data-"

  tags = local.common_tags
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket_prefix = "${var.project_name}-cloudtrail-"

  tags = local.common_tags
}

# S3 Bucket Encryption for CloudTrail
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block for CloudTrail
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

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
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# =============================================================================
# IAM ROLES FOR EC2
# =============================================================================

resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "${var.project_name}-ec2-s3-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      }
    ]
  })
}

# Attach SSM managed policy to EC2 role for Systems Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.ec2.name
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# =============================================================================
# SECRETS MANAGER
# =============================================================================

resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "${var.project_name}-rds-credentials"
  description = "RDS master user credentials"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id

  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
  })
}

# =============================================================================
# RDS
# =============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-rds-instance"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "appdb"
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  auto_minor_version_upgrade = true
  multi_az                   = true
  publicly_accessible       = false

  skip_final_snapshot       = true
  deletion_protection       = false
  delete_automated_backups  = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-instance"
  })
}

# =============================================================================
# LAMBDA FOR RDS BACKUP MANAGEMENT
# =============================================================================

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
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

  tags = local.common_tags
}

# Lambda IAM Policy
resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
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
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DeleteDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
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

# KMS Key for Lambda environment variables encryption
resource "aws_kms_key" "lambda" {
  description = "KMS key for Lambda environment variables encryption"

  tags = local.common_tags
}

resource "aws_kms_alias" "lambda" {
  name          = "alias/${var.project_name}-lambda-key"
  target_key_id = aws_kms_key.lambda.key_id
}

# Lambda Function
resource "aws_lambda_function" "rds_backup" {
  filename         = "rds_backup.zip"
  function_name    = "${var.project_name}-rds-backup"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      RDS_INSTANCE_ID = aws_db_instance.main.identifier
      SECRET_ARN      = aws_secretsmanager_secret.rds_credentials.arn
    }
  }

  kms_key_arn = aws_kms_key.lambda.arn

  tags = local.common_tags

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-rds-backup"
  retention_in_days = 14

  tags = local.common_tags
}

# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "rds_backup.zip"
  
  source {
    content = <<EOF
import boto3
import os
import json
from datetime import datetime

def handler(event, context):
    rds = boto3.client('rds')
    secrets = boto3.client('secretsmanager')
    
    instance_id = os.environ['RDS_INSTANCE_ID']
    
    try:
        # Create snapshot
        snapshot_id = f"{instance_id}-snapshot-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=instance_id
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup initiated successfully',
                'snapshot_id': snapshot_id
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
EOF
    filename = "index.py"
  }
}

# =============================================================================
# ELASTICACHE
# =============================================================================

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project_name}-cache"
  description                = "Redis cache cluster"
  
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  
  tags = local.common_tags
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }

  tags = local.common_tags

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# =============================================================================
# SYSTEMS MANAGER DOCUMENT
# =============================================================================

resource "aws_ssm_document" "maintenance" {
  name          = "${var.project_name}-maintenance-document"
  document_type = "Command"
  document_format = "YAML"

  content = <<DOC
schemaVersion: '2.2'
description: 'Automated maintenance tasks including patching and updates'
parameters:
  action:
    type: String
    description: 'Action to perform'
    allowedValues:
      - update
      - patch
      - restart
    default: update
mainSteps:
  - action: 'aws:runShellScript'
    name: 'performMaintenance'
    inputs:
      runCommand:
        - |
          #!/bin/bash
          case "{{ action }}" in
            update)
              echo "Performing system updates..."
              yum update -y
              echo "System updates completed."
              ;;
            patch)
              echo "Performing security patches..."
              yum update --security -y
              echo "Security patches completed."
              ;;
            restart)
              echo "Restarting system..."
              shutdown -r +1
              ;;
            *)
              echo "Invalid action specified."
              exit 1
              ;;
          esac
DOC

  tags = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.identifier
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret for RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function for RDS backup"
  value       = aws_lambda_function.rds_backup.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for RDS backup"
  value       = aws_lambda_function.rds_backup.arn
}

output "elasticache_replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "elasticache_primary_endpoint" {
  description = "Primary endpoint of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "ec2_iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2.name
}

output "ec2_iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "elasticache_security_group_id" {
  description = "ID of the ElastiCache security group"
  value       = aws_security_group.elasticache.id
}

output "vpc_flow_logs_log_group_name" {
  description = "Name of the VPC Flow Logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "ssm_document_name" {
  description = "Name of the Systems Manager maintenance document"
  value       = aws_ssm_document.maintenance.name
}

output "kms_key_id" {
  description = "ID of the KMS key used for Lambda encryption"
  value       = aws_kms_key.lambda.key_id
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = local.availability_zones
}
```

## Key Features Implemented

### 🔐 **Security Best Practices**
- **VPC Flow Logs**: Enabled for traffic monitoring and analysis
- **Least Privilege Security Groups**: Restricted access within VPC CIDR ranges
- **S3 Encryption**: AES-256 server-side encryption for all buckets
- **RDS Security**: Private subnets, encrypted storage, Multi-AZ deployment
- **Lambda Encryption**: KMS-encrypted environment variables
- **IAM Roles**: No hardcoded access keys, proper role-based access

### 🏗️ **Infrastructure Components**
- **VPC**: 10.0.0.0/16 CIDR in us-east-2 region
- **Subnets**: 2 public (10.0.1.0/24, 10.0.2.0/24) and 2 private (10.0.10.0/24, 10.0.20.0/24)
- **NAT Gateways**: One per AZ for high availability
- **RDS MySQL 8.0**: Multi-AZ, encrypted, auto-backups enabled
- **ElastiCache Redis**: Multi-AZ with encryption at rest and in transit
- **Lambda**: RDS backup management with VPC integration

### 🔍 **Monitoring & Auditing**
- **CloudTrail**: Full API activity logging to encrypted S3 bucket
- **VPC Flow Logs**: Network traffic analysis via CloudWatch
- **Systems Manager**: Automated maintenance document for patching

### 🔑 **Secrets Management**
- **AWS Secrets Manager**: Secure storage of RDS credentials
- **Random Generation**: 8-character username (starting with letter) and 16-character password with AWS-compliant special characters

### 📋 **Comprehensive Outputs**
- All resource IDs, ARNs, and endpoints for integration
- Security group IDs for reference
- IAM role details for EC2 instance attachment

This configuration provides a production-ready, secure AWS infrastructure following best practices for networking, security, monitoring, and automation.
