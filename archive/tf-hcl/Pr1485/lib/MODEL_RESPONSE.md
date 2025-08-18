# Terraform Multi-Region Web Application Stack

I'll create a comprehensive Terraform configuration that deploys a highly available, fault-tolerant web application across multiple AWS regions. This configuration follows AWS best practices for security, scalability, and disaster recovery.

## tap_stack.tf

```hcl
# Configure Terraform and AWS Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary Region Provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment   = "Production"
      Application   = "WebApp"
      ManagedBy     = "Terraform"
      Project       = "MultiRegionWebApp"
      Owner         = "DevOps"
    }
  }
}

# Secondary Region Provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment   = "Production"
      Application   = "WebApp"
      ManagedBy     = "Terraform"
      Project       = "MultiRegionWebApp"
      Owner         = "DevOps"
    }
  }
}

# Data sources
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_ami" "amazon_linux" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for primary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "webapp-primary-kms-key"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/webapp-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for secondary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "webapp-secondary-kms-key"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/webapp-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# PRIMARY REGION INFRASTRUCTURE

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "webapp-vpc-primary"
  }
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = {
    Name = "webapp-igw-primary"
  }
}

# Public Subnets - Primary
resource "aws_subnet" "public_primary" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "webapp-public-subnet-${count.index + 1}-primary"
    Type = "Public"
  }
}

# Private Subnets - Primary
resource "aws_subnet" "private_primary" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = {
    Name = "webapp-private-subnet-${count.index + 1}-primary"
    Type = "Private"
  }
}

# NAT Gateways - Primary
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = 2
  domain   = "vpc"
  
  tags = {
    Name = "webapp-nat-eip-${count.index + 1}-primary"
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 2
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id
  
  tags = {
    Name = "webapp-nat-${count.index + 1}-primary"
  }
}

# Route Tables - Primary
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = {
    Name = "webapp-public-rt-primary"
  }
}

resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = {
    Name = "webapp-private-rt-${count.index + 1}-primary"
  }
}

# Route Table Associations - Primary
resource "aws_route_table_association" "public_primary" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# SECONDARY REGION INFRASTRUCTURE

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "webapp-vpc-secondary"
  }
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = {
    Name = "webapp-igw-secondary"
  }
}

# Public Subnets - Secondary
resource "aws_subnet" "public_secondary" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "webapp-public-subnet-${count.index + 1}-secondary"
    Type = "Public"
  }
}

# Private Subnets - Secondary
resource "aws_subnet" "private_secondary" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = {
    Name = "webapp-private-subnet-${count.index + 1}-secondary"
    Type = "Private"
  }
}

# NAT Gateways - Secondary
resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  count    = 2
  domain   = "vpc"
  
  tags = {
    Name = "webapp-nat-eip-${count.index + 1}-secondary"
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 2
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id
  
  tags = {
    Name = "webapp-nat-${count.index + 1}-secondary"
  }
}

# Route Tables - Secondary
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = {
    Name = "webapp-public-rt-secondary"
  }
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = {
    Name = "webapp-private-rt-${count.index + 1}-secondary"
  }
}

# Route Table Associations - Secondary
resource "aws_route_table_association" "public_secondary" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# SECURITY GROUPS

# ALB Security Group - Primary
resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "webapp-alb-sg-primary"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.primary.id
  
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
  
  tags = {
    Name = "webapp-alb-sg-primary"
  }
}

# EC2 Security Group - Primary
resource "aws_security_group" "ec2_primary" {
  provider    = aws.primary
  name        = "webapp-ec2-sg-primary"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "webapp-ec2-sg-primary"
  }
}

# RDS Security Group - Primary
resource "aws_security_group" "rds_primary" {
  provider    = aws.primary
  name        = "webapp-rds-sg-primary"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id, aws_security_group.lambda_primary.id]
  }
  
  tags = {
    Name = "webapp-rds-sg-primary"
  }
}

# Lambda Security Group - Primary
resource "aws_security_group" "lambda_primary" {
  provider    = aws.primary
  name        = "webapp-lambda-sg-primary"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.primary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "webapp-lambda-sg-primary"
  }
}

# Similar Security Groups for Secondary Region
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "webapp-alb-sg-secondary"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.secondary.id
  
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
  
  tags = {
    Name = "webapp-alb-sg-secondary"
  }
}

resource "aws_security_group" "ec2_secondary" {
  provider    = aws.secondary
  name        = "webapp-ec2-sg-secondary"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "webapp-ec2-sg-secondary"
  }
}

resource "aws_security_group" "lambda_secondary" {
  provider    = aws.secondary
  name        = "webapp-lambda-sg-secondary"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.secondary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "webapp-lambda-sg-secondary"
  }
}

# RDS SUBNET GROUPS
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "webapp-db-subnet-group-primary"
  subnet_ids = aws_subnet.private_primary[*].id
  
  tags = {
    Name = "webapp-db-subnet-group-primary"
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "webapp-db-subnet-group-secondary"
  subnet_ids = aws_subnet.private_secondary[*].id
  
  tags = {
    Name = "webapp-db-subnet-group-secondary"
  }
}

# RDS INSTANCES
resource "aws_db_instance" "primary" {
  provider                = aws.primary
  identifier              = "webapp-db-primary"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id             = aws_kms_key.primary.arn
  
  db_name  = "webapp"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager
  
  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name = "webapp-db-primary"
  }
}

resource "aws_db_instance" "secondary" {
  provider                = aws.secondary
  identifier              = "webapp-db-secondary"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id             = aws_kms_key.secondary.arn
  
  db_name  = "webapp"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager
  
  vpc_security_group_ids = [aws_security_group.lambda_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name = "webapp-db-secondary"
  }
}

# IAM ROLES AND POLICIES

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "webapp-ec2-role"
  
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
    Name = "webapp-ec2-role"
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "webapp-ec2-policy"
  role = aws_iam_role.ec2_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "webapp-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "webapp-lambda-role"
  
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
    Name = "webapp-lambda-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "webapp-lambda-policy"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:Connect",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# COGNITO USER POOL
resource "aws_cognito_user_pool" "main" {
  provider = aws.primary
  name     = "webapp-user-pool"
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
  
  auto_verified_attributes = ["email"]
  
  schema {
    attribute_data_type = "String"
    name               = "email"
    required           = true
    mutable            = true
  }
  
  tags = {
    Name = "webapp-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "main" {
  provider     = aws.primary
  name         = "webapp-user-pool-client"
  user_pool_id = aws_cognito_user_pool.main.id
  
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["https://example.com/callback"]
  logout_urls                          = ["https://example.com/logout"]
  
  supported_identity_providers = ["COGNITO"]
}

# LAMBDA FUNCTIONS

# Lambda function code (inline for simplicity)
resource "aws_lambda_function" "api_handler_primary" {
  provider         = aws.primary
  filename         = "lambda_function.zip"
  function_name    = "webapp-api-handler-primary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  
  vpc_config {
    subnet_ids         = aws_subnet.private_primary[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  tracing_config {
    mode = "Active"
  }
  
  environment {
    variables = {
      DB_HOST     = aws_db_instance.primary.endpoint
      DB_NAME     = aws_db_instance.primary.db_name
      DB_USER     = aws_db_instance.primary.username
      REGION      = "us-east-1"
    }
  }
  
  tags = {
    Name = "webapp-api-handler-primary"
  }
}

resource "aws_lambda_function" "api_handler_secondary" {
  provider         = aws.secondary
  filename         = "lambda_function.zip"
  function_name    = "webapp-api-handler-secondary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  
  vpc_config {
    subnet_ids         = aws_subnet.private_secondary[*].id
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  
  tracing_config {
    mode = "Active"
  }
  
  environment {
    variables = {
      DB_HOST     = aws_db_instance.secondary.endpoint
      DB_NAME     = aws_db_instance.secondary.db_name
      DB_USER     = aws_db_instance.secondary.username
      REGION      = "us-west-2"
    }
  }
  
  tags = {
    Name = "webapp-api-handler-secondary"
  }
}

# Create a dummy zip file for Lambda
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
    logger.info(f"Received event: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'region': context.invoked_function_arn.split(':')[3]
        })
    }
EOF
    filename = "index.py"
  }
}

# API GATEWAY
resource "aws_api_gateway_rest_api" "main" {
  provider = aws.primary
  name     = "webapp-api"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = {
    Name = "webapp-api"
  }
}

resource "aws_api_gateway_resource" "api" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_method" "api_get" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.api.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_authorizer" "cognito" {
  provider        = aws.primary
  name            = "webapp-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.main.arn]
}

resource "aws_api_gateway_integration" "lambda" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.api.id
  http_method             = aws_api_gateway_method.api_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_primary.invoke_arn
}

resource "aws_api_gateway_deployment" "main" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "prod"
  
  depends_on = [
    aws_api_gateway_method.api_get,
    aws_api_gateway_integration.lambda
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "api_gateway" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# APPLICATION LOAD BALANCERS

# ALB - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "webapp-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.public_primary[*].id
  
  enable_deletion_protection = false
  
  tags = {
    Name = "webapp-alb-primary"
  }
}

resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "webapp-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  tags = {
    Name = "webapp-tg-primary"
  }
}

resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
```