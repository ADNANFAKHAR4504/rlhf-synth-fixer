# Primary ALB Security Group
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
    description = "Allow HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-alb-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary ALB Security Group
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
    description = "Allow HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-alb-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Primary Application Security Group
resource "aws_security_group" "primary_app" {
  provider    = aws.primary
  name        = "app-primary-${var.environment_suffix}"
  description = "Security group for primary application instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
    description     = "Allow traffic from primary ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
    description = "Allow SSH from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-app-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary Application Security Group
resource "aws_security_group" "secondary_app" {
  provider    = aws.secondary
  name        = "app-secondary-${var.environment_suffix}"
  description = "Security group for secondary application instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
    description     = "Allow traffic from secondary ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
    description = "Allow SSH from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-app-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Primary Aurora Security Group
resource "aws_security_group" "primary_aurora" {
  provider    = aws.primary
  name        = "aurora-primary-${var.environment_suffix}"
  description = "Security group for primary Aurora cluster"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_app.id]
    description     = "Allow PostgreSQL from primary application"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
    description = "Allow PostgreSQL from secondary VPC for replication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-aurora-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary Aurora Security Group
resource "aws_security_group" "secondary_aurora" {
  provider    = aws.secondary
  name        = "aurora-secondary-${var.environment_suffix}"
  description = "Security group for secondary Aurora cluster"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_app.id]
    description     = "Allow PostgreSQL from secondary application"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
    description = "Allow PostgreSQL from primary VPC for replication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-aurora-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}
