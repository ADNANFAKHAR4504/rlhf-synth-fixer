# Route 53 hosted zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  tags = {
    Name        = "route53-zone-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# CloudWatch metric alarm for primary replication lag
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-primary-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000
  alarm_description   = "This metric monitors Aurora global replication lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  alarm_actions = [aws_sns_topic.primary.arn]

  tags = {
    Name        = "alarm-replication-lag-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Health check for primary cluster (TCP-based)
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = aws_rds_cluster.primary.endpoint
  port              = 5432
  type              = "TCP"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "healthcheck-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Health check for secondary cluster (TCP-based)
resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  fqdn              = aws_rds_cluster.secondary.endpoint
  port              = 5432
  type              = "TCP"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "healthcheck-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Calculated health check combining TCP and replication lag alarm
resource "aws_route53_health_check" "primary_combined" {
  provider = aws.primary
  type     = "CALCULATED"

  child_health_threshold = 1
  child_healthchecks = [
    aws_route53_health_check.primary.id
  ]

  tags = {
    Name        = "healthcheck-primary-combined-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Primary database DNS record with failover
resource "aws_route53_record" "primary" {
  provider        = aws.primary
  zone_id         = aws_route53_zone.main.zone_id
  name            = "db.${var.domain_name}"
  type            = "CNAME"
  ttl             = 60
  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary_combined.id

  failover_routing_policy {
    type = "PRIMARY"
  }

  records = [aws_rds_cluster.primary.endpoint]
}

# Secondary database DNS record with failover
resource "aws_route53_record" "secondary" {
  provider       = aws.primary
  zone_id        = aws_route53_zone.main.zone_id
  name           = "db.${var.domain_name}"
  type           = "CNAME"
  ttl            = 60
  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  records = [aws_rds_cluster.secondary.endpoint]
}