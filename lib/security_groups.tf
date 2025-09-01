resource "aws_security_group" "vpc1_ec2_sg" {
  name        = "vpc1-ec2-security-group"
  description = "Security group for EC2 instances in VPC 1"
  vpc_id      = aws_vpc.vpc1.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc1_public.cidr_block]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc1_public.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-sg"
  })
}

resource "aws_security_group" "vpc2_ec2_sg" {
  name        = "vpc2-ec2-security-group"
  description = "Security group for EC2 instances in VPC 2"
  vpc_id      = aws_vpc.vpc2.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc2_public.cidr_block]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc2_public.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-sg"
  })
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-security-group"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.vpc1.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc1_ec2_sg.id, aws_security_group.vpc2_ec2_sg.id]
  }

  tags = merge(var.common_tags, {
    Name = "rds-sg"
  })
}