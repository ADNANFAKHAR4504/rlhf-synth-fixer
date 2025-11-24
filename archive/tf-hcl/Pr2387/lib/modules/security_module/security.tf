# Security Module - Security Groups and IAM

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-${var.project_name}-alb-"
  vpc_id      = var.vpc_id
  description = "Security group for Application Load Balancer"

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-sg"
    Type = "security-group"
    Component = "alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-${var.project_name}-web-"
  vpc_id      = var.vpc_id
  description = "Security group for web servers"
  
  # Custom application port from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # HTTPS access from ALB
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH access from bastion (if enabled)
  dynamic "ingress" {
    for_each = var.enable_ssh_access ? [1] : []
    content {
      description     = "SSH from bastion"
      from_port       = 22
      to_port         = 22
      protocol        = "tcp"
      security_groups = var.enable_ssh_access ? [aws_security_group.bastion[0].id] : []
    }
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-sg"
    Type = "security-group"
    Component = "web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-${var.project_name}-db-"
  vpc_id      = var.vpc_id
  description = "Security group for database servers"

  # Database access from web servers
  ingress {
    description     = "Database access from web servers"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # Database access from bastion (if enabled)
  dynamic "ingress" {
    for_each = var.enable_ssh_access ? [1] : []
    content {
      description     = "Database access from bastion"
      from_port       = var.db_port
      to_port         = var.db_port
      protocol        = "tcp"
      security_groups = var.enable_ssh_access ? [aws_security_group.bastion[0].id] : []
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-db-sg"
    Type = "security-group"
    Component = "database"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Bastion Host Security Group (Optional)
resource "aws_security_group" "bastion" {
  count = var.enable_ssh_access ? 1 : 0

  name_prefix = "${var.environment}-${var.project_name}-bastion-"
  vpc_id      = var.vpc_id
  description = "Security group for bastion host"

  # SSH access from allowed IPs
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-bastion-sg"
    Type = "security-group"
    Component = "bastion"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-${var.project_name}-ec2-role"

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-ec2-role"
    Type = "iam-role"
    Component = "ec2"
  })
}

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.environment}-${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.environment}/${var.project_name}/*",
          "arn:aws:ssm:*:*:parameter/${var.environment}/${var.project_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWS managed policies
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent_server_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-ec2-profile"
    Type = "iam-instance-profile"
    Component = "ec2"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} ${var.project_name}"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-kms-key"
    Type = "kms-key"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.project_name}"
  target_key_id = aws_kms_key.main.key_id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}