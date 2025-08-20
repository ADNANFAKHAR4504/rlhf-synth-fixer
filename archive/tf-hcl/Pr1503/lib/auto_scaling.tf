# Launch Template
resource "aws_launch_template" "ecommerce_lt" {
  name_prefix   = "ecommerce-lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      volume_type = "gp3"
      encrypted   = true
      # Using default AWS managed key for EBS encryption
      kms_key_id            = aws_kms_key.ecommerce_kms_key.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Simple web application
cat << 'HTML' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Application</title>
</head>
<body>
    <h1>Welcome to E-commerce Platform</h1>
    <p>PCI-DSS Compliant Web Application</p>
    <p>Database Endpoint: ${aws_db_instance.ecommerce_db.endpoint}</p>
    <p>Server: $(hostname)</p>
</body>
</html>
HTML

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "ecommerce-instance-${var.environment_suffix}"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "ecommerce_asg" {
  name                      = "ecommerce-asg-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.public_subnets[*].id
  target_group_arns         = [aws_lb_target_group.ecommerce_tg.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.ecommerce_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ecommerce-asg-${var.environment_suffix}"
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

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "ecommerce_scale_up" {
  name                   = "ecommerce-scale-up-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "ecommerce_scale_down" {
  name                   = "ecommerce-scale-down-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "ecommerce_high_cpu" {
  alarm_name          = "ecommerce-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }

  tags = var.common_tags
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "ecommerce_low_cpu" {
  alarm_name          = "ecommerce-low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }

  tags = var.common_tags
}