# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "loan-processing-alb-sg-${local.env_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet"
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

  tags = {
    Name = "loan-processing-alb-sg-${local.env_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "loan-processing-ec2-sg-${local.env_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Application port from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "loan-processing-ec2-sg-${local.env_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name_prefix = "loan-processing-aurora-sg-${local.env_suffix}-"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2 instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "loan-processing-aurora-sg-${local.env_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
