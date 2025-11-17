# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id

  dynamic "ingress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "ingress" && (k == "http" || k == "https")
    }

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  dynamic "egress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "egress"
    }

    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      description = egress.value.description
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Instance Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id

  # Allow traffic from ALB
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTP from ALB"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTPS from ALB"
  }

  # SSH access from VPC
  dynamic "ingress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "ingress" && k == "ssh"
    }

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  dynamic "egress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "egress"
    }

    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      description = egress.value.description
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ec2-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id

  # Allow PostgreSQL from EC2 instances
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "Allow PostgreSQL from EC2"
  }

  # Additional PostgreSQL rules from variable
  dynamic "ingress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "ingress" && k == "postgres"
    }

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  dynamic "egress" {
    for_each = {
      for k, v in var.security_group_rules : k => v
      if v.type == "egress"
    }

    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      description = egress.value.description
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
