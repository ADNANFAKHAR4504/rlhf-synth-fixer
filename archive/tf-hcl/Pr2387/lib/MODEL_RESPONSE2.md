# Gap Analysis and Resolution

## Identified Gaps

1. **Incomplete ALB Module**: The `modules/alb/main.tf` was cut off mid-resource definition
2. **Missing EC2 Module**: Complete EC2 module implementation is missing
3. **Missing Root Configuration**: No root-level `main.tf`, `variables.tf`, `outputs.tf`, or `terraform.tf`
4. **Missing Environment Configurations**: No staging/production environment configurations
5. **Missing Module Documentation**: README files for modules are missing

## Resolution Steps

Let me complete the missing components systematically:

### 1. Complete ALB Module

**modules/alb/main.tf** (Continuing from where it was cut off)
```hcl
# ALB Module - Application Load Balancer
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data source for SSL certificate (if provided)
data "aws_acm_certificate" "ssl_cert" {
  count  = var.ssl_certificate_arn != "" ? 1 : 0
  arn    = var.ssl_certificate_arn
  statuses = ["ISSUED"]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = true
  idle_timeout              = var.idle_timeout

  # Access logs configuration
  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb"
    Type = "application-load-balancer"
    Component = "alb"
  })
}

# Target Group for web servers
resource "aws_lb_target_group" "web" {
  name     = "${var.environment}-${var.project_name}-web-tg"
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    interval            = var.health_check_interval
    matcher             = var.health_check_matcher
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = var.target_protocol
    timeout             = var.health_check_timeout
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  # Stickiness configuration
  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-tg"
    Type = "target-group"
    Component = "alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener (redirect to HTTPS if SSL is enabled)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # If SSL certificate is provided, redirect HTTP to HTTPS
  dynamic "default_action" {
    for_each = var.ssl_certificate_arn != "" ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  # If no SSL certificate, forward to target group
  dynamic "default_action" {
    for_each = var.ssl_certificate_arn == "" ? [1] : []
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.web.arn
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-http-listener"
    Type = "alb-listener"
    Component = "alb"
  })
}

# HTTPS Listener (only if SSL certificate is provided)
resource "aws_lb_listener" "https" {
  count = var.ssl_certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-https-listener"
    Type = "alb-listener"
    Component = "alb"
  })
}

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.response_time_threshold
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-response-time-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.unhealthy_hosts_threshold
  alarm_description   = "This metric monitors unhealthy ALB targets"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-unhealthy-hosts-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

# WAF Web ACL Association (if WAF is enabled)
resource "aws_wafv2_web_acl_association" "alb" {
  count = var.enable_waf ? 1 : 0

  resource_arn = aws_lb.main.arn
  web_acl_arn  = var.waf_web_acl_arn
}
```

**modules/alb/variables.tf**
```hcl
# ALB Module Variables
variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.project_name))
    error_message = "Project name must contain only alphanumeric characters and hyphens."
  }
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must be a valid VPC identifier."
  }
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "At least 2 public subnets are required for ALB high availability."
  }
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.alb_security_group_id))
    error_message = "Security group ID must be a valid security group identifier."
  }
}

variable "target_port" {
  description = "Port on which targets receive traffic"
  type        = number
  default     = 80
  validation {
    condition     = var.target_port > 0 && var.target_port <= 65535
    error_message = "Target port must be between 1 and 65535."
  }
}

variable "target_protocol" {
  description = "Protocol to use for routing traffic to targets"
  type        = string
  default     = "HTTP"
  validation {
    condition     = contains(["HTTP", "HTTPS"], var.target_protocol)
    error_message = "Target protocol must be either HTTP or HTTPS."
  }
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener"
  type        = string
  default     = ""
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "Time in seconds that connections are allowed to be idle"
  type        = number
  default     = 60
  validation {
    condition     = var.idle_timeout >= 1 && var.idle_timeout <= 4000
    error_message = "Idle timeout must be between 1 and 4000 seconds."
  }
}

variable "enable_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "S3 prefix for ALB access logs"
  type        = string
  default     = "alb-logs"
}

# Health Check Variables
variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/"
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive health checks successes required"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_healthy_threshold >= 2 && var.health_check_healthy_threshold <= 10
    error_message = "Health check healthy threshold must be between 2 and 10."
  }
}

variable "health_check_interval" {
  description = "Approximate amount of time between health checks"
  type        = number
  default     = 30
  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "Health check interval must be between 5 and 300 seconds."
  }
}

variable "health_check_matcher" {
  description = "Response codes to use when checking for a healthy responses"
  type        = string
  default     = "200"
}

variable "health_check_timeout" {
  description = "Amount of time to wait when receiving a response from the health check"
  type        = number
  default     = 5
  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds."
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Health check unhealthy threshold must be between 2 and 10."
  }
}

# Stickiness Variables
variable "enable_stickiness" {
  description = "Enable load balancer cookie stickiness"
  type        = bool
  default     = false
}

variable "stickiness_duration" {
  description = "Time period for which requests from a client should be routed to the same target"
  type        = number
  default     = 86400
  validation {
    condition     = var.stickiness_duration >= 1 && var.stickiness_duration <= 604800
    error_message = "Stickiness duration must be between 1 second and 7 days (604800 seconds)."
  }
}

# CloudWatch Alarms Variables
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for ALB"
  type        = bool
  default     = true
}

variable "response_time_threshold" {
  description = "Response time threshold for CloudWatch alarm (in seconds)"
  type        = number
  default     = 1.0
}

variable "unhealthy_hosts_threshold" {
  description = "Unhealthy hosts threshold for CloudWatch alarm"
  type        = number
  default     = 0
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

# WAF Variables
variable "enable_waf" {
  description = "Enable WAF for ALB"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of WAF Web ACL to associate with ALB"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}
```

**modules/alb/outputs.tf**
```hcl
# ALB Module Outputs
output "alb_id" {
  description = "ID of the load balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix for use with CloudWatch Metrics"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_id" {
  description = "ID of the target group"
  value       = aws_lb_target_group.web.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}

output "target_group_arn_suffix" {
  description = "ARN suffix for use with CloudWatch Metrics"
  value       = aws_lb_target_group.web.arn_suffix
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = var.ssl_certificate_arn != "" ? aws_lb_listener.https[0].arn : null
}

output "alb_security_group_id" {
  description = "Security group ID attached to the ALB"
  value       = var.alb_security_group_id
}
```

### 2. Complete EC2 Module

**modules/ec2/main.tf**
```hcl
# EC2 Module - Auto Scaling Group and Launch Template
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources
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

data "aws_secretsmanager_secret" "app_secrets" {
  count = var.secrets_manager_secret_name != "" ? 1 : 0
  name  = var.secrets_manager_secret_name
}

data "aws_secretsmanager_secret_version" "app_secrets" {
  count     = var.secrets_manager_secret_name != "" ? 1 : 0
  secret_id = data.aws_secretsmanager_secret.app_secrets[0].id
}

# User data script for EC2 instances
locals {
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment         = var.environment
    project_name        = var.project_name
    app_port           = var.app_port
    secrets_arn        = var.secrets_manager_secret_name != "" ? data.aws_secretsmanager_secret.app_secrets[0].arn : ""
    cloudwatch_config  = var.cloudwatch_config
    additional_packages = var.additional_packages
  }))
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-${var.project_name}-web-"
  description   = "Launch template for ${var.environment} ${var.project_name} web servers"
  image_id      = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  vpc_security_group_ids = [var.web_security_group_id]

  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  user_data = local.user_data

  # EBS optimization
  ebs_optimized = var.ebs_optimized

  # Monitoring
  monitoring {
    enabled = var.detailed_monitoring
  }

  # Block device mappings
  dynamic "block_device_mappings" {
    for_each = var.block_device_mappings
    content {
      device_name = block_device_mappings.value.device_name
      ebs {
        volume_size           = block_device_mappings.value.volume_size
        volume_type           = block_device_mappings.value.volume_type
        iops                  = block_device_mappings.value.iops
        throughput            = block_device_mappings.value.throughput
        encrypted             = block_device_mappings.value.encrypted
        kms_key_id           = block_device_mappings.value.kms_key_id
        delete_on_termination = block_device_mappings.value.delete_on_termination
      }
    }
  }

  # Instance metadata options
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-instance"
      Type = "ec2-instance"
      Component = "web"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-volume"
      Type = "ebs-volume"
      Component = "web"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-launch-template"
    Type = "launch-template"
    Component = "web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "${var.environment}-${var.project_name}-web-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [var.target_group_arn]
  health_check_type   = var.health_check_type
  health_check_grace_period = var.health_check_grace_period

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Instance refresh configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = var.instance_refresh_min_healthy_percentage
      instance_warmup       = var.instance_warmup
    }
    triggers = ["tag"]
  }

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Termination policies
  termination_policies = var.termination_policies

  # Enable instance protection
  protect_from_scale_in = var.protect_from_scale_in

  # Tags
  dynamic "tag" {
    for_each = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-asg"
      Type = "auto-scaling-group"
      Component = "web"
    })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes       = [desired_capacity]
  }

  depends_on = [aws_launch_template.web]
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-${var.project_name}-scale-up"
  scaling_adjustment     = var.scale_up_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type           = "SimpleScaling"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-scale-up-policy"
    Type = "autoscaling-policy"
    Component = "web"
  })
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-${var.project_name}-scale-down"
  scaling_adjustment     = var.scale_down_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type           = "SimpleScaling"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-scale-down-policy"
    Type = "autoscaling-policy"
    Component = "web"
  })
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.cpu_high_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = var.cpu_high_period
  statistic           = "Average"
  threshold           = var.cpu_high_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = concat([aws_autoscaling_policy.scale_up.arn], var.alarm_actions)

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-cpu-high-alarm"
    Type = "cloudwatch-alarm"
    Component = "web"
  })
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.cpu_low_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = var.cpu_low_period
  statistic           = "Average"
  threshold           = var.cpu_low_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-cpu-low-alarm"
    Type = "cloudwatch-alarm"
    Component = "web"
  })
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${var.environment}-${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-app-logs"
    Type = "log-group"
    Component = "web"
  })
}

# SNS Topic for notifications (optional)
resource "aws_sns_topic" "notifications" {
  count = var.enable_notifications ? 1 : 0

  name = "${var.environment}-${var.project_name}-notifications"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-notifications"
    Type = "sns-topic"
    Component = "web"
  })
}

# SNS Topic Subscription (optional)
resource "aws_sns_topic_subscription" "email_notifications" {
  count = var.enable_notifications && length(var.notification_emails) > 0 ? length(var.notification_emails) : 0

  topic_arn = aws_sns_topic.notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_emails[count.index]
}
```

**modules/ec2/user_data.sh**
```bash
#!/bin/bash

# User Data Script for Web Servers
set -e

# Variables from Terraform
ENVIRONMENT="${environment}"
PROJECT_NAME="${project_name}"
APP_PORT="${app_port}"
SECRETS_ARN="${secrets_arn}"

# Update system
yum update -y

# Install required packages
yum install -y \
    amazon-cloudwatch-agent \
    aws-cli \
    docker \
    git \
    htop \
    jq \
    nginx \
    ${additional_packages}

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
${cloudwatch_config}
EOF

# Start and enable services
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Configure nginx
cat > /etc/nginx/conf.d/app.conf << EOF
upstream app {
    server localhost:$APP_PORT;
}

server {
    listen 80;
    server_name _;

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remove default nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration and restart
nginx -t && systemctl restart nginx

# Retrieve secrets if configured
if [ ! -z "$SECRETS_ARN" ]; then
    echo "Retrieving secrets from AWS Secrets Manager..."
    aws secretsmanager get-secret-value \
        --secret-id "$SECRETS_ARN" \
        --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region) \
        --query SecretString \
        --output text > /opt/app/.env
    
    chown ec2-user:ec2-user /opt/app/.env
    chmod 600 /opt/app/.env
fi

# Create a simple health check application
cat > /opt/app/health_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from datetime import datetime

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            health_data = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                'project': os.environ.get('PROJECT_NAME', 'unknown'),
                'instance_id': os.popen('curl -s http://169.254.169.254/latest/meta