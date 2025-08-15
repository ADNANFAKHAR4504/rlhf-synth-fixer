# Security Group with restricted HTTP/HTTPS access
resource "aws_security_group" "secure_web_sg" {
  name_prefix = "secure-web-sg-${local.env_suffix}-"
  description = "Security group with restricted HTTP/HTTPS access"
  vpc_id      = data.aws_vpc.default.id

  # HTTP ingress rule - restricted to allowed CIDR blocks
  ingress {
    description = "HTTP access from allowed networks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # HTTPS ingress rule - restricted to allowed CIDR blocks
  ingress {
    description = "HTTPS access from allowed networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Outbound rules - allow all outbound traffic (can be further restricted based on requirements)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "secure-web-security-group"
    Type = "SecurityGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}