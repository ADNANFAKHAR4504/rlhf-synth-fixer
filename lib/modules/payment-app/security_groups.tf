# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.environment}-payment-app-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet (redirect to HTTPS)"
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
    Name        = "${var.environment}-payment-app-alb-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-payment-app-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
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
    Name        = "${var.environment}-payment-app-ec2-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-payment-app-rds-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "PostgreSQL from EC2"
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
    Name        = "${var.environment}-payment-app-rds-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}