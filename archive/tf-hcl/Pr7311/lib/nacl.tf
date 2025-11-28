# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.payment_vpc.id
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

  # Outbound All
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "public-nacl-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.payment_vpc.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound from VPC on application ports
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 8080
    to_port    = 8090
  }

  # Inbound Ephemeral Ports (for return traffic)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "private-nacl-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Network ACL for Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.payment_vpc.id
  subnet_ids = aws_subnet.database[*].id

  # Inbound PostgreSQL from Private Subnets only
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.11.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "10.0.12.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "10.0.13.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  # Inbound Ephemeral Ports (for return traffic from private subnets)
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound to Private Subnets
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name        = "database-nacl-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}
