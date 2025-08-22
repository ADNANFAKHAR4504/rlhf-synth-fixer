# Application Load Balancer
resource "aws_lb" "main" {
  for_each = toset(["dev"])

  name               = "${local.project_prefix}-${each.key}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web[each.key].id]
  subnets = [
    aws_subnet.public["${each.key}-${var.availability_zones[0]}"].id,
    aws_subnet.public["${each.key}-${var.availability_zones[1]}"].id
  ]

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "${each.key}-alb"
    enabled = true
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  for_each = aws_lb.main

  name     = "${local.project_prefix}-${each.key}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main[each.key].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-target-group"
  })
}

# ALB Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  for_each = {
    for k, v in aws_instance.web : k => v
  }

  target_group_arn = aws_lb_target_group.main[split("-", each.key)[0]].arn
  target_id        = each.value.id
  port             = 80
}

# ALB Listener
resource "aws_lb_listener" "main" {
  for_each = aws_lb.main

  load_balancer_arn = each.value.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[each.key].arn
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-listener"
  })
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${local.project_prefix}-alb-logs-${random_string.alb_logs_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alb-logs"
  })
}

resource "random_string" "alb_logs_suffix" {
  length  = 8
  special = false
  upper   = false
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

# ALB Access Logs Policy
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root" # ELB service account for us-east-1
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  for_each = aws_lb.main

  resource_arn = each.value.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}