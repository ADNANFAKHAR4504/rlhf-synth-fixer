# Web Security Group (for ALB/public-facing resources)
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for web tier"

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for application tier"

  ingress {
    description     = "HTTP from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "HTTPS from web tier"
    from_port       = 8443
    to_port         = 8443
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for database tier"

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Management Security Group (for bastion/admin access)
resource "aws_security_group" "management" {
  name_prefix = "${var.project_name}-mgmt-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for management/bastion hosts"

  ingress {
    description = "SSH from corporate network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr] # Restrict to VPC only
  }

  ingress {
    description = "RDP from corporate network"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr] # Restrict to VPC only
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-mgmt-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpce-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for VPC endpoints"

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "${var.project_name}-vpce-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}