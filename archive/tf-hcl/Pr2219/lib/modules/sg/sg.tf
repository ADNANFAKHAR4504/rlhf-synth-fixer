resource "aws_security_group" "bastion" {
  name        = "${var.project}-${var.environment}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_security_group" "private_instance" {
  name        = "${var.project}-${var.environment}-private-sg"
  description = "Security group for private instances"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow SSH from bastion host"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}
