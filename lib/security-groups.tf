resource "aws_security_group" "hub_application" {
  provider = aws.hub

  name        = "hub-application-sg-${local.env_suffix}"
  description = "Security group for application workloads in hub VPC"
  vpc_id      = module.hub_vpc.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "hub-application-sg-${local.env_suffix}"
    }
  )
}

resource "aws_vpc_security_group_ingress_rule" "hub_app_from_uswest" {
  provider = aws.hub

  security_group_id = aws_security_group.hub_application.id
  description       = "Allow traffic from US West spoke"
  cidr_ipv4         = var.uswest_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "hub_app_from_europe" {
  provider = aws.hub

  security_group_id = aws_security_group.hub_application.id
  description       = "Allow traffic from Europe spoke"
  cidr_ipv4         = var.europe_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "hub_app_from_hub" {
  provider = aws.hub

  security_group_id = aws_security_group.hub_application.id
  description       = "Allow traffic from hub VPC"
  cidr_ipv4         = var.hub_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "hub_app_egress" {
  provider = aws.hub

  security_group_id = aws_security_group.hub_application.id
  description       = "Allow all outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "uswest_application" {
  provider = aws.us_west

  name        = "uswest-application-sg-${local.env_suffix}"
  description = "Security group for application workloads in US West spoke VPC"
  vpc_id      = module.uswest_vpc.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "uswest-application-sg-${local.env_suffix}"
    }
  )
}

resource "aws_vpc_security_group_ingress_rule" "uswest_app_from_hub" {
  provider = aws.us_west

  security_group_id = aws_security_group.uswest_application.id
  description       = "Allow traffic from hub"
  cidr_ipv4         = var.hub_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "uswest_app_from_europe" {
  provider = aws.us_west

  security_group_id = aws_security_group.uswest_application.id
  description       = "Allow traffic from Europe spoke"
  cidr_ipv4         = var.europe_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "uswest_app_from_uswest" {
  provider = aws.us_west

  security_group_id = aws_security_group.uswest_application.id
  description       = "Allow traffic from US West VPC"
  cidr_ipv4         = var.uswest_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "uswest_app_egress" {
  provider = aws.us_west

  security_group_id = aws_security_group.uswest_application.id
  description       = "Allow all outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "europe_application" {
  provider = aws.europe

  name        = "europe-application-sg-${local.env_suffix}"
  description = "Security group for application workloads in Europe spoke VPC"
  vpc_id      = module.europe_vpc.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "europe-application-sg-${local.env_suffix}"
    }
  )
}

resource "aws_vpc_security_group_ingress_rule" "europe_app_from_hub" {
  provider = aws.europe

  security_group_id = aws_security_group.europe_application.id
  description       = "Allow traffic from hub"
  cidr_ipv4         = var.hub_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "europe_app_from_uswest" {
  provider = aws.europe

  security_group_id = aws_security_group.europe_application.id
  description       = "Allow traffic from US West spoke"
  cidr_ipv4         = var.uswest_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "europe_app_from_europe" {
  provider = aws.europe

  security_group_id = aws_security_group.europe_application.id
  description       = "Allow traffic from Europe VPC"
  cidr_ipv4         = var.europe_vpc_cidr
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "europe_app_egress" {
  provider = aws.europe

  security_group_id = aws_security_group.europe_application.id
  description       = "Allow all outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
