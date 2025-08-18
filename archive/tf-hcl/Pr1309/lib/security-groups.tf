# Security Group for ALB - Primary Region
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-primary-alb-sg"
  description = "Security group for Primary ALB"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-alb-sg"
  })
}

# Security Group for ALB - Secondary Region
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-secondary-alb-sg"
  description = "Security group for Secondary ALB"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-alb-sg"
  })
}

# Security Group for EC2 instances - Primary Region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-primary-ec2-sg"
  description = "Security group for Primary EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-ec2-sg"
  })
}

# Security Group for EC2 instances - Secondary Region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-secondary-ec2-sg"
  description = "Security group for Secondary EC2 instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-ec2-sg"
  })
}

# Security Group for RDS - Primary Region
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-primary-rds-sg"
  description = "Security group for Primary RDS"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-rds-sg"
  })
}

# Security Group for RDS - Secondary Region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-secondary-rds-sg"
  description = "Security group for Secondary RDS"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-rds-sg"
  })
}