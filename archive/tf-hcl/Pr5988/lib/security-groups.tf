resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "alb-sg-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "app-sg-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances"

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.config.vpc_cidr]
    description = "Allow PostgreSQL within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "app-sg-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_security_group" "dms" {
  count       = terraform.workspace == "production" ? 1 : 0
  name_prefix = "dms-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for DMS replication instance"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.legacy_vpc_cidr, var.production_vpc_cidr]
    description = "Allow PostgreSQL from both VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "dms-sg-${var.environment_suffix}"
  })
}
