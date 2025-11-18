# Requirement 1: Consolidated reusable EC2 module

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Security Groups
resource "aws_security_group" "instance" {
  name_prefix = "${var.environment}-${var.region_name}-${var.tier_name}-${var.environment_suffix}-"
  description = "Security group for ${var.tier_name} tier instances"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      cidr_blocks     = lookup(ingress.value, "cidr_blocks", null)
      security_groups = lookup(ingress.value, "security_groups", null)
      description     = lookup(ingress.value, "description", "Managed by Terraform")
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  # Requirement 7: Lifecycle rules with create_before_destroy
  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.tier_name}-sg-${var.environment_suffix}"
      Tier = var.tier_name
    }
  )
}

# Launch Template
resource "aws_launch_template" "instance" {
  name_prefix   = "${var.environment}-${var.region_name}-${var.tier_name}-${var.environment_suffix}-"
  description   = "Launch template for ${var.tier_name} tier instances"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  vpc_security_group_ids = [aws_security_group.instance.id]

  user_data = base64encode(var.user_data)

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = var.root_volume_size
      volume_type           = var.root_volume_type
      delete_on_termination = true
      encrypted             = true
    }
  }

  monitoring {
    enabled = var.detailed_monitoring
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.tags,
      {
        Name = "${var.environment}-${var.region_name}-${var.tier_name}-instance-${var.environment_suffix}"
        Tier = var.tier_name
      }
    )
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(
      var.tags,
      {
        Name = "${var.environment}-${var.region_name}-${var.tier_name}-volume-${var.environment_suffix}"
        Tier = var.tier_name
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.tier_name}-lt-${var.environment_suffix}"
      Tier = var.tier_name
    }
  )
}

# Auto Scaling Group
resource "aws_autoscaling_group" "instance" {
  name_prefix = "${var.environment}-${var.region_name}-${var.tier_name}-asg-${var.environment_suffix}-"

  vpc_zone_identifier       = var.subnet_ids
  target_group_arns         = var.target_group_arns
  health_check_type         = var.health_check_type
  health_check_grace_period = var.health_check_grace_period

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.instance.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMinSize",
    "GroupMaxSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  wait_for_capacity_timeout = "10m"

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-${var.region_name}-${var.tier_name}-asg-${var.environment_suffix}"
    propagate_at_launch = false
  }

  tag {
    key                 = "Tier"
    value               = var.tier_name
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  count                  = var.enable_autoscaling_policies ? 1 : 0
  name                   = "${var.environment}-${var.region_name}-${var.tier_name}-scale-up-${var.environment_suffix}"
  scaling_adjustment     = var.scale_up_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown               = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.instance.name
}

resource "aws_autoscaling_policy" "scale_down" {
  count                  = var.enable_autoscaling_policies ? 1 : 0
  name                   = "${var.environment}-${var.region_name}-${var.tier_name}-scale-down-${var.environment_suffix}"
  scaling_adjustment     = var.scale_down_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown               = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.instance.name
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = var.enable_autoscaling_policies ? 1 : 0
  alarm_name          = "${var.environment}-${var.region_name}-${var.tier_name}-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.high_cpu_threshold
  alarm_description   = "Scale up when CPU exceeds ${var.high_cpu_threshold}%"
  alarm_actions       = [aws_autoscaling_policy.scale_up[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.instance.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  count               = var.enable_autoscaling_policies ? 1 : 0
  alarm_name          = "${var.environment}-${var.region_name}-${var.tier_name}-low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.low_cpu_threshold
  alarm_description   = "Scale down when CPU falls below ${var.low_cpu_threshold}%"
  alarm_actions       = [aws_autoscaling_policy.scale_down[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.instance.name
  }

  tags = var.tags
}