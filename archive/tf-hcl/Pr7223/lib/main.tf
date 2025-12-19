# Main Terraform configuration

# Generate a random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

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

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    }
  )
}

resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-sg"
    }
  )
}

# S3 Buckets
resource "aws_s3_bucket" "data" {
  count = var.s3_bucket_count

  bucket = "${local.name_prefix}-data-${count.index + 1}"

  tags = merge(
    local.common_tags,
    {
      Name  = "${local.name_prefix}-data-${count.index + 1}"
      Index = count.index + 1
    }
  )
}

resource "aws_s3_bucket_versioning" "data" {
  count = var.s3_bucket_count

  bucket = aws_s3_bucket.data[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Aurora Module
module "aurora" {
  source = "./modules/aurora"

  name_prefix             = local.name_prefix
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [aws_security_group.lambda.id]
  instance_class          = var.aurora_instance_class
  instance_count          = var.aurora_instance_count
  tags                    = local.common_tags
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  name_prefix        = local.name_prefix
  environment        = var.environment
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  s3_bucket_arn      = aws_s3_bucket.data[0].arn
  bucket_name        = aws_s3_bucket.data[0].id
  log_retention_days = var.log_retention_days
  tags               = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.short_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "${local.short_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-tg"
    }
  )
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alerts"
    }
  )
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "alerts@example.com"

  filter_policy = jsonencode({
    severity = ["critical", "high"]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/payment-processing/${var.environment}/application-${substr(random_id.suffix.hex, 0, 8)}"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-logs"
    }
  )
}

# IAM Roles with environment-specific trust policies
resource "aws_iam_role" "app_role" {
  for_each = toset(["api", "worker", "scheduler"])

  name_prefix = "${local.short_prefix}-${each.key}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.environment}-${each.key}"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.key}-role"
      Type = each.key
    }
  )
}

resource "aws_iam_role_policy" "app_role_policy" {
  for_each = aws_iam_role.app_role

  name_prefix = "${local.short_prefix}-${each.key}-pol-"
  role        = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.data[0].arn}/*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.application.arn}:*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Data source to verify CIDR non-overlap
data "aws_vpc" "validate_cidr" {
  id = module.vpc.vpc_id

  lifecycle {
    postcondition {
      condition     = !contains(["10.0.0.0/16", "10.1.0.0/16", "10.2.0.0/16"], self.cidr_block) || var.vpc_cidr == self.cidr_block
      error_message = "VPC CIDR block overlaps with other environments"
    }
  }
}
