# ALB Module - Application Load Balancer

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = true
  idle_timeout              = var.idle_timeout

  # Access logs configuration
  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb"
    Type = "application-load-balancer"
    Component = "alb"
  })
}

# Target Group for web servers
resource "aws_lb_target_group" "web" {
  name     = "${var.environment}-${var.project_name}-web-tg-tf"
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    interval            = var.health_check_interval
    matcher             = var.health_check_matcher
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = var.target_protocol
    timeout             = var.health_check_timeout
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  # Stickiness configuration
  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-tg"
    Type = "target-group"
    Component = "alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
      type             = "forward"
      target_group_arn = aws_lb_target_group.web.arn
    }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-http-listener"
    Type = "alb-listener"
    Component = "alb"
  })
}


# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.response_time_threshold
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-response-time-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.unhealthy_hosts_threshold
  alarm_description   = "This metric monitors unhealthy ALB targets"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-unhealthy-hosts-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

# WAF Web ACL Association (if WAF is enabled)
resource "aws_wafv2_web_acl_association" "alb" {
  count = var.enable_waf ? 1 : 0

  resource_arn = aws_lb.main.arn
  web_acl_arn  = var.waf_web_acl_arn
}