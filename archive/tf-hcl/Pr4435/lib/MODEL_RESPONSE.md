```hcl
# tap_stack.tf - Secure & Compliant AWS Infrastructure

###############################################################################
# Common Variables & Locals
###############################################################################

locals {
  # Environment-specific configurations
  environments = {
    dev = {
      name       = "development"
      short_name = "dev"
      cidr_block = "10.0.0.0/16"
      azs        = ["a", "b"]
    }
    staging = {
      name       = "staging"
      short_name = "stg"
      cidr_block = "10.1.0.0/16"
      azs        = ["a", "b", "c"]
    }
    prod = {
      name       = "production"
      short_name = "prod"
      cidr_block = "10.2.0.0/16"
      azs        = ["a", "b", "c"]
    }
  }

  # Organization's allowed IP ranges
  allowed_ip_ranges = ["192.168.1.0/24", "10.100.0.0/16"]

  # Common tags applied to all resources
  common_tags = {
    CostCenter = "IT-Infrastructure"
    Owner      = "Cloud-Ops"
    Terraform  = "true"
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

###############################################################################
# KMS Keys
###############################################################################

resource "aws_kms_key" "main" {
  description             = "Main encryption key for ${local.environments[var.environment].name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-main-kms-key"
      Environment = local.environments[var.environment].name
    }
  )

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.environments[var.environment].short_name}-main"
  target_key_id = aws_kms_key.main.key_id
}

data "aws_caller_identity" "current" {}

###############################################################################
# Networking - VPC & Subnets
###############################################################################

resource "aws_vpc" "main" {
  cidr_block           = local.environments[var.environment].cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-vpc"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_subnet" "private" {
  count             = length(local.environments[var.environment].azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.environments[var.environment].cidr_block, 8, count.index)
  availability_zone = "${var.aws_region}${local.environments[var.environment].azs[count.index]}"

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-private-${local.environments[var.environment].azs[count.index]}"
      Environment = local.environments[var.environment].name
      Tier        = "private"
    }
  )
}

resource "aws_subnet" "public" {
  count             = length(local.environments[var.environment].azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.environments[var.environment].cidr_block, 8, count.index + 100)
  availability_zone = "${var.aws_region}${local.environments[var.environment].azs[count.index]}"

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-public-${local.environments[var.environment].azs[count.index]}"
      Environment = local.environments[var.environment].name
      Tier        = "public"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-igw"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_eip" "nat" {
  count = length(local.environments[var.environment].azs)

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-nat-eip-${local.environments[var.environment].azs[count.index]}"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_nat_gateway" "main" {
  count         = length(local.environments[var.environment].azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-nat-${local.environments[var.environment].azs[count.index]}"
      Environment = local.environments[var.environment].name
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
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-public-rt"
      Environment = local.environments[var.environment].name
      Tier        = "public"
    }
  )
}

resource "aws_route_table" "private" {
  count  = length(local.environments[var.environment].azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-private-rt-${local.environments[var.environment].azs[count.index]}"
      Environment = local.environments[var.environment].name
      Tier        = "private"
    }
  )
}

resource "aws_route_table_association" "public" {
  count          = length(local.environments[var.environment].azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(local.environments[var.environment].azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

###############################################################################
# Security Groups
###############################################################################

resource "aws_security_group" "app" {
  name        = "${local.environments[var.environment].name}-app-sg"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  # Restrict inbound traffic to internal and allowed IP ranges
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = concat([local.environments[var.environment].cidr_block], local.allowed_ip_ranges)
    description = "HTTPS from internal VPC and allowed IPs"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = concat([local.environments[var.environment].cidr_block], local.allowed_ip_ranges)
    description = "HTTP from internal VPC and allowed IPs"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-app-sg"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_security_group" "db" {
  name        = "${local.environments[var.environment].name}-db-sg"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  # Allow database connections only from app tier
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL from app tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-db-sg"
      Environment = local.environments[var.environment].name
    }
  )
}

###############################################################################
# IAM Roles & Policies
###############################################################################

# EC2 instance profile
resource "aws_iam_role" "ec2_role" {
  name = "${local.environments[var.environment].name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Condition = {
          IpAddress = {
            "aws:SourceIp" = local.allowed_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-ec2-role"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.environments[var.environment].name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "${local.environments[var.environment].name}-ec2-s3-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.app.arn}",
          "${aws_s3_bucket.app.arn}/*"
        ]
      }
    ]
  })
}

# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${local.environments[var.environment].name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-lambda-role"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_iam_role_policy" "lambda_vpc_access" {
  name = "${local.environments[var.environment].name}-lambda-vpc-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
      }
    ]
  })
}

###############################################################################
# S3 Buckets
###############################################################################

resource "aws_s3_bucket" "app" {
  bucket = "${local.environments[var.environment].short_name}-app-data-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-app-data"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket = aws_s3_bucket.app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:*",
        Resource = [
          "${aws_s3_bucket.app.arn}",
          "${aws_s3_bucket.app.arn}/*"
        ],
        Condition = {
          NotIpAddress = {
            "aws:SourceIp" = local.allowed_ip_ranges
          }
        }
      },
      {
        Effect = "Allow",
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        },
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.app.arn}",
          "${aws_s3_bucket.app.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.environments[var.environment].short_name}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-logs"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###############################################################################
# CloudTrail
###############################################################################

resource "aws_cloudtrail" "main" {
  name                          = "${local.environments[var.environment].name}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-cloudtrail"
      Environment = local.environments[var.environment].name
    }
  )
}

###############################################################################
# CloudWatch Alarms
###############################################################################

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.environments[var.environment].name}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-cloudtrail-logs"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "console_signin_failures" {
  alarm_name          = "${local.environments[var.environment].name}-console-signin-failures"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleSignInFailureCount"
  namespace           = "AWS/CloudTrail"
  period              = "300"
  statistic           = "Sum"
  threshold           = "3"
  alarm_description   = "This metric monitors failed console logins"

  alarm_actions = [aws_sns_topic.security_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-console-signin-failures"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_sns_topic" "security_alerts" {
  name = "${local.environments[var.environment].name}-security-alerts"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-security-alerts"
      Environment = local.environments[var.environment].name
    }
  )
}

###############################################################################
# RDS PostgreSQL
###############################################################################

resource "aws_db_subnet_group" "main" {
  name       = "${local.environments[var.environment].name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-db-subnet-group"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${local.environments[var.environment].name}-postgres13-params"
  family = "postgres13"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-postgres13-params"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_db_instance" "main" {
  identifier             = "${local.environments[var.environment].name}-postgres"
  engine                 = "postgres"
  engine_version         = "13"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  max_allocated_storage  = 1000
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.main.arn
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name
  
  # Use a reference to a sensitive parameter store value in real usage
  username               = "dbadmin"
  password               = "TemporaryPassword123!" # Should be replaced with a reference to a secure parameter
  
  # Disable public accessibility
  publicly_accessible    = false
  
  # Enable deletion protection for production
  deletion_protection    = var.environment == "prod" ? true : false
  
  # Enable automated backups with 7 days retention
  backup_retention_period = 7
  
  # Enable Performance Insights with 7 days retention
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  performance_insights_retention_period = 7
  
  # Skip final snapshot in dev/staging, but keep it in prod
  skip_final_snapshot = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${local.environments[var.environment].name}-postgres-final-snapshot" : null

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-postgres"
      Environment = local.environments[var.environment].name
    }
  )
}


###############################################################################
# Lambda Functions
###############################################################################

resource "aws_lambda_function" "app_processor" {
  function_name    = "${local.environments[var.environment].name}-app-processor"
  description      = "Process application data"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs14.x"
  memory_size      = 256
  timeout          = 30
  
  # Use a reference to a real S3 object in real usage
  s3_bucket        = aws_s3_bucket.app.id
  s3_key           = "lambda/app-processor.zip"
  
  # Configure VPC access
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.app.id]
  }
  
  # Set concurrency limits
  reserved_concurrent_executions = 10

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.address
      DB_NAME     = aws_db_instance.main.db_name
      ENVIRONMENT = local.environments[var.environment].name
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-app-processor"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.app_processor.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-app-processor-logs"
      Environment = local.environments[var.environment].name
    }
  )
}

###############################################################################
# EC2 Instances
###############################################################################

data "aws_ami" "amazon_linux2" {
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

resource "aws_launch_template" "app" {
  name_prefix   = "${local.environments[var.environment].name}-app-"
  image_id      = data.aws_ami.amazon_linux2.id
  instance_type = "t3.medium"
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
  }
  
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp2"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
    }
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Enforce IMDSv2
    http_put_response_hop_limit = 1
  }
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install -y nginx
    systemctl enable nginx
    systemctl start nginx
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name        = "${local.environments[var.environment].name}-app-instance"
        Environment = local.environments[var.environment].name
      }
    )
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix               = "${local.environments[var.environment].name}-app-asg-"
  vpc_zone_identifier       = aws_subnet.private[*].id
  min_size                  = 2
  max_size                  = 10
  desired_capacity          = 2
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  tag {
    key                 = "Name"
    value               = "${local.environments[var.environment].name}-app-asg"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
  
  tag {
    key                 = "Environment"
    value               = local.environments[var.environment].name
    propagate_at_launch = true
  }
}

###############################################################################
# API Gateway
###############################################################################

resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.environments[var.environment].name}-api"
  description = "Main API for ${local.environments[var.environment].name} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-api"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_api_gateway_resource" "resource" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "resource"
}

resource "aws_api_gateway_method" "get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.resource.id
  http_method   = "GET"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.resource.id
  http_method             = aws_api_gateway_method.get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app_processor.invoke_arn
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.resource.id
  http_method = aws_api_gateway_method.get.http_method
  status_code = "200"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = local.environments[var.environment].short_name

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${local.environments[var.environment].name}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "apigateway.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${local.environments[var.environment].name}-api-gateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

###############################################################################
# AWS WAF 
###############################################################################

resource "aws_wafv2_web_acl" "main" {
  name        = "${local.environments[var.environment].name}-web-acl"
  description = "Web ACL for ${local.environments[var.environment].name} environment"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.environments[var.environment].name}-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.environments[var.environment].name}-AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateBasedRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.environments[var.environment].name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.environments[var.environment].name}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-web-acl"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = local.environments[var.environment].short_name

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = jsonencode({
      requestId      = "$context.requestId",
      ip             = "$context.identity.sourceIp",
      requestTime    = "$context.requestTime",
      httpMethod     = "$context.httpMethod",
      routeKey       = "$context.routeKey",
      status         = "$context.status",
      protocol       = "$context.protocol",
      responseLength = "$context.responseLength",
      userAgent      = "$context.identity.userAgent"
    })
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-api-stage"
      Environment = local.environments[var.environment].name
    }
  )
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.main.name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.environments[var.environment].name}-api-gateway-logs"
      Environment = local.environments[var.environment].name
    }
  )
}
