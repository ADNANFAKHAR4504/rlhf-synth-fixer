# Data source to find an available AMI (works with LocalStack and real AWS)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon", "self", "aws-marketplace"]

  filter {
    name   = "name"
    values = ["amzn-ami-*", "amzn2-ami-*", "ubuntu*", "Amazon*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

locals {
  # Use the dynamically found AMI ID
  ami_id = data.aws_ami.amazon_linux.id
}


# Launch Template (used by ASG when enabled)
resource "aws_launch_template" "main" {
  count = var.enable_asg ? 1 : 0

  name_prefix = "${var.environment}-${var.project_name}-"
  # Using static AMI ID for LocalStack compatibility
  image_id      = local.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  user_data = filebase64("${path.module}/user_data.sh")

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-launch-template"
  })
}

# Simple EC2 Instance for LocalStack (when ASG is disabled and EC2 is enabled)
# Note: EC2 instance creation can hang in LocalStack Community - set enable_ec2 = false to skip
resource "aws_instance" "main" {
  count = var.enable_asg ? 0 : (var.enable_ec2 ? 1 : 0)

  ami                    = local.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.instance_profile_name

  user_data = filebase64("${path.module}/user_data.sh")

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-instance"
  })

  # LocalStack workaround: credit_specification is not fully supported
  lifecycle {
    ignore_changes = [credit_specification]
  }
}

# Auto Scaling Group (only when enabled - not available in LocalStack Community)
resource "aws_autoscaling_group" "main" {
  count = var.enable_asg ? 1 : 0

  name                      = "${var.environment}-${var.project_name}-asg"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = var.target_group_arn != "" ? [var.target_group_arn] : []
  health_check_type         = "EC2"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main[0].id
    version = "$Latest"
  }

  # Enable instance refresh for zero-downtime deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-${var.project_name}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policies (only when ASG is enabled)
resource "aws_autoscaling_policy" "scale_up" {
  count = var.enable_asg ? 1 : 0

  name                   = "${var.environment}-${var.project_name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main[0].name
}

resource "aws_autoscaling_policy" "scale_down" {
  count = var.enable_asg ? 1 : 0

  name                   = "${var.environment}-${var.project_name}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main[0].name
}

# CloudWatch Alarms (only when ASG is enabled)
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.enable_asg ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.enable_asg ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = var.common_tags
}