# Secondary Launch Template
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "lt-secondary-${var.environment_suffix}"
  image_id      = var.ami_id_secondary
  instance_type = var.instance_type
  key_name      = null # Set key name if SSH access required

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.secondary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker

              # Install CloudWatch agent
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
              rpm -U ./amazon-cloudwatch-agent.rpm

              # Sample application (replace with actual application)
              docker run -d -p 8080:8080 --name app \
                -e DB_HOST=${aws_rds_cluster.secondary.endpoint} \
                -e DB_NAME=${var.db_name} \
                -e AWS_REGION=${var.secondary_region} \
                your-application-image:latest
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name    = "app-secondary-${var.environment_suffix}"
      Region  = "secondary"
      DR-Role = "secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name    = "lt-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Auto Scaling Group
resource "aws_autoscaling_group" "secondary" {
  provider                  = aws.secondary
  name                      = "asg-secondary-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.secondary_private[*].id
  target_group_arns         = [aws_lb_target_group.secondary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 6
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "asg-secondary-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "secondary"
    propagate_at_launch = true
  }

  tag {
    key                 = "DR-Role"
    value               = "secondary"
    propagate_at_launch = true
  }
}

# Secondary Auto Scaling Policy - Target Tracking (CPU)
resource "aws_autoscaling_policy" "secondary_cpu" {
  provider               = aws.secondary
  name                   = "asg-policy-cpu-secondary-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.secondary.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
