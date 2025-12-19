### Reasoning Trace
---

Alright, I'm asked to create a comprehensive Terraform script for a serverless ML model inference pipeline for a fintech company. This is a complex task that needs to cover multiple AWS services and ensure they're connected properly. Let me break down what I need to include:

1. **Variable declarations**
   - AWS region (referenced from provider.tf)
   - Environment-specific settings
   - Tagging values
   - Configuration parameters

2. **AWS Lambda (Container-based Model Inference)**
   - Lambda functions for different model versions
   - Container image configurations
   - Provisioned concurrency and scaling
   - EFS mounting
   - Environment variables

3. **Amazon EFS (Model Storage)**
   - EFS filesystem
   - Mount points
   - KMS encryption
   - Security groups

4. **Amazon API Gateway**
   - API Gateway configuration
   - Stages for version management
   - Lambda integrations
   - API keys and usage plans
   - WAF integration
   - Logging

5. **AWS ECR (Container Registry)**
   - ECR repositories
   - Lifecycle policies
   - Encryption
   - Vulnerability scanning

6. **Monitoring & Observability**
   - CloudWatch metrics
   - Alarms
   - X-Ray tracing

7. **Auto-Scaling and Concurrency Management**
   - Provisioned concurrency
   - Application Auto Scaling
   - CloudWatch alarms for scaling triggers

8. **AWS IAM**
   - IAM roles for each service
   - Policy definitions
   - Least privilege principle

9. **Security Controls**
   - KMS keys
   - TLS enforcement
   - WAF configurations
   - Parameter Store

10. **Tagging**
    - Apply consistent tags across all resources

Let me create the Terraform script now, making sure all these components are properly integrated.

```terraform
# tap_stack.tf - Terraform script for serverless ML model inference pipeline

##############################################
# Variables
##############################################

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ml-fraud-detection"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "Data Science Team"
}

variable "version" {
  description = "Version of the deployment"
  type        = string
  default     = "1.0.0"
}

variable "model_versions" {
  description = "List of model versions to deploy"
  type        = list(string)
  default     = ["v1", "v2"]
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
  type        = number
  default     = 60
}

variable "provisioned_concurrency" {
  description = "Provisioned concurrency for Lambda functions"
  type        = number
  default     = 10
}

variable "max_concurrency" {
  description = "Maximum concurrency for Lambda functions"
  type        = number
  default     = 100
}

variable "api_gateway_throttling_rate_limit" {
  description = "Rate limit for API Gateway"
  type        = number
  default     = 1000
}

variable "api_gateway_throttling_burst_limit" {
  description = "Burst limit for API Gateway"
  type        = number
  default     = 2000
}

variable "ecr_image_scan_on_push" {
  description = "Enable scanning on image push to ECR"
  type        = bool
  default     = true
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability setting for ECR"
  type        = string
  default     = "IMMUTABLE"
}

variable "ecr_max_image_count" {
  description = "Maximum number of images to keep in ECR"
  type        = number
  default     = 100
}

##############################################
# Local Variables
##############################################

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project_name
    Version     = var.version
    ManagedBy   = "Terraform"
  }
  
  lambda_name_prefix = "${var.project_name}-inference"
  ecr_repository_name = "${var.project_name}-models"
}

##############################################
# KMS Key for Encryption
##############################################

resource "aws_kms_key" "ml_key" {
  description             = "KMS key for ${var.project_name} ML inference pipeline"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "Enable IAM User Permissions",
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

resource "aws_kms_alias" "ml_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.ml_key.key_id
}

##############################################
# ECR Repository
##############################################

resource "aws_ecr_repository" "model_repository" {
  name                 = local.ecr_repository_name
  image_tag_mutability = var.ecr_image_tag_mutability
  
  image_scanning_configuration {
    scan_on_push = var.ecr_image_scan_on_push
  }
  
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ml_key.arn
  }
  
  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "model_repository_policy" {
  repository = aws_ecr_repository.model_repository.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last ${var.ecr_max_image_count} images",
        selection = {
          tagStatus     = "any",
          countType     = "imageCountMoreThan",
          countNumber   = var.ecr_max_image_count
        },
        action = {
          type = "expire"
        }
      }
    ]
  })
}

##############################################
# VPC Configuration
##############################################

resource "aws_vpc" "ml_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "ml_subnet_a" {
  vpc_id            = aws_vpc.ml_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-subnet-a"
  })
}

resource "aws_subnet" "ml_subnet_b" {
  vpc_id            = aws_vpc.ml_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-subnet-b"
  })
}

resource "aws_internet_gateway" "ml_igw" {
  vpc_id = aws_vpc.ml_vpc.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

resource "aws_route_table" "ml_route_table" {
  vpc_id = aws_vpc.ml_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ml_igw.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-route-table"
  })
}

resource "aws_route_table_association" "ml_rta_a" {
  subnet_id      = aws_subnet.ml_subnet_a.id
  route_table_id = aws_route_table.ml_route_table.id
}

resource "aws_route_table_association" "ml_rta_b" {
  subnet_id      = aws_subnet.ml_subnet_b.id
  route_table_id = aws_route_table.ml_route_table.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.ml_vpc.id
  
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

resource "aws_security_group" "efs_sg" {
  name        = "${var.project_name}-efs-sg"
  description = "Security group for EFS"
  vpc_id      = aws_vpc.ml_vpc.id
  
  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-efs-sg"
  })
}

##############################################
# EFS for Model Storage
##############################################

resource "aws_efs_file_system" "model_storage" {
  creation_token = "${var.project_name}-model-storage"
  encrypted      = true
  kms_key_id     = aws_kms_key.ml_key.arn
  
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-model-storage"
  })
}

resource "aws_efs_mount_target" "model_storage_mount_a" {
  file_system_id  = aws_efs_file_system.model_storage.id
  subnet_id       = aws_subnet.ml_subnet_a.id
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_efs_mount_target" "model_storage_mount_b" {
  file_system_id  = aws_efs_file_system.model_storage.id
  subnet_id       = aws_subnet.ml_subnet_b.id
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_efs_access_point" "model_access_point" {
  file_system_id = aws_efs_file_system.model_storage.id
  
  posix_user {
    gid = 1000
    uid = 1000
  }
  
  root_directory {
    path = "/models"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-model-access-point"
  })
}

##############################################
# IAM Roles and Policies
##############################################

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda execution"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess",
          "elasticfilesystem:DescribeMountTargets"
        ],
        Resource = aws_efs_file_system.model_storage.arn
      },
      {
        Effect = "Allow",
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        Resource = aws_kms_key.ml_key.arn
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role" "api_gateway_role" {
  name = "${var.project_name}-api-gateway-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_policy" "api_gateway_policy" {
  name        = "${var.project_name}-api-gateway-policy"
  description = "Policy for API Gateway"
  
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
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_policy_attachment" {
  role       = aws_iam_role.api_gateway_role.name
  policy_arn = aws_iam_policy.api_gateway_policy.arn
}

##############################################
# Lambda Functions (Container-based)
##############################################

resource "aws_lambda_function" "model_inference" {
  for_each = toset(var.model_versions)
  
  function_name = "${local.lambda_name_prefix}-${each.value}"
  role          = aws_iam_role.lambda_execution_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.model_repository.repository_url}:${each.value}"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  
  vpc_config {
    subnet_ids         = [aws_subnet.ml_subnet_a.id, aws_subnet.ml_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  file_system_config {
    arn              = aws_efs_access_point.model_access_point.arn
    local_mount_path = "/mnt/models"
  }
  
  environment {
    variables = {
      MODEL_VERSION = each.value
      MODEL_PATH    = "/mnt/models/${each.value}"
      LOG_LEVEL     = "INFO"
      ENVIRONMENT   = var.environment
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  depends_on = [
    aws_efs_mount_target.model_storage_mount_a,
    aws_efs_mount_target.model_storage_mount_b
  ]
  
  tags = merge(local.common_tags, {
    Name         = "${local.lambda_name_prefix}-${each.value}",
    ModelVersion = each.value
  })
}

resource "aws_lambda_provisioned_concurrency_config" "model_concurrency" {
  for_each = toset(var.model_versions)
  
  function_name                     = aws_lambda_function.model_inference[each.key].function_name
  provisioned_concurrent_executions = var.provisioned_concurrency
  qualifier                         = aws_lambda_alias.model_alias[each.key].name
}

resource "aws_lambda_alias" "model_alias" {
  for_each = toset(var.model_versions)
  
  name             = "live"
  function_name    = aws_lambda_function.model_inference[each.key].function_name
  function_version = aws_lambda_function.model_inference[each.key].version
}

resource "aws_appautoscaling_target" "lambda_target" {
  for_each = toset(var.model_versions)
  
  max_capacity       = var.max_concurrency
  min_capacity       = var.provisioned_concurrency
  resource_id        = "function:${aws_lambda_function.model_inference[each.key].function_name}:live"
  scalable_dimension = "lambda:function:ProvisionedConcurrency"
  service_namespace  = "lambda"
  
  depends_on = [aws_lambda_alias.model_alias]
}

resource "aws_appautoscaling_policy" "lambda_concurrency_utilization" {
  for_each = toset(var.model_versions)
  
  name               = "${aws_lambda_function.model_inference[each.key].function_name}-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.lambda_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.lambda_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.lambda_target[each.key].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "LambdaProvisionedConcurrencyUtilization"
    }
    target_value       = 0.75
    scale_in_cooldown  = 120
    scale_out_cooldown = 30
  }
}

##############################################
# API Gateway
##############################################

resource "aws_apigatewayv2_api" "ml_api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
  }
  
  tags = local.common_tags
}

resource "aws_apigatewayv2_stage" "ml_api_stage" {
  for_each = toset(var.model_versions)
  
  api_id      = aws_apigatewayv2_api.ml_api.id
  name        = each.value
  auto_deploy = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId",
      ip             = "$context.identity.sourceIp",
      requestTime    = "$context.requestTime",
      httpMethod     = "$context.httpMethod",
      path           = "$context.path",
      status         = "$context.status",
      protocol       = "$context.protocol",
      responseLength = "$context.responseLength",
      integrationLatency = "$context.integrationLatency",
      responseLatency = "$context.responseLatency"
    })
  }
  
  default_route_settings {
    detailed_metrics_enabled = true
    throttling_burst_limit   = var.api_gateway_throttling_burst_limit
    throttling_rate_limit    = var.api_gateway_throttling_rate_limit
  }
  
  tags = merge(local.common_tags, {
    ModelVersion = each.value
  })
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  for_each = toset(var.model_versions)
  
  api_id             = aws_apigatewayv2_api.ml_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_alias.model_alias[each.key].invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  for_each = toset(var.model_versions)
  
  api_id    = aws_apigatewayv2_api.ml_api.id
  route_key = "POST /${each.value}/predict"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration[each.key].id}"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  for_each = toset(var.model_versions)
  
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.model_inference[each.key].function_name
  qualifier     = aws_lambda_alias.model_alias[each.key].name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ml_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_api_mapping" "api_mapping" {
  for_each = toset(var.model_versions)
  
  api_id      = aws_apigatewayv2_api.ml_api.id
  domain_name = aws_apigatewayv2_domain_name.api_domain.id
  stage       = aws_apigatewayv2_stage.ml_api_stage[each.key].id
  api_mapping_key = each.value
}

##############################################
# Custom Domain and TLS
##############################################

resource "aws_acm_certificate" "api_cert" {
  domain_name       = "api.${var.project_name}.example.com"
  validation_method = "DNS"
  
  tags = local.common_tags
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_domain_name" "api_domain" {
  domain_name = "api.${var.project_name}.example.com"
  
  domain_name_configuration {
    certificate_arn = aws_acm_certificate.api_cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
  
  tags = local.common_tags
}

##############################################
# WAF for API Gateway
##############################################

resource "aws_wafv2_web_acl" "api_waf" {
  name        = "${var.project_name}-api-waf"
  description = "WAF for ${var.project_name} API Gateway"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimit"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    
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
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-api-waf"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "api_waf_association" {
  resource_arn = aws_apigatewayv2_stage.ml_api_stage["v1"].arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

##############################################
# API Keys & Usage Plans
##############################################

resource "aws_api_gateway_api_key" "api_key" {
  name        = "${var.project_name}-api-key"
  description = "API key for ${var.project_name} API"
  enabled     = true
  
  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan" "api_usage_plan" {
  name        = "${var.project_name}-usage-plan"
  description = "Usage plan for ${var.project_name} API"
  
  api_stages {
    api_id = aws_apigatewayv2_api.ml_api.id
    stage  = aws_apigatewayv2_stage.ml_api_stage["v1"].id
  }
  
  quota_settings {
    limit  = 10000
    period = "DAY"
  }
  
  throttle_settings {
    burst_limit = var.api_gateway_throttling_burst_limit
    rate_limit  = var.api_gateway_throttling_rate_limit
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan_key" "api_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.api_usage_plan.id
}

##############################################
# CloudWatch Monitoring
##############################################

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset(var.model_versions)
  
  name              = "/aws/lambda/${aws_lambda_function.model_inference[each.key].function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.ml_key.arn
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/api_gateway/${aws_apigatewayv2_api.ml_api.name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.ml_key.arn
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.model_versions)
  
  alarm_name          = "${aws_lambda_function.model_inference[each.key].function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors lambda errors"
  
  dimensions = {
    FunctionName = aws_lambda_function.model_inference[each.key].function_name
  }
  
  alarm_actions = [aws_sns_topic.alarm_topic.arn]
  ok_actions    = [aws_sns_topic.alarm_topic.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.model_versions)
  
  alarm_name          = "${aws_lambda_function.model_inference[each.key].function_name}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 500 # 500ms threshold for response time
  alarm_description   = "This metric monitors lambda execution duration"
  
  dimensions = {
    FunctionName = aws_lambda_function.model_inference[each.key].function_name
  }
  
  alarm_actions = [aws_sns_topic.alarm_topic.arn]
  ok_actions    = [aws_sns_topic.alarm_topic.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 100 # 100ms threshold for API latency
  alarm_description   = "This metric monitors API Gateway latency"
  
  dimensions = {
    ApiName = aws_apigatewayv2_api.ml_api.name
  }
  
  alarm_actions = [aws_sns_topic.alarm_topic.arn]
  ok_actions    = [aws_sns_topic.alarm_topic.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "ml_dashboard" {
  dashboard_name = var.project_name
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.model_inference["v1"].function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.model_inference["v2"].function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Invocations"
          region  = var.aws_region
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.model_inference["v1"].function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.model_inference["v2"].function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Duration"
          region  = var.aws_region
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.model_inference["v1"].function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.model_inference["v2"].function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Errors"
          region  = var.aws_region
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_apigatewayv2_api.ml_api.name],
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Requests"
          region  = var.aws_region
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", aws_apigatewayv2_api.ml_api.name],
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Latency"
          region  = var.aws_region
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", aws_lambda_function.model_inference["v1"].function_name],
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", aws_lambda_function.model_inference["v2"].function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Concurrency"
          region  = var.aws_region
          period  = 60
        }
      }
    ]
  })
}

##############################################
# SNS Topic for Alarms
##############################################

resource "aws_sns_topic" "alarm_topic" {
  name              = "${var.project_name}-alarms"
  kms_master_key_id = aws_kms_key.ml_key.id
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarm_topic.arn
  protocol  = "email"
  endpoint  = "alerts@example.com"
}

##############################################
# X-Ray Tracing
##############################################

resource "aws_xray_sampling_rule" "tracing_sampling" {
  rule_name      = "${var.project_name}-sampling"
  priority       = 1000
  reservoir_size = 1
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_name   = "*"
  service_type   = "*"
  
  attributes = {
    Project = var.project_name
  }
}

##############################################
# Outputs
##############################################

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.model_repository.repository_url
}

output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = aws_apigatewayv2_api.ml_api.api_endpoint
}

output "custom_domain_url" {
  description = "Custom domain URL for the API"
  value       = "https://${aws_apigatewayv2_domain_name.api_domain.domain_name}"
}

output "lambda_function_names" {
  description = "The names of the Lambda functions"
  value       = { for k, v in aws_lambda_function.model_inference : k => v.function_name }
}

output "efs_filesystem_id" {
  description = "The ID of the EFS filesystem"
  value       = aws_efs_file_system.model_storage.id
}

output "efs_access_point_id" {
  description = "The ID of the EFS access point"
  value       = aws_efs_access_point.model_access_point.id
}

output "api_key" {
  description = "The API key"
  value       = aws_api_gateway_api_key.api_key.value
  sensitive   = true
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarm_topic.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}"
}

output "model_endpoints" {
  description = "The endpoints for each model version"
  value = {
    for version in var.model_versions : 
    version => "${aws_apigatewayv2_api.ml_api.api_endpoint}/${version}/predict"
  }
}

output "waf_web_acl_id" {
  description = "The ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api_waf.id
}
```

Let me review the Terraform script to make sure it covers all the requirements:

1. **AWS Lambda (Container-based Model Inference)** - ✅ Deployed Lambda functions using container images from ECR, configured provisioned concurrency, auto-scaling, EFS mounts, and environment variables.

2. **Amazon EFS (Model Storage)** - ✅ Set up encrypted EFS volume with access points, mount targets, and proper security groups.

3. **Amazon API Gateway** - ✅ Created API Gateway with multiple stages, Lambda integrations, API keys, usage plans, and logging.

4. **AWS ECR (Container Registry)** - ✅ Set up ECR repository with lifecycle policies and encryption.

5. **Monitoring & Observability** - ✅ Configured CloudWatch metrics, alarms, dashboards, and X-Ray tracing.

6. **Auto-Scaling and Concurrency Management** - ✅ Set up provisioned concurrency, auto-scaling policies, and CloudWatch alarms.

7. **AWS IAM** - ✅ Created IAM roles with least privilege permissions for Lambda, API Gateway, and other services.

8. **Security Controls** - ✅ Implemented KMS encryption, TLS for API Gateway, WAF, and secure handling of credentials.

9. **Tagging** - ✅ Added required tags to all resources.

10. **Outputs** - ✅ Provided comprehensive outputs for reference.

11. **Variables** - ✅ Declared all necessary variables with sensible defaults.

I've included the architecture described in the requirements and have made sure to implement best practices for security, scalability, and performance. The script is complete and should be deployable as `tap_stack.tf`.

Hmm, I noticed a potential issue with the API Gateway API key integration - APIGatewayV2 (HTTP API) doesn't support API keys directly as the REST API does. Let me update that part to ensure it's compatible.

Actually, another issue I'm noticing is that I'm trying to use a WAF association with an HTTP API stage, but the WAF association resource expects a REST API stage. Let me update the API Gateway implementation to use REST API instead of HTTP API for better compatibility with API keys and WAF.

This seems like a very comprehensive Terraform script that should meet all the requirements. Let me make a quick review again:

- It creates all required resources from scratch
- Implements proper security, scalability, and performance measures
- Follows AWS and Terraform best practices
- Provides complete variable declarations, resources, and outputs
- Uses the `aws_region` variable from provider.tf

I believe the script is ready to be delivered.
### Answer 
---

# Serverless ML Model Inference Pipeline for Fintech Fraud Detection

This Terraform script (`tap_stack.tf`) deploys a scalable, high-performance ML inference pipeline for real-time fraud detection, meeting strict fintech requirements for latency and security compliance.

```terraform
# tap_stack.tf - Terraform script for serverless ML model inference pipeline

##############################################
# Variables
##############################################

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fraud-detection"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "Data Science Team"
}

variable "version" {
  description = "Version of the deployment"
  type        = string
  default     = "1.0.0"
}

variable "model_versions" {
  description = "List of model versions to deploy"
  type        = list(string)
  default     = ["v1", "v2"]
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
  type        = number
  default     = 60
}

variable "provisioned_concurrency" {
  description = "Provisioned concurrency for Lambda functions"
  type        = number
  default     = 10
}

variable "max_concurrency" {
  description = "Maximum concurrency for Lambda functions"
  type        = number
  default     = 100
}

variable "api_gateway_throttling_rate_limit" {
  description = "Rate limit for API Gateway"
  type        = number
  default     = 1000
}

variable "api_gateway_throttling_burst_limit" {
  description = "Burst limit for API Gateway"
  type        = number
  default     = 2000
}

variable "ecr_image_scan_on_push" {
  description = "Enable scanning on image push to ECR"
  type        = bool
  default     = true
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability setting for ECR"
  type        = string
  default     = "IMMUTABLE"
}

variable "ecr_max_image_count" {
  description = "Maximum number of images to keep in ECR"
  type        = number
  default     = 100
}

##############################################
# Local Variables
##############################################

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project_name
    Version     = var.version
    ManagedBy   = "Terraform"
  }
  
  lambda_name_prefix = "${var.project_name}-inference"
  ecr_repository_name = "${var.project_name}-models"
}

##############################################
# Data Sources
##############################################

data "aws_caller_identity" "current" {}

data "aws_region" "current" {
  # This uses the aws_region from provider.tf
}

##############################################
# KMS Key for Encryption
##############################################

resource "aws_kms_key" "ml_key" {
  description             = "KMS key for ${var.project_name} ML inference pipeline"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "Enable IAM User Permissions",
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

resource "aws_kms_alias" "ml_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.ml_key.key_id
}

##############################################
# ECR Repository
##############################################

resource "aws_ecr_repository" "model_repository" {
  name                 = local.ecr_repository_name
  image_tag_mutability = var.ecr_image_tag_mutability
  
  image_scanning_configuration {
    scan_on_push = var.ecr_image_scan_on_push
  }
  
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ml_key.arn
  }
  
  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "model_repository_policy" {
  repository = aws_ecr_repository.model_repository.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last ${var.ecr_max_image_count} images",
        selection = {
          tagStatus     = "any",
          countType     = "imageCountMoreThan",
          countNumber   = var.ecr_max_image_count
        },
        action = {
          type = "expire"
        }
      }
    ]
  })
}

##############################################
# VPC Configuration
##############################################

resource "aws_vpc" "ml_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "ml_subnet_a" {
  vpc_id            = aws_vpc.ml_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${data.aws_region.current.name}a"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-subnet-a"
  })
}

resource "aws_subnet" "ml_subnet_b" {
  vpc_id            = aws_vpc.ml_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${data.aws_region.current.name}b"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-subnet-b"
  })
}

resource "aws_internet_gateway" "ml_igw" {
  vpc_id = aws_vpc.ml_vpc.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

resource "aws_route_table" "ml_route_table" {
  vpc_id = aws_vpc.ml_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ml_igw.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-route-table"
  })
}

resource "aws_route_table_association" "ml_rta_a" {
  subnet_id      = aws_subnet.ml_subnet_a.id
  route_table_id = aws_route_table.ml_route_table.id
}

resource "aws_route_table_association" "ml_rta_b" {
  subnet_id      = aws_subnet.ml_subnet_b.id
  route_table_id = aws_route_table.ml_route_table.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.ml_vpc.id
  
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

resource "aws_security_group" "efs_sg" {
  name        = "${var.project_name}-efs-sg"
  description = "Security group for EFS"
  vpc_id      = aws_vpc.ml_vpc.id
  
  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-efs-sg"
  })
}

##############################################
# EFS for Model Storage
##############################################

resource "aws_efs_file_system" "model_storage" {
  creation_token = "${var.project_name}-model-storage"
  encrypted      = true
  kms_key_id     = aws_kms_key.ml_key.arn
  
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-model-storage"
  })
}

resource "aws_efs_mount_target" "model_storage_mount_a" {
  file_system_id  = aws_efs_file_system.model_storage.id
  subnet_id       = aws_subnet.ml_subnet_a.id
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_efs_mount_target" "model_storage_mount_b" {
  file_system_id  = aws_efs_file_system.model_storage.id
  subnet_id       = aws_subnet.ml_subnet_b.id
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_efs_access_point" "model_access_point" {
  file_system_id = aws_efs_file_system.model_storage.id
  
  posix_user {
    gid = 1000
    uid = 1000
  }
  
  root_directory {
    path = "/models"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-model-access-point"
  })
}

##############################################
# IAM Roles and Policies
##############################################

resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda execution with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess",
          "elasticfilesystem:DescribeMountTargets"
        ],
        Resource = aws_efs_file_system.model_storage.arn
      },
      {
        Effect = "Allow",
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        Resource = aws_kms_key.ml_key.arn
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role" "api_gateway_role" {
  name = "${var.project_name}-api-gateway-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_policy" "api_gateway_policy" {
  name        = "${var.project_name}-api-gateway-policy"
  description = "Policy for API Gateway"
  
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
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_policy_attachment" {
  role       = aws_iam_role.api_gateway_role.name
  policy_arn = aws_iam_policy.api_gateway_policy.arn
}

##############################################
# Lambda Functions (Container-based)
##############################################

resource "aws_lambda_function" "model_inference" {
  for_each = toset(var.model_versions)
  
  function_name = "${local.lambda_name_prefix}-${each.value}"
  role          = aws_iam_role.lambda_execution_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.model_repository.repository_url}:${each.value}"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  
  vpc_config {
    subnet_ids         = [aws_subnet.ml_subnet_a.id, aws_subnet.ml_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  file_system_config {
    arn              = aws_efs_access_point.model_access_point.arn
    local_mount_path = "/mnt/models"
  }
  
  environment {
    variables = {
      MODEL_VERSION = each.value
      MODEL_PATH    = "/mnt/models/${each.value}"
      LOG_LEVEL     = "INFO"
      ENVIRONMENT   = var.environment
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  depends_on = [
    aws_efs_mount_target.model_storage_mount_a,
    aws_efs_mount_target.model_storage_mount_b
  ]
  
  tags = merge(local.common_tags, {
    Name         = "${local.lambda_name_prefix}-${each.value}",
    ModelVersion = each.value
  })
}

resource "aws_lambda_alias" "model_alias" {
  for_each = toset(var.model_versions)
  
  name             = "live"
  function_name    = aws_lambda_function.model_inference[each.key].function_name
  function_version = "$LATEST"
  
  description = "Live alias for ${each.key} model version"
}

resource "aws_lambda_provisioned_concurrency_config" "model_concurrency" {
  for_each = toset(var.model_versions)
  
  function_name                     = aws_lambda_function.model_inference[each.key].function_name
  provisioned_concurrent_executions = var.provisioned_concurrency
  qualifier                         = aws_lambda_alias.model_alias[each.key].name
}

resource "aws_appautoscaling_target" "lambda_target" {
  for_each = toset(var.model_versions)
  
  max_capacity       = var.max_concurrency
  min_capacity       = var.provisioned_concurrency
  resource_id        = "function:${aws_lambda_function.model_inference[each.key].function_name}:${aws_lambda_alias.model_alias[each.key].name}"
  scalable_dimension = "lambda:function:ProvisionedConcurrency"
  service_namespace  = "lambda"
}

resource "aws_appautoscaling_policy" "lambda_concurrency_utilization" {
  for_each = toset(var.model_versions)
  
  name               = "${aws_lambda_function.model_inference[each.key].function_name}-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.lambda_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.lambda_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.lambda_target[each.key].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "LambdaProvisionedConcurrencyUtilization"
    }
    target_value       = 0.75
    scale_in_cooldown  = 120
    scale_out_cooldown = 30
  }
}

##############################################
# API Gateway
##############################################

resource "aws_api_gateway_rest_api" "ml_api" {
  name        = "${var.project_name}-api"
  description = "API for ML model inference"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "model_resource" {
  for_each = toset(var.model_versions)
  
  rest_api_id = aws_api_gateway_rest_api.ml_api.id
  parent_id   = aws_api_gateway_rest_api.ml_api.root_resource_id
  path_part   = each.value
}

resource "aws_api_gateway_resource" "predict_resource" {
  for_each = toset(var.model_versions