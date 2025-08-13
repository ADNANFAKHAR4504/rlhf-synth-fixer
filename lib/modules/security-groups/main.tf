# Web tier security group (only allows 80 and 443 from anywhere)
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-${var.organization_name}-web-"
  vpc_id      = var.vpc_id
  description = "Security group for web tier - allows HTTP/HTTPS"

  # HTTP access from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-web-sg"
    Tier = "Web"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application tier security group (restricted access)
resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-${var.organization_name}-app-"
  vpc_id      = var.vpc_id
  description = "Security group for application tier"

  # Access from web tier only
  ingress {
    description     = "App port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # SSH access from allowed CIDR blocks only
  ingress {
    description = "SSH from allowed networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-app-sg"
    Tier = "Application"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database tier security group (most restrictive)
resource "aws_security_group" "db" {
  name_prefix = "${var.environment}-${var.organization_name}-db-"
  vpc_id      = var.vpc_id
  description = "Security group for database tier"

  # Database access from app tier only
  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # PostgreSQL access from app tier only
  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # No outbound rules for maximum security
  tags = {
    Name = "${var.environment}-${var.organization_name}-db-sg"
    Tier = "Database"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Management security group for administrative access
resource "aws_security_group" "mgmt" {
  name_prefix = "${var.environment}-${var.organization_name}-mgmt-"
  vpc_id      = var.vpc_id
  description = "Security group for management access"

  # SSH access from allowed CIDR blocks only
  ingress {
    description = "SSH from allowed networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # RDP access from allowed CIDR blocks only
  ingress {
    description = "RDP from allowed networks"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-mgmt-sg"
    Tier = "Management"
  }

  lifecycle {
    create_before_destroy = true
  }
}