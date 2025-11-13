# EC2 Module - Auto Scaling Group and Launch Template

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
    additional_packages = var.additional_packages
  }))
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-${var.project_name}-web-"
  description   = "Launch template for ${var.environment} ${var.project_name} web servers"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  # key_name      = var.key_pair_name

  vpc_security_group_ids = [var.web_security_group_id]

  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  user_data = local.user_data

  # EBS optimization
  # ebs_optimized = var.ebs_optimized

  # Monitoring
  monitoring {
    enabled = var.detailed_monitoring
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
  name                = "${var.environment}-${var.project_name}-web-asg-hcltftftf"
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
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-${var.project_name}-scale-down"
  scaling_adjustment     = var.scale_down_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type           = "SimpleScaling"
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