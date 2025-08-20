# modules/network/main.tf
resource "aws_security_group" "main" {
  name_prefix = "myapp-${var.environment}-sg-"
  vpc_id      = data.aws_vpc.default.id

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

  tags = {
    Name        = "myapp-${var.environment}-sg"
    Environment = var.environment
  }
}

data "aws_vpc" "default" {
  default = true
}

output "security_group_id" {
  value = aws_security_group.main.id
}
