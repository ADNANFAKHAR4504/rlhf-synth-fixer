# Security group for Route53 resolver endpoints
resource "aws_security_group" "resolver" {
  count = var.enable_route53_resolver ? 1 : 0

  name_prefix = "hub-${var.region}-sg-resolver-"
  description = "Security group for Route53 resolver endpoints"
  vpc_id      = module.vpc_hub.vpc_id

  ingress {
    description = "DNS UDP from VPCs"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  ingress {
    description = "DNS TCP from VPCs"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-sg-resolver-${local.name_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 Resolver inbound endpoint
resource "aws_route53_resolver_endpoint" "inbound" {
  count = var.enable_route53_resolver ? 1 : 0

  name               = "hub-${var.region}-resolver-inbound-${local.name_suffix}"
  direction          = "INBOUND"
  security_group_ids = [aws_security_group.resolver[0].id]

  dynamic "ip_address" {
    for_each = module.vpc_hub.private_subnet_ids

    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-resolver-inbound-${local.name_suffix}"
  })

  depends_on = [aws_security_group.resolver]
}

# Route53 Resolver outbound endpoint
resource "aws_route53_resolver_endpoint" "outbound" {
  count = var.enable_route53_resolver ? 1 : 0

  name               = "hub-${var.region}-resolver-outbound-${local.name_suffix}"
  direction          = "OUTBOUND"
  security_group_ids = [aws_security_group.resolver[0].id]

  dynamic "ip_address" {
    for_each = module.vpc_hub.private_subnet_ids

    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-resolver-outbound-${local.name_suffix}"
  })

  depends_on = [aws_security_group.resolver]
}

# Share resolver rules with spoke VPCs using AWS RAM (optional - requires AWS Organizations)
resource "aws_ram_resource_share" "resolver_rules" {
  count = var.enable_route53_resolver && var.enable_ram_sharing ? 1 : 0

  name                      = "shared-${var.region}-ram-resolver-rules-${local.name_suffix}"
  allow_external_principals = false

  tags = merge(local.common_tags, {
    Name = "shared-${var.region}-ram-resolver-rules-${local.name_suffix}"
  })
}

# Associate VPCs with RAM share (optional - requires AWS Organizations)
resource "aws_ram_principal_association" "resolver_rules" {
  count = var.enable_route53_resolver && var.enable_ram_sharing ? 1 : 0

  principal          = data.aws_caller_identity.current.account_id
  resource_share_arn = aws_ram_resource_share.resolver_rules[0].arn
}
