# IAM Role for Web Application
resource "aws_iam_role" "web_app_role" {
  name = "${local.resource_prefix}-web-app-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Web Application (Least Privilege)
resource "aws_iam_policy" "web_app_policy" {
  name = "${local.resource_prefix}-web-app-policy-${local.unique_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.api_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "web_app_policy_attachment" {
  role       = aws_iam_role.web_app_role.name
  policy_arn = aws_iam_policy.web_app_policy.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "web_app_profile" {
  name = "${local.resource_prefix}-web-app-profile-${local.unique_suffix}"
  role = aws_iam_role.web_app_role.name
}

# IAM Role for Database Service
resource "aws_iam_role" "db_service_role" {
  name = "${local.resource_prefix}-db-service-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
}

# Security Group for Web Tier
resource "aws_security_group" "web_tier" {
  name_prefix = "${local.resource_prefix}-web-tier-"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.resource_prefix}-web-tier-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Tier
resource "aws_security_group" "app_tier" {
  name_prefix = "${local.resource_prefix}-app-tier-"
  vpc_id      = data.aws_vpc.existing.id

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.resource_prefix}-app-tier-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Database Tier
resource "aws_security_group" "db_tier" {
  name_prefix = "${local.resource_prefix}-db-tier-"
  vpc_id      = data.aws_vpc.existing.id

  tags = {
    Name = "${local.resource_prefix}-db-tier-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group Rules to avoid circular dependency
resource "aws_security_group_rule" "web_to_db" {
  type                     = "egress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.db_tier.id
  security_group_id        = aws_security_group.web_tier.id
}

resource "aws_security_group_rule" "app_to_db" {
  type                     = "egress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.db_tier.id
  security_group_id        = aws_security_group.app_tier.id
}

resource "aws_security_group_rule" "web_to_app" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web_tier.id
  security_group_id        = aws_security_group.app_tier.id
}

resource "aws_security_group_rule" "db_from_web" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web_tier.id
  security_group_id        = aws_security_group.db_tier.id
}

resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app_tier.id
  security_group_id        = aws_security_group.db_tier.id
}