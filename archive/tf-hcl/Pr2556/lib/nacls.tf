# Network ACL for Public Subnets
# Provides additional layer of security for subnets containing NAT Gateways and ALBs
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-public-nacl"
  }
}

# Network ACL for Private Subnets  
# Strict controls for application workload subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-private-nacl"
  }
}

# Public NACL Rules - Inbound
# Allow HTTPS/HTTP from trusted CIDRs for ALB access
resource "aws_network_acl_rule" "public_inbound_https" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_inbound_http" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 200 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 80
  to_port        = 80
}

# Allow ephemeral ports for return traffic (ALB health checks, responses)
resource "aws_network_acl_rule" "public_inbound_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Public NACL Rules - Outbound
# Allow all outbound traffic for NAT Gateway functionality
resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Private NACL Rules - Inbound
# Allow traffic from public subnets (ALB to instances)
resource "aws_network_acl_rule" "private_inbound_from_public" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.public[count.index].cidr_block
  from_port      = 8080
  to_port        = 8080
}

# Allow intra-VPC communication for private subnets
resource "aws_network_acl_rule" "private_inbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Allow ephemeral ports for return traffic
resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL Rules - Outbound
# Allow HTTPS for package updates and AWS API calls
resource "aws_network_acl_rule" "private_outbound_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

# Allow HTTP for package repositories
resource "aws_network_acl_rule" "private_outbound_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

# Allow DNS resolution
resource "aws_network_acl_rule" "private_outbound_dns" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  protocol       = "udp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 53
  to_port        = 53
}

# Allow intra-VPC communication
resource "aws_network_acl_rule" "private_outbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}
