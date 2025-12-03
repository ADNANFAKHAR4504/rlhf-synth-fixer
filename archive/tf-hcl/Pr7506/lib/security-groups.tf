# Primary Region Security Groups
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "alb-primary-${var.environment_suffix}"
  description = "Security group for primary ALB"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "primary_instances" {
  provider    = aws.primary
  name        = "instances-primary-${var.environment_suffix}"
  description = "Security group for primary EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "instances-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "primary_database" {
  provider    = aws.primary
  name        = "database-primary-${var.environment_suffix}"
  description = "Security group for primary Aurora cluster"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_instances.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "database-primary-${var.environment_suffix}"
  }
}

# Secondary Region Security Groups
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "alb-secondary-${var.environment_suffix}"
  description = "Security group for secondary ALB"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-secondary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "secondary_instances" {
  provider    = aws.secondary
  name        = "instances-secondary-${var.environment_suffix}"
  description = "Security group for secondary EC2 instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "instances-secondary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "secondary_database" {
  provider    = aws.secondary
  name        = "database-secondary-${var.environment_suffix}"
  description = "Security group for secondary Aurora cluster"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_instances.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "database-secondary-${var.environment_suffix}"
  }
}
