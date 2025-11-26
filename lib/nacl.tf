# nacl.tf - Network ACLs for three-tier isolation

# Public Network ACL
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Inbound HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Inbound HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Inbound Ephemeral Ports (for return traffic)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All Traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "public-nacl-${var.environment_suffix}"
    Tier = "Public"
  }
}

# Private Network ACL
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound from VPC (all traffic)
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Inbound Application Ports 8080-8090
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 8080
    to_port    = 8090
  }

  # Inbound Ephemeral Ports
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All Traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "private-nacl-${var.environment_suffix}"
    Tier = "Private"
  }
}

# Database Network ACL
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Inbound PostgreSQL from Private Subnets
  dynamic "ingress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 100 + index(var.private_subnet_cidrs, ingress.value)
      action     = "allow"
      cidr_block = ingress.value
      from_port  = 5432
      to_port    = 5432
    }
  }

  # Inbound Ephemeral Ports from Private Subnets
  dynamic "ingress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 200 + index(var.private_subnet_cidrs, ingress.value)
      action     = "allow"
      cidr_block = ingress.value
      from_port  = 1024
      to_port    = 65535
    }
  }

  # Outbound to Private Subnets
  dynamic "egress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 100 + index(var.private_subnet_cidrs, egress.value)
      action     = "allow"
      cidr_block = egress.value
      from_port  = 1024
      to_port    = 65535
    }
  }

  tags = {
    Name = "database-nacl-${var.environment_suffix}"
    Tier = "Database"
  }
}
