# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name_prefix = "${var.resource_prefix}-ec2-"

  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-ec2-role"
    }
  )
}

# IAM policy document for EC2 assume role
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# IAM policy document for EC2 permissions
data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    effect = "Allow"

    actions = [
      "cloudwatch:PutMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]

    resources = [
      "arn:aws:s3:::${var.resource_prefix}-*",
      "arn:aws:s3:::${var.resource_prefix}-*/*"
    ]
  }

  # Explicit deny for dangerous actions
  statement {
    effect = "Deny"

    actions = [
      "iam:*",
      "organizations:*",
      "account:*"
    ]

    resources = ["*"]
  }

  statement {
    effect = "Deny"

    actions = [
      "s3:DeleteBucket",
      "s3:PutBucketPolicy",
      "rds:DeleteDBCluster",
      "rds:DeleteDBInstance"
    ]

    resources = ["*"]
  }
}

# IAM policy for EC2
resource "aws_iam_policy" "ec2" {
  name_prefix = "${var.resource_prefix}-ec2-"
  description = "Policy for EC2 instances"
  policy      = data.aws_iam_policy_document.ec2_permissions.json

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-ec2-policy"
    }
  )
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2.arn
}

# IAM instance profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.resource_prefix}-ec2-"
  role        = aws_iam_role.ec2.name

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-ec2-profile"
    }
  )
}

# Launch template for EC2 instances
resource "aws_launch_template" "main" {
  name_prefix   = "${var.resource_prefix}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  vpc_security_group_ids = [var.ec2_security_group_id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    systemctl start docker
    systemctl enable docker

    # Sample application
    docker run -d -p 8080:8080 --name app \
      -e ENVIRONMENT=${var.environment} \
      nginx:alpine
  EOF
  )

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      var.common_tags,
      {
        Name = "${var.resource_prefix}-instance"
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix               = "${var.resource_prefix}-asg-"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [var.target_group_arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.instance_count
  max_size         = var.instance_count * 2
  desired_capacity = var.instance_count

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  dynamic "tag" {
    for_each = merge(
      var.common_tags,
      {
        Name = "${var.resource_prefix}-asg-instance"
      }
    )

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.resource_prefix}-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.resource_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Triggers when CPU exceeds 70%"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.resource_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.resource_prefix}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 20
  alarm_description   = "Triggers when CPU drops below 20%"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}
