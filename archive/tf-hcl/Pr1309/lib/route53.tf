# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = "${local.resource_prefix}.internal.local"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-zone"
  })
}

# Route 53 Health Check for Primary ALB
resource "aws_route53_health_check" "primary_alb" {
  fqdn                    = aws_lb.primary.dns_name
  port                    = 80
  type                    = "HTTP"
  resource_path           = "/"
  failure_threshold       = 3
  request_interval        = 30
  cloudwatch_alarm_region = var.aws_region_primary
  cloudwatch_alarm_name   = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-health-check"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary_alb" {
  fqdn                    = aws_lb.secondary.dns_name
  port                    = 80
  type                    = "HTTP"
  resource_path           = "/"
  failure_threshold       = 3
  request_interval        = 30
  cloudwatch_alarm_region = var.aws_region_secondary
  cloudwatch_alarm_name   = aws_cloudwatch_metric_alarm.secondary_alb_health.alarm_name

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-health-check"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# CloudWatch Alarms for Health Checks
resource "aws_cloudwatch_metric_alarm" "primary_alb_health" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "secondary_alb_health" {
  provider            = aws.secondary
  alarm_name          = "${local.resource_prefix}-secondary-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = var.common_tags
}

# Primary DNS Record with Weighted Routing
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "${local.resource_prefix}.internal.local"
  type    = "A"

  set_identifier = "primary"

  weighted_routing_policy {
    weight = 100
  }

  health_check_id = aws_route53_health_check.primary_alb.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Secondary DNS Record with Weighted Routing (Failover)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "${local.resource_prefix}.internal.local"
  type    = "A"

  set_identifier = "secondary"

  weighted_routing_policy {
    weight = 0
  }

  health_check_id = aws_route53_health_check.secondary_alb.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}