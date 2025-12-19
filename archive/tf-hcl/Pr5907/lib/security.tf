# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "payment-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet"
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
    Name           = "payment-alb-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Tier
resource "aws_security_group" "app" {
  name_prefix = "payment-app-sg-"
  description = "Security group for Application tier EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Application port from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "payment-app-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Database Tier
resource "aws_security_group" "db" {
  name_prefix = "payment-db-sg-"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "payment-db-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for DMS Replication Instance
resource "aws_security_group" "dms" {
  name_prefix = "payment-dms-sg-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "payment-dms-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# WAF Web ACL for Rate Limiting
resource "aws_wafv2_web_acl" "main" {
  name  = "payment-waf-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PaymentWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name           = "payment-waf-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}
