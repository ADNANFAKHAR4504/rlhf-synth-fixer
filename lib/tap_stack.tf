###################
# Launch Template and Auto Scaling
###################

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

# User data script for application instances
locals {
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment     = var.environment
    db_endpoint     = aws_db_instance.main.endpoint
    db_name         = var.db_name
    db_username     = var.db_username
    app_port        = var.app_port
    log_group_name  = aws_cloudwatch_log_group.app.name
    aws_region      = data.aws_region.current.name
  }))
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.environment}-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name # Add this variable

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_instance.name
  }

  user_data = local.user_data

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id           = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = var.enable_detailed_monitoring
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Component = "application"
      Name      = "${var.environment}-app-instance-${local.unique_id}"
    })
  }

  tags = merge(local.common_tags, {
    Component = "application"
    Name      = "${var.environment}-app-lt-${local.unique_id}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.environment}-app-asg-${local.unique_id}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-app-instance-${local.unique_id}"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up-${local.unique_id}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down-${local.unique_id}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-cpu-high-${local.unique_id}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.scale_up_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = merge(local.common_tags, {
    Component = "monitoring"
    Name      = "${var.environment}-cpu-high-${local.unique_id}"
  })
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.environment}-cpu-low-${local.unique_id}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.scale_down_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = merge(local.common_tags, {
    Component = "monitoring"
    Name      = "${var.environment}-cpu-low-${local.unique_id}"
  })
}

###################
# Additional CloudWatch Log Groups
###################

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.environment}-app-${local.unique_id}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Component = "monitoring"
    Name      = "${var.environment}-app-logs-${local.unique_id}"
  })
}

###################
# SSM Parameters for Application Configuration
###################

resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/${var.environment}/app/db_endpoint"
  type  = "SecureString"
  value = aws_db_instance.main.endpoint
  key_id = aws_kms_key.main.key_id

  tags = merge(local.common_tags, {
    Component = "configuration"
    Name      = "${var.environment}-db-endpoint-${local.unique_id}"
  })
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.environment}/app/db_name"
  type  = "String"
  value = var.db_name

  tags = merge(local.common_tags, {
    Component = "configuration"
    Name      = "${var.environment}-db-name-${local.unique_id}"
  })
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.environment}/app/db_username"
  type  = "SecureString"
  value = var.db_username
  key_id = aws_kms_key.main.key_id

  tags = merge(local.common_tags, {
    Component = "configuration"
    Name      = "${var.environment}-db-username-${local.unique_id}"
  })
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.environment}/app/db_password"
  type  = "SecureString"
  value = var.db_password
  key_id = aws_kms_key.main.key_id

  tags = merge(local.common_tags, {
    Component = "configuration"
    Name      = "${var.environment}-db-password-${local.unique_id}"
  })
}