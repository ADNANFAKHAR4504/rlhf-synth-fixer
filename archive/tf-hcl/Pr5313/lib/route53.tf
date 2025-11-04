module "route53_zone" {
  source = "./modules/route53-zone"

  providers = {
    aws = aws.hub
  }

  domain_name        = var.route53_domain_name
  primary_vpc_id     = module.hub_vpc.vpc_id
  primary_vpc_region = "us-east-1"
  project_tags       = local.common_tags
}

resource "aws_route53_vpc_association_authorization" "uswest" {
  provider = aws.hub

  vpc_id  = module.uswest_vpc.vpc_id
  zone_id = module.route53_zone.zone_id
}

resource "aws_route53_zone_association" "uswest" {
  provider = aws.us_west

  vpc_id  = module.uswest_vpc.vpc_id
  zone_id = module.route53_zone.zone_id

  depends_on = [aws_route53_vpc_association_authorization.uswest]
}

resource "aws_route53_vpc_association_authorization" "europe" {
  provider = aws.hub

  vpc_id  = module.europe_vpc.vpc_id
  zone_id = module.route53_zone.zone_id
}

resource "aws_route53_zone_association" "europe" {
  provider = aws.europe

  vpc_id  = module.europe_vpc.vpc_id
  zone_id = module.route53_zone.zone_id

  depends_on = [aws_route53_vpc_association_authorization.europe]
}
