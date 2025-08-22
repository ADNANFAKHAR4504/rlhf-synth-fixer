# Security Group for Web Servers
resource "aws_security_group" "web" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-web-sg"
  description = "Security group for web servers"
  vpc_id      = each.value.id

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

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-web-sg"
  })
}

# Security Group for Database
resource "aws_security_group" "rds" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = each.value.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web[each.key].id]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-rds-sg"
  })
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = each.value.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-lambda-sg"
  })
}