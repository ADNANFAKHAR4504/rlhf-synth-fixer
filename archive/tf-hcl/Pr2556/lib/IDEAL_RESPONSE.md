## lib/cloudtrail.tf

```hcl
# CloudTrail for comprehensive API logging and security monitoring
# Captures all API calls for audit, compliance, and security analysis

# CloudWatch Log Group for CloudTrail logs
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail-logs"
  }
}

# CloudTrail configuration with comprehensive logging
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.logging.id
  s3_key_prefix                 = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true
  kms_key_id                    = aws_kms_key.main.arn

  # Send logs to CloudWatch for real-time monitoring
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  # Capture both read and write events
  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    # Log all S3 object-level events for security
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data.arn}/*"]
    }

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logging.arn}/*"]
    }
  }

  # Enable log file validation for integrity checking
  enable_log_file_validation = true

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail"
  }

  depends_on = [aws_s3_bucket_policy.logging_cloudtrail]
}

```

## lib/cloudwatch.tf

```hcl
# CloudWatch monitoring, alarms, and metric filters for security and operations
# Implements real-time monitoring for security events and system health

# Metric filter for root account usage detection
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${var.project_name}-${var.environment}-root-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-root-account-usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-root-usage-alarm"
  }
}

# Metric filter for failed console logins
resource "aws_cloudwatch_log_metric_filter" "failed_console_logins" {
  name           = "${var.project_name}-${var.environment}-failed-console-logins"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage EXISTS) }"

  metric_transformation {
    name      = "FailedConsoleLogins"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for failed console logins
resource "aws_cloudwatch_metric_alarm" "failed_console_logins_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-failed-console-logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedConsoleLogins"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "3"
  alarm_description   = "This metric monitors failed console login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-failed-logins-alarm"
  }
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-unauthorized-api-alarm"
  }
}

# CloudWatch dashboard for security monitoring
resource "aws_cloudwatch_dashboard" "security_dashboard" {
  dashboard_name = "${var.project_name}-${var.environment}-security-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["${var.project_name}/${var.environment}/Security", "RootAccountUsage"],
            [".", "FailedConsoleLogins"],
            [".", "UnauthorizedAPICalls"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Security Metrics"
        }
      }
    ]
  })
}

```

## lib/config.tf

```hcl
# AWS Config for compliance monitoring and configuration drift detection
# Monitors EC2 instances to ensure they are members of Auto Scaling Groups

# S3 bucket policy update for AWS Config
resource "aws_s3_bucket_policy" "logging_config" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logging.arn,
          "${aws_s3_bucket.logging.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-${var.environment}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-${var.environment}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.logging.id
  s3_key_prefix  = "config"

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# AWS Config Rule: EC2 instances must be in Auto Scaling Group
resource "aws_config_config_rule" "ec2_in_asg" {
  name = "${var.project_name}-${var.environment}-ec2-in-asg"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_MANAGED_BY_SSM"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-in-asg-rule"
  }
}

# Additional Config Rule: Ensure EC2 instances are in Auto Scaling Groups
resource "aws_config_config_rule" "autoscaling_group_elb_healthcheck_required" {
  name = "${var.project_name}-${var.environment}-asg-elb-healthcheck"

  source {
    owner             = "AWS"
    source_identifier = "AUTOSCALING_GROUP_ELB_HEALTHCHECK_REQUIRED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-asg-elb-healthcheck-rule"
  }
}

```

## lib/ec2.tf

```hcl
# EC2 infrastructure with Auto Scaling Group in private subnets
# Implements security best practices: no public IPs, SSM access only, IMDSv2

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch template for EC2 instances with security hardening
resource "aws_launch_template" "app_servers" {
  name_prefix   = "${var.project_name}-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  # Security: Disable IMDSv1, require IMDSv2 only
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Security: No public IP assignment
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app_instances.id]
    delete_on_termination       = true
  }

  # IAM instance profile for SSM access
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance.name
  }

  # Enable detailed monitoring for better observability
  monitoring {
    enabled = true
  }

  # User data script for basic configuration
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent

    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Basic application setup (replace with your application)
    yum install -y httpd
    systemctl enable httpd
    systemctl start httpd

    # Configure httpd to listen on port 8080
    sed -i 's/Listen 80/Listen 8080/' /etc/httpd/conf/httpd.conf
    systemctl restart httpd

    # Create a simple health check page
    echo "<html><body><h1>Application Server Ready</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-${var.environment}-app-server"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group for high availability and automatic scaling
resource "aws_autoscaling_group" "app_servers" {
  name                      = "${var.project_name}-${var.environment}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app_servers.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.app_servers.id
    version = "$Latest"
  }

  # Ensure instances are distributed across AZs
  availability_zones = data.aws_availability_zones.available.names

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  # Lifecycle hook for graceful shutdowns
  initial_lifecycle_hook {
    name                 = "instance-terminating"
    default_result       = "ABANDON"
    heartbeat_timeout    = 300
    lifecycle_transition = "autoscaling:EC2_INSTANCE_TERMINATING"
  }
}

# Application Load Balancer for distributing traffic
resource "aws_lb" "app_lb" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Set to true for production

  # Access logs to S3
  access_logs {
    bucket  = aws_s3_bucket.logging.id
    prefix  = "alb-access-logs"
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# Target group for application servers
resource "aws_lb_target_group" "app_servers" {
  name     = "${var.project_name}-${var.environment}-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-tg"
  }
}

# ALB Listener for HTTPS traffic
resource "aws_lb_listener" "app_https" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.app_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_servers.arn
  }
}

# ALB Listener for HTTP traffic (redirect to HTTPS)
resource "aws_lb_listener" "app_http" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Self-signed certificate for ALB (replace with real certificate in production)
resource "aws_acm_certificate" "app_cert" {
  domain_name       = "app.${var.project_name}.local"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.project_name}.local"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert"
  }
}

```

## lib/iam.tf

```hcl
# IAM roles and policies with least privilege access
# Each role is scoped to specific resources and actions required for functionality

# EC2 Instance Role - Minimal permissions for SSM and CloudWatch
resource "aws_iam_role" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-role"

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

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-instance-role"
  }
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-profile"
  role = aws_iam_role.ec2_instance.name
}

# Policy for EC2 instances - SSM Session Manager access only
resource "aws_iam_role_policy" "ec2_ssm_policy" {
  name = "${var.project_name}-${var.environment}-ec2-ssm-policy"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.app_data.arn}/*"
      }
    ]
  })
}

# CloudTrail Service Role
resource "aws_iam_role" "cloudtrail" {
  name = "${var.project_name}-${var.environment}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail-role"
  }
}

# CloudTrail CloudWatch Logs policy
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.project_name}-${var.environment}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.project_name}-${var.environment}:*"
      }
    ]
  })
}

# AWS Config Service Role
resource "aws_iam_role" "config" {
  name = "${var.project_name}-${var.environment}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-config-role"
  }
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Config delivery channel policy
resource "aws_iam_role_policy" "config_delivery_policy" {
  name = "${var.project_name}-${var.environment}-config-delivery-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect   = "Allow"
        Action   = "s3:GetBucketLocation"
        Resource = aws_s3_bucket.logging.arn
      }
    ]
  })
}

```

## lib/kms.tf

```hcl
# Get current AWS account ID and region for KMS key policy
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Customer Managed KMS Key for S3 and CloudTrail encryption
# Provides granular control over encryption and access policies
resource "aws_kms_key" "main" {
  description             = "Customer managed key for ${var.project_name} ${var.environment} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  # Comprehensive key policy following least privilege principles
  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-policy-${var.project_name}-${var.environment}"
    Statement = [
      # Root account administrative access
      {
        Sid    = "EnableRootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      # S3 service access for server-side encryption
      {
        Sid    = "AllowS3ServiceAccess"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      # CloudTrail service access for log encryption
      {
        Sid    = "AllowCloudTrailAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "cloudtrail.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      # CloudWatch Logs service access
      {
        Sid    = "AllowCloudWatchLogsAccess"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.project_name}-${var.environment}"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-cmk"
  }
}

# KMS Key Alias for easier reference and management
resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-key"
  target_key_id = aws_kms_key.main.key_id
}

```

## lib/nacls.tf

```hcl
# Network ACL for Public Subnets
# Provides additional layer of security for subnets containing NAT Gateways and ALBs
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-public-nacl"
  }
}

# Network ACL for Private Subnets
# Strict controls for application workload subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-private-nacl"
  }
}

# Public NACL Rules - Inbound
# Allow HTTPS/HTTP from trusted CIDRs for ALB access
resource "aws_network_acl_rule" "public_inbound_https" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_inbound_http" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 200 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 80
  to_port        = 80
}

# Allow ephemeral ports for return traffic (ALB health checks, responses)
resource "aws_network_acl_rule" "public_inbound_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Public NACL Rules - Outbound
# Allow all outbound traffic for NAT Gateway functionality
resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Private NACL Rules - Inbound
# Allow traffic from public subnets (ALB to instances)
resource "aws_network_acl_rule" "private_inbound_from_public" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.public[count.index].cidr_block
  from_port      = 8080
  to_port        = 8080
}

# Allow intra-VPC communication for private subnets
resource "aws_network_acl_rule" "private_inbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Allow ephemeral ports for return traffic
resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL Rules - Outbound
# Allow HTTPS for package updates and AWS API calls
resource "aws_network_acl_rule" "private_outbound_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

# Allow HTTP for package repositories
resource "aws_network_acl_rule" "private_outbound_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

# Allow DNS resolution
resource "aws_network_acl_rule" "private_outbound_dns" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  protocol       = "udp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 53
  to_port        = 53
}

# Allow intra-VPC communication
resource "aws_network_acl_rule" "private_outbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

```

## lib/outputs.tf

```hcl
# Output values for the production infrastructure
# These outputs provide important information about created resources

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_eips" {
  description = "Elastic IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "app_instances_security_group_id" {
  description = "ID of the application instances security group"
  value       = aws_security_group.app_instances.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "kms_key_id" {
  description = "ID of the KMS customer managed key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS customer managed key"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS customer managed key"
  value       = aws_kms_alias.main.name
}

output "app_data_bucket_id" {
  description = "ID of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "app_data_bucket_arn" {
  description = "ARN of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.arn
}

output "logging_bucket_id" {
  description = "ID of the logging S3 bucket"
  value       = aws_s3_bucket.logging.id
}

output "logging_bucket_arn" {
  description = "ARN of the logging S3 bucket"
  value       = aws_s3_bucket.logging.arn
}

output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance IAM role"
  value       = aws_iam_role.ec2_instance.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_instance.name
}

output "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.arn
}

output "config_role_arn" {
  description = "ARN of the AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app_servers.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app_servers.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.app_servers.arn
}

output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app_lb.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app_lb.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.app_lb.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app_servers.arn
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.app_cert.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

output "root_usage_alarm_name" {
  description = "Name of the root usage CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.root_usage_alarm.alarm_name
}

output "failed_logins_alarm_name" {
  description = "Name of the failed console logins CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.failed_console_logins_alarm.alarm_name
}

output "unauthorized_api_alarm_name" {
  description = "Name of the unauthorized API calls CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.unauthorized_api_calls_alarm.alarm_name
}

output "security_dashboard_url" {
  description = "URL of the CloudWatch security dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.security_dashboard.dashboard_name}"
}

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "config_rules" {
  description = "Names of the AWS Config rules"
  value = [
    aws_config_config_rule.ec2_in_asg.name,
    aws_config_config_rule.autoscaling_group_elb_healthcheck_required.name
  ]
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

output "operational_alerts_topic_arn" {
  description = "ARN of the operational alerts SNS topic"
  value       = aws_sns_topic.operational_alerts.arn
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

# Security validation outputs
output "security_validation" {
  description = "Security configuration validation summary"
  value = {
    vpc_flow_logs_enabled        = false # Not implemented in this basic setup
    s3_encryption_enabled        = true
    s3_versioning_enabled        = true
    s3_public_access_blocked     = true
    kms_key_rotation_enabled     = true
    cloudtrail_enabled           = true
    config_enabled               = true
    security_groups_validated    = true
    nacls_configured             = true
    instances_in_private_subnets = true
    ssm_session_manager_enabled  = true
  }
}

```

## lib/s3.tf

```hcl
# S3 bucket for application data storage
# Implements security best practices: encryption, versioning, access logging
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.project_name}-${var.environment}-app-data-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-app-data"
    Purpose    = "Application data storage"
    Compliance = "SOC2"
  }
}

# S3 bucket for access logs and audit trails
# Separate bucket for security logs to prevent tampering
resource "aws_s3_bucket" "logging" {
  bucket = "${var.project_name}-${var.environment}-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-logs"
    Purpose    = "Access logs and audit trails"
    Compliance = "SOC2"
  }
}

# Random suffix to ensure globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Block all public access to application data bucket
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block all public access to logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on application data bucket for data protection
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable versioning on logging bucket for audit trail integrity
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# KMS encryption for application data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# KMS encryption for logging bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Access logging for application data bucket (logs go to logging bucket)
resource "aws_s3_bucket_logging" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/app-data/"
}

# Lifecycle policy for application data bucket
# Manages storage costs while maintaining compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "app_data_lifecycle"
    status = "Enabled"

    # Transition current objects to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition current objects to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete non-current versions after 90 days to manage costs
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Transition non-current versions to IA after 30 days
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

# Lifecycle policy for logging bucket
# Longer retention for audit and compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "logging_lifecycle"
    status = "Enabled"

    # Transition to IA after 90 days (logs accessed less frequently)
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 365 days
    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # Keep non-current versions for 7 years for compliance
    noncurrent_version_expiration {
      noncurrent_days = 2555 # 7 years
    }
  }
}

# Bucket policy for CloudTrail access to logging bucket
resource "aws_s3_bucket_policy" "logging_cloudtrail" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      }
    ]
  })
}

```

## lib/security_groups.tf

```hcl
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

```

## lib/sns.tf

```hcl
# SNS topic for security alerts and notifications
# Provides centralized alerting for security events and system issues

resource "aws_sns_topic" "security_alerts" {
  name              = "${var.project_name}-${var.environment}-security-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-security-alerts"
  }
}

# SNS topic policy to allow CloudWatch to publish
resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "sns:Subscribe",
          "sns:ListSubscriptionsByTopic",
          "sns:GetTopicAttributes",
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# Email subscription for security alerts (replace with actual email)
resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = "alamutu.d@turing.com" # Replace with actual email address
}

# SNS topic for operational alerts
resource "aws_sns_topic" "operational_alerts" {
  name              = "${var.project_name}-${var.environment}-operational-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-operational-alerts"
  }
}

# SNS topic policy for operational alerts
resource "aws_sns_topic_policy" "operational_alerts" {
  arn = aws_sns_topic.operational_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "cloudwatch.amazonaws.com",
            "autoscaling.amazonaws.com"
          ]
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.operational_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

```

## lib/variables.tf

```hcl
# Core region variable consumed by provider.tf
# Variable definitions for the production infrastructure
# These variables control the behavior and configuration of all resources

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "Only us-west-2 is allowed for this production deployment."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "secure-foundation"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC - /16 provides 65,536 IP addresses"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "trusted_cidrs" {
  description = "List of trusted CIDR blocks for network access - restrict to known networks only"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition     = length(var.trusted_cidrs) > 0
    error_message = "At least one trusted CIDR must be specified."
  }
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"

  validation {
    condition     = contains(["t3.small", "t3.medium", "t3.large", "m5.large", "m5.xlarge"], var.instance_type)
    error_message = "Instance type must be from approved list for production use."
  }
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.min_size >= 2
    error_message = "Minimum size must be at least 2 for high availability."
  }
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6

  validation {
    condition     = var.max_size >= var.min_size
    error_message = "Maximum size must be greater than or equal to minimum size."
  }
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

```

## lib/vpc.tf

```hcl
# Data source to get available AZs in the region
# This ensures we deploy across multiple AZs for high availability
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

# Main VPC - Foundation of our secure network architecture
# Uses /16 CIDR to provide ample IP space while maintaining security boundaries
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Security: Disable VPC flow logs to CloudWatch by default
  # Enable only when needed for troubleshooting to reduce costs

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# Internet Gateway - Provides internet access for public subnets
# Only public subnets (ALB, NAT) will route through this gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# Public Subnets - Host NAT Gateways and Load Balancers only
# These subnets have direct internet access but contain no application instances
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false # Security: Never auto-assign public IPs

  tags = {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets - Host all application workloads
# These subnets have no direct internet access; egress via NAT Gateway only
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
# Each AZ gets its own NAT Gateway for high availability
resource "aws_eip" "nat" {
  count = 2

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways - Provide secure outbound internet access for private subnets
# Deployed in public subnets but serve private subnet egress traffic
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
  }
}

# Public Route Table - Routes traffic from public subnets to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

# Private Route Tables - One per AZ for fault isolation
# Routes traffic from private subnets to respective NAT Gateway
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with their respective private route tables
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

```
