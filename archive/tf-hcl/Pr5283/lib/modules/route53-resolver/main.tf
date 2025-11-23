# Route53 Resolver module for DNS resolution between VPCs

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

locals {
  name_prefix = "${var.environment}-${var.region}-${var.environment_suffix}"
}

# Security group for Route53 Resolver endpoints
resource "aws_security_group" "resolver" {
  name        = "${local.name_prefix}-resolver-sg"
  description = "Security group for Route53 Resolver endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow DNS queries from VPC"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Allow DNS queries from VPC (UDP)"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-resolver-sg"
    }
  )
}

# Inbound Route53 Resolver endpoint
resource "aws_route53_resolver_endpoint" "inbound" {
  name      = "${local.name_prefix}-resolver-inbound"
  direction = "INBOUND"

  security_group_ids = [aws_security_group.resolver.id]

  dynamic "ip_address" {
    for_each = var.subnet_ids
    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-resolver-inbound"
      Type = "inbound"
    }
  )
}

# Outbound Route53 Resolver endpoint
resource "aws_route53_resolver_endpoint" "outbound" {
  name      = "${local.name_prefix}-resolver-outbound"
  direction = "OUTBOUND"

  security_group_ids = [aws_security_group.resolver.id]

  dynamic "ip_address" {
    for_each = var.subnet_ids
    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-resolver-outbound"
      Type = "outbound"
    }
  )
}

