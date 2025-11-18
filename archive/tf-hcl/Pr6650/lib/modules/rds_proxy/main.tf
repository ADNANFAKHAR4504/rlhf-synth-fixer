# RDS Proxy for connection pooling and improved failover handling

# IAM Role for RDS Proxy
resource "aws_iam_role" "rds_proxy" {
  name_prefix = "rds-proxy-${var.dr_role}-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "role-rds-proxy-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# IAM Policy for RDS Proxy to access Secrets Manager
resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name_prefix = "rds-proxy-secrets-policy-"
  role        = aws_iam_role.rds_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.kms_key_arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Security Group for RDS Proxy
resource "aws_security_group" "rds_proxy" {
  name_prefix = "rds-proxy-${var.dr_role}-${var.environment_suffix}-"
  description = "Security group for RDS Proxy"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Allow MySQL connections from allowed security groups"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "sg-rds-proxy-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# RDS Proxy
resource "aws_db_proxy" "main" {
  name          = "rds-proxy-${var.dr_role}-${var.environment_suffix}"
  engine_family = "MYSQL"
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = var.secret_arn
    iam_auth    = "DISABLED"
  }

  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.subnet_ids
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]

  # Connection pooling configuration
  idle_client_timeout = 1800

  # Enable enhanced monitoring
  require_tls = true

  tags = {
    Name        = "rds-proxy-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
    DR-Role     = var.dr_role
  }

  depends_on = [
    aws_iam_role_policy.rds_proxy_secrets
  ]
}

# RDS Proxy Target
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    max_connections_percent      = 100
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
    session_pinning_filters      = []
  }
}

resource "aws_db_proxy_target" "main" {
  db_proxy_name         = aws_db_proxy.main.name
  target_group_name     = aws_db_proxy_default_target_group.main.name
  db_cluster_identifier = var.rds_cluster_id
}

# CloudWatch Log Group for RDS Proxy
resource "aws_cloudwatch_log_group" "rds_proxy" {
  name              = "/aws/rds/proxy/${aws_db_proxy.main.name}"
  retention_in_days = 7

  tags = {
    Name        = "log-rds-proxy-${var.dr_role}-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}