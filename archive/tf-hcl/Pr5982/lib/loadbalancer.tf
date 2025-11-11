# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "payment-alb-logs-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "alb-logs-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  depends_on = [
    aws_s3_bucket_public_access_block.alb_logs
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "payment" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = local.current_env.alb_deletion_protection
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  depends_on = [
    aws_s3_bucket_policy.alb_logs,
    aws_s3_bucket_public_access_block.alb_logs
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "payment-alb-${var.environment_suffix}"
    }
  )
}

# Target Group - Blue
resource "aws_lb_target_group" "blue" {
  name        = "payment-blue-${var.environment_suffix}"
  port        = var.payment_app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-tg-${var.environment_suffix}"
      Deployment = "blue"
    }
  )
}

# Target Group - Green
resource "aws_lb_target_group" "green" {
  name        = "payment-green-${var.environment_suffix}"
  port        = var.payment_app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-tg-${var.environment_suffix}"
      Deployment = "green"
    }
  )
}

# HTTP Listener with Weighted Target Groups (HTTPS disabled for QA testing)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.payment.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_target_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_target_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-http-listener-${var.environment_suffix}"
    }
  )
}