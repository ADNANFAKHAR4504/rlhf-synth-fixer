# Private hosted zone for internal DNS (optional)
resource "aws_route53_zone" "private" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  name     = var.private_domain_name
  comment  = "Private hosted zone for trading platform"

  vpc {
    vpc_id     = module.hub_vpc.vpc_id
    vpc_region = var.hub_region
  }

  tags = merge(var.common_tags, {
    Name = "private-hosted-zone"
  })

  lifecycle {
    ignore_changes = [vpc]
  }
}

# Associate private zone with AP-Northeast-1 spoke VPC
resource "aws_route53_zone_association" "us_west_spoke" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.us_west
  zone_id  = aws_route53_zone.private[0].zone_id
  vpc_id   = module.us_west_spoke_vpc.vpc_id
}

# Associate private zone with US-West-1 spoke VPC
resource "aws_route53_zone_association" "eu_west_spoke" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.eu_west
  zone_id  = aws_route53_zone.private[0].zone_id
  vpc_id   = module.eu_west_spoke_vpc.vpc_id
}

# Example DNS records for each region
resource "aws_route53_record" "hub_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.hub"
  type     = "A"
  ttl      = 300
  records  = ["10.0.1.100"] # Example private IP

  depends_on = [aws_route53_zone.private]
}

resource "aws_route53_record" "us_west_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.ap-northeast-1"
  type     = "A"
  ttl      = 300
  records  = ["10.1.1.100"] # Example private IP
}

resource "aws_route53_record" "eu_west_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.ap-southeast-2"
  type     = "A"
  ttl      = 300
  records  = ["10.2.1.100"] # Example private IP
}