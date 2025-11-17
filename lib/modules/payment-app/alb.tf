# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-payment-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = data.aws_subnets.public.ids
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-alb"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-payment-app-alb-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name        = "${var.environment}-payment-app-alb-logs"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

data "aws_caller_identity" "current" {}

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
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb/*"
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-payment-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = var.environment == "prod" ? 300 : 30
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-tg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  count = var.instance_count
  
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  
  depends_on = [aws_acm_certificate_validation.main]
}

# ACM Certificate (self-signed for demo)
resource "aws_acm_certificate" "main" {
  domain_name       = "${var.environment}.payment-app.example.com"
  validation_method = "DNS"
  
  subject_alternative_names = [
    "www.${var.environment}.payment-app.example.com"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-cert"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# For demo purposes - in production, you'd validate with Route53
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
}