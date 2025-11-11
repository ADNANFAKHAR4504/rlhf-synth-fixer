# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${terraform.workspace}-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "alb-logs-${terraform.workspace}-${var.environment_suffix}"
  })
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

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = data.aws_elb_service_account.main.arn
      }
      Action   = "s3:PutObject"
      Resource = "${aws_s3_bucket.alb_logs.arn}/*"
    }]
  })
}

resource "aws_lb" "main" {
  name               = "alb-${terraform.workspace}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id # Use all public subnets (minimum 2)

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "alb-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

resource "aws_lb_target_group" "main" {
  name     = "tg-${terraform.workspace}-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "tg-${terraform.workspace}-${var.environment_suffix}"
  })
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
