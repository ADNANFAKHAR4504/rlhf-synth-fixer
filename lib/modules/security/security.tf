#######################
# KMS Keys
#######################

resource "aws_kms_key" "main" {
  description             = "KMS key for general encryption - ${var.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "EnableIAM"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid = "AllowLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
      },
      {
        Sid = "AllowELBServiceToUseKMSForS3Logging"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-kms-key", Type = "Encryption" })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "EnableIAM"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid = "AllowRDS"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-rds-kms-key", Type = "Encryption" })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.name_prefix}-rds-key"
  target_key_id = aws_kms_key.rds.key_id
}

#######################
# Security Groups
#######################

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "ALB SG"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = var.http_port
    to_port     = var.http_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = var.https_port
    to_port     = var.https_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "All"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-alb-sg" })
}

resource "aws_security_group" "web" {
  name        = "${var.name_prefix}-web-sg"
  description = "web SG"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = var.http_port
    to_port         = var.http_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    description     = "HTTPS from ALB"
    from_port       = var.https_port
    to_port         = var.https_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    description = "All"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-web-sg" })
}

resource "aws_security_group" "bastion" {
  name        = "${var.name_prefix}-bastion-sg"
  description = "bastion SG"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH"
    from_port   = var.ssh_port
    to_port     = var.ssh_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }
  egress {
    description = "All"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-bastion-sg" })
}

resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "db SG"
  vpc_id      = var.vpc_id

  ingress {
    description     = "DB from web"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  egress {
    description = "Private outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.private_subnets_cidr
  }

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-db-sg" })
}

#######################
# IAM Roles & Policies
#######################

resource "aws_iam_role" "ec2_role" {
  name = "${var.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-ec2-role" })
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.name_prefix}-ec2-policy"
  description = "EC2 least privilege"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.name_prefix}*:*"
      },
      {
        Effect = "Allow",
        Action = ["s3:GetObject","s3:ListBucket"],
        Resource = [ var.logs_bucket_arn, "${var.logs_bucket_arn}/*" ]
      },
      {
        Effect = "Allow",
        Action = ["kms:Decrypt","kms:GenerateDataKey*"],
        Resource = aws_kms_key.main.arn
      }
    ]
  })
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-ec2-policy" })
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_role_policy_attachment" "ssm_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.name_prefix}-rds-monitoring"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-rds-monitoring" })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "config_role" {
  name = "${var.name_prefix}-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-config-role" })
}

resource "aws_iam_role_policy_attachment" "config_policy_attach" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWS_ConfigRole"
}

#######################
# WAF (valid HCL formatting)
#######################

resource "aws_wafv2_web_acl" "main" {
  count       = var.enable_waf ? 1 : 0
  name        = "${var.name_prefix}-waf"
  description = "WAF web ACL"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "SQLiRule"
    priority = 1

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-sqli-rule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "CommonRuleSet"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-common-rule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-rule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-waf" })
}

resource "aws_wafv2_web_acl_association" "main" {
  count        = var.enable_waf ? 1 : 0
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}

#######################
# AWS Config (conditional)
#######################

resource "aws_config_configuration_recorder" "main" {
  count    = var.manage_config_recorder ? 1 : 0
  name     = "${var.name_prefix}-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.manage_config_recorder ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
}

resource "aws_config_delivery_channel" "main" {
  count           = var.manage_config_recorder ? 1 : 0
  name            = "${var.name_prefix}-delivery-channel"
  s3_bucket_name  = var.logs_bucket_id
  s3_key_prefix   = "config"
  depends_on      = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.name_prefix}-encrypted-volumes"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-encrypted-volumes" })
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  name = "${var.name_prefix}-rds-storage-encrypted"
  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-rds-storage-encrypted" })
}

resource "aws_config_config_rule" "restricted_ssh" {
  name = "${var.name_prefix}-restricted-ssh"
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-restricted-ssh" })
}

resource "aws_config_config_rule" "root_mfa" {
  name = "${var.name_prefix}-root-mfa-enabled"
  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-root-mfa-enabled" })
}
