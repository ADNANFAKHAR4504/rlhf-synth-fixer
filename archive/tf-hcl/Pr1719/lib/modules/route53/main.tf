# Route 53 Multi-Regional DNS Configuration

# Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_east_1

  name = var.domain_name

  tags = merge(var.common_tags, {
    Name = "${var.environment}-hosted-zone-${var.common_tags.UniqueSuffix}"
  })
}

# Health Checks for each region
resource "aws_route53_health_check" "us_east_1" {
  provider = aws.us_east_1

  fqdn              = var.us_east_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-us-east-1-${var.common_tags.UniqueSuffix}"
  })
}

resource "aws_route53_health_check" "eu_west_1" {
  provider = aws.eu_west_1

  fqdn              = var.eu_west_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-eu-west-1-${var.common_tags.UniqueSuffix}"
  })
}

resource "aws_route53_health_check" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  fqdn              = var.ap_southeast_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-ap-southeast-1-${var.common_tags.UniqueSuffix}"
  })
}

# Primary A Record (US East 1)
resource "aws_route53_record" "primary" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.us_east_1_lb_dns
    zone_id                = "Z35SXDOTRQ7X7K" # ALB zone ID for us-east-1
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.us_east_1.id
  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "us-east-1"
}

# Secondary A Record (EU West 1)
resource "aws_route53_record" "secondary_eu_west_1" {
  provider = aws.eu_west_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.eu_west_1_lb_dns
    zone_id                = "Z32O12X8N17W61" # ALB zone ID for eu-west-1 (Ireland)
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.eu_west_1.id
  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "eu-west-1"
}

# Secondary A Record (AP Southeast 1)
resource "aws_route53_record" "secondary_ap_southeast_1" {
  provider = aws.ap_southeast_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.ap_southeast_1_lb_dns
    zone_id                = "Z3O0EMF9N8YDH6T" # ALB zone ID for ap-southeast-1
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.ap_southeast_1.id
  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "ap-southeast-1"
}

# Regional subdomains for direct access
resource "aws_route53_record" "us_east_1" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "us-east-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.us_east_1_lb_dns
    zone_id                = "Z35SXDOTRQ7X7K"
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "eu_west_1" {
  provider = aws.eu_west_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "eu-west-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.eu_west_1_lb_dns
    zone_id                = "Z32O12X8N17W61"
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "ap-southeast-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.ap_southeast_1_lb_dns
    zone_id                = "Z3O0EMF9N8YDH6T"
    evaluate_target_health = true
  }
}

# CNAME for www subdomain
resource "aws_route53_record" "www" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [var.domain_name]
}
