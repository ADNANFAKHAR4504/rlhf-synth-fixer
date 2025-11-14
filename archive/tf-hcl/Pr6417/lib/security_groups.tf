resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environmentSuffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "alb-sg-${var.environmentSuffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environmentSuffix}-"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "web-sg-${var.environmentSuffix}"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environmentSuffix}-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from web servers"
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "rds-sg-${var.environmentSuffix}"
  })
}