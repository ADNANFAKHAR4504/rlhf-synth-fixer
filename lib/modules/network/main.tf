# modules/network/main.tf
resource "aws_security_group" "main" {
  name_prefix = "${var.security_group_name_prefix}-${var.environment}-sg-"

  ingress {
    from_port   = var.ingress_port
    to_port     = var.ingress_port
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.egress_cidr_blocks
  }

  tags = merge({
    Name        = "${var.security_group_name_prefix}-${var.environment}-sg"
    Environment = var.environment
  }, var.security_group_tags)
}

output "security_group_id" {
  value = aws_security_group.main.id
}
