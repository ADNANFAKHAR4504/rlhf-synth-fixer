# Infrastructure as Code Solution

## Terraform Configuration Files


### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Secondary provider for DR region resources (used via provider alias in modules/resources)
provider "aws" {
  alias  = "secondary"
  region = var.dr_region
}
```


### tap_stack.tf

```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Secondary (DR) AWS region"
  type        = string
  default     = "us-east-2"
}

variable "name_prefix" {
  description = "Common name prefix for resources"
  type        = string
  default     = "tap"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr1485, dev, staging)"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "Primary VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dr_vpc_cidr" {
  description = "DR VPC CIDR"
  type        = string
  default     = "10.1.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for Auto Scaling"
  type        = string
  default     = "t3.micro"
}

variable "desired_capacity" {
  description = "ASG desired capacity"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "ASG max capacity"
  type        = number
  default     = 4
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    Application = "WebApp"
    Environment = "Production"
    ManagedBy   = "terraform"
    Owner       = "platform"
  }
}

########################
# Data & Locals
########################
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Resource naming with environment suffix
  resource_prefix = var.environment_suffix != "" ? "${var.name_prefix}-${var.environment_suffix}" : var.name_prefix
  
  azs           = slice(data.aws_availability_zones.available.names, 0, 2)
  public_cidrs  = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_cidrs = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i + 10)]

  dr_public_cidrs  = [for i in range(2) : cidrsubnet(var.dr_vpc_cidr, 8, i)]
  dr_private_cidrs = [for i in range(2) : cidrsubnet(var.dr_vpc_cidr, 8, i + 10)]
  dr_azs           = slice(data.aws_availability_zones.dr.names, 0, 2)

  common_tags = merge(
    var.tags,
    {
      Region    = data.aws_region.current.region
      ManagedBy = "terraform"
    }
  )
}

########################
# (Removed) Central S3 logging bucket – not required by prompt
########################

########################
# KMS for RDS
########################
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS at-rest encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.resource_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

########################
# VPC (Primary)
########################
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.resource_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = local.azs
  public_subnets  = local.public_cidrs
  private_subnets = local.private_cidrs

  enable_nat_gateway       = true
  single_nat_gateway       = true
  enable_dns_hostnames     = true
  enable_dns_support       = true
  map_public_ip_on_launch  = false

  tags = local.common_tags
}

########################
# Security Groups (Primary)
########################
resource "aws_security_group" "alb" {
  name        = "${local.resource_prefix}-alb-sg"
  description = "ALB ingress"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description      = "HTTP from anywhere"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = local.common_tags
}

resource "aws_security_group" "app" {
  name        = "${local.resource_prefix}-app-sg"
  description = "Allow from ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "App HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = local.common_tags
}

resource "aws_security_group" "lambda" {
  name        = "${local.resource_prefix}-lambda-sg"
  description = "Lambda VPC access"
  vpc_id      = module.vpc.vpc_id

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = local.common_tags
}

resource "aws_security_group" "rds" {
  name        = "${local.resource_prefix}-rds-sg"
  description = "MySQL ingress from app and lambda"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "MySQL from app"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "MySQL from lambda"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = local.common_tags
}

########################
# ALB (Primary)
########################
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.7"

  name               = "${local.resource_prefix}-alb"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]

  http_tcp_listeners = [
    {
      port               = 80
      protocol           = "HTTP"
      target_group_index = 0
    }
  ]

  target_groups = [
    {
      name             = "${local.resource_prefix}-tg"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "instance"
      health_check = {
        path                = "/"
        protocol            = "HTTP"
        matcher             = "200-399"
        interval            = 30
        timeout             = 5
        healthy_threshold   = 2
        unhealthy_threshold = 2
      }
    }
  ]

  # Access logs to S3 disabled to avoid ACL constraints in minimal setup

  tags = local.common_tags
}

########################
# Auto Scaling (Primary)
########################
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.resource_prefix}-lt-"
  image_id      = data.aws_ssm_parameter.al2023_ami.value
  instance_type = var.instance_type
  vpc_security_group_ids = [aws_security_group.app.id]
  user_data = base64encode(<<-EOT
    #!/bin/bash
    dnf update -y
    dnf install -y nginx
    cat <<'HTML' >/usr/share/nginx/html/index.html
    <html><body><h1>${local.resource_prefix} - Hello from ASG</h1></body></html>
    HTML
    systemctl enable nginx
    systemctl start nginx
  EOT
  )
  tag_specifications {
    resource_type = "instance"
    tags = local.common_tags
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${local.resource_prefix}-asg"
  vpc_zone_identifier       = module.vpc.private_subnets
  min_size                  = 1
  max_size                  = var.max_capacity
  desired_capacity          = var.desired_capacity
  health_check_type         = "EC2"
  health_check_grace_period = 120
  target_group_arns         = module.alb.target_group_arns

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.resource_prefix}-app"
    propagate_at_launch = true
  }
}

########################
# RDS MySQL (Multi-AZ + KMS)
########################
data "aws_secretsmanager_random_password" "db" {
  password_length = 20
  exclude_characters = "\"'\\/`$"
  require_each_included_type = true
}

resource "aws_secretsmanager_secret" "db" {
  name        = "${local.resource_prefix}/rds/mysql"
  description = "RDS master credentials"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = data.aws_secretsmanager_random_password.db.random_password
  })
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.6"

  identifier = "${local.resource_prefix}-mysql"

  engine               = "mysql"
  engine_version       = "8.0"
  family               = "mysql8.0"
  major_engine_version = "8.0"
  instance_class       = "db.t4g.micro"

  allocated_storage      = 20
  max_allocated_storage  = 100
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  deletion_protection    = true
  skip_final_snapshot    = true
  backup_retention_period = 7
  publicly_accessible    = false

  username = var.db_username
  password = data.aws_secretsmanager_random_password.db.random_password
  port     = 3306

  manage_master_user_password = false

  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.rds.id]

  performance_insights_enabled = false

  tags = local.common_tags
}

########################
# Lambda (inline zip) + IAM
########################
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.resource_prefix}-handler"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_iam_role" "lambda" {
  name               = "${local.resource_prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy" "lambda_secrets_read" {
  name   = "${local.resource_prefix}-lambda-secrets-read"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_db_secret.json
}

data "aws_iam_policy_document" "lambda_db_secret" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [aws_secretsmanager_secret.db.arn]
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    content  = <<-PY
      import json
      import os
      import boto3

      def handler(event, context):
          secret_id = os.environ.get("DB_SECRET_ID", "")
          ok = True
          if secret_id:
              try:
                  sm = boto3.client("secretsmanager")
                  sm.describe_secret(SecretId=secret_id)
              except Exception:
                  ok = False
          return {"statusCode": 200, "body": json.dumps({"ok": ok})}
    PY
    filename = "index.py"
  }
}

resource "aws_lambda_function" "handler" {
  function_name = "${local.resource_prefix}-handler"
  role          = aws_iam_role.lambda.arn
  runtime       = "python3.11"
  handler       = "index.handler"
  filename      = data.archive_file.lambda_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)

  environment {
    variables = {
      DB_SECRET_ID = aws_secretsmanager_secret.db.id
      DB_HOST      = module.rds.db_instance_address
    }
  }

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.common_tags
}

########################
# API Gateway + Cognito authorizer
########################
resource "aws_cognito_user_pool" "this" {
  name = "${local.resource_prefix}-users"
  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
  mfa_configuration = "OFF"
  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "this" {
  name                    = "${local.resource_prefix}-client"
  user_pool_id            = aws_cognito_user_pool.this.id
  generate_secret         = true
  explicit_auth_flows     = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
  supported_identity_providers = ["COGNITO"]
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "${local.resource_prefix}-api"
  description = "API Gateway fronting Lambda"
  endpoint_configuration { types = ["REGIONAL"] }
  tags = local.common_tags
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${local.resource_prefix}-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.api.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.this.arn]
  identity_source = "method.request.header.Authorization"
}

resource "aws_api_gateway_resource" "hello" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "hello"
}

resource "aws_api_gateway_method" "hello_any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.hello.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "hello_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.hello.id
  http_method             = aws_api_gateway_method.hello_any.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.handler.invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handler.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  triggers    = { redeploy = timestamp() }
  lifecycle { create_before_destroy = true }
  
  depends_on = [
    aws_api_gateway_method.hello_any,
    aws_api_gateway_integration.hello_integration
  ]
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.api.id
  stage_name    = "prod"
  xray_tracing_enabled = true
  tags                 = local.common_tags

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format          = jsonencode({ requestId = "$context.requestId", ip = "$context.identity.sourceIp", requestTime = "$context.requestTime", httpMethod = "$context.httpMethod", routeKey = "$context.routeKey", status = "$context.status", protocol = "$context.protocol" })
  }

  depends_on = [aws_api_gateway_account.this]
}

# API Gateway access logging setup (minimal, scoped)
data "aws_iam_policy_document" "apigw_logs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apigw_logs" {
  name               = "${local.resource_prefix}-apigw-logs-role"
  assume_role_policy = data.aws_iam_policy_document.apigw_logs_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "apigw_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "apigw_logs" {
  name   = "${local.resource_prefix}-apigw-logs-policy"
  role   = aws_iam_role.apigw_logs.id
  policy = data.aws_iam_policy_document.apigw_logs.json
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${local.resource_prefix}-prod"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.apigw_logs.arn
}

 

resource "aws_api_gateway_method_settings" "all_methods" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled      = true
    logging_level        = "OFF"
    data_trace_enabled   = false
    throttling_burst_limit = 1000
    throttling_rate_limit  = 500
  }
}

########################
# CloudFront fronting ALB
########################
resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  comment             = "${local.resource_prefix} distribution"
  default_root_object = ""

  origin {
    domain_name = module.alb.lb_dns_name
    origin_id   = "alb-origin"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = true
      headers      = ["Authorization"]
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # CloudFront logging disabled to keep minimal surface area

  price_class = "PriceClass_100"
  tags        = local.common_tags
}

########################
# DR Region (minimal): VPC + ALB + ASG
########################
data "aws_availability_zones" "dr" {
  provider = aws.secondary
  state    = "available"
}

module "vpc_dr" {
  providers = { aws = aws.secondary }
  source    = "terraform-aws-modules/vpc/aws"
  version   = "~> 5.0"

  name = "${local.resource_prefix}-vpc-dr"
  cidr = var.dr_vpc_cidr

  azs             = local.dr_azs
  public_subnets  = local.dr_public_cidrs
  private_subnets = local.dr_private_cidrs

  enable_nat_gateway       = true
  single_nat_gateway       = true
  enable_dns_hostnames     = true
  enable_dns_support       = true
  map_public_ip_on_launch  = false

  tags = merge(local.common_tags, { Region = var.dr_region })
}

resource "aws_security_group" "alb_dr" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-alb-sg-dr"
  description = "ALB ingress DR"
  vpc_id      = module.vpc_dr.vpc_id

  ingress {
    description      = "HTTP from anywhere"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, { Region = var.dr_region })
}

resource "aws_security_group" "app_dr" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-app-sg-dr"
  description = "Allow from ALB (DR)"
  vpc_id      = module.vpc_dr.vpc_id

  ingress {
    description     = "App HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_dr.id]
  }

  egress {
    description      = "All egress"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, { Region = var.dr_region })
}

module "alb_dr" {
  providers = { aws = aws.secondary }
  source    = "terraform-aws-modules/alb/aws"
  version   = "~> 8.7"

  name               = "${local.resource_prefix}-alb-dr"
  load_balancer_type = "application"
  vpc_id             = module.vpc_dr.vpc_id
  subnets            = module.vpc_dr.public_subnets
  security_groups    = [aws_security_group.alb_dr.id]

  http_tcp_listeners = [
    {
      port               = 80
      protocol           = "HTTP"
      target_group_index = 0
    }
  ]

  target_groups = [
    {
      name             = "${local.resource_prefix}-tg-dr"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "instance"
      health_check = {
        path     = "/"
        protocol = "HTTP"
      }
    }
  ]

  # Access logs disabled in DR for minimal setup

  tags = merge(local.common_tags, { Region = var.dr_region })
}

data "aws_ssm_parameter" "al2023_ami_dr" {
  provider = aws.secondary
  name     = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_launch_template" "app_dr" {
  provider      = aws.secondary
  name_prefix   = "${local.resource_prefix}-lt-dr-"
  image_id      = data.aws_ssm_parameter.al2023_ami_dr.value
  instance_type = var.instance_type
  vpc_security_group_ids = [aws_security_group.app_dr.id]
  user_data = base64encode(<<-EOT
    #!/bin/bash
    dnf update -y
    dnf install -y nginx
    echo "<html><body><h1>${local.resource_prefix} - DR</h1></body></html>" >/usr/share/nginx/html/index.html
    systemctl enable nginx
    systemctl start nginx
  EOT
  )
  tag_specifications {
    resource_type = "instance"
    tags = local.common_tags
  }
}

resource "aws_autoscaling_group" "app_dr" {
  provider                 = aws.secondary
  name                      = "${local.resource_prefix}-asg-dr"
  vpc_zone_identifier      = module.vpc_dr.private_subnets
  min_size                 = 1
  max_size                 = var.max_capacity
  desired_capacity         = 1
  target_group_arns        = module.alb_dr.target_group_arns
  health_check_type        = "EC2"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.app_dr.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.resource_prefix}-app-dr"
    propagate_at_launch = true
  }
}

########################
# Outputs
########################
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = module.alb.lb_dns_name
}

output "api_invoke_url" {
  value = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}/hello"
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.this.id
}
```
