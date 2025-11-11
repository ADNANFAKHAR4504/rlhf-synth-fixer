# Route 53 Private Hosted Zone
resource "aws_route53_zone" "private" {
  name = "payment.internal"

  vpc {
    vpc_id = aws_vpc.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-private-zone-${var.environment_suffix}"
    }
  )
}

# Weighted Record for Blue Environment
resource "aws_route53_record" "payment_blue" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "api.payment.internal"
  type    = "A"

  weighted_routing_policy {
    weight = var.blue_target_weight
  }

  set_identifier = "blue-${var.environment_suffix}"

  alias {
    name                   = aws_lb.payment.dns_name
    zone_id                = aws_lb.payment.zone_id
    evaluate_target_health = true
  }
}

# Weighted Record for Green Environment
resource "aws_route53_record" "payment_green" {
  count = var.green_target_weight > 0 ? 1 : 0

  zone_id = aws_route53_zone.private.zone_id
  name    = "api.payment.internal"
  type    = "A"

  weighted_routing_policy {
    weight = var.green_target_weight
  }

  set_identifier = "green-${var.environment_suffix}"

  alias {
    name                   = aws_lb.payment.dns_name
    zone_id                = aws_lb.payment.zone_id
    evaluate_target_health = true
  }
}

# Health Check for Blue Environment
resource "aws_route53_health_check" "blue" {
  type              = "HTTP"
  resource_path     = "/"
  fqdn              = aws_lb.payment.dns_name
  port              = 80
  request_interval  = 30
  failure_threshold = 3

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-health-${var.environment_suffix}"
      Deployment = "blue"
    }
  )
}

# Health Check for Green Environment
resource "aws_route53_health_check" "green" {
  count = var.green_target_weight > 0 ? 1 : 0

  type              = "HTTP"
  resource_path     = "/"
  fqdn              = aws_lb.payment.dns_name
  port              = 80
  request_interval  = 30
  failure_threshold = 3

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-health-${var.environment_suffix}"
      Deployment = "green"
    }
  )
}

# Database Endpoint Record
resource "aws_route53_record" "database_writer" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "db-writer.payment.internal"
  type    = "CNAME"
  ttl     = 300
  records = [aws_rds_cluster.payment.endpoint]
}

resource "aws_route53_record" "database_reader" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "db-reader.payment.internal"
  type    = "CNAME"
  ttl     = 300
  records = [aws_rds_cluster.payment.reader_endpoint]
}