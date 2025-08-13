# Secure AWS Infrastructure with Terraform

I'll create a comprehensive Terraform configuration that implements all the specified security best practices. Here's the complete solution:

```hcl
# secure_infrastructure.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# 1. KMS Key Management with automatic rotation
resource "aws_kms_key" "prod_master_key" {
  description             = "Master KMS key for production environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "prod-master-kms-key"
    Environment = "production"
  }
}

resource "aws_kms_alias" "prod_master_key_alias" {
  name          = "alias/prod-master-key"
  target_key_id = aws_kms_key.prod_master_key.key_id
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# 2. VPC Network Isolation
resource "aws_vpc" "prod_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "prod-vpc"
    Environment = "production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = {
    Name        = "prod-igw"
    Environment = "production"
  }
}

# Private Subnets
resource "aws_subnet" "prod_private_subnet_1" {
  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "prod-private-subnet-1"
    Environment = "production"
    Type        = "private"
  }
}

resource "aws_subnet" "prod_private_subnet_2" {
  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "prod-private-subnet-2"
    Environment = "production"
    Type        = "private"
  }
}

# Public Subnet for NAT Gateway
resource "aws_subnet" "prod_public_subnet" {
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.100.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "prod-public-subnet"
    Environment = "production"
    Type        = "public"
  }
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "prod_nat_eip" {
  domain = "vpc"
  
  tags = {
    Name        = "prod-nat-eip"
    Environment = "production"
  }
}

resource "aws_nat_gateway" "prod_nat_gateway" {
  allocation_id = aws_eip.prod_nat_eip.id
  subnet_id     = aws_subnet.prod_public_subnet.id

  tags = {
    Name        = "prod-nat-gateway"
    Environment = "production"
  }

  depends_on = [aws_internet_gateway.prod_igw]
}

# Route Tables
resource "aws_route_table" "prod_public_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = {
    Name        = "prod-public-route-table"
    Environment = "production"
  }
}

resource "aws_route_table" "prod_private_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.prod_nat_gateway.id
  }

  tags = {
    Name        = "prod-private-route-table"
    Environment = "production"
  }
}

# Route Table Associations
resource "aws_route_table_association" "prod_public_rta" {
  subnet_id      = aws_subnet.prod_public_subnet.id
  route_table_id = aws_route_table.prod_public_rt.id
}

resource "aws_route_table_association" "prod_private_rta_1" {
  subnet_id      = aws_subnet.prod_private_subnet_1.id
  route_table_id = aws_route_table.prod_private_rt.id
}

resource "aws_route_table_association" "prod_private_rta_2" {
  subnet_id      = aws_subnet.prod_private_subnet_2.id
  route_table_id = aws_route_table.prod_private_rt.id
}

# 3. IAM Roles (no inline policies)
# Lambda Execution Role
resource "aws_iam_role" "prod_lambda_execution_role" {
  name = "prod-lambda-execution-role"

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
    Name        = "prod-lambda-execution-role"
    Environment = "production"
  }
}

# Attach AWS managed policy for Lambda basic execution
resource "aws_iam_role_policy_attachment" "prod_lambda_basic_execution" {
  role       = aws_iam_role.prod_lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for Lambda to access VPC
resource "aws_iam_policy" "prod_lambda_vpc_policy" {
  name        = "prod-lambda-vpc-policy"
  description = "Policy for Lambda VPC access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "prod_lambda_vpc_policy_attachment" {
  role       = aws_iam_role.prod_lambda_execution_role.name
  policy_arn = aws_iam_policy.prod_lambda_vpc_policy.arn
}

# EC2 Instance Role
resource "aws_iam_role" "prod_ec2_role" {
  name = "prod-ec2-role"

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

  tags = {
    Name        = "prod-ec2-role"
    Environment = "production"
  }
}

resource "aws_iam_instance_profile" "prod_ec2_profile" {
  name = "prod-ec2-profile"
  role = aws_iam_role.prod_ec2_role.name
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "prod_rds_enhanced_monitoring" {
  name = "prod-rds-enhanced-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "prod-rds-enhanced-monitoring-role"
    Environment = "production"
  }
}

resource "aws_iam_role_policy_attachment" "prod_rds_enhanced_monitoring" {
  role       = aws_iam_role.prod_rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# 4. Security Groups
# EC2 Security Group - SSH only from specified CIDR
resource "aws_security_group" "prod_ec2_sg" {
  name_prefix = "prod-ec2-sg"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    description = "SSH from specified CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "prod-ec2-security-group"
    Environment = "production"
  }
}

# Lambda Security Group
resource "aws_security_group" "prod_lambda_sg" {
  name_prefix = "prod-lambda-sg"
  vpc_id      = aws_vpc.prod_vpc.id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "prod-lambda-security-group"
    Environment = "production"
  }
}

# RDS Security Group
resource "aws_security_group" "prod_rds_sg" {
  name_prefix = "prod-rds-sg"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    description     = "MySQL/Aurora from Lambda"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_lambda_sg.id]
  }

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_ec2_sg.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "prod-rds-security-group"
    Environment = "production"
  }
}

# 5. S3 Bucket with AES-256 encryption
resource "aws_s3_bucket" "prod_secure_bucket" {
  bucket = "prod-secure-bucket-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "prod-secure-bucket"
    Environment = "production"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prod_bucket_encryption" {
  bucket = aws_s3_bucket.prod_secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "prod_bucket_pab" {
  bucket = aws_s3_bucket.prod_secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "prod_bucket_versioning" {
  bucket = aws_s3_bucket.prod_secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 6. Lambda Function with IAM-authenticated triggers only
resource "aws_lambda_function" "prod_secure_lambda" {
  filename         = "lambda_function.zip"
  function_name    = "prod-secure-lambda"
  role            = aws_iam_role.prod_lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30

  vpc_config {
    subnet_ids         = [aws_subnet.prod_private_subnet_1.id, aws_subnet.prod_private_subnet_2.id]
    security_group_ids = [aws_security_group.prod_lambda_sg.id]
  }

  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }

  tags = {
    Name        = "prod-secure-lambda"
    Environment = "production"
  }

  depends_on = [
    aws_iam_role_policy_attachment.prod_lambda_basic_execution,
    aws_iam_role_policy_attachment.prod_lambda_vpc_policy_attachment,
    aws_cloudwatch_log_group.prod_lambda_logs
  ]
}

# Lambda function code
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
    logger.info('Lambda function invoked with event: %s', json.dumps(event))
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Secure Lambda function executed successfully',
            'environment': 'production'
        })
    }
EOF
    filename = "index.py"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "prod_lambda_logs" {
  name              = "/aws/lambda/prod-secure-lambda"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.prod_master_key.arn

  tags = {
    Name        = "prod-lambda-logs"
    Environment = "production"
  }
}

# Lambda permission for IAM-authenticated invocation only
resource "aws_lambda_permission" "prod_lambda_invoke_permission" {
  statement_id  = "AllowExecutionFromIAM"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.prod_secure_lambda.function_name
  principal     = data.aws_caller_identity.current.account_id
}

# 7. RDS with logging and encryption
resource "aws_db_subnet_group" "prod_db_subnet_group" {
  name       = "prod-db-subnet-group"
  subnet_ids = [aws_subnet.prod_private_subnet_1.id, aws_subnet.prod_private_subnet_2.id]

  tags = {
    Name        = "prod-db-subnet-group"
    Environment = "production"
  }
}

resource "aws_db_parameter_group" "prod_db_params" {
  family = "mysql8.0"
  name   = "prod-db-params"

  parameter {
    name  = "general_log"
    value = "1"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "log_queries_not_using_indexes"
    value = "1"
  }

  tags = {
    Name        = "prod-db-params"
    Environment = "production"
  }
}

resource "aws_db_instance" "prod_rds_instance" {
  identifier = "prod-rds-instance"

  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.prod_master_key.arn

  # Database configuration
  db_name  = "proddb"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.prod_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.prod_rds_sg.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Logging configuration
  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
  parameter_group_name            = aws_db_parameter_group.prod_db_params.name

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.prod_rds_enhanced_monitoring.arn

  # Security
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "prod-rds-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name        = "prod-rds-instance"
    Environment = "production"
  }
}

# CloudWatch Log Groups for RDS logs (encrypted)
resource "aws_cloudwatch_log_group" "prod_rds_error_logs" {
  name              = "/aws/rds/instance/prod-rds-instance/error"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.prod_master_key.arn

  tags = {
    Name        = "prod-rds-error-logs"
    Environment = "production"
  }
}

resource "aws_cloudwatch_log_group" "prod_rds_general_logs" {
  name              = "/aws/rds/instance/prod-rds-instance/general"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.prod_master_key.arn

  tags = {
    Name        = "prod-rds-general-logs"
    Environment = "production"
  }
}

resource "aws_cloudwatch_log_group" "prod_rds_slowquery_logs" {
  name              = "/aws/rds/instance/prod-rds-instance/slowquery"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.prod_master_key.arn

  tags = {
    Name        = "prod-rds-slowquery-logs"
    Environment = "production"
  }
}

# 8. EC2 Instance in private subnet
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
}

resource "aws_instance" "prod_ec2_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_private_subnet_1.id
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.prod_ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id           = aws_kms_key.prod_master_key.arn
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name        = "prod-ec2-instance"
    Environment = "production"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.prod_private_subnet_1.id, aws_subnet.prod_private_subnet_2.id]
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.prod_master_key.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.prod_secure_bucket.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.prod_secure_lambda.function_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.prod_rds_instance.endpoint
  sensitive   = true
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.prod_ec2_instance.id
}
```

## Key Security Features Implemented

### 1. **IAM Roles Management**
- ✅ All permissions managed through IAM roles, no inline policies
- Separate roles for Lambda, EC2, and RDS enhanced monitoring
- Proper assume role policies for each service

### 2. **S3 Encryption**
- ✅ AES-256 server-side encryption enabled
- Public access blocked completely
- Versioning enabled for data protection

### 3. **VPC Network Isolation**
- ✅ Complete VPC setup with private subnets
- NAT Gateway for controlled internet access
- All resources deployed in private subnets

### 4. **Lambda Security**
- ✅ Lambda deployed in VPC private subnets
- IAM-authenticated invocation only
- Proper security groups and VPC configuration

### 5. **RDS Logging and Encryption**
- ✅ All database logs enabled (error, general, slow query)
- Storage encryption with KMS
- CloudWatch logs encrypted with KMS
- Enhanced monitoring enabled

### 6. **EC2 Security Groups**
- ✅ SSH access restricted to specified CIDR range only
- No other inbound traffic allowed
- Deployed in private subnet

### 7. **KMS Key Management**
- ✅ Automatic key rotation enabled
- Used for encrypting RDS, EBS, and CloudWatch logs
- Proper key policies implemented

## Usage Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Plan the deployment:**
```bash
terraform plan -var="allowed_ssh_cidr=YOUR_IP_RANGE/32"
```

3. **Apply the configuration:**
```bash
terraform apply -var="allowed_ssh_cidr=YOUR_IP_RANGE/32"
```

4. **Verify security compliance:**
- Check AWS Trusted Advisor for security recommendations
- Review CloudTrail logs for all API calls
- Validate encryption status of all resources

This configuration ensures enterprise-grade security compliance and follows AWS Well-Architected Framework security pillar best practices.