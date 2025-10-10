# Route53 Health Checks and Failover

resource "aws_route53_health_check" "primary_alb" {
  fqdn              = var.primary_alb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  measure_latency   = true

  tags = {
    Name        = "${var.project_name}-primary-health-check"
    Environment = var.environment
  }
}

resource "aws_route53_health_check" "secondary_alb" {
  fqdn              = var.secondary_alb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  measure_latency   = true

  tags = {
    Name        = "${var.project_name}-secondary-health-check"
    Environment = var.environment
  }
}

