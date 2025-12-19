# security.tf - Security groups for VPC peering traffic

# -----------------------------------------------------------------------------
# PRODUCTION VPC SECURITY GROUPS
# -----------------------------------------------------------------------------

# Security group for production application servers
resource "aws_security_group" "production_app" {
  provider    = aws.primary
  name        = "production-app-sg-${var.environment_suffix}"
  description = "Security group for production application servers allowing peered VPC traffic"
  vpc_id      = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-app-sg-${var.environment_suffix}"
  })
}

# Allow HTTPS (443) from partner VPC application subnets
resource "aws_security_group_rule" "production_app_https_from_partner" {
  provider = aws.primary
  count    = length(local.partner_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS from partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Allow custom API (8443) from partner VPC application subnets
resource "aws_security_group_rule" "production_app_api_from_partner" {
  provider = aws.primary
  count    = length(local.partner_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic from partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Egress to partner VPC - HTTPS
resource "aws_security_group_rule" "production_app_https_to_partner" {
  provider = aws.primary
  count    = length(local.partner_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS to partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Egress to partner VPC - custom API
resource "aws_security_group_rule" "production_app_api_to_partner" {
  provider = aws.primary
  count    = length(local.partner_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic to partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# -----------------------------------------------------------------------------
# PARTNER VPC SECURITY GROUPS
# -----------------------------------------------------------------------------

# Security group for partner application servers
resource "aws_security_group" "partner_app" {
  provider    = aws.partner
  name        = "partner-app-sg-${var.environment_suffix}"
  description = "Security group for partner application servers allowing peered VPC traffic"
  vpc_id      = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-app-sg-${var.environment_suffix}"
  })
}

# Allow HTTPS (443) from production VPC application subnets
resource "aws_security_group_rule" "partner_app_https_from_production" {
  provider = aws.partner
  count    = length(local.production_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS from production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Allow custom API (8443) from production VPC application subnets
resource "aws_security_group_rule" "partner_app_api_from_production" {
  provider = aws.partner
  count    = length(local.production_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic from production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Egress to production VPC - HTTPS
resource "aws_security_group_rule" "partner_app_https_to_production" {
  provider = aws.partner
  count    = length(local.production_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS to production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Egress to production VPC - custom API
resource "aws_security_group_rule" "partner_app_api_to_production" {
  provider = aws.partner
  count    = length(local.production_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic to production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}