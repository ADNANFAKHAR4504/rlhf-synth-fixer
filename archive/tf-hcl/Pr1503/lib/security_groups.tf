# Load Balancer Security Group
resource "aws_security_group" "alb_sg" {
  name        = "ecommerce-alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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

  tags = merge(var.common_tags, {
    Name = "ecommerce-alb-sg-${var.environment_suffix}"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "ecommerce-ec2-sg-${var.environment_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-ec2-sg-${var.environment_suffix}"
  })
}

# RDS Security Group
resource "aws_security_group" "rds_sg" {
  name        = "ecommerce-rds-sg-${var.environment_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-rds-sg-${var.environment_suffix}"
  })
}