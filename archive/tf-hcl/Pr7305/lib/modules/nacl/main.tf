resource "aws_network_acl" "main" {
  vpc_id = var.vpc_id

  tags = var.tags
}

# Dynamic ingress rules for allowed ports
resource "aws_network_acl_rule" "ingress_allowed" {
  for_each = { for idx, rule in local.ingress_rules : "${rule.cidr}-${rule.port}-${idx}" => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  protocol       = each.value.protocol
  rule_action    = "allow"
  cidr_block     = each.value.cidr
  from_port      = each.value.port
  to_port        = each.value.port
}

# Dynamic egress rules for allowed ports
resource "aws_network_acl_rule" "egress_allowed" {
  for_each = { for idx, rule in local.egress_rules : "${rule.cidr}-${rule.port}-${idx}" => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  egress         = true
  protocol       = each.value.protocol
  rule_action    = "allow"
  cidr_block     = each.value.cidr
  from_port      = each.value.port
  to_port        = each.value.port
}

# Ingress rule for return traffic (ephemeral ports)
resource "aws_network_acl_rule" "ingress_ephemeral" {
  for_each = { for idx, cidr in var.allowed_cidrs : idx => cidr }

  network_acl_id = aws_network_acl.main.id
  rule_number    = 900 + tonumber(each.key)
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 1024
  to_port        = 65535
}

# Egress rule for return traffic (ephemeral ports)
resource "aws_network_acl_rule" "egress_ephemeral" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 900
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Allow all traffic within VPC
resource "aws_network_acl_rule" "ingress_vpc" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "egress_vpc" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

# Allow outbound HTTPS for internet access
resource "aws_network_acl_rule" "egress_https_internet" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 150
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

# Associate NACL with subnets
resource "aws_network_acl_association" "main" {
  count = length(var.subnet_ids)

  network_acl_id = aws_network_acl.main.id
  subnet_id      = var.subnet_ids[count.index]
}

locals {
  # Generate ingress rules
  ingress_rules = flatten([
    for cidx, cidr in var.allowed_cidrs : [
      for pidx, port in var.allowed_ports : {
        rule_number = 300 + (cidx * 20) + pidx
        cidr        = cidr
        port        = port.port
        protocol    = port.protocol == "tcp" ? "6" : port.protocol == "udp" ? "17" : "-1"
      }
    ]
  ])

  # Generate egress rules  
  egress_rules = flatten([
    for cidx, cidr in var.allowed_cidrs : [
      for pidx, port in var.allowed_ports : {
        rule_number = 500 + (cidx * 20) + pidx
        cidr        = cidr
        port        = port.port
        protocol    = port.protocol == "tcp" ? "6" : port.protocol == "udp" ? "17" : "-1"
      }
    ]
  ])
}
