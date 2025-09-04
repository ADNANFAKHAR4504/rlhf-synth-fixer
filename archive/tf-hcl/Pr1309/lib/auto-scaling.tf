# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "${local.resource_prefix}-primary-lt"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region       = var.aws_region_primary
    project_name = local.resource_prefix
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.resource_prefix}-primary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-lt"
  })
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "${local.resource_prefix}-secondary-lt"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region       = var.aws_region_secondary
    project_name = local.resource_prefix
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.resource_prefix}-secondary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-lt"
  })
}

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider                  = aws.primary
  name                      = "${local.resource_prefix}-primary-asg"
  vpc_zone_identifier       = aws_subnet.primary_private[*].id
  target_group_arns         = [aws_lb_target_group.primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  # Enable ARC Zonal Shift capabilities - commented out as it conflicts with vpc_zone_identifier
  # availability_zones = data.aws_availability_zones.primary.names

  dynamic "tag" {
    for_each = merge(local.common_tags, {
      Name               = "${local.resource_prefix}-primary-asg"
      "AmazonECSManaged" = ""
    })

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider                  = aws.secondary
  name                      = "${local.resource_prefix}-secondary-asg"
  vpc_zone_identifier       = aws_subnet.secondary_private[*].id
  target_group_arns         = [aws_lb_target_group.secondary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  # Enable ARC Zonal Shift capabilities - commented out as it conflicts with vpc_zone_identifier
  # availability_zones = data.aws_availability_zones.secondary.names

  dynamic "tag" {
    for_each = merge(local.common_tags, {
      Name               = "${local.resource_prefix}-secondary-asg"
      "AmazonECSManaged" = ""
    })

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider               = aws.primary
  name                   = "${local.resource_prefix}-primary-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "primary_scale_down" {
  provider               = aws.primary
  name                   = "${local.resource_prefix}-primary-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider               = aws.secondary
  name                   = "${local.resource_prefix}-secondary-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider               = aws.secondary
  name                   = "${local.resource_prefix}-secondary-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}