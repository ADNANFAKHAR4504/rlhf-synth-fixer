# route53.tf - Route 53 health checks and failover routing

# Note: This assumes a hosted zone already exists. In production, reference existing zone.
# For demonstration purposes, we create health checks without requiring an actual domain.

resource "aws_route53_health_check" "primary" {
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  enable_sni        = true
  fqdn              = aws_lb.main.dns_name
  port              = 443

  tags = {
    Name       = "payment-primary-health-check-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for health check
resource "aws_cloudwatch_metric_alarm" "health_check_failed" {
  alarm_name          = "payment-health-check-failed-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This alarm monitors Route 53 health check status"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = {
    Name       = "payment-health-check-alarm-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# Output DNS name for health check configuration
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer for Route 53 configuration"
  value       = aws_lb.main.dns_name
}

output "route53_health_check_id" {
  description = "ID of the Route 53 health check"
  value       = aws_route53_health_check.primary.id
}
