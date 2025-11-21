# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  vpc {
    vpc_id     = aws_vpc.primary.id
    vpc_region = var.primary_region
  }

  tags = {
    Name              = "route53-zone-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Associate hosted zone with DR VPC
resource "aws_route53_zone_association" "dr" {
  provider = aws.dr
  zone_id  = aws_route53_zone.main.id
  vpc_id   = aws_vpc.dr.id
}

# Endpoint health check for primary database
resource "aws_route53_health_check" "primary_endpoint" {
  provider          = aws.primary
  type              = "TCP"
  fqdn              = aws_db_instance.primary.address
  port              = 5432
  request_interval  = 30
  failure_threshold = 3

  tags = {
    Name              = "health-check-primary-endpoint-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Calculated health check for primary database
resource "aws_route53_health_check" "primary" {
  provider               = aws.primary
  type                   = "CALCULATED"
  child_health_threshold = 1
  child_healthchecks     = [aws_route53_health_check.primary_endpoint.id]

  tags = {
    Name              = "health-check-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Endpoint health check for DR database
resource "aws_route53_health_check" "dr_endpoint" {
  provider          = aws.primary
  type              = "TCP"
  fqdn              = aws_db_instance.dr.address
  port              = 5432
  request_interval  = 30
  failure_threshold = 3

  tags = {
    Name              = "health-check-dr-endpoint-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Calculated health check for DR database
resource "aws_route53_health_check" "dr" {
  provider               = aws.primary
  type                   = "CALCULATED"
  child_health_threshold = 1
  child_healthchecks     = [aws_route53_health_check.dr_endpoint.id]

  tags = {
    Name              = "health-check-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Primary database DNS record
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
  records         = [aws_db_instance.primary.address]
}

# DR database DNS record
resource "aws_route53_record" "dr" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "dr"
  health_check_id = aws_route53_health_check.dr.id
  records         = [aws_db_instance.dr.address]
}
