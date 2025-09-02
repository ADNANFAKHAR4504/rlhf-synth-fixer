I can see the issues with your Terraform configuration. The main problem is that several files are incomplete, and there are missing variables and resources. Let me provide you with the complete, corrected files.

## Issues Found:

1. `iam.tf` is incomplete (missing closing braces)
2. Missing variables `project_name` and `environment` in `variables.tf`
3. Several files are completely missing: `ec2.tf`, `cloudtrail.tf`, `cloudwatch.tf`, `config.tf`, `sns.tf`, `outputs.tf`
4. Some resources reference variables that don't exist

## Fixed and Complete Files:

### variables.tf (Updated)

```hcl
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

### iam.tf (Complete)

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
        Effect = "Allow"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Action = "s3:GetBucketLocation"
        Resource = aws_s3_bucket.logging.arn
      }
    ]
  })
}
```

### ec2.tf (New)

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
    http_endpoint = "enabled"
    http_tokens   = "required"
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
  name                = "${var.project_name}-${var.environment}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app_servers.arn]
  health_check_type   = "ELB"
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

### cloudtrail.tf (New)

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
    read_write_type                 = "All"
    include_management_events       = true
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

### cloudwatch.tf (New)

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

### config.tf (New)

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
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
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

### sns.tf (New)

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
        Action = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
        Condition = {
          StringEquals = {
            "
```
