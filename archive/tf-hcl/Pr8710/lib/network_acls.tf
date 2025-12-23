# Network ACL - Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = merge(
    var.common_tags,
    {
      Name = "nacl-public-${var.environment_suffix}"
      Tier = "public"
    }
  )
}

# Public NACL - Allow all inbound (stateless - must allow return traffic)
resource "aws_network_acl_rule" "public_inbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Public NACL - Allow all outbound
resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Network ACL - Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    var.common_tags,
    {
      Name = "nacl-private-${var.environment_suffix}"
      Tier = "private"
    }
  )
}

# Private NACL - Allow inbound from VPC
resource "aws_network_acl_rule" "private_inbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Private NACL - Allow ephemeral ports inbound (for return traffic)
resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL - Allow all outbound
resource "aws_network_acl_rule" "private_outbound_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Network ACL - Isolated Subnets (Strict PCI DSS)
resource "aws_network_acl" "isolated" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.isolated[*].id

  tags = merge(
    var.common_tags,
    {
      Name       = "nacl-isolated-${var.environment_suffix}"
      Tier       = "isolated"
      Compliance = "PCI-DSS"
    }
  )
}

# Isolated NACL - Allow inbound only from VPC
resource "aws_network_acl_rule" "isolated_inbound_vpc" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Isolated NACL - Deny inbound from internet
resource "aws_network_acl_rule" "isolated_inbound_deny_internet" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 50
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
}

# Isolated NACL - Allow outbound only within VPC
resource "aws_network_acl_rule" "isolated_outbound_vpc" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Isolated NACL - Deny outbound to internet
resource "aws_network_acl_rule" "isolated_outbound_deny_internet" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 50
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
}
