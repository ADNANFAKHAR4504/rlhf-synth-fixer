########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-webapp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "enable_waf" {
  description = "Enable WAF v2 Web ACL"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateways"
  type        = bool
  default     = true
}

variable "enable_alb_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = true
}

variable "enable_alb" {
  description = "Enable Application Load Balancer"
  type        = bool
  default     = true
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

########################
# KMS Key for encryption
########################
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}-${var.environment_suffix}"
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
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow EventBridge"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM Parameter Store"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-kms-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment_suffix}-key"
  target_key_id = aws_kms_key.main.key_id
}

########################
# VPC and Networking
########################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-igw"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(aws_subnet.public) : 0
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(aws_subnet.public) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-nat-gateway-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

########################
# Security Groups
########################
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
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
    Name        = "${var.project_name}-${var.environment_suffix}-alb-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "webapp" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-webapp-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-webapp-sg"
    Environment = var.environment
  }
}

########################
# S3 Bucket with KMS encryption
########################
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "webapp_assets" {
  bucket = "${var.project_name}-${var.environment_suffix}-webapp-assets-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-webapp-assets"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "webapp_assets" {
  bucket = aws_s3_bucket.webapp_assets.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "webapp_assets" {
  bucket = aws_s3_bucket.webapp_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "webapp_assets" {
  bucket = aws_s3_bucket.webapp_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

########################
# CloudWatch Log Group with KMS encryption
########################
resource "aws_cloudwatch_log_group" "webapp_logs" {
  name              = "/aws/webapp/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-logs"
    Environment = var.environment
  }
}

########################
# Application Load Balancer
########################
resource "aws_lb" "main" {
  count              = var.enable_alb ? 1 : 0
  name               = "${var.project_name}-${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  dynamic "access_logs" {
    for_each = var.enable_alb_access_logs ? [1] : []
    content {
      bucket  = aws_s3_bucket.webapp_assets.bucket
      prefix  = "alb-access-logs"
      enabled = true
    }
  }

  depends_on = [aws_s3_bucket_public_access_block.webapp_assets]

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-alb"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  count  = var.enable_alb_access_logs ? 1 : 0
  bucket = aws_s3_bucket.webapp_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.webapp_assets.arn}/alb-access-logs/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.webapp_assets.arn
      }
    ]
  })
}

########################
# WAF v2
########################
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  name  = "${var.project_name}-${var.environment_suffix}-web-acl"
  scope = "REGIONAL"

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
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 3

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
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-waf"
    Environment = var.environment
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WebACL"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  count        = var.enable_waf && var.enable_alb ? 1 : 0
  resource_arn = aws_lb.main[0].arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}

########################
# IAM Role for web application (least privilege)
########################
resource "aws_iam_role" "webapp_role" {
  name = "${var.project_name}-${var.environment_suffix}-webapp-role"

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
    Name        = "${var.project_name}-${var.environment_suffix}-webapp-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "webapp_policy" {
  name = "${var.project_name}-${var.environment_suffix}-webapp-policy"
  role = aws_iam_role.webapp_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.webapp_assets.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.webapp_logs.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.main.arn
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.aws_region}.amazonaws.com",
              "logs.${var.aws_region}.amazonaws.com",
              "ssm.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment_suffix}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          aws_cloudwatch_event_bus.webapp_events.arn
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "webapp_profile" {
  name = "${var.project_name}-${var.environment_suffix}-webapp-profile"
  role = aws_iam_role.webapp_role.name
}

########################
# Systems Manager Parameter Store
########################
resource "aws_ssm_parameter" "database_host" {
  name  = "/${var.project_name}/${var.environment_suffix}/database/host"
  type  = "String"
  value = "db.${var.project_name}-${var.environment_suffix}.internal"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-db-host-param"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "app_config" {
  name = "/${var.project_name}/${var.environment_suffix}/app/config"
  type = "String"
  value = jsonencode({
    log_level       = "INFO"
    max_connections = 100
    cache_ttl       = 300
    feature_flags = {
      new_ui    = true
      analytics = false
    }
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-app-config-param"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "api_key" {
  name   = "/${var.project_name}/${var.environment_suffix}/api/key"
  type   = "SecureString"
  value  = "placeholder-secure-api-key-${random_id.bucket_suffix.hex}"
  key_id = aws_kms_key.main.arn

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-api-key-param"
    Environment = var.environment
  }
}

########################
# EventBridge Custom Bus and Rules
########################
resource "aws_cloudwatch_event_bus" "webapp_events" {
  name = "${var.project_name}-${var.environment_suffix}-events"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-event-bus"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/events/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-eventbridge-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_rule" "user_activity" {
  name           = "${var.project_name}-${var.environment_suffix}-user-activity"
  description    = "Capture user activity events"
  event_bus_name = aws_cloudwatch_event_bus.webapp_events.name

  event_pattern = jsonencode({
    source      = ["webapp.user"]
    detail-type = ["User Activity"]
    detail = {
      action = ["login", "logout", "signup"]
    }
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-user-activity-rule"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_rule" "system_alerts" {
  name           = "${var.project_name}-${var.environment_suffix}-system-alerts"
  description    = "Capture system alert events"
  event_bus_name = aws_cloudwatch_event_bus.webapp_events.name

  event_pattern = jsonencode({
    source      = ["webapp.system"]
    detail-type = ["System Alert"]
    detail = {
      severity = ["HIGH", "CRITICAL"]
    }
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-system-alerts-rule"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "user_activity_logs" {
  rule           = aws_cloudwatch_event_rule.user_activity.name
  target_id      = "UserActivityLogsTarget"
  arn            = aws_cloudwatch_log_group.eventbridge_logs.arn
  event_bus_name = aws_cloudwatch_event_bus.webapp_events.name
}

resource "aws_cloudwatch_event_target" "system_alerts_logs" {
  rule           = aws_cloudwatch_event_rule.system_alerts.name
  target_id      = "SystemAlertsLogsTarget"
  arn            = aws_cloudwatch_log_group.eventbridge_logs.arn
  event_bus_name = aws_cloudwatch_event_bus.webapp_events.name
}

# IAM role for EventBridge to write to CloudWatch Logs
resource "aws_iam_role" "eventbridge_logs_role" {
  name = "${var.project_name}-${var.environment_suffix}-eventbridge-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-eventbridge-logs-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "eventbridge_logs_policy" {
  name = "${var.project_name}-${var.environment_suffix}-eventbridge-logs-policy"
  role = aws_iam_role.eventbridge_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.eventbridge_logs.arn}:*"
        ]
      }
    ]
  })
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = var.enable_alb ? aws_lb.main[0].dns_name : ""
}

output "enable_alb" {
  description = "Whether ALB is enabled"
  value       = var.enable_alb
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.webapp_assets.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.webapp_logs.name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : ""
}

output "enable_waf" {
  description = "Whether WAF is enabled"
  value       = var.enable_waf
}

output "enable_nat_gateway" {
  description = "Whether NAT Gateway is enabled"
  value       = var.enable_nat_gateway
}

output "enable_alb_access_logs" {
  description = "Whether ALB access logs are enabled"
  value       = var.enable_alb_access_logs
}

output "ssm_parameter_database_host" {
  description = "Name of the database host parameter"
  value       = aws_ssm_parameter.database_host.name
}

output "ssm_parameter_app_config" {
  description = "Name of the app config parameter"
  value       = aws_ssm_parameter.app_config.name
}

output "ssm_parameter_api_key" {
  description = "Name of the API key parameter"
  value       = aws_ssm_parameter.api_key.name
}

output "eventbridge_bus_arn" {
  description = "ARN of the EventBridge custom bus"
  value       = aws_cloudwatch_event_bus.webapp_events.arn
}

output "eventbridge_logs_group" {
  description = "Name of the EventBridge logs group"
  value       = aws_cloudwatch_log_group.eventbridge_logs.name
}
