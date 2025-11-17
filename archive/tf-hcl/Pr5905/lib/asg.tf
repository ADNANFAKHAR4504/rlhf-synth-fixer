# Auto Scaling Group - Blue Environment
resource "aws_autoscaling_group" "blue" {
  name                      = "asg-blue-${var.environment_suffix}"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [aws_lb_target_group.blue.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.blue.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMinSize",
    "GroupMaxSize",
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
    value               = "asg-blue-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Blue"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentType"
    value               = "BlueGreen"
    propagate_at_launch = true
  }

  tag {
    key                 = "Version"
    value               = var.app_version_blue
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Group - Green Environment
resource "aws_autoscaling_group" "green" {
  name                      = "asg-green-${var.environment_suffix}"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [aws_lb_target_group.green.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.green.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMinSize",
    "GroupMaxSize",
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
    value               = "asg-green-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Green"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentType"
    value               = "BlueGreen"
    propagate_at_launch = true
  }

  tag {
    key                 = "Version"
    value               = var.app_version_green
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Policy - Blue Environment (Target Tracking - CPU)
resource "aws_autoscaling_policy" "blue_cpu" {
  name                   = "asg-policy-blue-cpu-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.blue.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Green Environment (Target Tracking - CPU)
resource "aws_autoscaling_policy" "green_cpu" {
  name                   = "asg-policy-green-cpu-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.green.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Blue Environment (Target Tracking - ALB Request Count)
resource "aws_autoscaling_policy" "blue_request_count" {
  name                   = "asg-policy-blue-requests-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.blue.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.blue.arn_suffix}"
    }
    target_value = 1000.0
  }
}

# Auto Scaling Policy - Green Environment (Target Tracking - ALB Request Count)
resource "aws_autoscaling_policy" "green_request_count" {
  name                   = "asg-policy-green-requests-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.green.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.green.arn_suffix}"
    }
    target_value = 1000.0
  }
}
