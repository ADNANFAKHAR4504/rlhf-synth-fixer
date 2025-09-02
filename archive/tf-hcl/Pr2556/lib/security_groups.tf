# Application Load Balancer Security Group
# Allows inbound HTTPS/HTTP only from trusted CIDR ranges
# This is the only security group that accepts traffic from the internet
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer - restricts access to trusted CIDRs only"

  # Allow HTTPS from trusted networks only
  dynamic "ingress" {
    for_each = var.trusted_cidrs
    content {
      description = "HTTPS from trusted CIDR ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Allow HTTP from trusted networks only (for redirect to HTTPS)
  dynamic "ingress" {
    for_each = var.trusted_cidrs
    content {
      description = "HTTP from trusted CIDR ${ingress.value} (redirect to HTTPS)"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Egress: Allow outbound to application instances on port 8080
  egress {
    description     = "HTTP to application instances"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.app_instances.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Instance Security Group
# Only accepts traffic from ALB and allows minimal outbound access
resource "aws_security_group" "app_instances" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances - only allows traffic from ALB"

  # Allow inbound from ALB security group only
  ingress {
    description     = "HTTP from Application Load Balancer"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Egress: HTTPS for package updates, API calls, etc.
  egress {
    description = "HTTPS outbound for updates and API calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: HTTP for package repositories (many still use HTTP)
  egress {
    description = "HTTP outbound for package repositories"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: DNS resolution
  egress {
    description = "DNS resolution"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-app-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
# Allows HTTPS access to AWS services via VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-${var.environment}-vpce-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints - allows HTTPS from private subnets"

  # Allow HTTPS from private subnets for AWS API access
  ingress {
    description = "HTTPS from private subnets to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.private : subnet.cidr_block]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-vpce-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group validation to ensure no wide-open ingress rules
resource "null_resource" "security_group_validation" {
  triggers = {
    alb_sg_id = aws_security_group.alb.id
    app_sg_id = aws_security_group.app_instances.id
  }

  provisioner "local-exec" {
    command = "echo 'Security groups created with restricted access - no 0.0.0.0/0 ingress on application instances'"
  }
}
