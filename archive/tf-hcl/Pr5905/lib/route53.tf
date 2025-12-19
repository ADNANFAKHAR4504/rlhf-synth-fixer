# Route 53 Weighted Routing - Blue Environment
resource "aws_route53_record" "blue" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "blue-${var.environment_suffix}"

  weighted_routing_policy {
    weight = var.blue_traffic_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Weighted Routing - Green Environment
resource "aws_route53_record" "green" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "green-${var.environment_suffix}"

  weighted_routing_policy {
    weight = var.green_traffic_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
