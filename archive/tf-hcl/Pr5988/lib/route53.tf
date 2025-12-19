resource "aws_route53_zone" "main" {
  count = terraform.workspace == "production" ? 1 : 0
  name  = var.route53_zone_name

  tags = merge(local.common_tags, {
    Name = "hosted-zone-${var.environment_suffix}"
  })
}

data "aws_lb" "legacy" {
  count = terraform.workspace == "production" ? 1 : 0

  tags = {
    Workspace = "legacy"
    Suffix    = var.environment_suffix
  }
}

resource "aws_route53_record" "app" {
  count   = terraform.workspace == "production" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  set_identifier = "legacy"
  weighted_routing_policy {
    weight = var.legacy_traffic_weight
  }

  alias {
    name                   = data.aws_lb.legacy[0].dns_name
    zone_id                = data.aws_lb.legacy[0].zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_production" {
  count   = terraform.workspace == "production" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  set_identifier = "production"
  weighted_routing_policy {
    weight = var.production_traffic_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
