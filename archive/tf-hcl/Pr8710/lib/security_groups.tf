# Security Group - Web/Load Balancer Tier
resource "aws_security_group" "web" {
  name_prefix = "web-${var.environment_suffix}-"
  description = "Security group for web tier and load balancers"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "sg-web-${var.environment_suffix}"
      Tier = "public"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Web SG - Allow HTTPS inbound
resource "aws_security_group_rule" "web_https_inbound" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS from internet"
  security_group_id = aws_security_group.web.id
}

# Web SG - Allow HTTP inbound
resource "aws_security_group_rule" "web_http_inbound" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTP from internet"
  security_group_id = aws_security_group.web.id
}

# Web SG - Allow all outbound
resource "aws_security_group_rule" "web_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.web.id
}

# Security Group - Application Tier
resource "aws_security_group" "app" {
  name_prefix = "app-${var.environment_suffix}-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "sg-app-${var.environment_suffix}"
      Tier = "private"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# App SG - Allow traffic from web tier
resource "aws_security_group_rule" "app_from_web" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  description              = "Allow application traffic from web tier"
  security_group_id        = aws_security_group.app.id
}

# App SG - Allow all outbound
resource "aws_security_group_rule" "app_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.app.id
}

# Security Group - Data Tier (Payment Processing)
resource "aws_security_group" "data" {
  name_prefix = "data-${var.environment_suffix}-"
  description = "Security group for data tier - payment processing"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name       = "sg-data-${var.environment_suffix}"
      Tier       = "isolated"
      Compliance = "PCI-DSS"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Data SG - Allow MySQL from app tier
resource "aws_security_group_rule" "data_mysql_from_app" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow MySQL from application tier"
  security_group_id        = aws_security_group.data.id
}

# Data SG - Allow PostgreSQL from app tier
resource "aws_security_group_rule" "data_postgres_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow PostgreSQL from application tier"
  security_group_id        = aws_security_group.data.id
}

# Data SG - Restricted outbound (no direct internet access)
resource "aws_security_group_rule" "data_outbound_vpc" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = [var.vpc_cidr]
  description       = "Allow outbound only within VPC"
  security_group_id = aws_security_group.data.id
}
